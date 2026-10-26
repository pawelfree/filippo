import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type FsrsConfigRevision, type FsrsReview } from '@prisma/client';
import { DefaultScheduler, Rating, type DefaultSchedulerCard, type DefaultSchedulerOptions, type DefaultSchedulerRevlog } from 'ts-fsrs';
import { PrismaService } from '../database/prisma.service';

const learnerId = 'local';
const modelVersion = 'FSRS-7' as const;
type Overrides = Omit<DefaultSchedulerOptions<'FSRS-7'>, 'version'>;
export type FsrsRating = typeof Rating.Again | typeof Rating.Hard | typeof Rating.Good | typeof Rating.Easy;
export interface FsrsReviewInput { reviewEventId: string; lexicalSenseId: string; rating: FsrsRating; reviewedAt: Date }
export interface FsrsReviewResult { card: DefaultSchedulerCard; revlog: DefaultSchedulerRevlog; dueAt: Date; configRevision: number }

function parseDate(value: unknown): Date {
  if (typeof value !== 'string') throw new Error('Niepoprawna data w stanie FSRS.');
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== value) throw new Error('Niepoprawna data w stanie FSRS.');
  return date;
}

function restoreCard(json: string, senseId: string): DefaultSchedulerCard {
  const value = JSON.parse(json) as Record<string, unknown>;
  const numeric = ['stability', 'stabilityFast', 'difficulty', 'state', 'reps', 'lapses', 'scheduledDays', 'learningStep'];
  if (!value || typeof value !== 'object' || value.cardId !== senseId || !['new', 'learning', 'review'].includes(String(value.scheduleStatus)) || numeric.some((key) => typeof value[key] !== 'number' || !Number.isFinite(value[key])) || ![0, 1, 2, 3].includes(value.state as number)) {
    throw new Error('Niepoprawna karta FSRS w bazie danych.');
  }
  value.dueAt = parseDate(value.dueAt);
  if (value.lastReviewAt !== null && value.lastReviewAt !== undefined) value.lastReviewAt = parseDate(value.lastReviewAt);
  return value as DefaultSchedulerCard;
}

function restoreRevlog(json: string, senseId: string): DefaultSchedulerRevlog {
  const value = JSON.parse(json) as Record<string, unknown>;
  const numeric = ['stability', 'stabilityFast', 'difficulty', 'scheduledDays', 'learningStep'];
  if (!value || typeof value !== 'object' || value.cardId !== senseId || ![Rating.Again, Rating.Hard, Rating.Good, Rating.Easy].includes(value.rating as FsrsRating) || !['new', 'learning', 'review'].includes(String(value.scheduleStatus)) || ![0, 1, 2, 3].includes(value.state as number) || numeric.some((key) => typeof value[key] !== 'number' || !Number.isFinite(value[key]))) throw new Error('Niepoprawny dziennik FSRS w bazie danych.');
  value.dueAt = parseDate(value.dueAt);
  value.reviewTime = parseDate(value.reviewTime);
  if (value.lastReviewAt !== null && value.lastReviewAt !== undefined) value.lastReviewAt = parseDate(value.lastReviewAt);
  return value as DefaultSchedulerRevlog;
}

function validateOverrides(value: unknown): Overrides {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BadRequestException('Niepoprawna konfiguracja FSRS.');
  const overrides = value as Record<string, unknown>;
  const allowed = new Set(['desiredRetention', 'maximumInterval', 'enableFuzz', 'enableShortTerm', 'learningSteps', 'relearningSteps', 'graduatingInterval', 'allowModelOverride', 'clearStatsOnForget', 'weights']);
  for (const [key, entry] of Object.entries(overrides)) {
    if (!allowed.has(key)) throw new BadRequestException(`Nieznany parametr FSRS: ${key}.`);
    if (['enableFuzz', 'enableShortTerm', 'allowModelOverride', 'clearStatsOnForget'].includes(key) && typeof entry !== 'boolean') throw new BadRequestException(`Niepoprawny parametr FSRS: ${key}.`);
    if (['desiredRetention', 'maximumInterval', 'graduatingInterval'].includes(key) && (typeof entry !== 'number' || !Number.isFinite(entry))) throw new BadRequestException(`Niepoprawny parametr FSRS: ${key}.`);
    if (key === 'desiredRetention' && typeof entry === 'number' && (entry <= 0 || entry >= 1)) throw new BadRequestException('Niepoprawny parametr FSRS: desiredRetention.');
    if (key === 'maximumInterval' && typeof entry === 'number' && (!Number.isInteger(entry) || entry < 1)) throw new BadRequestException('Niepoprawny parametr FSRS: maximumInterval.');
    if (key === 'graduatingInterval' && typeof entry === 'number' && (entry <= 0 || entry > 36500)) throw new BadRequestException('Niepoprawny parametr FSRS: graduatingInterval.');
    if (['learningSteps', 'relearningSteps'].includes(key) && (!Array.isArray(entry) || entry.some((step) => typeof step !== 'string' || !/^[1-9]\d*[smhd]$/.test(step)))) throw new BadRequestException(`Niepoprawny parametr FSRS: ${key}.`);
    if (key === 'weights' && (!Array.isArray(entry) || entry.length !== 34 || entry.some((weight) => typeof weight !== 'number' || !Number.isFinite(weight)))) throw new BadRequestException('Niepoprawne wagi FSRS-7.');
  }
  return overrides as Overrides;
}

