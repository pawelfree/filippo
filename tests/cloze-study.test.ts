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
  const oldKey = process.env.OPENAI_API_KEY;
  const id = 'sense-test';
  const batch = { results: [{ lexical_sense_id: id, slots: [1, 2, 3, 4].map((position) => ({ position, exercise: exercise(id, position) })) }] };
  let request: any;
  process.env.OPENAI_API_KEY = 'test-key';
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
    delete batch.results[0].slots[0].exercise.sentence_pl;
    await assert.rejects(() => (service as unknown as { generate: (id: string) => Promise<unknown> }).generate(id), { status: 502 });
  } finally {
    globalThis.fetch = oldFetch;
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
    const service = new ClozeService(prisma as never, {} as never, new FsrsService(prisma as never));
    (service as unknown as { generate: (id: string) => Promise<unknown> }).generate = async (id) => ({ results: [{ lexical_sense_id: id, slots: [1, 2, 3, 4].map((position) => ({ position, exercise: exercise(id, position) })) }] });
    const created = await service.createSession(2);
    assert.equal(created.status, 'queued');
    await (service as unknown as { runNext: () => Promise<void> }).runNext();
    assert.equal(await prisma.clozeExercise.count(), 8);
    const ready = await service.session(created.id);
    assert.equal(ready.status, 'ready');
    assert.equal(ready.requestedCount, 2);
    assert.equal('answer_keys' in ready.current!.exercise, false);
    const firstEvent = randomUUID();
    const firstAnswer = { eventId: firstEvent, position: 0, responses: { word: 'tregua' } };
    const correct = await service.answer(created.id, firstAnswer);
    assert.deepEqual(correct.accepted, { correct: true, rating: Rating.Easy });
    assert.equal(correct.current!.position, 1);
    const retried = await service.answer(created.id, firstAnswer);
    assert.deepEqual(retried.accepted, correct.accepted);
    assert.equal(await prisma.fsrsReview.count(), 1);
    const wrong = await service.answer(created.id, { eventId: randomUUID(), position: 1, responses: { word: 'xyz' } });
    assert.deepEqual(wrong.accepted, { correct: false, rating: Rating.Again });
    assert.equal(wrong.finished, true);
    assert.equal(wrong.completedCount, 2);
    assert.equal(await prisma.fsrsReview.count(), 2);
    assert.equal(await prisma.clozeAttempt.count(), 2);
    assert.equal((await service.createSession(2)).status, 'ready');
    const available = await prisma.lexicalSense.create({ data: { lexicalItem: 'tregua', definition: 'pausa diversa', detailsJson: '{}' } });
    await prisma.clozeExercise.create({ data: { lexicalSenseId: available.id, position: 1, contentJson: JSON.stringify(exercise(available.id, 1)) } });
    const missing = await prisma.lexicalSense.create({ data: { lexicalItem: 'pausa', definition: 'interruzione', detailsJson: '{}' } });
    const partial = await prisma.clozeSession.create({ data: { selectedIdsJson: JSON.stringify([available.id, missing.id]), status: 'ready', failuresJson: JSON.stringify({ [`${missing.id}:1`]: 'Brak poprawnego ćwiczenia po trzech próbach.' }) } });
    const partialStart = await service.session(partial.id);
    assert.equal(partialStart.requestedCount, 2);
    const partialEnd = await service.answer(partial.id, { eventId: randomUUID(), position: 0, responses: { word: 'tregua' } });
    assert.equal(partialEnd.finished, true);
    assert.equal(partialEnd.completedCount, 2);
    assert.equal(partialEnd.failures[`${missing.id}:1`], 'Brak poprawnego ćwiczenia po trzech próbach.');
    await new StudyService(prisma as never, new FsrsService(prisma as never)).reset();
    assert.equal(await prisma.clozeSession.count(), 0);
    assert.equal(await prisma.clozeAttempt.count(), 0);
    assert.equal(await prisma.clozeExercise.count(), 9);
  } finally {
    await prisma?.$disconnect();
    if (oldUrl === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = oldUrl;
    await rm(directory, { recursive: true, force: true });
  }
});
