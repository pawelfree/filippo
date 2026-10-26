import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { JSDOM } from 'jsdom';
import { PrismaClient } from '@prisma/client';
import { LexicalSensesService } from '../src/lexical-senses/lexical-senses.service';

const details = {
  schema_version: '3.0.0', lexical_item_it: 'ponte', language: 'it', part_of_speech: 'noun',
  definition_it: 'struttura per attraversare', definition_pl: 'most', glosses_pl: ['most'],
  usage: { register: 'neutral', patterns_it: [], collocations_it: [], constraints_pl: [] },
  examples: [{ sentence_it: 'Attraverso il ponte.', translation_pl: 'Przechodzę przez most.', origin: 'authored' }],
  evidence: { e1: { source_type: 'dictionary', locator: 'https://example.org/dizionario', supports: ['meaning', 'part_of_speech', 'register'] } },
};

test('lists, edits, and removes a stored LexicalSense', async () => {
  const stored = {
    id: 'sense-1', language: 'it', lexicalItem: 'ponte', definition: details.definition_it,
    detailsJson: JSON.stringify(details), identityKey: null, createdAt: new Date('2026-10-25T00:00:00Z'), updatedAt: new Date(), tasks: [], fsrsStates: [],
  };
  const updates: Array<Record<string, unknown>> = [];
  let deleted = false;
  const prisma = {
    $queryRaw: async (query: { sql: string }) => query.sql.includes('count(*)') ? [{ total: 1n }] : [{ id: stored.id }],
    lexicalSense: {
      findMany: async () => [stored],
      findUnique: async () => stored,
      update: async ({ data }: { data: Record<string, unknown> }) => { updates.push(data); return { ...stored, ...data }; },
      delete: async () => { deleted = true; return stored; },
    },
  };
  const service = new LexicalSensesService(prisma as never);

  const listed = await service.list();
  assert.equal(listed.total, 1);
  assert.equal(listed.page, 1);
  assert.equal(listed.items[0].definition_pl, 'most');

  const updated = await service.update('sense-1', { definition_it: 'costruzione per superare un ostacolo', definition_pl: 'konstrukcja do pokonania przeszkody' });
  assert.equal(updated.definition_it, 'costruzione per superare un ostacolo');
  assert.equal(updated.definition_pl, 'konstrukcja do pokonania przeszkody');
  const storedDetails = JSON.parse(String(updates[0].detailsJson));
  assert.equal(storedDetails.definition_it, 'costruzione per superare un ostacolo');
  assert.equal(storedDetails.definition_pl, 'konstrukcja do pokonania przeszkody');
  assert.equal(typeof updates[0].identityKey, 'string');

  assert.deepEqual(await service.remove('sense-1'), { id: 'sense-1' });
  assert.equal(deleted, true);
});

test('paginates stored senses and applies search before pagination', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'filippo-stored-pages-'));
  const databasePath = join(directory, 'test.db');
  const previousDatabaseUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = `file:${databasePath}`;
  let prisma: PrismaClient | undefined;
  try {
    const migrationsRoot = join(process.cwd(), 'prisma', 'migrations');
    const migrations = (await readdir(migrationsRoot, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
    for (const migration of migrations) {
      const sql = await readFile(join(migrationsRoot, migration, 'migration.sql'), 'utf8');
      const apply = spawnSync('sqlite3', [databasePath], { input: sql, encoding: 'utf8' });
      assert.equal(apply.status, 0, apply.stderr || apply.stdout);
    }
    prisma = new PrismaClient();
    for (let index = 0; index < 23; index += 1) {
      const word = index < 12 ? `ponte ${index}` : `casa ${index}`;
      await prisma.lexicalSense.create({ data: {
        id: `sense-${String(index).padStart(2, '0')}`, lexicalItem: word, definition: `definizione ${index}`,
        detailsJson: JSON.stringify({ ...details, lexical_item_it: word, definition_it: `definizione ${index}`, definition_pl: index < 12 ? `most ${index}` : `dom ${index}` }),
        createdAt: new Date(Date.UTC(2026, 0, 23 - index)),
      } });
    }
    const service = new LexicalSensesService(prisma as never);
    const secondPage = await service.list('2');
    assert.equal(secondPage.total, 23);
    assert.equal(secondPage.totalPages, 3);
    assert.equal(secondPage.items.length, 10);
    assert.equal(secondPage.items[0].id, 'sense-10');
    const filtered = await service.list('3', 'ponte');
    assert.equal(filtered.total, 12);
    assert.equal(filtered.page, 2);
    assert.equal(filtered.items.length, 2);
    assert.equal(filtered.items[0].id, 'sense-10');
    const polish = await service.list('1', 'dom 22');
    assert.equal(polish.total, 1);
    assert.equal(polish.items[0].id, 'sense-22');
    await assert.rejects(service.list('0'), /Numer strony/);
  } finally {
    await prisma?.$disconnect();
    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabaseUrl;
    await rm(directory, { recursive: true, force: true });
  }
});

