import { createHash } from 'node:crypto';
import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type FsrsState, type LexicalSense, type StudyAttempt } from '@prisma/client';
import { Rating } from 'ts-fsrs';
import { PrismaService } from '../database/prisma.service';
import { FsrsService, type FsrsRating } from '../fsrs/fsrs.service';

type StudyDb = PrismaService | Prisma.TransactionClient;
type Kind = 'due' | 'reinforcement' | 'new';
type Counts = { dueCount: number; reinforcementCount: number; newCount: number; nextDueAt: Date | null };
type Candidate = { lexicalSenseId: string; sense: Record<string, unknown>; kind: Kind; presentationToken: string };
type Next = Counts & { candidate: Candidate | null };

const learnerId = 'local';
const warsawDay = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit' });

function dayKey(now: Date): string {
  const parts = Object.fromEntries(warsawDay.formatToParts(now).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function token(id: string, kind: Kind, version: number | null, lastEventId: string | null, day: string, configRevision: number): string {
  return createHash('sha256').update(JSON.stringify([id, kind, version, lastEventId, day, configRevision])).digest('hex');
}

function publicSense(sense: LexicalSense): Record<string, unknown> {
  let details: Record<string, unknown> | null = null;
  if (sense.detailsJson) {
    try {
      const parsed: unknown = JSON.parse(sense.detailsJson);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) details = parsed as Record<string, unknown>;
    } catch { /* An older record still has its basic fields. */ }
  }
  return { id: sense.id, lexical_item_it: sense.lexicalItem, definition_it: sense.definition, details };
}

@Injectable()
export class StudyService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService, @Inject(FsrsService) private readonly fsrs: FsrsService) {}

  private async latestAttempts(db: StudyDb, day: string): Promise<Map<string, StudyAttempt>> {
    const attempts = await db.studyAttempt.findMany({ where: { dayKey: day }, orderBy: [{ reviewedAt: 'desc' }, { eventId: 'desc' }] });
    const latest = new Map<string, StudyAttempt>();
    for (const attempt of attempts) if (!latest.has(attempt.lexicalSenseId)) latest.set(attempt.lexicalSenseId, attempt);
    return latest;
  }

  private async snapshot(db: StudyDb, now: Date): Promise<Next> {
    const day = dayKey(now);
    const [due, future, newCount, latest, config] = await Promise.all([
      db.fsrsState.findMany({ where: { learnerId, dueAt: { lte: now } }, include: { lexicalSense: true }, orderBy: [{ dueAt: 'asc' }, { lexicalSenseId: 'asc' }] }),
      db.fsrsState.findFirst({ where: { learnerId, dueAt: { gt: now } }, select: { dueAt: true }, orderBy: { dueAt: 'asc' } }),
      db.lexicalSense.count({ where: { fsrsStates: { none: {} } } }),
      this.latestAttempts(db, day),
      db.fsrsConfigRevision.findFirst({ orderBy: { revision: 'desc' }, select: { revision: true } }),
    ]);
    const incomplete = await db.fsrsState.findFirst({ where: { OR: [{ learnerId: { not: learnerId } }, { schedulerData: null }, { configRevision: null }] }, select: { id: true } });
    if (incomplete) throw new ConflictException('Starszy stan FSRS wymaga migracji przed użyciem.');
    const dueIds = new Set(due.map((state) => state.lexicalSenseId));
    const pending = [...latest.values()].filter((attempt) => attempt.rating === Rating.Again && !dueIds.has(attempt.lexicalSenseId)).sort((a, b) => a.reviewedAt.getTime() - b.reviewedAt.getTime() || a.eventId.localeCompare(b.eventId));
    const pendingStates = pending.length ? await db.fsrsState.findMany({ where: { learnerId, lexicalSenseId: { in: pending.map((item) => item.lexicalSenseId) } }, include: { lexicalSense: true } }) : [];
    const pendingById = new Map(pendingStates.map((state) => [state.lexicalSenseId, state]));
    const reinforcement = pending.filter((attempt) => pendingById.has(attempt.lexicalSenseId));
    const newSense = due.length || reinforcement.length ? null : await db.lexicalSense.findFirst({ where: { fsrsStates: { none: {} } }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
    const selected = due[0] ? { kind: 'due' as const, sense: due[0].lexicalSense, state: due[0] } : reinforcement[0] ? { kind: 'reinforcement' as const, sense: pendingById.get(reinforcement[0].lexicalSenseId)!.lexicalSense, state: pendingById.get(reinforcement[0].lexicalSenseId)! } : newSense ? { kind: 'new' as const, sense: newSense, state: null } : null;
    if (selected?.state) this.fsrs.readStoredCard(selected.state);
    return {
      dueCount: due.length, reinforcementCount: reinforcement.length, newCount, nextDueAt: future?.dueAt ?? null,
      candidate: selected ? {
        lexicalSenseId: selected.sense.id, sense: publicSense(selected.sense), kind: selected.kind,
        presentationToken: token(selected.sense.id, selected.kind, selected.state?.version ?? null, latest.get(selected.sense.id)?.eventId ?? null, day, config?.revision ?? 0),
      } : null,
    };
  }

  async overview(): Promise<Counts> {
    await this.fsrs.getConfig();
    const { candidate: _candidate, ...counts } = await this.snapshot(this.prisma, new Date());
    return counts;
  }

  async next(): Promise<Next> { await this.fsrs.getConfig(); return this.snapshot(this.prisma, new Date()); }

  async reset(): Promise<Counts> {
    await this.fsrs.getConfig();
    await this.prisma.$transaction(async (tx) => {
      const config = await tx.fsrsConfigRevision.findFirst({ orderBy: { revision: 'desc' } });
      if (!config) throw new ConflictException('Brak konfiguracji FSRS.');
      await tx.studyAttempt.deleteMany();
      await tx.fsrsReview.deleteMany();
      await tx.fsrsState.deleteMany();
      await tx.fsrsConfigRevision.create({ data: { revision: config.revision + 1, modelVersion: config.modelVersion, overridesJson: config.overridesJson } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return this.overview();
  }

  private async currentCandidate(db: StudyDb, id: string, now: Date): Promise<{ kind: Kind; state: FsrsState | null; lastEventId: string | null }> {
    const sense = await db.lexicalSense.findUnique({ where: { id }, select: { id: true } });
    if (!sense) throw new NotFoundException('Nie znaleziono LexicalSense.');
    const [state, last, anyState] = await Promise.all([
      db.fsrsState.findUnique({ where: { learnerId_lexicalSenseId: { learnerId, lexicalSenseId: id } } }),
      db.studyAttempt.findFirst({ where: { lexicalSenseId: id, dayKey: dayKey(now) }, orderBy: [{ reviewedAt: 'desc' }, { eventId: 'desc' }] }),
      db.fsrsState.findFirst({ where: { lexicalSenseId: id }, select: { id: true } }),
    ]);
    if (!state && anyState) throw new ConflictException('Starszy stan FSRS wymaga migracji przed użyciem.');
    if (state) this.fsrs.readStoredCard(state);
    const kind: Kind = !state ? 'new' : state.dueAt <= now ? 'due' : last?.rating === Rating.Again ? 'reinforcement' : 'new';
    if (state && kind === 'new') throw new ConflictException('To znaczenie nie jest jeszcze dostępne do oceny.');
    return { kind, state, lastEventId: last?.eventId ?? null };
  }

  async record(body: { eventId?: unknown; lexicalSenseId?: unknown; presentationToken?: unknown; rating?: unknown }): Promise<Next & { accepted: { eventId: string; kind: Kind; rating: number; reviewedAt: Date } }> {
    const { eventId, lexicalSenseId: id, presentationToken, rating } = body ?? {};
    if (typeof eventId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId) || typeof id !== 'string' || !id.trim() || typeof presentationToken !== 'string' || !/^[0-9a-f]{64}$/.test(presentationToken) || ![Rating.Again, Rating.Hard, Rating.Good, Rating.Easy].includes(rating as FsrsRating)) throw new BadRequestException('Niepoprawna ocena nauki.');
    await this.fsrs.getConfig();
    for (let retry = 0; retry < 3; retry += 1) {
      try {
        const accepted = await this.prisma.$transaction(async (tx) => {
          const existing = await tx.studyAttempt.findUnique({ where: { eventId } });
          if (existing) {
            if (existing.lexicalSenseId !== id || existing.rating !== rating || existing.presentationToken !== presentationToken) throw new ConflictException('Identyfikator zdarzenia użyto dla innej oceny.');
            return { eventId, kind: existing.kind as Kind, rating: existing.rating, reviewedAt: existing.reviewedAt };
          }
          const now = new Date();
          const current = await this.currentCandidate(tx, id, now);
          const day = dayKey(now);
          const config = await tx.fsrsConfigRevision.findFirst({ orderBy: { revision: 'desc' }, select: { revision: true } });
          const revision = config?.revision ?? 0;
          const expected = token(id, current.kind, current.state?.version ?? null, current.lastEventId, day, revision);
          const promoted = current.kind === 'due' && current.state && presentationToken === token(id, 'reinforcement', current.state.version, current.lastEventId, day, revision);
          if (presentationToken !== expected && !promoted) throw new ConflictException('Wyświetlone znaczenie jest nieaktualne.');
          const highestPriority = (await this.snapshot(tx, now)).candidate;
          if (highestPriority?.lexicalSenseId !== id) throw new ConflictException('Kolejka nauki zmieniła się.');
          const kind = current.kind;
          const fsrsReviewEventId = kind === 'reinforcement' ? null : `study:${eventId}`;
          if (fsrsReviewEventId) await this.fsrs.applyReviewInTransaction(tx, { reviewEventId: fsrsReviewEventId, lexicalSenseId: id, rating: rating as FsrsRating, reviewedAt: now });
          await tx.studyAttempt.create({ data: { eventId, lexicalSenseId: id, presentationToken, kind, rating: rating as number, reviewedAt: now, dayKey: day, fsrsReviewEventId } });
          return { eventId, kind, rating: rating as number, reviewedAt: now };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        return { ...(await this.next()), accepted };
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2002', 'P2034'].includes(error.code)) {
          if (retry < 2) continue;
          throw new ConflictException({ message: 'Stan nauki zmienił się podczas zapisu.', current: await this.next() });
        }
        if (error instanceof ConflictException) throw new ConflictException({ message: error.message, current: await this.next() });
        throw error;
      }
    }
    throw new ConflictException('Nie udało się zapisać oceny.');
  }
}
