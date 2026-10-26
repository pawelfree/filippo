import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common';
import { DefaultScheduler, Rating, type DefaultSchedulerOptions } from 'ts-fsrs';
import { PrismaService } from '../database/prisma.service';
import { FsrsService } from '../fsrs/fsrs.service';

const learnerId = 'local';
const timeZone = 'Europe/Warsaw';
const dayFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
});
const rangeDays = { '7d': 7, '30d': 30, '90d': 90 } as const;
type HistoryRange = keyof typeof rangeDays | 'all';
const scheduleDays = { '7d': 7, '30d': 30 } as const;
type ScheduleRange = keyof typeof scheduleDays;

function dayKey(date: Date): string {
  const parts = Object.fromEntries(dayFormatter.formatToParts(date).map(({ type, value }) => [type, value]));
  return parts.year + '-' + parts.month + '-' + parts.day;
}

function shiftDay(key: string, offset: number): string {
  const [year, month, day] = key.split('-').map(Number);
  return dayKey(new Date(Date.UTC(year, month - 1, day + offset, 12)));
}

function ratio(success: number, total: number) {
  return { success, total, rate: total ? success / total : null };
}

function histogram(labels: string[], pick: (value: number) => number, values: number[]) {
  const buckets = labels.map((label) => ({ label, count: 0 }));
  for (const value of values) buckets[pick(value)].count += 1;
  return buckets;
}