test('shows icon actions and enables saving only after a definition changes', async () => {
  const item = {
    id: 'sense-1', lexical_item_it: 'ponte', part_of_speech: 'noun',
    definition_it: 'struttura per attraversare', definition_pl: 'most', editable: true,
  };
  const dom = new JSDOM('<input id="stored-search"><div id="stored-list"></div><button id="stored-prev"></button><span id="stored-page-info"></span><button id="stored-next"></button><p id="status"></p><p id="error" hidden></p>', { runScripts: 'outside-only' });
  const { window } = dom;
  window.fetch = (async (_path: string, options?: RequestInit) => {
    if (!options?.method) return new Response(JSON.stringify({ items: [item], page: 1, pageSize: 10, total: 1, totalPages: 1 }), { headers: { 'content-type': 'application/json' } });
    return new Response(JSON.stringify({ ...item, definition_pl: 'przeprawa' }), { headers: { 'content-type': 'application/json' } });
  }) as typeof window.fetch;
  window.eval(await readFile(join(process.cwd(), 'dist', 'browser', 'stored-lexical-senses.js'), 'utf8'));
  await new Promise((resolve) => setTimeout(resolve, 0));
  const doc = window.document;
  const save = doc.querySelector<HTMLButtonElement>('[aria-label="Zapisz zmiany"]');
  const remove = doc.querySelector<HTMLButtonElement>('[aria-label="Usuń wpis"]');
  assert.ok(save);
  assert.ok(remove);
  assert.equal(save.textContent, '💾');
  assert.equal(remove.textContent, '🗑');
  assert.equal(save.disabled, true);
  assert.equal(doc.getElementById('stored-page-info')?.textContent, 'Strona 1 z 1');
  const polish = doc.querySelector<HTMLTextAreaElement>('[data-definition-pl]');
  assert.ok(polish);
  polish.value = 'przeprawa';
  polish.dispatchEvent(new window.Event('input', { bubbles: true }));
  assert.equal(save.disabled, false);
  save.click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(save.disabled, true);
  dom.window.close();
});

test('stored-sense pagination requests the next page and filters across all pages', async () => {
  const requested: string[] = [];
  const dom = new JSDOM('<input id="stored-search"><div id="stored-list"></div><button id="stored-prev"></button><span id="stored-page-info"></span><button id="stored-next"></button><p id="status"></p><p id="error" hidden></p>', { runScripts: 'outside-only' });
  const { window } = dom;
  window.fetch = (async (path: string) => {
    requested.push(path);
    const url = new URL(path, 'http://localhost');
    const page = Number(url.searchParams.get('page'));
    const search = url.searchParams.get('search');
    const item = { id: `sense-${page}`, lexical_item_it: search || `parola ${page}`, part_of_speech: 'noun', definition_it: 'senso', definition_pl: 'znaczenie', editable: false };
    return new Response(JSON.stringify({ items: [item], page: search ? 1 : page, pageSize: 10, total: search ? 1 : 11, totalPages: search ? 1 : 2 }), { headers: { 'content-type': 'application/json' } });
  }) as typeof window.fetch;
  window.eval(await readFile(join(process.cwd(), 'dist', 'browser', 'stored-lexical-senses.js'), 'utf8'));
  await new Promise((resolve) => setTimeout(resolve, 0));
  const next = window.document.getElementById('stored-next') as HTMLButtonElement;
  assert.equal(next.disabled, false);
  next.click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(window.document.getElementById('stored-page-info')?.textContent, 'Strona 2 z 2');
  assert.ok(requested.some((path) => path.includes('page=2')));
  const search = window.document.getElementById('stored-search') as HTMLInputElement;
  search.value = 'most';
  search.dispatchEvent(new window.Event('input', { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 300));
  assert.ok(requested.some((path) => path.includes('page=1') && path.includes('search=most')));
  assert.equal(window.document.getElementById('stored-page-info')?.textContent, 'Strona 1 z 1');
  dom.window.close();
});
