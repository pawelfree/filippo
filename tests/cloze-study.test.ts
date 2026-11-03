import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { Rating } from 'ts-fsrs';
import { ClozeService } from '../src/cloze/cloze.service';
import { projectTaxonomyForGeneration } from '../src/cloze/taxonomy-generation-input';
import { FsrsService } from '../src/fsrs/fsrs.service';
import { StudyService } from '../src/study/study.service';

function exercise(id: string, position: number) {
  return {
    exercise_id: `${id}-${position}`, task_type: 'fill_blank', lexical_sense_id: id,
    prompt: [{ text: 'La ' }, { gap_id: 'word' }, { text: ' è breve.' }],
    sentence_pl: 'Chwila wytchnienia jest krótka.', hints: [], intent: 'practice', difficulty: 'easy',
    gaps: ['word'], answer_keys: { main: { fragments: { word: 'tregua' } } },
    success_checks_by_answer_key: { main: [{ taxonomy_node_id: 'CAT-01-CON-02-VAR-002', evidence_class: 'direct' }] },
    primary_grammar_target: { taxonomy_node_id: 'CAT-01-CON-02-VAR-002' },
  };
}

test('generation taxonomy includes every grammar target without editorial metadata', () => {
  const source = JSON.parse(readFileSync(join(process.cwd(), '.ai/docs/grammar_taxonomy/taxonomy.json'), 'utf8'));
  const projected = projectTaxonomyForGeneration(source, 'test-hash');
  assert.deepEqual(projected.categories.map((item) => item.id), source.categories.map((item: any) => item.id));
  assert.deepEqual(projected.constructions.map((item) => item.id), source.constructions.map((item: any) => item.id));
  assert.deepEqual(projected.variants.map((item) => item.id), source.variants.map((item: any) => item.id));
  assert.deepEqual(projected.relations, source.relations);
  assert.equal(projected.variants.length, 348);
  assert.ok(projected.variants.some((item) => item.cefr.reference_level === 'C1'));
  assert.ok(projected.variants.some((item) => item.operational_profile?.rule_cases?.length));
  assert.ok(projected.variants.some((item) => item.operational_profile?.normative_cases?.length));
  assert.equal('metadata' in projected, false);
  assert.equal('slug' in projected.variants[0], false);
  assert.equal('description' in projected.variants[0].cefr, false);
  assert.equal('mapping_status' in projected.variants[0].cefr, false);
});