@Injectable()
export class FsrsService {
  private readonly locks = new Map<string, Promise<void>>();

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private async configRow(): Promise<FsrsConfigRevision> {
    await this.prisma.fsrsConfigRevision.upsert({ where: { revision: 1 }, update: {}, create: { revision: 1, modelVersion, overridesJson: '{}' } });
    const latest = await this.prisma.fsrsConfigRevision.findFirst({ orderBy: { revision: 'desc' } });
    if (!latest || latest.modelVersion !== modelVersion) throw new ConflictException('Wersja modelu FSRS wymaga migracji.');
    return latest;
  }

  async getConfig(): Promise<{ modelVersion: string; revision: number; overrides: Overrides }> {
    const row = await this.configRow();
    return { modelVersion: row.modelVersion, revision: row.revision, overrides: JSON.parse(row.overridesJson) as Overrides };
  }

  async updateConfig(value: unknown): Promise<{ modelVersion: string; revision: number; overrides: Overrides }> {
    const overrides = validateOverrides(value);
    try { await DefaultScheduler({ version: modelVersion, ...overrides }); }
    catch { throw new BadRequestException('Niepoprawna konfiguracja FSRS.'); }
    await this.configRow();
    const row = await this.prisma.$transaction(async (tx) => {
      const current = await tx.fsrsConfigRevision.findFirst({ orderBy: { revision: 'desc' } });
      if (!current || current.modelVersion !== modelVersion) throw new ConflictException('Wersja modelu FSRS wymaga migracji.');
      return tx.fsrsConfigRevision.create({ data: { revision: current.revision + 1, modelVersion, overridesJson: JSON.stringify(overrides) } });
    });
    return { modelVersion, revision: row.revision, overrides };
  }

  async getState(lexicalSenseId: string): Promise<{ lexicalSenseId: string; card: DefaultSchedulerCard; dueAt: Date; configRevision: number; updatedAt: Date } | null> {
    const stored = await this.prisma.fsrsState.findUnique({ where: { learnerId_lexicalSenseId: { learnerId, lexicalSenseId } } });
    if (!stored) {
      if (await this.prisma.fsrsState.findFirst({ where: { lexicalSenseId } })) throw new ConflictException('Starszy stan FSRS wymaga migracji przed użyciem.');
      return null;
    }
    if (!stored.schedulerData || stored.configRevision === null) throw new ConflictException('Starszy stan FSRS wymaga migracji przed użyciem.');
    const card = restoreCard(stored.schedulerData, lexicalSenseId);
    if (card.dueAt.getTime() !== stored.dueAt.getTime()) throw new Error('Termin FSRS nie odpowiada zapisanej karcie.');
    return { lexicalSenseId, card, dueAt: card.dueAt, configRevision: stored.configRevision, updatedAt: stored.updatedAt };
  }

  async getReviews(lexicalSenseId: string): Promise<Array<{ reviewEventId: string; rating: number; reviewedAt: Date; revlog: DefaultSchedulerRevlog; configRevision: number }>> {
    const rows = await this.prisma.fsrsReview.findMany({ where: { lexicalSenseId }, orderBy: { reviewedAt: 'asc' } });
    return rows.map((row) => ({ reviewEventId: row.reviewEventId, rating: row.rating, reviewedAt: row.reviewedAt, revlog: restoreRevlog(row.revlogJson, lexicalSenseId), configRevision: row.configRevision }));
  }

  private fromReview(row: FsrsReview): FsrsReviewResult {
    const card = restoreCard(row.cardJson, row.lexicalSenseId);
    return { card, revlog: restoreRevlog(row.revlogJson, row.lexicalSenseId), dueAt: card.dueAt, configRevision: row.configRevision };
  }