@Injectable()
export class StudyStatisticsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(FsrsService) private readonly fsrs: FsrsService,
  ) {}

  async overview(history: string = '30d', asOf = new Date(), schedule: string = '30d') {
    if (history !== 'all' && !Object.hasOwn(rangeDays, history)) {
      throw new BadRequestException('Niepoprawny zakres historii.');
    }
    if (!Object.hasOwn(scheduleDays, schedule)) {
      throw new BadRequestException('Niepoprawny zakres zaplanowanych terminów.');
    }
    const selected = history as HistoryRange;
    const selectedSchedule = schedule as ScheduleRange;
    return this.prisma.$transaction(async (tx) => {
      const [total, states, reviews, reinforcements] = await Promise.all([
        tx.lexicalSense.count(),
        tx.fsrsState.findMany({ where: { learnerId }, select: { dueAt: true } }),
        tx.fsrsReview.findMany({
          where: { reviewedAt: { lte: asOf } },
          select: {
            reviewEventId: true, lexicalSenseId: true, rating: true, reviewedAt: true,
            studyAttempt: { select: { kind: true } },
          },
          orderBy: [{ reviewedAt: 'asc' }, { reviewEventId: 'asc' }],
        }),
        tx.studyAttempt.findMany({
          where: { kind: 'reinforcement', reviewedAt: { lte: asOf } },
          select: { reviewedAt: true },
        }),
      ]);
      const today = dayKey(asOf);
      const first = selected === 'all'
        ? [reviews[0]?.reviewedAt, ...reinforcements.map((item) => item.reviewedAt)]
          .filter((date): date is Date => !!date)
          .map(dayKey).sort()[0] ?? today
        : shiftDay(today, -(rangeDays[selected as keyof typeof rangeDays] - 1));
      const days: string[] = [];
      for (let day = first; day <= today; day = shiftDay(day, 1)) days.push(day);
      const byDay = new Map(days.map((day) => [day, { day, again: 0, hard: 0, good: 0, easy: 0, reinforcements: 0 }]));
      const firstReviews = new Set<string>();
      let retained = 0;
      let retainedTotal = 0;
      let dueRetained = 0;
      let dueTotal = 0;
      let unclassified = 0;
      let formalReviews = 0;
      for (const review of reviews) {
        const day = dayKey(review.reviewedAt);
        const bucket = byDay.get(day);
        if (!bucket) continue;
        formalReviews += 1;
        if (review.rating === Rating.Again) bucket.again += 1;
        else if (review.rating === Rating.Hard) bucket.hard += 1;
        else if (review.rating === Rating.Good) bucket.good += 1;
        else if (review.rating === Rating.Easy) bucket.easy += 1;
        const key = review.lexicalSenseId + ':' + day;
        if (firstReviews.has(key)) continue;
        firstReviews.add(key);
        retainedTotal += 1;
        if (review.rating !== Rating.Again) retained += 1;
        if (review.studyAttempt?.kind === 'due') {
          dueTotal += 1;
          if (review.rating !== Rating.Again) dueRetained += 1;
        } else if (!review.studyAttempt) unclassified += 1;
      }
      for (const attempt of reinforcements) {
        const bucket = byDay.get(dayKey(attempt.reviewedAt));
        if (bucket) bucket.reinforcements += 1;
      }
      const scheduledDays = Array.from({ length: scheduleDays[selectedSchedule] }, (_, index) => ({
        day: shiftDay(today, index + 1), count: 0,
      }));
      const scheduledByDay = new Map(scheduledDays.map((item) => [item.day, item]));
      let overdue = 0;
      let dueLaterToday = 0;
      let beyond = 0;
      for (const state of states) {
        if (state.dueAt <= asOf) overdue += 1;
        else {
          const key = dayKey(state.dueAt);
          if (key === today) dueLaterToday += 1;
          else {
            const bucket = scheduledByDay.get(key);
            if (bucket) bucket.count += 1;
            else beyond += 1;
          }
        }
      }
      return {
        asOf: asOf.toISOString(), timeZone, historyRange: selected, scheduleRange: selectedSchedule,
        summary: {
          total, studied: states.length, newCount: Math.max(0, total - states.length),
          dueNow: overdue, formalReviews,
        },
        history: [...byDay.values()],
        retention: {
          overall: ratio(retained, retainedTotal),
          due: ratio(dueRetained, dueTotal),
          unclassified,
        },
        scheduled: { overdue, today: dueLaterToday, days: scheduledDays, beyond },
      };
    });
  }

  async memory(asOf = new Date()) {
    const { states, configurations } = await this.prisma.$transaction(async (tx) => ({
      states: await tx.fsrsState.findMany({ where: { learnerId } }),
      configurations: await tx.fsrsConfigRevision.findMany(),
    }));
    const configs = new Map(configurations.map((config) => [config.revision, config]));
    const schedulers = new Map<number, Awaited<ReturnType<typeof DefaultScheduler>>>();
    const difficulty: number[] = [];
    const stability: number[] = [];
    const retrievability: number[] = [];
    let invalidCount = 0;
    for (const state of states) {
      const config = state.configRevision === null ? null : configs.get(state.configRevision);
      if (!config || config.modelVersion !== 'FSRS-7') { invalidCount += 1; continue; }
      try {
        const card = this.fsrs.readStoredCard(state);
        if (!card.lastReviewAt) throw new Error('Brak daty oceny.');
        let scheduler = schedulers.get(config.revision);
        if (!scheduler) {
          scheduler = await DefaultScheduler({
            version: 'FSRS-7',
            ...JSON.parse(config.overridesJson) as DefaultSchedulerOptions<'FSRS-7'>,
          });
          schedulers.set(config.revision, scheduler);
        }
        const elapsed = scheduler.chrono.difference(card.lastReviewAt, asOf);
        const probability = scheduler.model.forgettingCurve(card, elapsed);
        if (elapsed < 0 || !Number.isFinite(probability) || probability < 0 || probability > 1
          || !Number.isFinite(card.difficulty) || !Number.isFinite(card.stability)) {
          throw new Error('Niepoprawny stan pamięci.');
        }
        difficulty.push(card.difficulty);
        stability.push(card.stability);
        retrievability.push(probability);
      } catch { invalidCount += 1; }
    }
    if (invalidCount) {
      throw new ConflictException({
        message: 'Nie można obliczyć stanu pamięci dla części kart FSRS.',
        invalidCount,
      });
    }
    return {
      asOf: asOf.toISOString(), timeZone, count: states.length, invalidCount,
      estimatedKnown: retrievability.reduce((sum, value) => sum + value, 0),
      distributions: {
        difficulty: histogram(['0–2', '2–4', '4–6', '6–8', '8–10'], (value) => Math.min(4, Math.max(0, Math.floor(value / 2))), difficulty),
        stability: histogram(['<1 dzień', '1–7 dni', '7–30 dni', '30–90 dni', '≥90 dni'], (value) => value < 1 ? 0 : value < 7 ? 1 : value < 30 ? 2 : value < 90 ? 3 : 4, stability),
        retrievability: histogram(['0–20%', '20–40%', '40–60%', '60–80%', '80–100%'], (value) => Math.min(4, Math.floor(value * 5)), retrievability),
      },
    };
  }
}
