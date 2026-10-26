import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { Rating } from 'ts-fsrs';
import { FsrsService } from '../src/fsrs/fsrs.service';
import { StudySimulationService } from '../src/study/study-simulation.service';
import { StudyService } from '../src/study/study.service';

test('simulation is deterministic, bounded by new senses, and does not write FSRS data', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'filippo-simulation-'));
  const previousUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = `file:${join(directory, 'test.db')}`;
  let prisma: PrismaClient | undefined;
  try {
    const migrationsRoot = join(process.cwd(), 'prisma', 'migrations');
    const migrations = (await readdir(migrationsRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
    for (const migration of migrations) {
      const sql = await readFile(join(migrationsRoot, migration, 'migration.sql'), 'utf8');
      const result = spawnSync('sqlite3', [join(directory, 'test.db')], { input: sql, encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr || result.stdout);
    }
    prisma = new PrismaClient();
    const fsrs = new FsrsService(prisma as never);
    const simulation = new StudySimulationService(prisma as never, fsrs);
    const asOf = new Date('2026-10-26T12:00:00.000Z');
    const empty = await simulation.simulate({ newPerDay: 0, seed: 7 }, asOf);
    assert.equal(empty.daily.length, 30);
    assert.ok(empty.daily.every((day) => day.formalMean === 0 && day.newMean === 0 && day.reinforcementMean === 0));
    assert.equal(await prisma.fsrsConfigRevision.count(), 0, 'empty simulation must not initialize configuration');
    assert.equal((await simulation.simulate({ newPerDay: 1 }, asOf)).actualNewAvailable, 0);
    await assert.rejects(() => simulation.simulate({ newPerDay: -1 }, asOf), (error: any) => error.status === 400);
    await assert.rejects(() => simulation.simulate({ newPerDay: 101 }, asOf), (error: any) => error.status === 400);
    await assert.rejects(() => simulation.simulate({ seed: 1.5 }, asOf), (error: any) => error.status === 400);
    await assert.rejects(() => simulation.simulate({ unexpected: true }, asOf), (error: any) => error.status === 400);

    const learned = await prisma.lexicalSense.create({ data: { lexicalItem: 'casa', definition: 'abitazione' } });
    await prisma.lexicalSense.create({ data: { lexicalItem: 'gatto', definition: 'animale' } });
    await prisma.lexicalSense.create({ data: { lexicalItem: 'sole', definition: 'stella' } });
    await assert.rejects(() => simulation.simulate({ newPerDay: 1 }, asOf), (error: any) => error.status === 409);
    const reviewAt = new Date('2026-10-24T12:00:00.000Z');
    await fsrs.applyReview({ reviewEventId: 'first-new', lexicalSenseId: learned.id, rating: Rating.Good, reviewedAt: reviewAt });
    await prisma.studyAttempt.create({ data: {
      eventId: 'first-new-attempt', lexicalSenseId: learned.id, presentationToken: 'a'.repeat(64),
      kind: 'new', rating: Rating.Good, reviewedAt: reviewAt, dayKey: '2026-10-24', fsrsReviewEventId: 'first-new',
    } });
    const state = await prisma.fsrsState.findUniqueOrThrow({ where: { learnerId_lexicalSenseId: { learnerId: 'local', lexicalSenseId: learned.id } } });
    const card = JSON.parse(state.schedulerData!);
    card.dueAt = '2026-10-26T12:10:00.000Z';
    await prisma.fsrsState.update({ where: { id: state.id }, data: { dueAt: new Date(card.dueAt), schedulerData: JSON.stringify(card) } });
    const before = {
      states: await prisma.fsrsState.findMany(),
      reviews: await prisma.fsrsReview.findMany(),
      attempts: await prisma.studyAttempt.findMany(),
      revisions: await prisma.fsrsConfigRevision.findMany(),
    };
    const first = await simulation.simulate({ newPerDay: 1, seed: 1234 }, asOf);
    const again = await simulation.simulate({ newPerDay: 1, seed: 1234 }, asOf);
    assert.deepEqual(again, first);
    assert.equal(first.actualNewAvailable, 2);
    assert.equal(first.runs, 100);
    assert.equal(first.sampleSizes.firstNew, 1);
    assert.equal(first.assumptions.newRatingSource, 'first-new-30d');
    assert.equal(first.daily[0].formalMean >= 1, true);
    assert.deepEqual(first.daily.slice(0, 3).map((day) => day.newMean), [1, 1, 0]);
    assert.equal(first.daily.reduce((sum, day) => sum + day.newMean, 0), 2);
    assert.deepEqual(await prisma.fsrsState.findMany(), before.states);
    assert.deepEqual(await prisma.fsrsReview.findMany(), before.reviews);
    assert.deepEqual(await prisma.studyAttempt.findMany(), before.attempts);
    assert.deepEqual(await prisma.fsrsConfigRevision.findMany(), before.revisions);

    card.dueAt = '2026-12-20T12:00:00.000Z';
    await prisma.fsrsState.update({ where: { id: state.id }, data: { dueAt: new Date(card.dueAt), schedulerData: JSON.stringify(card) } });
    const changed = await simulation.simulate({ newPerDay: 0, seed: 1234 }, asOf);
    assert.equal(changed.daily[0].formalMean, 0);
    assert.notDeepEqual(changed.daily, first.daily);

    await prisma.fsrsState.update({ where: { id: state.id }, data: { schedulerData: '{broken' } });
    await assert.rejects(() => simulation.simulate({ newPerDay: 0 }, asOf), (error: any) => error.status === 409);
    await new StudyService(prisma as never, fsrs).reset();
    const afterReset = await simulation.simulate({ newPerDay: 0 }, asOf);
    assert.equal(afterReset.daily[0].formalMean, 0);
    assert.equal(afterReset.actualNewAvailable, 3);
    await fsrs.applyReview({ reviewEventId: 'short-step', lexicalSenseId: learned.id, rating: Rating.Again, reviewedAt: asOf });
    const shortSteps = await simulation.simulate({ newPerDay: 0, seed: 8 }, asOf);
    assert.ok(shortSteps.daily[0].formalMean > 1, 'short FSRS intervals on one day must count as separate formal reviews');
    await prisma.lexicalSense.createMany({ data: Array.from({ length: 100 }, (_, index) => ({ lexicalItem: `test-${index}`, definition: 'test' })) });
    const larger = await simulation.simulate({ newPerDay: 5, seed: 8 }, asOf);
    assert.equal(larger.daily.length, 30);
    assert.equal(larger.daily.reduce((sum, day) => sum + day.newMean, 0), 102);
  } finally {
    await prisma?.$disconnect();
    if (previousUrl === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = previousUrl;
    await rm(directory, { recursive: true, force: true });
  }
});
