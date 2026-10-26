import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { Rating } from 'ts-fsrs';
import { FsrsService } from '../src/fsrs/fsrs.service';

test('FSRS service persists reviews, restores cards, rejects conflicting and late events, and revisions config', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'filippo-fsrs-'));
  const oldUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = `file:${join(directory, 'test.db')}`;
  let prisma: PrismaClient | undefined;
  try {
    const migrationsRoot = join(process.cwd(), 'prisma', 'migrations');
    const migrations = (await readdir(migrationsRoot, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
    for (const migration of migrations) {
      const sql = await readFile(join(migrationsRoot, migration, 'migration.sql'), 'utf8');
      const applied = spawnSync('sqlite3', [join(directory, 'test.db')], { input: sql, encoding: 'utf8' });
      assert.equal(applied.status, 0, applied.stderr || applied.stdout);
    }
    prisma = new PrismaClient();
    const first = await prisma.lexicalSense.create({ data: { lexicalItem: 'casa', definition: 'edificio' } });
    const second = await prisma.lexicalSense.create({ data: { lexicalItem: 'casa', definition: 'famiglia' } });
    const service = new FsrsService(prisma as never);
    assert.equal(await service.getState(first.id), null);
    assert.equal((await service.getConfig()).revision, 1);
    assert.deepEqual((await service.getConfig()).overrides, {});

    const at = new Date('2026-10-01T12:00:00.000Z');
    const firstReview = await service.applyReview({ reviewEventId: 'one', lexicalSenseId: first.id, rating: Rating.Good, reviewedAt: at });
    assert.equal(firstReview.card.reps, 1);
    assert.equal(firstReview.revlog.rating, Rating.Good);
    assert.equal(firstReview.card.dueAt.getTime(), firstReview.dueAt.getTime());
    assert.equal(firstReview.configRevision, 1);
    assert.equal((await service.getState(first.id))?.dueAt.getTime(), firstReview.dueAt.getTime());
    assert.equal(await service.getState(second.id), null);

    const repeated = await service.applyReview({ reviewEventId: 'one', lexicalSenseId: first.id, rating: Rating.Good, reviewedAt: at });
    assert.deepEqual(repeated, firstReview);
    assert.equal(await prisma.fsrsReview.count(), 1);
    await assert.rejects(() => service.applyReview({ reviewEventId: 'one', lexicalSenseId: first.id, rating: Rating.Easy, reviewedAt: at }), /zdarzeni|identyfikator/i);
    await assert.rejects(() => service.applyReview({ reviewEventId: 'late', lexicalSenseId: first.id, rating: Rating.Again, reviewedAt: new Date(at.getTime() - 1000) }), /starsz|kolejności/i);

    const priorDue = (await service.getState(first.id))!.dueAt;
    await assert.rejects(() => service.updateConfig({ desiredRetention: 2 }), /konfigurac|parametr/i);
    assert.equal((await service.getConfig()).revision, 1);
    const config = await service.updateConfig({ desiredRetention: 0.92, enableFuzz: false });
    assert.equal(config.revision, 2);
    assert.equal((await service.getState(first.id))!.dueAt.getTime(), priorDue.getTime());

    const next = await service.applyReview({ reviewEventId: 'two', lexicalSenseId: first.id, rating: Rating.Hard, reviewedAt: new Date(at.getTime() + 86_400_000) });
    assert.equal(next.card.reps, 2);
    assert.equal(next.configRevision, 2);
    const other = await service.applyReview({ reviewEventId: 'three', lexicalSenseId: second.id, rating: Rating.Again, reviewedAt: at });
    assert.equal(other.card.reps, 1);
    const easy = await service.applyReview({ reviewEventId: 'four', lexicalSenseId: second.id, rating: Rating.Easy, reviewedAt: new Date(at.getTime() + 86_400_000) });
    assert.equal(easy.revlog.rating, Rating.Easy);
    assert.equal((await prisma.fsrsReview.findMany({ where: { lexicalSenseId: first.id } })).length, 2);

    const concurrent = await Promise.all([
      service.applyReview({ reviewEventId: 'five', lexicalSenseId: first.id, rating: Rating.Good, reviewedAt: new Date(at.getTime() + 2 * 86_400_000) }),
      service.applyReview({ reviewEventId: 'six', lexicalSenseId: first.id, rating: Rating.Hard, reviewedAt: new Date(at.getTime() + 3 * 86_400_000) }),
    ]);
    assert.equal(concurrent[1].card.reps, 4);
    const beforeRollback = await service.getState(first.id);
    await prisma.$executeRawUnsafe("CREATE TRIGGER reject_fsrs_review BEFORE INSERT ON FsrsReview WHEN NEW.reviewEventId = 'rollback' BEGIN SELECT RAISE(ABORT, 'forced'); END");
    await assert.rejects(() => service.applyReview({ reviewEventId: 'rollback', lexicalSenseId: first.id, rating: Rating.Good, reviewedAt: new Date(at.getTime() + 4 * 86_400_000) }));
    assert.deepEqual(await service.getState(first.id), beforeRollback);
    assert.equal(await prisma.fsrsReview.count({ where: { lexicalSenseId: first.id } }), 4);
    await prisma.$executeRawUnsafe('DROP TRIGGER reject_fsrs_review');

    const repeatedAfterConfig = await service.applyReview({ reviewEventId: 'one', lexicalSenseId: first.id, rating: Rating.Good, reviewedAt: at });
    assert.deepEqual(repeatedAfterConfig, firstReview);

    const otherInstance = new FsrsService(prisma as never);
    const crossInstance = await Promise.allSettled([
      service.applyReview({ reviewEventId: 'seven', lexicalSenseId: first.id, rating: Rating.Good, reviewedAt: new Date(at.getTime() + 4 * 86_400_000) }),
      otherInstance.applyReview({ reviewEventId: 'eight', lexicalSenseId: first.id, rating: Rating.Easy, reviewedAt: new Date(at.getTime() + 5 * 86_400_000) }),
    ]);
    const successes = crossInstance.filter((outcome): outcome is PromiseFulfilledResult<Awaited<ReturnType<FsrsService['applyReview']>>> => outcome.status === 'fulfilled');
    for (const outcome of crossInstance) if (outcome.status === 'rejected') assert.equal((outcome.reason as { status?: number }).status, 409);
    assert.ok(successes.length >= 1);
    assert.equal(await prisma.fsrsReview.count({ where: { lexicalSenseId: first.id } }), 4 + successes.length);
    const finalState = await service.getState(first.id);
    assert.ok(successes.some((outcome) => outcome.value.dueAt.getTime() === finalState?.dueAt.getTime()));

    await prisma.$disconnect();
    prisma = new PrismaClient();
    const restarted = new FsrsService(prisma as never);
    const restored = await restarted.getState(first.id);
    assert.ok(restored);
    assert.ok(restored.card.dueAt instanceof Date);
    assert.ok(restored.card.lastReviewAt instanceof Date);
    assert.equal(restored.dueAt.getTime(), finalState.dueAt.getTime());
    assert.equal((await restarted.getConfig()).revision, 2);
    assert.equal((await restarted.getReviews(first.id)).length, 4 + successes.length);
  } finally {
    await prisma?.$disconnect();
    if (oldUrl === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = oldUrl;
    await rm(directory, { recursive: true, force: true });
  }
});
