import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { Rating } from 'ts-fsrs';
import { FsrsService } from '../src/fsrs/fsrs.service';
import { StudyService } from '../src/study/study.service';

test('a forgotten new meaning returns after the other new meanings', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'filippo-study-order-'));
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
    const first = await prisma.lexicalSense.create({ data: { lexicalItem: 'casa', definition: 'abitazione' } });
    const second = await prisma.lexicalSense.create({ data: { lexicalItem: 'gatto', definition: 'animale' } });
    const study = new StudyService(prisma as never, new FsrsService(prisma as never));
    const initial = await study.next();
    assert.equal(initial.candidate?.lexicalSenseId, first.id);
    const forgotten = await study.record({ eventId: randomUUID(), lexicalSenseId: first.id, presentationToken: initial.candidate!.presentationToken, rating: Rating.Again });
    assert.equal(forgotten.reinforcementCount, 1);
    assert.equal(forgotten.newCount, 1);
    assert.equal(forgotten.candidate?.lexicalSenseId, second.id);
    assert.equal(forgotten.candidate?.kind, 'new');
    const learned = await study.record({ eventId: randomUUID(), lexicalSenseId: second.id, presentationToken: forgotten.candidate!.presentationToken, rating: Rating.Good });
    assert.equal(learned.candidate?.lexicalSenseId, first.id);
    assert.equal(learned.candidate?.kind, 'reinforcement');
    const fsrsReviewsBeforeReinforcement = await prisma.fsrsReview.count();
    const stillForgotten = await study.record({ eventId: randomUUID(), lexicalSenseId: first.id, presentationToken: learned.candidate!.presentationToken, rating: Rating.Again });
    assert.equal(stillForgotten.accepted.kind, 'reinforcement');
    assert.equal(await prisma.fsrsReview.count(), fsrsReviewsBeforeReinforcement);
    assert.equal(stillForgotten.reinforcementCount, 0);
    assert.equal(stillForgotten.candidate, null);
    const third = await prisma.lexicalSense.create({ data: { lexicalItem: 'acqua', definition: 'liquido' } });
    const resumed = new StudyService(prisma as never, new FsrsService(prisma as never));
    assert.equal((await resumed.next()).candidate?.lexicalSenseId, third.id);
    const stored = (await prisma.fsrsState.findUnique({ where: { learnerId_lexicalSenseId: { learnerId: 'local', lexicalSenseId: first.id } } }))!;
    const card = JSON.parse(stored.schedulerData!);
    card.dueAt = new Date(Date.now() - 1000).toISOString();
    await prisma.fsrsState.update({ where: { id: stored.id }, data: { dueAt: new Date(card.dueAt), schedulerData: JSON.stringify(card) } });
    const due = await resumed.next();
    assert.equal(due.candidate?.lexicalSenseId, first.id);
    assert.equal(due.candidate?.kind, 'due');
    const dueAgain = await resumed.record({ eventId: randomUUID(), lexicalSenseId: first.id, presentationToken: due.candidate!.presentationToken, rating: Rating.Again });
    assert.equal(dueAgain.candidate?.kind, 'reinforcement');
    const reviewsAfterDue = await prisma.fsrsReview.count();
    const reinforcedAgain = await resumed.record({ eventId: randomUUID(), lexicalSenseId: first.id, presentationToken: dueAgain.candidate!.presentationToken, rating: Rating.Again });
    assert.equal(reinforcedAgain.reinforcementCount, 0);
    assert.equal(reinforcedAgain.candidate?.lexicalSenseId, third.id);
    assert.equal(reinforcedAgain.candidate?.kind, 'new');
    assert.equal(await prisma.fsrsReview.count(), reviewsAfterDue);
  } finally {
    await prisma?.$disconnect();
    if (oldUrl === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = oldUrl;
    await rm(directory, { recursive: true, force: true });
  }
});

