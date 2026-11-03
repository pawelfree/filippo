import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { Rating } from 'ts-fsrs';
import { ClozeService } from '../src/cloze/cloze.service';
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
    return { ok: true, json: async () => ({ output_text: JSON.stringify(batch) }) } as Response;
  }) as typeof fetch;
  try {
    const input = { prepare: async () => ({ lexical_senses: [{ id, lexical_item_it: 'tregua', part_of_speech: 'noun', definition_it: 'pausa', definition_pl: 'wytchnienie', usage: { register: 'neutral', patterns_it: [], collocations_it: [], constraints_pl: [] } }] }) };
    const service = new ClozeService({} as never, input as never, {} as never);
    const result = await (service as unknown as { generate: (id: string) => Promise<typeof batch> }).generate(id);
    assert.equal(result.results[0].slots.length, 4);
    assert.match(request.instructions, /sentence_pl/);
    assert.equal(JSON.parse(request.input).lexical_senses[0].id, id);
    assert.equal(logged[0][0], '[Cloze generation response]');
    delete batch.results[0].slots[0].exercise.sentence_pl;
    await assert.rejects(() => (service as unknown as { generate: (id: string) => Promise<unknown> }).generate(id), { status: 502 });
  } finally {
    globalThis.fetch = oldFetch;
    console.info = oldInfo;
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
    (service as unknown as { generate: (id: string) => Promise<unknown> }).generate = async (id) => ({ results: [{ lexical_sense_id: id, slots: [1, 2, 3, 4].map((position) => ({ position, exercise: exercise(id, position) })) }] });
    const interrupted = await prisma.clozeSession.create({ data: { selectedIdsJson: JSON.stringify([first.id, second.id]), status: 'failed' } });
    const interruptedBefore = await service.session(interrupted.id);
    const created = await service.createSession(2);
    assert.equal(created.status, 'queued');
    assert.deepEqual(created.generation, { processed: 0, total: 2 });
    assert.equal((await service.listSessions())[0].status, 'queued');
    await (service as unknown as { runNext: () => Promise<void> }).runNext();
    assert.equal(await prisma.clozeExercise.count(), 8);
    const ready = await service.session(created.id);
    assert.deepEqual((await service.session(interrupted.id)).generation, interruptedBefore.generation, 'later generated exercises changed interrupted job progress');
    assert.equal(ready.status, 'ready');
    assert.equal(ready.requestedCount, 2);
    assert.deepEqual(ready.generation, { processed: 2, total: 2 });
    const history = await service.listSessions();
    assert.equal(history[0].status, 'ready');
    assert.deepEqual(history[0].generation, { processed: 2, total: 2 });
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
    const nextSession = await service.createSession(2);
    assert.equal(nextSession.status, 'ready');
    assert.notEqual(nextSession.current!.exerciseId, ready.current!.exerciseId);
    assert.equal((await prisma.clozeExercise.findUniqueOrThrow({ where: { id: nextSession.current!.exerciseId } })).position, 2);
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
    (service as unknown as { generate: (id: string) => Promise<unknown> }).generate = async (id) => {
      started();
      await paused;
      return { results: [{ lexical_sense_id: id, slots: [1, 2, 3, 4].map((position) => ({ position, exercise: exercise(id, position) })) }] };
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
    (service as unknown as { generate: (id: string) => Promise<unknown> }).generate = async (id) => {
      calls += 1;
      return { results: [{ lexical_sense_id: id, slots: [1, 2, 3, 4].map((position) => ({ position, exercise: exercise(id, position) })) }] };
    };
    const oldSession = await service.createSession(1);
    assert.equal(oldSession.status, 'ready', 'one unused exercise should avoid generation');
    assert.equal(calls, 0);
    for (let position = 1; position <= 4; position += 1) {
      const row = position === 1 ? firstExercise : await prisma.clozeExercise.create({ data: { lexicalSenseId: sense.id, position, contentJson: JSON.stringify(exercise(sense.id, position)) } });
      await prisma.clozeAttempt.create({ data: { eventId: randomUUID(), sessionId: oldSession.id, lexicalSenseId: sense.id, exerciseId: row.id, position: position - 1, responseJson: '{}', correct: true, rating: Rating.Easy, reviewedAt: new Date() } });
    }
    const created = await service.createSession(1);
    assert.equal(created.status, 'queued');
    await (service as unknown as { runNext: () => Promise<void> }).runNext();
    const ready = await service.session(created.id);
    assert.equal(ready.status, 'ready');
    assert.equal(calls, 1);
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
