import { BadRequestException, ConflictException, Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DefaultScheduler, Rating, type DefaultSchedulerCard, type DefaultSchedulerOptions } from 'ts-fsrs';
import { PrismaService } from '../database/prisma.service';
import { FsrsService } from '../fsrs/fsrs.service';

const learnerId = 'local';
const timeZone = 'Europe/Warsaw';
const days = 30;
const runs = 100;
const maxEvents = 150_000;
const maxMilliseconds = 5_000;
const dayFormatter = new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
type Grade = typeof Rating.Again | typeof Rating.Hard | typeof Rating.Good | typeof Rating.Easy;
type Scheduler = Awaited<ReturnType<typeof DefaultScheduler>>;
type DayCounts = { formal: number; newCount: number; reinforcement: number };

function dayKey(date: Date): string {
  const parts = Object.fromEntries(dayFormatter.formatToParts(date).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function shiftDay(key: string, offset: number): string {
  const [year, month, day] = key.split('-').map(Number);
  return dayKey(new Date(Date.UTC(year, month - 1, day + offset, 12)));
}

function dayStart(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  const nominal = Date.UTC(year, month - 1, day);
  let low = nominal - 12 * 60 * 60 * 1000;
  let high = nominal + 12 * 60 * 60 * 1000;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (dayKey(new Date(middle)) < key) low = middle; else high = middle;
  }
  return new Date(high);
}

function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function draw<T>(sample: T[], next: () => number): T {
  return sample[Math.floor(next() * sample.length)];
}

function quantile(sorted: number[], fraction: number): number {
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  return sorted[lower] + (sorted[Math.ceil(position)] - sorted[lower]) * (position - lower);
}

function aggregate(values: number[]): { mean: number; p10: number; p90: number } {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    mean: values.reduce((sum, value) => sum + value, 0) / values.length,
    p10: quantile(sorted, 0.1), p90: quantile(sorted, 0.9),
  };
}