test('study queue persists formal and local attempts, retries safely, and rolls back partial reviews', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'filippo-study-'));
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
    const first = await prisma.lexicalSense.create({ data: { lexicalItem: 'casa', definition: 'abitazione', detailsJson: JSON.stringify({ definition_pl: 'dom', part_of_speech: 'noun' }) } });
    const second = await prisma.lexicalSense.create({ data: { lexicalItem: 'gatto', definition: 'animale' } });
    const fsrs = new FsrsService(prisma as never);
    const study = new StudyService(prisma as never, fsrs);
    assert.deepEqual(await study.overview(), { dueCount: 0, reinforcementCount: 0, newCount: 2, nextDueAt: null });

    const firstCandidate = (await study.next()).candidate!;
    assert.equal(firstCandidate.lexicalSenseId, first.id);
    assert.equal((firstCandidate.sense.details as { definition_pl: string }).definition_pl, 'dom');
    const firstEvent = randomUUID();
    const firstBody = { eventId: firstEvent, lexicalSenseId: first.id, presentationToken: firstCandidate.presentationToken, rating: Rating.Good };
    const firstResult = await study.record(firstBody);
    assert.equal(firstResult.accepted.kind, 'new');
    assert.equal(firstResult.newCount, 1);
    assert.equal(await prisma.fsrsReview.count(), 1);
    const localDate = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(firstResult.accepted.reviewedAt).map(({ type, value }) => [type, value]));
    assert.equal((await prisma.studyAttempt.findUnique({ where: { eventId: firstEvent } }))!.dayKey, `${localDate.year}-${localDate.month}-${localDate.day}`);
    const repeated = await study.record(firstBody);
    assert.deepEqual(repeated.accepted, firstResult.accepted);
    assert.equal(await prisma.studyAttempt.count(), 1);
    await assert.rejects(() => study.record({ ...firstBody, eventId: randomUUID() }), (error: any) => error.status === 409);
    await assert.rejects(() => study.record({ ...firstBody, rating: Rating.Easy }), (error: any) => error.status === 409);

    const secondCandidate = (await study.next()).candidate!;
    assert.equal(secondCandidate.lexicalSenseId, second.id);
    const again = await study.record({ eventId: randomUUID(), lexicalSenseId: second.id, presentationToken: secondCandidate.presentationToken, rating: Rating.Again });
    assert.equal(again.reinforcementCount, 1);
    assert.equal(again.candidate?.lexicalSenseId, second.id);
    assert.equal(again.candidate?.kind, 'reinforcement');
    const local = await study.record({ eventId: randomUUID(), lexicalSenseId: second.id, presentationToken: again.candidate!.presentationToken, rating: Rating.Good });
    assert.equal(local.accepted.kind, 'reinforcement');
    assert.equal(local.reinforcementCount, 0);
    assert.equal(await prisma.fsrsReview.count(), 2);
    assert.equal(local.candidate, null);

    const third = await prisma.lexicalSense.create({ data: { lexicalItem: 'acqua', definition: 'liquido' } });

    const stored = (await prisma.fsrsState.findUnique({ where: { learnerId_lexicalSenseId: { learnerId: 'local', lexicalSenseId: second.id } } }))!;
    const card = JSON.parse(stored.schedulerData!);
    card.dueAt = new Date(Date.now() - 1000).toISOString();
    await prisma.fsrsState.update({ where: { id: stored.id }, data: { dueAt: new Date(card.dueAt), schedulerData: JSON.stringify(card) } });
    const due = await study.next();
    assert.equal(due.dueCount, 1);
    assert.equal(due.candidate?.kind, 'due');
    assert.equal(due.candidate?.lexicalSenseId, second.id);
    const nextAgain = await study.record({ eventId: randomUUID(), lexicalSenseId: second.id, presentationToken: due.candidate!.presentationToken, rating: Rating.Again });
    assert.equal(await prisma.fsrsReview.count(), 3);
    assert.equal(nextAgain.candidate?.kind, 'reinforcement');
    const reinforcementToken = nextAgain.candidate!.presentationToken;
    const promotedState = (await prisma.fsrsState.findUnique({ where: { learnerId_lexicalSenseId: { learnerId: 'local', lexicalSenseId: second.id } } }))!;
    const promotedCard = JSON.parse(promotedState.schedulerData!);
    promotedCard.dueAt = new Date(Date.now() - 1000).toISOString();
    await prisma.fsrsState.update({ where: { id: promotedState.id }, data: { dueAt: new Date(promotedCard.dueAt), schedulerData: JSON.stringify(promotedCard) } });
    const promoted = await study.record({ eventId: randomUUID(), lexicalSenseId: second.id, presentationToken: reinforcementToken, rating: Rating.Good });
    assert.equal(promoted.accepted.kind, 'due');
    assert.equal(await prisma.fsrsReview.count(), 4);

    const thirdCandidate = (await study.next()).candidate!;
    assert.equal(thirdCandidate.lexicalSenseId, third.id);
    const rollbackId = randomUUID();
    await prisma.$executeRawUnsafe(`CREATE TRIGGER reject_study_attempt BEFORE INSERT ON StudyAttempt WHEN NEW.eventId = '${rollbackId}' BEGIN SELECT RAISE(ABORT, 'forced'); END`);
    await assert.rejects(() => study.record({ eventId: rollbackId, lexicalSenseId: third.id, presentationToken: thirdCandidate.presentationToken, rating: Rating.Good }));
    assert.equal(await fsrs.getState(third.id), null);
    assert.equal(await prisma.fsrsReview.count(), 4);
    await prisma.$executeRawUnsafe('DROP TRIGGER reject_study_attempt');

    await prisma.$disconnect();
    prisma = new PrismaClient();
    const resumed = new StudyService(prisma as never, new FsrsService(prisma as never));
    assert.equal((await resumed.next()).candidate?.lexicalSenseId, third.id);
    assert.equal((await resumed.overview()).newCount, 1);
    const parallelCandidate = (await resumed.next()).candidate!;
    const parallel = await Promise.allSettled([
      resumed.record({ eventId: randomUUID(), lexicalSenseId: third.id, presentationToken: parallelCandidate.presentationToken, rating: Rating.Good }),
      new StudyService(prisma as never, new FsrsService(prisma as never)).record({ eventId: randomUUID(), lexicalSenseId: third.id, presentationToken: parallelCandidate.presentationToken, rating: Rating.Easy }),
    ]);
    assert.equal(parallel.filter((result) => result.status === 'fulfilled').length, 1);
    assert.equal((parallel.find((result) => result.status === 'rejected') as PromiseRejectedResult).reason.status, 409);
    assert.equal(await prisma.fsrsReview.count({ where: { lexicalSenseId: third.id } }), 1);
    assert.equal(await prisma.studyAttempt.count({ where: { lexicalSenseId: third.id } }), 1);

    const fourth = await prisma.lexicalSense.create({ data: { lexicalItem: 'libro', definition: 'opera scritta' } });
    const restoredFsrs = new FsrsService(prisma as never);
    await restoredFsrs.applyReview({ reviewEventId: 'old-review', lexicalSenseId: fourth.id, rating: Rating.Good, reviewedAt: new Date(Date.now() - 60_000) });
    await prisma.studyAttempt.create({ data: { eventId: randomUUID(), lexicalSenseId: fourth.id, presentationToken: 'b'.repeat(64), kind: 'reinforcement', rating: Rating.Again, reviewedAt: new Date(Date.now() - 60_000), dayKey: '1900-01-01' } });
    assert.equal((await resumed.overview()).reinforcementCount, 0);

    const fifth = await prisma.lexicalSense.create({ data: { lexicalItem: 'sole', definition: 'stella' } });
    const beforeReset = await resumed.next();
    assert.equal(beforeReset.candidate?.lexicalSenseId, fifth.id);
    const configBeforeReset = await restoredFsrs.getConfig();
    const attemptsBeforeReset = await prisma.studyAttempt.count();
    const reviewsBeforeReset = await prisma.fsrsReview.count();
    const statesBeforeReset = await prisma.fsrsState.count();
    await prisma.$executeRawUnsafe("CREATE TRIGGER abort_study_reset BEFORE DELETE ON FsrsReview BEGIN SELECT RAISE(ABORT, 'forced'); END");
    await assert.rejects(() => resumed.reset());
    assert.equal(await prisma.studyAttempt.count(), attemptsBeforeReset);
    assert.equal(await prisma.fsrsReview.count(), reviewsBeforeReset);
    assert.equal(await prisma.fsrsState.count(), statesBeforeReset);
    assert.equal((await restoredFsrs.getConfig()).revision, configBeforeReset.revision);
    await prisma.$executeRawUnsafe('DROP TRIGGER abort_study_reset');
    const afterReset = await resumed.reset();
    assert.deepEqual(afterReset, { dueCount: 0, reinforcementCount: 0, newCount: 5, nextDueAt: null });
    assert.equal(await prisma.lexicalSense.count(), 5);
    assert.equal(await prisma.fsrsState.count(), 0);
    assert.equal(await prisma.fsrsReview.count(), 0);
    assert.equal(await prisma.studyAttempt.count(), 0);
    const configAfterReset = await restoredFsrs.getConfig();
    assert.deepEqual(configAfterReset.overrides, configBeforeReset.overrides);
    assert.equal(configAfterReset.revision, configBeforeReset.revision + 1);
    await assert.rejects(() => resumed.record({ eventId: randomUUID(), lexicalSenseId: fifth.id, presentationToken: beforeReset.candidate!.presentationToken, rating: Rating.Good }), (error: any) => error.status === 409);
    assert.equal(await prisma.fsrsState.count(), 0);
    const fresh = await resumed.next();
    assert.notEqual(fresh.candidate?.presentationToken, beforeReset.candidate?.presentationToken);
    await resumed.record({ eventId: randomUUID(), lexicalSenseId: fresh.candidate!.lexicalSenseId, presentationToken: fresh.candidate!.presentationToken, rating: Rating.Good });
    assert.equal(await prisma.fsrsState.count(), 1);
  } finally {
    await prisma?.$disconnect();
    if (oldUrl === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = oldUrl;
    await rm(directory, { recursive: true, force: true });
  }
});