test('ten selected senses with five ready sets request one five-sense AI batch', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'filippo-cloze-five-missing-'));
  const oldUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = `file:${join(directory, 'test.db')}`;
  let prisma: PrismaClient | undefined;
  try {
    const migrationsRoot = join(process.cwd(), 'prisma', 'migrations');
    const migrations = (await readdir(migrationsRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
    for (const migration of migrations) {
      const applied = spawnSync('sqlite3', [join(directory, 'test.db')], { input: await readFile(join(migrationsRoot, migration, 'migration.sql'), 'utf8'), encoding: 'utf8' });
      assert.equal(applied.status, 0, applied.stderr || applied.stdout);
    }
    prisma = new PrismaClient();
    const ids: string[] = [];
    for (let index = 0; index < 10; index += 1) {
      const sense = await prisma.lexicalSense.create({ data: { lexicalItem: `tregua-${index}`, definition: 'pausa', detailsJson: '{}' } });
      ids.push(sense.id);
      if (index < 5) for (let position = 1; position <= 4; position += 1) await prisma.clozeExercise.create({ data: { lexicalSenseId: sense.id, position, contentJson: JSON.stringify(exercise(sense.id, position)) } });
    }
    const fsrs = new FsrsService(prisma as never);
    const service = new ClozeService(prisma as never, {} as never, fsrs, new StudyService(prisma as never, fsrs));
    const batches: string[][] = [];
    (service as unknown as { generate: (ids: string[]) => Promise<unknown> }).generate = async (requested) => {
      batches.push(requested);
      return { results: requested.map((id) => ({ lexical_sense_id: id, slots: [1, 2, 3, 4].map((position) => ({ position, exercise: exercise(id, position) })) })) };
    };
    const session = await service.createSession(10, 'new');
    assert.equal(session.status, 'queued');
    assert.deepEqual(session.generation, { processed: 0, total: 5 });
    await (service as unknown as { runNext: () => Promise<void> }).runNext();
    assert.deepEqual(batches, [ids.slice(5)]);
    assert.equal((await service.session(session.id)).status, 'ready');
    assert.equal(await prisma.clozeExercise.count(), 40);
  } finally {
    await prisma?.$disconnect();
    if (oldUrl === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = oldUrl;
    await rm(directory, { recursive: true, force: true });
  }
});

test('failed AI batch can retry missing exercises in the same session', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'filippo-cloze-retry-missing-'));
  const oldUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = `file:${join(directory, 'test.db')}`;
  let prisma: PrismaClient | undefined;
  try {
    const migrationsRoot = join(process.cwd(), 'prisma', 'migrations');
    for (const migration of (await readdir(migrationsRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()) {
      const applied = spawnSync('sqlite3', [join(directory, 'test.db')], { input: await readFile(join(migrationsRoot, migration, 'migration.sql'), 'utf8'), encoding: 'utf8' });
      assert.equal(applied.status, 0, applied.stderr || applied.stdout);
    }
    prisma = new PrismaClient();
    const sense = await prisma.lexicalSense.create({ data: { lexicalItem: 'tregua', definition: 'pausa', detailsJson: '{}' } });
    const fsrs = new FsrsService(prisma as never);
    const service = new ClozeService(prisma as never, {} as never, fsrs, new StudyService(prisma as never, fsrs));
    let requests = 0;
    (service as unknown as { generate: (ids: string[]) => Promise<unknown> }).generate = async (ids) => {
      requests += 1;
      if (requests === 1) throw new Error('Nie udało się połączyć z OpenAI.');
      return { results: ids.map((id) => ({ lexical_sense_id: id, slots: [1, 2, 3, 4].map((position) => ({ position, exercise: exercise(id, position) })) })) };
    };
    const started = await service.createSession(1, 'new');
    await (service as unknown as { runNext: () => Promise<void> }).runNext();
    const failed = await service.session(started.id);
    assert.equal(failed.status, 'ready');
    assert.equal(failed.missingCount, 1);
    assert.equal(Object.keys(failed.failures).length, 4);
    assert.equal(failed.failureLabels[sense.id], 'tregua — pausa');
    const retried = await service.retryMissing(started.id);
    assert.equal(retried.status, 'queued');
    assert.deepEqual(retried.generation, { processed: 0, total: 1 });
    await (service as unknown as { runNext: () => Promise<void> }).runNext();
    const ready = await service.session(started.id);
    assert.equal(ready.status, 'ready');
    assert.equal(ready.missingCount, 0);
    assert.deepEqual(ready.failures, {});
    assert.equal(ready.current!.exercise.lexical_sense_id, sense.id);
    assert.equal(requests, 2);
    assert.equal(await prisma.clozeExercise.count(), 4);
  } finally {
    await prisma?.$disconnect();
    if (oldUrl === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = oldUrl;
    await rm(directory, { recursive: true, force: true });
  }
});

test('migration keeps old AI jobs while excluding ready sessions that only reused exercises', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'filippo-cloze-job-backfill-'));
  const database = join(directory, 'test.db');
  try {
    const root = join(process.cwd(), 'prisma', 'migrations');
    const migrations = (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
    const newest = '20261103200000_cloze_generation_jobs';
    for (const migration of migrations.filter((name) => name < newest)) {
      const applied = spawnSync('sqlite3', ['-bail', database], { input: await readFile(join(root, migration, 'migration.sql'), 'utf8'), encoding: 'utf8' });
      assert.equal(applied.status, 0, applied.stderr || applied.stdout);
    }
    const fixture = `
      INSERT INTO "LexicalSense" ("id", "lexicalItem", "definition", "updatedAt") VALUES ('sense', 'tregua', 'pausa', 1000);
      INSERT INTO "LexicalSense" ("id", "lexicalItem", "definition", "updatedAt") VALUES ('sense2', 'pausa', 'interruzione', 1000);
      INSERT INTO "ClozeExercise" ("id", "lexicalSenseId", "position", "contentJson", "createdAt") VALUES ('old', 'sense', 1, '{}', 1000);
      INSERT INTO "ClozeExercise" ("id", "lexicalSenseId", "position", "contentJson", "createdAt") VALUES ('generated', 'sense', 2, '{}', 3000);
      INSERT INTO "ClozeExercise" ("id", "lexicalSenseId", "position", "contentJson", "createdAt") VALUES ('generated2', 'sense2', 1, '{}', 3000);
      INSERT INTO "ClozeSession" ("id", "selectedIdsJson", "exerciseIdsJson", "status", "generationProcessed", "createdAt", "updatedAt") VALUES
        ('reuse', '["sense"]', '{"sense":"old"}', 'ready', 1, 2000, 2000),
        ('ai', '["sense"]', '{"sense":"generated"}', 'ready', 1, 2000, 3000),
        ('mixed', '["sense","sense2"]', '{"sense":"old","sense2":"generated2"}', 'ready', 2, 2000, 3000),
        ('queued', '["sense"]', '{}', 'queued', 0, 2000, 2000);
    `;
    const seeded = spawnSync('sqlite3', [database], { input: fixture, encoding: 'utf8' });
    assert.equal(seeded.status, 0, seeded.stderr || seeded.stdout);
    const applied = spawnSync('sqlite3', ['-bail', database], { input: await readFile(join(root, newest, 'migration.sql'), 'utf8'), encoding: 'utf8' });
    assert.equal(applied.status, 0, applied.stderr || applied.stdout);
    const result = spawnSync('sqlite3', [database, 'SELECT id || ":" || generationRequested FROM ClozeSession ORDER BY id'], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.deepEqual(result.stdout.trim().split('\n'), ['ai:1', 'mixed:1', 'queued:1', 'reuse:0']);
    const countMigration = '20261103210000_cloze_missing_generation_total';
    const counted = spawnSync('sqlite3', ['-bail', database], { input: await readFile(join(root, countMigration, 'migration.sql'), 'utf8'), encoding: 'utf8' });
    assert.equal(counted.status, 0, counted.stderr || counted.stdout);
    const progress = spawnSync('sqlite3', [database, 'SELECT generationTotal || ":" || generationProcessed FROM ClozeSession WHERE id = "mixed"'], { encoding: 'utf8' });
    assert.equal(progress.stdout.trim(), '1:1');
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('generation call validates a four-slot batch with Polish sentences', async () => {
  const oldFetch = globalThis.fetch;
  const oldInfo = console.info;
  const oldKey = process.env.OPENAI_API_KEY;
  const id = 'sense-test';
  const batch = { results: [{ lexical_sense_id: id, slots: [1, 2, 3, 4].map((position) => ({ position, exercise: exercise(id, position) })) }] };
  let request: any;
  process.env.OPENAI_API_KEY = 'test-key';
  const logged: unknown[][] = [];
  console.info = (...args: unknown[]) => { logged.push(args); };
  globalThis.fetch = (async (_url, options) => {
    request = JSON.parse(String(options?.body));
    return { ok: true, json: async () => ({ status: 'completed', output_text: JSON.stringify(batch) }) } as Response;
  }) as typeof fetch;
  try {
    const input = { prepare: async () => ({ lexical_senses: [{ id, lexical_item_it: 'tregua', part_of_speech: 'noun', definition_it: 'pausa', definition_pl: 'wytchnienie', usage: { register: 'neutral', patterns_it: [], collocations_it: [], constraints_pl: [] } }] }) };
    const service = new ClozeService({} as never, input as never, {} as never);
    const result = await (service as unknown as { generate: (ids: string[]) => Promise<typeof batch> }).generate([id]);
    assert.equal(result.results[0].slots.length, 4);
    assert.match(request.instructions, /sentence_pl/);
    assert.equal(JSON.parse(request.input).lexical_senses[0].id, id);
    assert.equal(JSON.parse(request.input).taxonomy.variants.length, 348);
    assert.equal(JSON.parse(request.input).competence_profile.competencies.length, 348);
    assert.equal(logged[0][0], '[Cloze generation response]');
    delete batch.results[0].slots[0].exercise.sentence_pl;
    await assert.rejects(() => (service as unknown as { generate: (ids: string[]) => Promise<unknown> }).generate([id]), { status: 502 });
  } finally {
    globalThis.fetch = oldFetch;
    console.info = oldInfo;
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = oldKey;
  }
});

test('cloze generation retrieves a completed background response before validating exercises', async () => {
  const oldFetch = globalThis.fetch;
  const oldKey = process.env.OPENAI_API_KEY;
  const oldInfo = console.info;
  const oldError = console.error;
  const id = 'sense-background';
  const batch = { results: [{ lexical_sense_id: id, slots: [1, 2, 3, 4].map((position) => ({ position, exercise: exercise(id, position) })) }] };
  const calls: Array<{ url: string; method: string }> = [];
  process.env.OPENAI_API_KEY = 'test-key';
  console.info = () => {};
  console.error = () => {};
  globalThis.fetch = (async (url, options) => {
    calls.push({ url: String(url), method: options?.method || 'GET' });
    if (options?.method === 'POST') {
      assert.equal(JSON.parse(String(options.body)).background, true);
      return { ok: true, status: 200, json: async () => ({ id: 'resp-test', status: 'in_progress' }) } as Response;
    }
    if (calls.length === 2) throw new Error('temporary network failure');
    return { ok: true, status: 200, json: async () => ({ id: 'resp-test', status: 'completed', output_text: JSON.stringify(batch) }) } as Response;
  }) as typeof fetch;
  try {
    const input = { prepare: async () => ({ lexical_senses: [{ id, lexical_item_it: 'tregua' }] }) };
    const service = new ClozeService({} as never, input as never, {} as never, {} as never);
    const result = await (service as unknown as { generate: (ids: string[]) => Promise<typeof batch> }).generate([id]);
    assert.equal(result.results[0].slots.length, 4);
    assert.deepEqual(calls.map((call) => call.method), ['POST', 'GET', 'GET']);
    assert.match(calls[1].url, /\/responses\/resp-test$/);
  } finally {
    globalThis.fetch = oldFetch;
    console.info = oldInfo;
    console.error = oldError;
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = oldKey;
  }
});

test('cloze generation distinguishes rejected API keys, exhausted quota and transport failures', async () => {
  const oldFetch = globalThis.fetch;
  const oldKey = process.env.OPENAI_API_KEY;
  const oldError = console.error;
  const logs: unknown[][] = [];
  const id = 'sense-test';
  const input = { prepare: async () => ({ lexical_senses: [{ id, lexical_item_it: 'pagnotta' }] }) };
  const service = new ClozeService({} as never, input as never, {} as never, {} as never);
  const generate = () => (service as unknown as { generate: (ids: string[]) => Promise<unknown> }).generate([id]);
  process.env.OPENAI_API_KEY = 'test-key';
  console.error = (...args: unknown[]) => { logs.push(args); };
  try {
    globalThis.fetch = (async () => ({ ok: false, status: 401, json: async () => ({ error: { code: 'invalid_api_key', message: 'sensitive-key-fragment' } }) })) as typeof fetch;
    await assert.rejects(generate, /OpenAI odrzuciło klucz API/);
    assert.doesNotMatch(JSON.stringify(logs), /sensitive-key-fragment/);
    globalThis.fetch = (async () => ({ ok: false, status: 429, json: async () => ({ error: { code: 'insufficient_quota' } }) })) as typeof fetch;
    await assert.rejects(generate, /Wyczerpano środki lub limit użycia/);
    globalThis.fetch = (async () => { throw new Error('socket closed'); }) as typeof fetch;
    await assert.rejects(generate, /Nie udało się połączyć/);
    globalThis.fetch = (async () => { const error = new Error('timed out'); error.name = 'TimeoutError'; throw error; }) as typeof fetch;
    await assert.rejects(generate, /Upłynął limit czasu/);
  } finally {
    globalThis.fetch = oldFetch;
    console.error = oldError;
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = oldKey;
  }
});

test('cloze session stores generated exercises, grades each selected sense once and resumes safely', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'filippo-cloze-'));
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
    const first = await prisma.lexicalSense.create({ data: { lexicalItem: 'tregua', definition: 'pausa', detailsJson: '{}' } });
    const second = await prisma.lexicalSense.create({ data: { lexicalItem: 'tregua', definition: 'sollievo', detailsJson: '{}' } });
    for (let position = 1; position <= 4; position += 1) await prisma.clozeExercise.create({ data: { lexicalSenseId: first.id, position, contentJson: JSON.stringify(exercise(first.id, position)) } });
    const fsrs = new FsrsService(prisma as never);
    const study = new StudyService(prisma as never, fsrs);
    const service = new ClozeService(prisma as never, {} as never, fsrs, study);
    (service as unknown as { generate: (ids: string[]) => Promise<unknown> }).generate = async (requested) => ({ results: requested.map((id) => ({ lexical_sense_id: id, slots: [1, 2, 3, 4].map((position) => ({ position, exercise: exercise(id, position) })) })) });
    const interrupted = await prisma.clozeSession.create({ data: { selectedIdsJson: JSON.stringify([first.id, second.id]), status: 'failed' } });
    const interruptedBefore = await service.session(interrupted.id);
    const created = await service.createSession(2, 'new');
    assert.equal(created.status, 'queued');
    assert.deepEqual(created.generation, { processed: 0, total: 1 });
    assert.equal((await service.listSessions())[0].status, 'queued');
    await (service as unknown as { runNext: () => Promise<void> }).runNext();
    assert.equal(await prisma.clozeExercise.count(), 8);
    const ready = await service.session(created.id);
    assert.deepEqual((await service.session(interrupted.id)).generation, interruptedBefore.generation, 'later generated exercises changed interrupted job progress');
    assert.equal(ready.status, 'ready');
    assert.equal(ready.requestedCount, 2);
    assert.deepEqual(ready.generation, { processed: 1, total: 1 });
    const history = await service.listSessions();
    assert.equal(history[0].status, 'ready');
    assert.deepEqual(history[0].generation, { processed: 1, total: 1 });
    assert.equal('current' in history[0], false);
    assert.equal('answer_keys' in ready.current!.exercise, false);
    const firstEvent = randomUUID();
    const firstAnswer = { eventId: firstEvent, position: 0, responses: { word: 'tregua' } };
    const correct = await service.answer(created.id, firstAnswer);
    assert.equal(correct.accepted.correct, true);
    assert.equal(correct.accepted.rating, Rating.Easy);
    assert.equal(correct.accepted.sentence, 'La tregua è breve.');
    assert.equal('answer_keys' in correct.accepted.exercise, false);
    assert.equal(correct.current!.position, 1);
    const retried = await service.answer(created.id, firstAnswer);
    assert.deepEqual(retried.accepted, correct.accepted);
    assert.equal(await prisma.fsrsReview.count(), 1);
    const wrong = await service.answer(created.id, { eventId: randomUUID(), position: 1, responses: { word: 'xyz' } });
    assert.equal(wrong.accepted.correct, false);
    assert.equal(wrong.accepted.rating, Rating.Again);
    assert.equal(wrong.accepted.sentence, 'La tregua è breve.');
    assert.equal(wrong.finished, false);
    assert.equal(wrong.current!.kind, 'reinforcement');
    assert.equal(wrong.current!.exerciseId, correct.current!.exerciseId);
    assert.equal(wrong.completedCount, 2);
    assert.equal(await prisma.fsrsReview.count(), 2);
    assert.equal((await study.overview()).reinforcementCount, 1);
    const pendingReview = await service.createSession(undefined, 'review');
    assert.equal(pendingReview.current!.kind, 'reinforcement');
    assert.equal(pendingReview.current!.exerciseId, correct.current!.exerciseId, 'same-day reinforcement should repeat the failed exercise');
    const reinforced = await service.answer(created.id, { eventId: randomUUID(), position: 2, responses: { word: 'tregua' } });
    assert.equal(reinforced.finished, true);
    assert.equal(await prisma.fsrsReview.count(), 2);
    assert.equal(await prisma.clozeAttempt.count(), 3);
    assert.equal((await study.overview()).reinforcementCount, 0);
    for (const sense of [first, second]) {
      const state = await prisma.fsrsState.findUniqueOrThrow({ where: { learnerId_lexicalSenseId: { learnerId: 'local', lexicalSenseId: sense.id } } });
      const card = JSON.parse(state.schedulerData!); card.dueAt = new Date(Date.now() - 1000).toISOString();
      await prisma.fsrsState.update({ where: { id: state.id }, data: { dueAt: new Date(card.dueAt), schedulerData: JSON.stringify(card) } });
    }
    const reviewSession = await service.createSession(undefined, 'review');
    assert.equal(reviewSession.status, 'ready');
    assert.equal(reviewSession.requestedCount, 2);
    assert.equal(reviewSession.current!.exerciseId, ready.current!.exerciseId, 'review should repeat the last used cloze exercise');
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.clozeAttempt.update({ where: { eventId: firstEvent }, data: { reviewedAt: yesterday } });
    const laterReview = await service.createSession(undefined, 'review');
    assert.equal(laterReview.status, 'ready');
    assert.notEqual(laterReview.current!.exerciseId, ready.current!.exerciseId, 'review after an earlier day should choose an unused exercise');
    assert.equal((await prisma.clozeExercise.findUniqueOrThrow({ where: { id: laterReview.current!.exerciseId } })).position, 2);
    await prisma.clozeAttempt.update({ where: { eventId: firstEvent }, data: { reviewedAt: new Date() } });
    await assert.rejects(() => service.createSession(undefined, 'new'), (error: any) => error.status === 400);
    const nextSession = await service.createSession(2);
    assert.equal(nextSession.status, 'ready');
    assert.equal(nextSession.current!.exerciseId, ready.current!.exerciseId, 'same-day due review should keep its exercise');
    assert.equal(await prisma.clozeExerciseUsage.count(), 2);
    const reviewsBeforeUsageReset = await prisma.fsrsReview.count();
    assert.deepEqual(await service.resetExerciseUsage(), { cleared: 2 });
    assert.equal(await prisma.clozeExerciseUsage.count(), 0);
    assert.equal(await prisma.clozeAttempt.count(), 3);
    assert.equal(await prisma.fsrsReview.count(), reviewsBeforeUsageReset);
    const reused = await service.createSession(2);
    assert.equal(reused.status, 'ready');
    assert.equal(reused.current!.exerciseId, ready.current!.exerciseId);
    const available = await prisma.lexicalSense.create({ data: { lexicalItem: 'tregua', definition: 'pausa diversa', detailsJson: '{}' } });
    await prisma.clozeExercise.create({ data: { lexicalSenseId: available.id, position: 1, contentJson: JSON.stringify(exercise(available.id, 1)) } });
    const missing = await prisma.lexicalSense.create({ data: { lexicalItem: 'pausa', definition: 'interruzione', detailsJson: '{}' } });
    const partial = await prisma.clozeSession.create({ data: { selectedIdsJson: JSON.stringify([available.id, missing.id]), status: 'ready', failuresJson: JSON.stringify({ [`${missing.id}:1`]: 'Brak poprawnego ćwiczenia po trzech próbach.' }) } });
    const partialStart = await service.session(partial.id);
    assert.equal(partialStart.requestedCount, 2);
    const partialEnd = await service.answer(partial.id, { eventId: randomUUID(), position: 0, responses: { word: 'tregua' } });
    assert.equal(partialEnd.finished, true);
    assert.equal(partialEnd.completedCount, 1);
    assert.equal(partialEnd.failures[`${missing.id}:1`], 'Brak poprawnego ćwiczenia po trzech próbach.');
    await study.reset();
    assert.equal(await prisma.clozeSession.count(), 0);
    assert.equal(await prisma.clozeAttempt.count(), 0);
    assert.equal(await prisma.clozeExercise.count(), 9);
  } finally {
    await prisma?.$disconnect();
    if (oldUrl === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = oldUrl;
    await rm(directory, { recursive: true, force: true });
  }
});