@Injectable()
export class StudySimulationService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(FsrsService) private readonly fsrs: FsrsService,
  ) {}

  async simulate(body: unknown, asOf = new Date()) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException('Niepoprawne ustawienia symulacji.');
    const input = body as Record<string, unknown>;
    if (Object.keys(input).some((key) => !['newPerDay', 'seed'].includes(key))) throw new BadRequestException('Nieznany parametr symulacji.');
    const newPerDay = input.newPerDay ?? 0;
    const seed = input.seed ?? 20261026;
    if (!Number.isInteger(newPerDay) || (newPerDay as number) < 0 || (newPerDay as number) > 100) throw new BadRequestException('Liczba nowych znaczeń dziennie musi wynosić od 0 do 100.');
    if (!Number.isInteger(seed) || (seed as number) < 0 || (seed as number) > 0xffffffff) throw new BadRequestException('Ziarno symulacji musi być liczbą całkowitą od 0 do 4294967295.');

    const snapshot = await this.prisma.$transaction(async (tx) => {
      const today = dayKey(asOf);
      const firstHistoryDay = shiftDay(today, -29);
      const historyFrom = dayStart(firstHistoryDay);
      const [states, available, config, reviews, attempts] = await Promise.all([
        tx.fsrsState.findMany({ where: { learnerId }, orderBy: [{ dueAt: 'asc' }, { lexicalSenseId: 'asc' }] }),
        tx.lexicalSense.findMany({ where: { fsrsStates: { none: {} } }, select: { id: true }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
        tx.fsrsConfigRevision.findFirst({ orderBy: { revision: 'desc' } }),
        tx.fsrsReview.findMany({ where: { reviewedAt: { gte: historyFrom, lte: asOf } }, select: {
          rating: true, reviewedAt: true, studyAttempt: { select: { kind: true } },
        } }),
        tx.studyAttempt.findMany({ where: { dayKey: today, reviewedAt: { lte: asOf } }, select: {
          lexicalSenseId: true, rating: true, kind: true, reviewedAt: true, eventId: true,
        }, orderBy: [{ reviewedAt: 'desc' }, { eventId: 'desc' }] }),
      ]);
      return { states, available, config, reviews, attempts };
    });

    if (snapshot.states.length > 2_000 || snapshot.available.length > 20_000) throw new ServiceUnavailableException('Zbyt wiele kart do bezpiecznego obliczenia scenariusza.');
    if ((!snapshot.config || snapshot.config.modelVersion !== 'FSRS-7') && (snapshot.states.length || ((newPerDay as number) > 0 && snapshot.available.length))) {
      throw new ConflictException('Brak aktywnej konfiguracji FSRS-7.');
    }
    const cards = snapshot.states.map((state) => this.fsrs.readStoredCard(state));
    for (const card of cards) if (!card.lastReviewAt || card.lastReviewAt > asOf) throw new ConflictException('Niekompletna karta FSRS nie pozwala obliczyć scenariusza.');
    let scheduler: Scheduler | null = null;
    if (snapshot.config) {
      try {
        scheduler = await DefaultScheduler({ version: 'FSRS-7', ...JSON.parse(snapshot.config.overridesJson) as DefaultSchedulerOptions<'FSRS-7'> });
      } catch { throw new ConflictException('Niepoprawna aktywna konfiguracja FSRS.'); }
    }

    const recent = snapshot.reviews.filter((review) => dayKey(review.reviewedAt) >= shiftDay(dayKey(asOf), -29));
    const allGrades = recent.map((review) => review.rating).filter((grade): grade is Grade => [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy].includes(grade as Grade));
    const positive = allGrades.filter((grade): grade is Grade => grade !== Rating.Again);
    const newGrades = recent.filter((review) => review.studyAttempt?.kind === 'new').map((review) => review.rating).filter((grade): grade is Grade => [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy].includes(grade as Grade));
    const positiveSample = positive.length ? positive : [Rating.Good];
    const newSample = newGrades.length ? newGrades : allGrades.length ? allGrades : [Rating.Good];
    const warnings: string[] = [];
    if (snapshot.states.length && !positive.length) warnings.push('Brak pozytywnych ocen w ostatnich 30 dniach: zapamiętane powtórki otrzymują Good.');
    if ((newPerDay as number) > 0 && snapshot.available.length && !newGrades.length && allGrades.length) warnings.push('Brak pierwszych ocen nowych znaczeń: użyto wszystkich formalnych ocen z ostatnich 30 dni.');
    if ((newPerDay as number) > 0 && snapshot.available.length && !allGrades.length) warnings.push('Brak formalnych ocen z ostatnich 30 dni: nowe znaczenia otrzymują Good.');

    const latest = new Map<string, (typeof snapshot.attempts)[number]>();
    for (const attempt of snapshot.attempts) if (!latest.has(attempt.lexicalSenseId)) latest.set(attempt.lexicalSenseId, attempt);
    const pending = snapshot.states.filter((state) => {
      const attempt = latest.get(state.lexicalSenseId);
      return attempt?.rating === Rating.Again && attempt.kind !== 'reinforcement' && state.dueAt > asOf;
    }).length;

    const startedAt = Date.now();
    let eventCount = 0;
    const allRuns: DayCounts[][] = [];
    const firstDay = dayKey(asOf);
    const newIds = snapshot.available.map((sense) => sense.id);
    for (let run = 0; run < runs; run += 1) {
      const next = random(((seed as number) + Math.imul(run + 1, 0x9e3779b9)) >>> 0);
      const simulated: DefaultSchedulerCard[] = cards.map((card) => structuredClone(card));
      const counts: DayCounts[] = [];
      let nextNew = 0;
      for (let offset = 0; offset < days; offset += 1) {
        if (Date.now() - startedAt > maxMilliseconds) throw new ServiceUnavailableException('Scenariusz przekroczył limit czasu obliczeń. Zmniejsz liczbę nowych znaczeń dziennie.');
        const day = shiftDay(firstDay, offset);
        const dayEnd = dayStart(shiftDay(day, 1));
        const bucket: DayCounts = { formal: 0, newCount: 0, reinforcement: offset === 0 ? pending : 0 };
        while (true) {
          let selected = -1;
          let due = dayEnd.getTime();
          for (let index = 0; index < simulated.length; index += 1) {
            const currentDue = simulated[index].dueAt.getTime();
            if (currentDue < due || (currentDue === due && selected >= 0 && simulated[index].cardId < simulated[selected].cardId)) {
              due = currentDue; selected = index;
            }
          }
          if (selected < 0) break;
          const card = simulated[selected];
          const at = new Date(Math.max(asOf.getTime(), due));
          if (at >= dayEnd) break;
          if (!scheduler || !card.lastReviewAt) throw new ConflictException('Niekompletna karta FSRS nie pozwala obliczyć scenariusza.');
          const elapsed = scheduler.chrono.difference(card.lastReviewAt, at);
          const recall = scheduler.model.forgettingCurve(card, elapsed);
          if (elapsed < 0 || !Number.isFinite(recall) || recall < 0 || recall > 1) throw new ConflictException('Nie można obliczyć prawdopodobieństwa przypomnienia.');
          const grade = next() < recall ? draw(positiveSample, next) : Rating.Again;
          const result = scheduler.review({ card, grade, now: at });
          if (result.card.dueAt <= at) throw new ConflictException('FSRS zwrócił niedodatni odstęp między powtórkami.');
          simulated[selected] = result.card;
          bucket.formal += 1;
          if (grade === Rating.Again && result.card.dueAt.getTime() > at.getTime() + 60_000) bucket.reinforcement += 1;
          eventCount += 1;
          if (eventCount > maxEvents || (eventCount % 100 === 0 && Date.now() - startedAt > maxMilliseconds)) throw new ServiceUnavailableException('Scenariusz przekroczył limit obliczeń. Zmniejsz liczbę nowych znaczeń dziennie.');
        }
        if (scheduler) {
          const firstAt = Math.max(asOf.getTime(), dayEnd.getTime() - 1);
          for (let number = 0; number < (newPerDay as number) && nextNew < newIds.length; number += 1) {
            const at = new Date(firstAt);
            const card = scheduler.newCard({ cardId: newIds[nextNew++], now: at });
            const grade = draw(newSample, next);
            const result = scheduler.review({ card, grade, now: at });
            if (result.card.dueAt <= at) throw new ConflictException('FSRS zwrócił niedodatni odstęp dla nowego znaczenia.');
            simulated.push(result.card);
            bucket.newCount += 1;
            if (grade === Rating.Again && result.card.dueAt.getTime() > at.getTime() + 60_000) bucket.reinforcement += 1;
            eventCount += 1;
            if (eventCount > maxEvents || (eventCount % 100 === 0 && Date.now() - startedAt > maxMilliseconds)) throw new ServiceUnavailableException('Scenariusz przekroczył limit obliczeń. Zmniejsz liczbę nowych znaczeń dziennie.');
          }
        }
        counts.push(bucket);
      }
      allRuns.push(counts);
    }
    return {
      asOf: asOf.toISOString(), timeZone, horizonDays: days, runs, seed, newPerDay,
      actualNewAvailable: newIds.length,
      assumptions: {
        dueReviewsCompleted: true,
        newAfterDueAtEndOfDay: true,
        reinforcementDelayMinutes: 1,
        positiveRatingSource: positive.length ? 'positive-formal-30d' : 'good-fallback',
        newRatingSource: newGrades.length ? 'first-new-30d' : allGrades.length ? 'all-formal-30d' : 'good-fallback',
        pendingReinforcements: pending,
      },
      sampleSizes: { formal: allGrades.length, positive: positive.length, firstNew: newGrades.length },
      warnings,
      daily: Array.from({ length: days }, (_, index) => {
        const formal = aggregate(allRuns.map((run) => run[index].formal));
        return {
          day: shiftDay(firstDay, index), formalMean: formal.mean, formalP10: formal.p10, formalP90: formal.p90,
          newMean: aggregate(allRuns.map((run) => run[index].newCount)).mean,
          reinforcementMean: aggregate(allRuns.map((run) => run[index].reinforcement)).mean,
        };
      }),
    };
  }
}