  async applyReview(input: FsrsReviewInput): Promise<FsrsReviewResult> {
    if (!input || typeof input.reviewEventId !== 'string' || !input.reviewEventId.trim() || typeof input.lexicalSenseId !== 'string' || !input.lexicalSenseId.trim() || ![Rating.Again, Rating.Hard, Rating.Good, Rating.Easy].includes(input.rating) || !(input.reviewedAt instanceof Date) || !Number.isFinite(input.reviewedAt.getTime())) {
      throw new BadRequestException('Niepoprawne zdarzenie oceny FSRS.');
    }
    const previous = this.locks.get(input.lexicalSenseId) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => { release = resolve; });
    this.locks.set(input.lexicalSenseId, current);
    await previous;
    try {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try { return await this.applyReviewTransaction(input); }
        catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2002', 'P2034'].includes(error.code) && attempt < 2) continue;
          throw error;
        }
      }
      throw new ConflictException('Nie udało się zapisać oceny FSRS.');
    } finally {
      release();
      if (this.locks.get(input.lexicalSenseId) === current) this.locks.delete(input.lexicalSenseId);
    }
  }

  private async applyReviewTransaction(input: FsrsReviewInput): Promise<FsrsReviewResult> {
    await this.configRow();
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.fsrsReview.findUnique({ where: { reviewEventId: input.reviewEventId } });
      if (existing) {
        if (existing.lexicalSenseId !== input.lexicalSenseId || existing.rating !== input.rating || existing.reviewedAt.getTime() !== input.reviewedAt.getTime()) throw new ConflictException('Identyfikator zdarzenia FSRS został użyty z inną oceną.');
        return this.fromReview(existing);
      }
      const config = await tx.fsrsConfigRevision.findFirst({ orderBy: { revision: 'desc' } });
      if (!config || config.modelVersion !== modelVersion) throw new ConflictException('Wersja modelu FSRS wymaga migracji.');
      if (!await tx.lexicalSense.findUnique({ where: { id: input.lexicalSenseId }, select: { id: true } })) throw new NotFoundException('Nie znaleziono LexicalSense.');
      const stored = await tx.fsrsState.findUnique({ where: { learnerId_lexicalSenseId: { learnerId, lexicalSenseId: input.lexicalSenseId } } });
      if (!stored && await tx.fsrsState.findFirst({ where: { lexicalSenseId: input.lexicalSenseId } })) throw new ConflictException('Starszy stan FSRS wymaga migracji przed użyciem.');
      if (stored?.schedulerData === null) throw new ConflictException('Starszy stan FSRS wymaga migracji przed użyciem.');
      if (stored?.lastReviewAt && input.reviewedAt.getTime() <= stored.lastReviewAt.getTime()) throw new ConflictException('Starsza ocena FSRS wymaga odtworzenia historii we właściwej kolejności.');
      const scheduler = await DefaultScheduler({ version: modelVersion, ...JSON.parse(config.overridesJson) as Overrides });
      const card = stored ? restoreCard(stored.schedulerData!, input.lexicalSenseId) : scheduler.newCard({ cardId: input.lexicalSenseId, now: input.reviewedAt });
      const result = scheduler.review({ card, grade: input.rating, now: input.reviewedAt });
      const data = {
        dueAt: result.card.dueAt, stability: result.card.stability, difficulty: result.card.difficulty,
        state: String(result.card.state), reps: result.card.reps, lapses: result.card.lapses,
        lastReviewAt: result.card.lastReviewAt ?? null, schedulerData: JSON.stringify(result.card), configRevision: config.revision,
      };
      if (stored) {
        const updated = await tx.fsrsState.updateMany({ where: { id: stored.id, version: stored.version }, data: { ...data, version: { increment: 1 } } });
        if (!updated.count) throw new ConflictException('Stan FSRS zmienił się podczas zapisu.');
      } else await tx.fsrsState.create({ data: { learnerId, lexicalSenseId: input.lexicalSenseId, ...data } });
      await tx.fsrsReview.create({ data: {
        reviewEventId: input.reviewEventId, lexicalSenseId: input.lexicalSenseId, rating: input.rating,
        reviewedAt: input.reviewedAt, revlogJson: JSON.stringify(result.revlog), cardJson: JSON.stringify(result.card), configRevision: config.revision,
      } });
      return { card: result.card, revlog: result.revlog, dueAt: result.card.dueAt, configRevision: config.revision };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}
