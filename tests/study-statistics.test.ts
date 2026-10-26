import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { DefaultScheduler, Rating } from 'ts-fsrs';
import { FsrsService } from '../src/fsrs/fsrs.service';
import { StudyStatisticsService } from '../src/study/study-statistics.service';
import { StudyService } from '../src/study/study.service';

test('statistics separate formal reviews, first daily retention, reinforcement, and Warsaw due dates', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'filippo-statistics-'));
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
    const statistics = new StudyStatisticsService(prisma as never, fsrs);
    const asOf = new Date('2026-10-26T12:00:00.000Z');
    const senses = [];
    for (const item of ['casa', 'gatto', 'acqua', 'libro', 'sole', 'ponte']) {
      senses.push(await prisma.lexicalSense.create({ data: { lexicalItem: item, definition: item } }));
    }
    const empty = await statistics.overview('7d', asOf);
    assert.equal(empty.retention.overall.rate, null);
    assert.equal(empty.summary.newCount, 6);
    assert.equal(empty.scheduled.overdue, 0);
    assert.equal((await statistics.memory(asOf)).count, 0);
    assert.equal(await prisma.fsrsConfigRevision.count(), 0, 'read-only statistics must not initialize FSRS configuration');

    for (const sense of senses.slice(0, 5)) {
      await fsrs.applyReview({ reviewEventId: `setup-${sense.id}`, lexicalSenseId: sense.id, rating: Rating.Good, reviewedAt: new Date('2026-10-24T10:00:00.000Z') });
    }
    await prisma.fsrsReview.deleteMany();
    const dueDates = [
      '2026-10-26T11:00:00.000Z', // overdue
      '2026-10-26T18:00:00.000Z', // later today in Warsaw
      '2026-10-27T00:00:00.000Z', // next Warsaw day
      '2026-11-05T00:00:00.000Z', // within 30 days, beyond 7 days
      '2026-12-01T00:00:00.000Z', // beyond the calendar
    ];
    for (let index = 0; index < 5; index += 1) {
      const state = await prisma.fsrsState.findUniqueOrThrow({ where: { learnerId_lexicalSenseId: { learnerId: 'local', lexicalSenseId: senses[index].id } } });
      const card = JSON.parse(state.schedulerData!);
      card.dueAt = dueDates[index];
      await prisma.fsrsState.update({ where: { id: state.id }, data: { dueAt: new Date(dueDates[index]), schedulerData: JSON.stringify(card) } });
    }
    const insertReview = async (eventId: string, senseIndex: number, rating: number, reviewedAt: string, kind?: string) => {
      await prisma!.fsrsReview.create({ data: {
        reviewEventId: eventId, lexicalSenseId: senses[senseIndex].id, rating,
        reviewedAt: new Date(reviewedAt), revlogJson: '{}', cardJson: '{}', configRevision: 1,
      } });
      if (kind) await prisma!.studyAttempt.create({ data: {
        eventId: `attempt-${eventId}`, lexicalSenseId: senses[senseIndex].id,
        presentationToken: 'a'.repeat(64), kind, rating, reviewedAt: new Date(reviewedAt),
        dayKey: 'ignored-by-statistics', fsrsReviewEventId: eventId,
      } });
    };
    // Europe/Warsaw changes from UTC+2 to UTC+1 on 25 October 2026.
    await insertReview('first-day', 0, Rating.Good, '2026-10-25T22:30:00.000Z', 'new');
    await insertReview('next-day-first', 0, Rating.Again, '2026-10-25T23:30:00.000Z', 'due');
    await insertReview('next-day-second', 0, Rating.Easy, '2026-10-25T23:40:00.000Z', 'due');
    await insertReview('direct', 1, Rating.Hard, '2026-10-26T08:00:00.000Z');
    await prisma.studyAttempt.create({ data: {
      eventId: 'reinforcement', lexicalSenseId: senses[0].id,
      presentationToken: 'b'.repeat(64), kind: 'reinforcement', rating: Rating.Good,
      reviewedAt: new Date('2026-10-26T09:00:00.000Z'), dayKey: '2026-10-26',
    } });
    const result = await statistics.overview('7d', asOf);
    assert.deepEqual(result.summary, { total: 6, studied: 5, newCount: 1, dueNow: 1, formalReviews: 4 });
    assert.deepEqual(result.retention, {
      overall: { success: 2, total: 3, rate: 2 / 3 },
      due: { success: 0, total: 1, rate: 0 }, unclassified: 1,
    });
    assert.deepEqual(result.history.find((day) => day.day === '2026-10-26'), {
      day: '2026-10-26', again: 1, hard: 1, good: 0, easy: 1, reinforcements: 1,
    });
    assert.deepEqual(result.scheduled.days[0], { day: '2026-10-27', count: 1 });
    assert.deepEqual([result.scheduled.overdue, result.scheduled.today, result.scheduled.beyond], [1, 1, 1]);
    assert.equal(result.scheduled.days.find((day) => day.day === '2026-11-05')?.count, 1);
    const sevenDaySchedule = await statistics.overview('7d', asOf, '7d');
    assert.equal(sevenDaySchedule.scheduleRange, '7d');
    assert.equal(sevenDaySchedule.scheduled.days.length, 7);
    assert.deepEqual([sevenDaySchedule.scheduled.overdue, sevenDaySchedule.scheduled.today, sevenDaySchedule.scheduled.beyond], [1, 1, 2]);
    await assert.rejects(() => statistics.overview('invalid', asOf), (error: any) => error.status === 400);
    await assert.rejects(() => statistics.overview('7d', asOf, '90d'), (error: any) => error.status === 400);

    const firstState = await prisma.fsrsState.findUniqueOrThrow({ where: { learnerId_lexicalSenseId: { learnerId: 'local', lexicalSenseId: senses[0].id } } });
    const scheduler = await DefaultScheduler({ version: 'FSRS-7' });
    const card = fsrs.readStoredCard(firstState);
    const expectedR = scheduler.model.forgettingCurve(card, scheduler.chrono.difference(card.lastReviewAt!, asOf));
    await fsrs.updateConfig({ desiredRetention: 0.8 });
    const beforeRead = await prisma.fsrsConfigRevision.count();
    const memory = await statistics.memory(asOf);
    assert.equal(memory.count, 5);
    assert.equal(memory.distributions.difficulty.reduce((sum, bucket) => sum + bucket.count, 0), 5);
    assert.equal(memory.distributions.stability.reduce((sum, bucket) => sum + bucket.count, 0), 5);
    assert.equal(memory.distributions.retrievability.reduce((sum, bucket) => sum + bucket.count, 0), 5);
    assert.ok(Math.abs(memory.estimatedKnown - 5 * expectedR) < 0.000001);
    assert.equal(await prisma.fsrsConfigRevision.count(), beforeRead);

    await prisma.fsrsState.update({ where: { id: firstState.id }, data: { schedulerData: '{broken' } });
    await assert.rejects(() => statistics.memory(asOf), (error: any) => error.status === 409 && error.response.invalidCount === 1);
    assert.equal((await statistics.overview('7d', asOf)).summary.formalReviews, 4, 'memory failure must leave history available');
    await new StudyService(prisma as never, fsrs).reset();
    const afterReset = await statistics.overview('7d', asOf);
    assert.equal(afterReset.summary.studied, 0);
    assert.equal(afterReset.summary.newCount, 6);
    assert.equal(afterReset.retention.overall.rate, null);
  } finally {
    await prisma?.$disconnect();
    if (previousUrl === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = previousUrl;
    await rm(directory, { recursive: true, force: true });
  }
});