test('reset during cloze generation cancels the worker without writing exercises or P2025 errors', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'filippo-cloze-reset-'));
  const oldUrl = process.env.DATABASE_URL;
  const oldError = console.error;
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
    const sense = await prisma.lexicalSense.create({ data: { lexicalItem: 'tregua', definition: 'pausa', detailsJson: '{}' } });
    const fsrs = new FsrsService(prisma as never);
    const service = new ClozeService(prisma as never, {} as never, fsrs, new StudyService(prisma as never, fsrs));
    let unblock!: () => void;
    let started!: () => void;
    const paused = new Promise<void>((resolve) => { unblock = resolve; });
    const entered = new Promise<void>((resolve) => { started = resolve; });
    (service as unknown as { generate: (ids: string[]) => Promise<unknown> }).generate = async (requested) => {
      started();
      await paused;
      return { results: requested.map((id) => ({ lexical_sense_id: id, slots: [1, 2, 3, 4].map((position) => ({ position, exercise: exercise(id, position) })) })) };
    };
    const created = await service.createSession(1);
    assert.equal(created.status, 'queued');
    const errors: unknown[][] = [];
    console.error = (...args: unknown[]) => { errors.push(args); };
    const worker = (service as unknown as { runNext: () => Promise<void> }).runNext();
    await entered;
    assert.deepEqual((await service.session(created.id)).generation, { processed: 0, total: 1 });
    await new StudyService(prisma as never, fsrs).reset();
    unblock();
    await worker;
    const p2025 = errors.some((entry) => entry.some((value) => value instanceof Error && String((value as { code?: string }).code) === 'P2025'));
    assert.equal(p2025, false, 'worker logged P2025 after session deletion');
    assert.equal(await prisma.clozeSession.count(), 0);
    assert.equal(await prisma.clozeExercise.count(), 0);
    assert.deepEqual(errors, []);
  } finally {
    console.error = oldError;
    await prisma?.$disconnect();
    if (oldUrl === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = oldUrl;
    await rm(directory, { recursive: true, force: true });
  }
});

