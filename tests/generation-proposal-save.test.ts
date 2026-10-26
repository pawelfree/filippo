import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { JSDOM } from 'jsdom';
import { LexicalSensesService } from '../src/lexical-senses/lexical-senses.service';

const proposal = {
  schema_version: '3.0.0', lexical_item_it: 'penna', language: 'it', part_of_speech: 'noun',
  definition_it: 'strumento per scrivere', definition_pl: 'przyrząd do pisania', glosses_pl: ['pióro'],
  usage: { register: 'neutral', patterns_it: [], collocations_it: [], constraints_pl: [] },
  examples: [],
  evidence: { e1: { source_type: 'dictionary', locator: 'https://example.org/penna', supports: ['meaning'] } },
};

test('saves a structurally valid proposal without an example despite evidence warnings', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'filippo-proposal-save-'));
  const oldUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = `file:${join(directory, 'test.db')}`;
  let prisma: PrismaClient | undefined;
  try {
    const migrationsRoot = join(process.cwd(), 'prisma', 'migrations');
    const migrations = (await readdir(migrationsRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
    for (const migration of migrations) {
      const sql = await readFile(join(migrationsRoot, migration, 'migration.sql'), 'utf8');
      const applied = spawnSync('sqlite3', [join(directory, 'test.db')], { input: sql, encoding: 'utf8' });
      assert.equal(applied.status, 0, applied.stderr || applied.stdout);
    }
    prisma = new PrismaClient();
    const job = await prisma.lexicalSenseGenerationJob.create({ data: { status: 'ready', itemsJson: '["penna"]' } });
    const pending = await prisma.lexicalSenseGenerationProposal.create({ data: {
      jobId: job.id, senseJson: JSON.stringify(proposal), validationWarningsJson: JSON.stringify([{ recordIndex: 0, lexicalItem: 'penna', warnings: ['Brak dowodu oznaczonego `part_of_speech`.'] }]),
    } });
    const result = await new LexicalSensesService(prisma as never).saveGenerationProposal(pending.id, { definition_pl: proposal.definition_pl, confirmedDistinct: false });
    assert.equal(result.status, 'saved');
    assert.equal(await prisma.lexicalSenseGenerationProposal.count(), 0);
    assert.deepEqual(JSON.parse((await prisma.lexicalSense.findFirst())!.detailsJson!).examples, []);
    const invalid = await prisma.lexicalSenseGenerationProposal.create({ data: { jobId: job.id, senseJson: JSON.stringify({ ...proposal, lexical_item_it: 'matita', glosses_pl: [] }) } });
    await assert.rejects(() => new LexicalSensesService(prisma as never).saveGenerationProposal(invalid.id, { definition_pl: proposal.definition_pl }), /glosses_pl/);
  } finally {
    await prisma?.$disconnect();
    if (oldUrl === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = oldUrl;
    await rm(directory, { recursive: true, force: true });
  }
});

test('proposal card shows evidence warnings and an inline save failure', async () => {
  const html = await readFile(join(process.cwd(), 'public/generation-proposals.html'), 'utf8');
  const script = await readFile(join(process.cwd(), 'dist/browser/generation-proposals.js'), 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost/generation-proposals.html', runScripts: 'outside-only' });
  try {
    const window = dom.window;
    (window as any).fetch = async (path: string, options?: RequestInit) => {
      if (options?.method === 'POST') return { ok: false, status: 400, json: async () => ({ message: 'Nie można zapisać propozycji.' }) };
      return { ok: true, status: 200, json: async () => path.endsWith('/generation-jobs') ? [] : [{ ...proposal, id: 'pending-1', validationWarnings: [{ warnings: ['Brak dowodu oznaczonego `part_of_speech`.'] }], matches: [] }] };
    };
    window.eval(script);
    const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
    await settle();
    const card = window.document.querySelector('#proposals .sense-card')!;
    assert.match(card.textContent!, /Brak dowodu oznaczonego/);
    (card.querySelector('[aria-label="Zapisz znaczenie"]') as HTMLButtonElement).click();
    await settle();
    assert.match(card.querySelector('[role="alert"]')?.textContent || '', /Nie można zapisać propozycji/);
  } finally { dom.window.close(); }
});
