import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { JSDOM } from 'jsdom';

const sense = (item: string, italian: string, polish: string) => ({
  schema_version: '3.0.0', lexical_item_it: item, language: 'it', part_of_speech: 'noun',
  definition_it: italian, definition_pl: polish, glosses_pl: [polish],
  usage: { register: 'neutral', patterns_it: [], collocations_it: [], constraints_pl: [] },
  examples: [{ sentence_it: `Questa è ${item}.`, translation_pl: `To jest ${polish}.`, origin: 'authored' }],
  evidence: { e1: { source_type: 'dictionary', locator: 'https://example.org/dizionario', supports: ['meaning', 'part_of_speech', 'register'] } },
});

async function waitFor(predicate: () => boolean | Promise<boolean>): Promise<void> {
  for (let attempt = 0; attempt < 150; attempt += 1) {
    if (await predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error('Timed out waiting for page state');
}

test('user reviews existing senses, corrects a generated sense, and saves only the selection', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'filippo-lexical-'));
  const databaseUrl = `file:${join(directory, 'test.db')}`;
  process.env.DATABASE_URL = databaseUrl;
  process.env.OPENAI_API_KEY = 'test-key';
  process.env.OPENAI_MODEL = 'test-model';
  const migrationsRoot = join(process.cwd(), 'prisma', 'migrations');
  const migrations = (await readdir(migrationsRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  for (const migration of migrations) {
    const sql = await readFile(join(migrationsRoot, migration, 'migration.sql'), 'utf8');
    const apply = spawnSync('sqlite3', [join(directory, 'test.db')], { input: sql, encoding: 'utf8' });
    assert.equal(apply.status, 0, apply.stderr || apply.stdout);
  }

  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  await prisma.lexicalSense.create({ data: {
    lexicalItem: 'casa', definition: 'edificio abitativo',
    detailsJson: JSON.stringify(sense('casa', 'edificio abitativo', 'dom')),
  } });

  const requests: unknown[] = [];
  let openaiFailure: { status: number; code: string } | undefined;
  const openai = createServer(async (request, response) => {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    requests.push(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    response.setHeader('content-type', 'application/json');
    if (openaiFailure) {
      response.statusCode = openaiFailure.status;
      response.end(JSON.stringify({ error: { code: openaiFailure.code } }));
      return;
    }
    response.end(JSON.stringify({ output: [{ type: 'web_search_call', status: 'completed' }], output_text: JSON.stringify({
      lexical_senses: [sense('casa', 'insieme di persone della stessa famiglia', 'rodzina'), sense('ponte', 'struttura per attraversare', 'most')],
      deferred: [{ input_form_it: 'xzy', reason_code: 'not_found_in_sources', needed_evidence_or_decision: 'Sprawdzić pisownię.' }],
      coverage: [
        { lexical_item_it: 'casa', part_of_speech: 'noun', selection_basis: 'general_use', notes_pl: 'Sprawdzono użycie rodzinne.' },
        { lexical_item_it: 'ponte', part_of_speech: 'noun', selection_basis: 'general_use', notes_pl: 'Sprawdzono użycie ogólne.' },
        { input_form_it: 'xzy', selection_basis: 'unresolved_input', notes_pl: 'Brak potwierdzenia.' },
      ],
    }) }));
  });
  openai.listen(0, '127.0.0.1');
  await once(openai, 'listening');
  const openaiAddress = openai.address();
  assert.ok(openaiAddress && typeof openaiAddress !== 'string');
  process.env.OPENAI_RESPONSES_URL = `http://127.0.0.1:${openaiAddress.port}`;

  const { NestFactory } = await import('@nestjs/core');
  const { AppModule } = await import('../src/app.module');
  let app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0, '127.0.0.1');
  const address = app.getHttpServer().address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  let dom: JSDOM | undefined;
  let jobResponseStatus: number | undefined;

  try {
    const html = await (await fetch(`${base}/lexical-senses.html`)).text();
    assert.match(html, /LexicalSense/);
    dom = new JSDOM(html, { url: `${base}/lexical-senses.html`, runScripts: 'outside-only' });
    const { window } = dom;
    window.fetch = (async (path: string, options?: RequestInit) => {
      const response = await fetch(new URL(path, base), options);
      if (path === '/api/lexical-senses/generation-jobs') jobResponseStatus = response.status;
      return response;
    }) as typeof window.fetch;
    window.eval(await readFile(join(process.cwd(), 'dist', 'browser', 'lexical-senses.js'), 'utf8'));
    const doc = window.document;
    const input = doc.querySelector<HTMLInputElement>('[data-item-input]');
    assert.ok(input);
    input.value = 'casa';
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
    for (const value of ['ponte', 'xzy']) {
      doc.querySelector<HTMLButtonElement>('#add-item')!.click();
      const fields = doc.querySelectorAll<HTMLInputElement>('[data-item-input]');
      fields[fields.length - 1].value = value;
      fields[fields.length - 1].dispatchEvent(new window.Event('input', { bubbles: true }));
    }
    doc.querySelector<HTMLButtonElement>('#check-items')!.click();
    await waitFor(() => doc.body.textContent!.includes('edificio abitativo'));
    assert.match(doc.body.textContent!, /Już w bazie/);
    doc.querySelector<HTMLButtonElement>('#generate-senses')!.click();
    await waitFor(() => doc.body.textContent!.includes('Zadanie zlecone'));
    assert.equal(jobResponseStatus, 202);
    assert.ok(doc.querySelector<HTMLInputElement>('[data-item-input]'));
    assert.equal(doc.querySelector<HTMLButtonElement>('#check-items')?.disabled, false);
    assert.ok(doc.querySelector('a[href="/generation-proposals.html"]'));
    await waitFor(async () => {
      const response = await fetch(`${base}/api/lexical-senses/generation-proposals`);
      return (await response.json() as unknown[]).length === 2;
    });
    assert.equal(requests.length, 1);
    const request = requests[0] as { tools: unknown[]; text: { format: { strict: boolean } } };
    assert.deepEqual(request.tools, [{ type: 'web_search' }]);
    assert.equal(request.text.format.strict, true);
    const pending = await (await fetch(`${base}/api/lexical-senses/generation-proposals`)).json() as Array<{ id: string; lexical_item_it: string }>;
    const casa = pending.find((item) => item.lexical_item_it === 'casa')!;
    const saved = await fetch(`${base}/api/lexical-senses/generation-proposals/${casa.id}/save`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ definition_pl: 'członkowie rodziny', confirmedDistinct: true }) });
    assert.equal(saved.status, 201);
    const check = await fetch(`${base}/api/lexical-senses/check`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: ['casa', 'ponte'] }),
    });
    assert.equal(check.status, 201);
    const checked = await check.json() as { items: Array<{ input: string; existing: Array<{ definition_pl?: string }> }> };
    assert.equal(checked.items.find((item) => item.input === 'casa')?.existing.length, 2);
    assert.ok(checked.items.find((item) => item.input === 'casa')?.existing.some((item) => item.definition_pl === 'członkowie rodziny'));
    assert.equal(checked.items.find((item) => item.input === 'ponte')?.existing.length, 0);
    const ponte = pending.find((item) => item.lexical_item_it === 'ponte')!;
    const rejected = await fetch(`${base}/api/lexical-senses/generation-proposals/${ponte.id}/reject`, { method: 'POST' });
    assert.equal(rejected.status, 204);
    const remaining = await (await fetch(`${base}/api/lexical-senses/generation-proposals`)).json() as unknown[];
    assert.equal(remaining.length, 0);
    assert.equal(await prisma.rejectedLexicalSenseProposal.count(), 1);

    const secondCheck = await fetch(`${base}/api/lexical-senses/check`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ items: ['ponte'] }),
    });
    const secondCheckBody = await secondCheck.json() as { checkId: string };
    const secondJob = await fetch(`${base}/api/lexical-senses/generation-jobs`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: ['ponte'], checkId: secondCheckBody.checkId }),
    });
    assert.equal(secondJob.status, 202);
    const secondJobBody = await secondJob.json() as { id: string };
    await waitFor(async () => (await prisma.lexicalSenseGenerationJob.findUnique({ where: { id: secondJobBody.id } }))?.status === 'ready');
    assert.equal(await prisma.lexicalSenseGenerationJob.count(), 2);

    await app.close();
    const interrupted = await prisma.lexicalSenseGenerationJob.create({ data: { status: 'running', itemsJson: JSON.stringify(['casa']) } });
    const waiting = await prisma.lexicalSenseGenerationJob.create({ data: { status: 'queued', itemsJson: JSON.stringify(['ponte']) } });
    app = await NestFactory.create(AppModule, { logger: false });
    await app.listen(0, '127.0.0.1');
    const restartedAddress = app.getHttpServer().address();
    assert.ok(restartedAddress && typeof restartedAddress !== 'string');
    const restartedBase = `http://127.0.0.1:${restartedAddress.port}`;
    for (const id of [interrupted.id, waiting.id]) {
      const job = await prisma.lexicalSenseGenerationJob.findUnique({ where: { id } });
      assert.equal(job?.status, 'failed');
      assert.equal(job?.errorCode, 'server_restarted');
    }
    const retry = await fetch(`${restartedBase}/api/lexical-senses/generation-jobs/${interrupted.id}/retry`, { method: 'POST' });
    assert.equal(retry.status, 201);
    const retriedJob = await retry.json() as { id: string; status: string };
    assert.notEqual(retriedJob.id, interrupted.id);
    await waitFor(async () => (await prisma.lexicalSenseGenerationJob.findUnique({ where: { id: retriedJob.id } }))?.status === 'ready');
  } finally {
    dom?.window.close();
    await app.close();
    openai.close();
    await prisma.$disconnect();
    await rm(directory, { recursive: true, force: true });
  }
});