test('exhausted cloze exercises cause a new four-exercise batch', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'filippo-cloze-next-batch-'));
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
    const sense = await prisma.lexicalSense.create({ data: { lexicalItem: 'tregua', definition: 'pausa', detailsJson: '{}' } });
    const firstExercise = await prisma.clozeExercise.create({ data: { lexicalSenseId: sense.id, position: 1, contentJson: JSON.stringify(exercise(sense.id, 1)) } });
    const fsrs = new FsrsService(prisma as never);
    const service = new ClozeService(prisma as never, {} as never, fsrs, new StudyService(prisma as never, fsrs));
    let calls = 0;
    (service as unknown as { generate: (ids: string[]) => Promise<unknown> }).generate = async (requested) => {
      calls += 1;
      return { results: requested.map((id) => ({ lexical_sense_id: id, slots: [1, 2, 3, 4].map((position) => ({ position, exercise: exercise(id, position) })) })) };
    };
    const resolvedWithoutAi = await prisma.clozeSession.create({ data: { selectedIdsJson: JSON.stringify([sense.id]), selectedKindsJson: JSON.stringify({ [sense.id]: 'new' }), status: 'queued', generationRequested: true, generationProcessed: 0 } });
    await (service as unknown as { runNext: () => Promise<void> }).runNext();
    assert.equal((await prisma.clozeSession.findUniqueOrThrow({ where: { id: resolvedWithoutAi.id } })).generationRequested, false);
    assert.equal(calls, 0);
    const oldSession = await service.createSession(1, 'new');
    assert.equal(oldSession.status, 'ready', 'one unused exercise should avoid generation');
    assert.equal(calls, 0);
    assert.deepEqual((await service.listSessions()).map((item) => item.id), [], 'using an existing exercise must not appear as AI generation');
    for (let position = 1; position <= 4; position += 1) {
      const row = position === 1 ? firstExercise : await prisma.clozeExercise.create({ data: { lexicalSenseId: sense.id, position, contentJson: JSON.stringify(exercise(sense.id, position)) } });
      await prisma.clozeAttempt.create({ data: { eventId: randomUUID(), sessionId: oldSession.id, lexicalSenseId: sense.id, exerciseId: row.id, position: position - 1, responseJson: '{}', correct: true, rating: Rating.Easy, reviewedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) } });
      await prisma.clozeExerciseUsage.create({ data: { exerciseId: row.id } });
    }
    await prisma.$transaction(async (tx) => fsrs.applyReviewInTransaction(tx, { reviewEventId: `test:${randomUUID()}`, lexicalSenseId: sense.id, rating: Rating.Easy, reviewedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) }));
    const state = await prisma.fsrsState.findUniqueOrThrow({ where: { learnerId_lexicalSenseId: { learnerId: 'local', lexicalSenseId: sense.id } } });
    const card = JSON.parse(state.schedulerData!); card.dueAt = new Date(Date.now() - 1000).toISOString();
    await prisma.fsrsState.update({ where: { id: state.id }, data: { dueAt: new Date(card.dueAt), schedulerData: JSON.stringify(card) } });
    const created = await service.createSession(undefined, 'review');
    assert.equal(created.status, 'queued');
    await (service as unknown as { runNext: () => Promise<void> }).runNext();
    const ready = await service.session(created.id);
    assert.equal(ready.status, 'ready');
    assert.equal(calls, 1);
    assert.deepEqual((await service.listSessions()).map((item) => item.id), [created.id], 'only the AI generation request should appear in the job list');
    assert.equal(await prisma.clozeExercise.count(), 8);
    const selected = await prisma.clozeExercise.findUniqueOrThrow({ where: { id: ready.current!.exerciseId } });
    assert.equal(selected.batch, 2);
    assert.equal(selected.position, 1);
  } finally {
    await prisma?.$disconnect();
    if (oldUrl === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = oldUrl;
    await rm(directory, { recursive: true, force: true });
  }
});
