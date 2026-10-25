import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
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

async function waitFor(predicate: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 150; attempt += 1) {
    if (predicate()) return;
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
  const push = spawnSync('node_modules/.bin/prisma', ['migrate', 'deploy'], {
    cwd: process.cwd(), env: { ...process.env, DATABASE_URL: databaseUrl }, encoding: 'utf8',
  });
  assert.equal(push.status, 0, push.stderr || push.stdout);

  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  await prisma.lexicalSense.create({ data: {
    lexicalItem: 'casa', definition: 'edificio abitativo',
    detailsJson: JSON.stringify(sense('casa', 'edificio abitativo', 'dom')),
  } });

  const requests: unknown[] = [];
  const openai = createServer(async (request, response) => {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    requests.push(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    response.setHeader('content-type', 'application/json');
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
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0, '127.0.0.1');
  const address = app.getHttpServer().address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  let dom: JSDOM | undefined;

  try {
    const html = await (await fetch(`${base}/lexical-senses.html`)).text();
    assert.match(html, /LexicalSense/);
    dom = new JSDOM(html, { url: `${base}/lexical-senses.html`, runScripts: 'outside-only' });
    const { window } = dom;
    window.fetch = ((path: string, options?: RequestInit) => fetch(new URL(path, base), options)) as typeof window.fetch;
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
    await waitFor(() => doc.querySelectorAll('[data-sense-card]').length === 2);
    assert.match(doc.body.textContent!, /Sprawdzić pisownię/);
    assert.equal(requests.length, 1);
    const request = requests[0] as { tools: unknown[]; text: { format: { strict: boolean } } };
    assert.deepEqual(request.tools, [{ type: 'web_search' }]);
    assert.equal(request.text.format.strict, true);
    const cards = doc.querySelectorAll<HTMLElement>('[data-sense-card]');
    const polish = cards[0].querySelector<HTMLTextAreaElement>('[data-definition-pl]')!;
    polish.value = 'członkowie rodziny';
    polish.dispatchEvent(new window.Event('input', { bubbles: true }));
    cards[0].querySelector<HTMLInputElement>('[data-select-sense]')!.click();
    cards[0].querySelector<HTMLInputElement>('[data-confirm-distinct]')!.click();
    doc.querySelector<HTMLButtonElement>('#save-senses')!.click();
    await waitFor(() => doc.body.textContent!.includes('Zapisano 1'));
    const check = await fetch(`${base}/api/lexical-senses/check`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: ['casa', 'ponte'] }),
    });
    assert.equal(check.status, 201);
    const checked = await check.json() as { items: Array<{ input: string; existing: Array<{ definition_pl?: string }> }> };
    assert.equal(checked.items.find((item) => item.input === 'casa')?.existing.length, 2);
    assert.ok(checked.items.find((item) => item.input === 'casa')?.existing.some((item) => item.definition_pl === 'członkowie rodziny'));
    assert.equal(checked.items.find((item) => item.input === 'ponte')?.existing.length, 0);
    doc.querySelector<HTMLButtonElement>('#save-senses')!.click();
    await waitFor(() => doc.body.textContent!.includes('Konflikty: 1'));
    const recheck = await fetch(`${base}/api/lexical-senses/check`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: ['casa'] }),
    });
    const second = await recheck.json() as { items: Array<{ existing: unknown[] }> };
    assert.equal(second.items[0].existing.length, 2);
  } finally {
    dom?.window.close();
    await app.close();
    openai.close();
    await prisma.$disconnect();
    await rm(directory, { recursive: true, force: true });
  }
});
