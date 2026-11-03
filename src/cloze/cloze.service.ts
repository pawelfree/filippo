import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BadGatewayException, BadRequestException, ConflictException, HttpException, HttpStatus, Inject, Injectable, NotFoundException, OnModuleDestroy, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import Ajv2020 from 'ajv/dist/2020';
import { Rating } from 'ts-fsrs';
import { PrismaService } from '../database/prisma.service';
import { ExerciseGenerationInputService } from '../exercise-generation-input/exercise-generation-input.service';
import { FsrsService } from '../fsrs/fsrs.service';
import { StudyService, dayKey } from '../study/study.service';
import { projectTaxonomyForGeneration } from './taxonomy-generation-input';

type Part = { text: string } | { gap_id: string };
type Exercise = {
  exercise_id: string; lexical_sense_id: string; task_type: 'fill_blank';
  prompt: Part[]; sentence_pl: string; hints: string[]; intent: string; difficulty: string;
  gaps: string[]; answer_keys: Record<string, { fragments: Record<string, string> }>;
  success_checks_by_answer_key: Record<string, Array<{ taxonomy_node_id: string; evidence_class: string }>>;
  primary_grammar_target: { taxonomy_node_id: string };
};
type Slot = { position: number; exercise?: Exercise; failure?: { attempts: number; reason: string } };
type GenerationResult = { results: Array<{ lexical_sense_id: string; slots: Slot[] }> };

const root = join(process.cwd(), '.ai/docs/generate-lexical-exercises');
const reference = (name: string) => readFileSync(join(root, 'references', name), 'utf8');
const ajv = new Ajv2020({ strict: false, validateFormats: false, allErrors: true });
ajv.addSchema(JSON.parse(reference('exercise.schema.json')), 'exercise.schema.json');
const validateExercise = ajv.getSchema<Exercise>('exercise.schema.json')!;
const validateResult = ajv.compile<GenerationResult>(JSON.parse(reference('generation_result.schema.json')));
const taxonomyText = readFileSync(join(process.cwd(), '.ai/docs/grammar_taxonomy/taxonomy.json'));
const taxonomy = JSON.parse(taxonomyText.toString()) as Record<string, any>;
const profile = JSON.parse(readFileSync(join(process.cwd(), '.ai/docs/competence_profile/profile.json'), 'utf8')) as Record<string, any>;
const taxonomyHash = createHash('sha256').update(taxonomyText).digest('hex');
const model = process.env.OPENAI_EXERCISE_MODEL || process.env.OPENAI_MODEL || 'gpt-5';
const maxCount = 20;

function parseJson<T>(value: string, fallback: T): T { try { return JSON.parse(value) as T; } catch { return fallback; } }
function openAiGenerationFailure(status: number, body: unknown): Error {
  const error = typeof body === 'object' && body !== null && 'error' in body ? body.error : undefined;
  const code = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' ? error.code : undefined;
  if (status === 401) return new UnauthorizedException('OpenAI odrzuciło klucz API. Sprawdź aktywną wartość OPENAI_API_KEY na serwerze.');
  if (status === 429) {
    const messages: Record<string, string> = {
      credit_balance_exhausted: 'Wyczerpano środki API OpenAI. Dodaj kredyty w ustawieniach rozliczeń.',
      insufficient_quota: 'Wyczerpano środki lub limit użycia API OpenAI. Sprawdź rozliczenia i limity projektu.',
      organization_spend_limit_exceeded: 'Osiągnięto limit wydatków organizacji OpenAI.',
      project_spend_limit_exceeded: 'Osiągnięto limit wydatków projektu OpenAI.',
      organization_usage_limit_exceeded: 'Osiągnięto miesięczny limit użycia organizacji OpenAI.',
      rate_limit_exceeded: 'OpenAI chwilowo ogranicza liczbę żądań. Spróbuj ponownie później.',
    };
    return new HttpException(messages[code || ''] || 'OpenAI odrzuciło żądanie z powodu limitu. Sprawdź rozliczenia i limity projektu.', HttpStatus.TOO_MANY_REQUESTS);
  }
  return new BadGatewayException(`OpenAI zwróciło błąd HTTP ${status}.`);
}
function publicExercise(exercise: Exercise) {
  const { answer_keys: _answers, success_checks_by_answer_key: _checks, ...visible } = exercise;
  return visible;
}
function correctSentence(exercise: Exercise, responses: Record<string, string>): string {
  const key = Object.values(exercise.answer_keys).find((candidate) => exercise.gaps.every((gap) => responses[gap]?.trim() === candidate.fragments[gap]))
    ?? Object.values(exercise.answer_keys)[0];
  return exercise.prompt.map((part) => 'text' in part ? part.text : key.fragments[part.gap_id]).join('');
}
function validContent(exercise: Exercise, id: string, position: number): boolean {
  if (!validateExercise(exercise) || exercise.lexical_sense_id !== id || !exercise.sentence_pl.trim()) return false;
  const seen = exercise.prompt.filter((part): part is { gap_id: string } => 'gap_id' in part).map((part) => part.gap_id);
  if (seen.length !== exercise.gaps.length || new Set(seen).size !== seen.length || seen.some((gap) => !exercise.gaps.includes(gap))) return false;
  if (Object.keys(exercise.answer_keys).length !== Object.keys(exercise.success_checks_by_answer_key).length) return false;
  for (const [key, answer] of Object.entries(exercise.answer_keys)) {
    if (!exercise.success_checks_by_answer_key[key] || Object.keys(answer.fragments).length !== seen.length || seen.some((gap) => !answer.fragments[gap])) return false;
    if (exercise.success_checks_by_answer_key[key].some((check) => !taxonomy.variants.some((variant: any) => variant.id === check.taxonomy_node_id))) return false;
  }
  return position >= 1 && position <= 4
    && taxonomy.variants.some((variant: any) => variant.id === exercise.primary_grammar_target.taxonomy_node_id)
    && profile.competencies.some((competency: any) => competency.taxonomy_node_id === exercise.primary_grammar_target.taxonomy_node_id);
}

@Injectable()
export class ClozeService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  private working = false;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ExerciseGenerationInputService) private readonly input: ExerciseGenerationInputService,
    @Inject(FsrsService) private readonly fsrs: FsrsService,
    @Inject(StudyService) private readonly study: StudyService,
  ) {}

  async onModuleInit(): Promise<void> {
    // A crash must not restart an already-running model attempt with a fresh budget.
    await this.prisma.clozeSession.updateMany({ where: { status: 'running' }, data: { status: 'failed' } });
    this.timer = setInterval(() => { void this.runNext(); }, 1000);
    void this.runNext();
  }
  onModuleDestroy(): void { if (this.timer) clearInterval(this.timer); }

  async createSession(countInput: unknown, modeInput: unknown = 'all') {
    if (!['all', 'review', 'new'].includes(String(modeInput))) throw new BadRequestException('Niepoprawny tryb nauki cloze.');
    const mode = modeInput as 'all' | 'review' | 'new';
    const count = mode === 'review' ? maxCount : Number(countInput);
    if (!Number.isInteger(count) || count < 1 || count > maxCount) throw new BadRequestException(`Podaj liczbę znaczeń od 1 do ${maxCount}.`);
    const plan = await this.study.selectForCloze(count, mode);
    if (!plan.length) throw new BadRequestException(mode === 'review' ? 'Nie ma teraz znaczeń do powtórki.' : mode === 'new' ? 'Nie ma teraz nowych znaczeń.' : 'Na dziś nie ma znaczeń do nauki według FSRS.');
    const selected = plan.map((item) => item.lexicalSenseId);
    const kinds = Object.fromEntries(plan.map((item) => [item.lexicalSenseId, item.kind]));
    const selectionAt = new Date();
    const sessionDay = dayKey(selectionAt);
    const [existing, usage, previousAttempts, todayAttempts] = await Promise.all([
      this.prisma.clozeExercise.findMany({ where: { lexicalSenseId: { in: selected } }, orderBy: [{ batch: 'asc' }, { position: 'asc' }] }),
      this.prisma.clozeExerciseUsage.findMany({ where: { exercise: { lexicalSenseId: { in: selected } } }, select: { exerciseId: true } }),
      this.prisma.clozeAttempt.findMany({ where: { lexicalSenseId: { in: selected }, reviewedAt: { lte: selectionAt } }, select: { eventId: true, lexicalSenseId: true, exerciseId: true, reviewedAt: true }, orderBy: [{ reviewedAt: 'desc' }, { eventId: 'desc' }] }),
      this.prisma.studyAttempt.findMany({ where: { lexicalSenseId: { in: selected }, dayKey: sessionDay, reviewedAt: { lte: selectionAt } }, select: { eventId: true, lexicalSenseId: true, kind: true, rating: true }, orderBy: [{ reviewedAt: 'desc' }, { eventId: 'desc' }] }),
    ]);
    const used = new Set(usage.map((item) => item.exerciseId));
    const assignments: Record<string, string> = {};
    const validRows = new Map(existing.filter((row) => validContent(parseJson<Exercise>(row.contentJson, {} as Exercise), row.lexicalSenseId, row.position)).map((row) => [row.id, row]));
    const lastAttempts = new Map<string, (typeof previousAttempts)[number]>();
    for (const attempt of previousAttempts) {
      if (!lastAttempts.has(attempt.lexicalSenseId)) lastAttempts.set(attempt.lexicalSenseId, attempt);
    }
    const lastTodayAttempt = new Map<string, (typeof todayAttempts)[number]>();
    for (const attempt of todayAttempts) {
      if (!lastTodayAttempt.has(attempt.lexicalSenseId)) lastTodayAttempt.set(attempt.lexicalSenseId, attempt);
    }
    const blockedLatest = new Set<string>();
    for (const id of selected) {
      const last = lastAttempts.get(id);
      if (!last || validRows.get(last.exerciseId)?.lexicalSenseId !== id) continue;
      const latestStudy = lastTodayAttempt.get(id);
      const failedHere = kinds[id] === 'reinforcement' && latestStudy?.eventId === last.eventId && latestStudy.kind !== 'reinforcement' && latestStudy.rating === Rating.Again;
      if ((failedHere || kinds[id] === 'due') && dayKey(last.reviewedAt) === sessionDay) assignments[id] = last.exerciseId;
      else if (kinds[id] === 'due') blockedLatest.add(last.exerciseId);
    }
    for (const row of existing) {
      if (!assignments[row.lexicalSenseId] && !used.has(row.id) && !blockedLatest.has(row.id) && validRows.has(row.id)) assignments[row.lexicalSenseId] = row.id;
    }
    const missingCount = selected.filter((id) => !assignments[id]).length;
    const ready = missingCount === 0;
    const session = await this.prisma.clozeSession.create({ data: { selectedIdsJson: JSON.stringify(selected), selectedKindsJson: JSON.stringify(kinds), exerciseIdsJson: JSON.stringify(assignments), status: ready ? 'ready' : 'queued', generationProcessed: 0, generationTotal: missingCount, generationRequested: !ready, createdAt: selectionAt } });
    return this.session(session.id);
  }

  async resetExerciseUsage() {
    const cleared = await this.prisma.clozeExerciseUsage.deleteMany();
    return { cleared: cleared.count };
  }

  async retryMissing(id: string) {
    const session = await this.prisma.clozeSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Nie znaleziono sesji cloze.');
    if (!['ready', 'failed'].includes(session.status)) throw new ConflictException('Poczekaj na zakończenie generowania.');
    if (await this.prisma.clozeAttempt.count({ where: { sessionId: id } })) throw new ConflictException('Po rozpoczęciu nauki dokończ sesję, a następnie rozpocznij nową dla brakujących znaczeń.');
    const selected = [...new Set(parseJson<string[]>(session.selectedIdsJson, []))];
    const assignments = parseJson<Record<string, string>>(session.exerciseIdsJson, {});
    const missing = selected.filter((senseId) => !assignments[senseId]);
    if (!missing.length) throw new BadRequestException('W tej sesji nie ma brakujących ćwiczeń.');
    const changed = await this.prisma.clozeSession.updateMany({ where: { id, status: session.status }, data: { status: 'queued', failuresJson: '{}', generationProcessed: 0, generationTotal: missing.length, generationRequested: true } });
    if (!changed.count) throw new ConflictException('Stan generowania zmienił się. Odśwież stronę.');
    return this.session(id);
  }

  async listSessions() {
    const rows = await this.prisma.clozeSession.findMany({ where: { generationRequested: true }, orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, createdAt: true } });
    const summaries = await Promise.all(rows.map(async (row) => {
      try {
        const { current: _current, finished: _finished, ...summary } = await this.session(row.id);
        return { ...summary, createdAt: row.createdAt };
      } catch (error) {
        if (error instanceof NotFoundException) return null;
        throw error;
      }
    }));
    return summaries.filter((summary) => summary !== null);
  }

  async session(id: string) {
    const session = await this.prisma.clozeSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Nie znaleziono sesji cloze.');
    const selected = parseJson<string[]>(session.selectedIdsJson, []);
    const distinct = [...new Set(selected)];
    const kinds = parseJson<Record<string, string>>(session.selectedKindsJson, {});
    const assignments = parseJson<Record<string, string>>(session.exerciseIdsJson, {});
    const failures = parseJson<Record<string, string>>(session.failuresJson, {});
    const failureIds = [...new Set(Object.keys(failures).map((key) => key.split(':')[0]))];
    const [attempts, failedSenses] = await Promise.all([
      this.prisma.clozeAttempt.findMany({ where: { sessionId: id }, select: { lexicalSenseId: true } }),
      failureIds.length ? this.prisma.lexicalSense.findMany({ where: { id: { in: failureIds } }, select: { id: true, lexicalItem: true, definition: true, detailsJson: true } }) : Promise.resolve([]),
    ]);
    const failureLabels = Object.fromEntries(failedSenses.map((sense) => {
      const details = parseJson<Record<string, unknown>>(sense.detailsJson || '', {});
      const glosses = details.glosses_pl;
      const gloss = Array.isArray(glosses) && typeof glosses[0] === 'string' ? glosses[0] : typeof details.definition_pl === 'string' ? details.definition_pl : sense.definition;
      return [sense.id, `${sense.lexicalItem} — ${gloss}`];
    }));
    const completedCount = new Set(attempts.map((item) => item.lexicalSenseId)).size;
    const missingCount = distinct.filter((senseId) => !assignments[senseId]).length;
    const common = { id: session.id, status: session.status, requestedCount: distinct.length, completedCount, missingCount, generation: { processed: session.generationProcessed, total: session.generationTotal }, failures, failureLabels };
    if (session.status !== 'ready') return { ...common, current: null, finished: session.status === 'failed' };
    const rows = await this.prisma.clozeExercise.findMany({ where: { lexicalSenseId: { in: distinct } }, orderBy: [{ batch: 'asc' }, { position: 'asc' }] });
    const byId = new Map(rows.filter((row) => validContent(parseJson<Exercise>(row.contentJson, {} as Exercise), row.lexicalSenseId, row.position)).map((row) => [row.id, row]));
    const legacy = !Object.keys(kinds).length;
    const legacyRows = new Map(rows.filter((row) => row.batch === 1 && row.position === 1 && byId.has(row.id)).map((row) => [row.lexicalSenseId, row]));
    const assigned = (senseId: string) => byId.get(assignments[senseId]) ?? (legacy ? legacyRows.get(senseId) : undefined);
    let index = session.cursor;
    while (index < selected.length && !assigned(selected[index])) index += 1;
    if (index === selected.length) return { ...common, current: null, finished: true };
    const row = assigned(selected[index])!;
    const exercise = parseJson<Exercise>(row.contentJson, {} as Exercise);
    const kind = attempts.some((item) => item.lexicalSenseId === selected[index]) ? 'reinforcement' : kinds[selected[index]] ?? 'new';
    return { ...common, current: { position: index, kind, exerciseId: row.id, exercise: publicExercise(exercise) }, finished: false };
  }

  async answer(id: string, body: { eventId?: unknown; position?: unknown; responses?: unknown }) {
    const eventId = body?.eventId;
    const position = body?.position;
    const responses = body?.responses;
    if (typeof eventId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId)
      || !Number.isInteger(position) || typeof responses !== 'object' || responses === null || Array.isArray(responses)
      || Object.values(responses).some((value) => typeof value !== 'string' || value.length > 200)) throw new BadRequestException('Niepoprawna odpowiedź cloze.');
    const values = responses as Record<string, string>;
    await this.fsrs.getConfig();
    let result: { correct: boolean; rating: number; kind: string; sentence: string; exercise: ReturnType<typeof publicExercise> } | undefined;
    for (let retry = 0; retry < 3; retry += 1) {
      try {
        result = await this.prisma.$transaction(async (tx) => {
          const prior = await tx.clozeAttempt.findUnique({ where: { eventId } });
          if (prior) {
            if (prior.sessionId !== id || prior.position !== position || prior.responseJson !== JSON.stringify(values)) throw new ConflictException('Identyfikator odpowiedzi został już użyty.');
            const priorExercise = await tx.clozeExercise.findUnique({ where: { id: prior.exerciseId } });
            if (!priorExercise) throw new ConflictException('Nie znaleziono ocenionego ćwiczenia.');
            const exercise = parseJson<Exercise>(priorExercise.contentJson, {} as Exercise);
            if (!validContent(exercise, prior.lexicalSenseId, priorExercise.position)) throw new ConflictException('Ocenione ćwiczenie jest niepoprawne.');
            const studyAttempt = await tx.studyAttempt.findUnique({ where: { eventId }, select: { kind: true } });
            return { correct: prior.correct, rating: prior.rating, kind: studyAttempt?.kind ?? 'new', sentence: correctSentence(exercise, values), exercise: publicExercise(exercise) };
          }
          const session = await tx.clozeSession.findUnique({ where: { id } });
          if (!session || session.status !== 'ready') throw new ConflictException('Sesja nie jest gotowa.');
          const ids = parseJson<string[]>(session.selectedIdsJson, []);
          const kinds = parseJson<Record<string, string>>(session.selectedKindsJson, {});
          const assignments = parseJson<Record<string, string>>(session.exerciseIdsJson, {});
          const rows = await tx.clozeExercise.findMany({ where: { lexicalSenseId: { in: ids } }, orderBy: [{ batch: 'asc' }, { position: 'asc' }] });
          const legacy = !Object.keys(kinds).length;
          const byId = new Map(rows.map((row) => [row.id, row]));
          const assigned = (senseId: string) => byId.get(assignments[senseId]) ?? (legacy ? rows.find((row) => row.lexicalSenseId === senseId && row.batch === 1 && row.position === 1) : undefined);
          let current = session.cursor;
          while (current < ids.length && !assigned(ids[current])) current += 1;
          if (current !== position || current >= ids.length) throw new ConflictException('Ta pozycja sesji nie jest już aktualna.');
          const row = assigned(ids[current])!;
          const exercise = parseJson<Exercise>(row.contentJson, {} as Exercise);
          if (!validContent(exercise, ids[current], row.position) || Object.keys(values).length !== exercise.gaps.length || exercise.gaps.some((gap) => !(gap in values))) throw new BadRequestException('Odpowiedź nie pasuje do luk ćwiczenia.');
          const correct = Object.values(exercise.answer_keys).some((key) => exercise.gaps.every((gap) => values[gap].trim() === key.fragments[gap]));
          const rating = correct ? Rating.Easy : Rating.Again;
          const reviewedAt = new Date();
          const previous = await tx.clozeAttempt.findFirst({ where: { sessionId: id, lexicalSenseId: ids[current] }, select: { eventId: true } });
          const kind = previous ? 'reinforcement' : kinds[ids[current]] ?? 'new';
          const formal = kind !== 'reinforcement';
          const reviewId = formal ? `cloze:${eventId}` : null;
          if (reviewId) await this.fsrs.applyReviewInTransaction(tx, { reviewEventId: reviewId, lexicalSenseId: ids[current], rating, reviewedAt });
          await tx.studyAttempt.create({ data: { eventId, lexicalSenseId: ids[current], presentationToken: `cloze:${id}:${current}`, kind, rating, reviewedAt, dayKey: dayKey(reviewedAt), fsrsReviewEventId: reviewId } });
          await tx.clozeAttempt.create({ data: { eventId, sessionId: id, lexicalSenseId: ids[current], exerciseId: row.id, position: current, responseJson: JSON.stringify(values), correct, rating, reviewedAt } });
          await tx.clozeExerciseUsage.upsert({ where: { exerciseId: row.id }, create: { exerciseId: row.id, usedAt: reviewedAt }, update: {} });
          if (rating === Rating.Again && formal) {
            if (kind === 'due') {
              let insert = current + 1;
              while (insert < ids.length && kinds[ids[insert]] !== 'new') insert += 1;
              ids.splice(insert, 0, ids[current]);
            } else ids.push(ids[current]);
          }
          const changed = await tx.clozeSession.updateMany({ where: { id, cursor: session.cursor }, data: { cursor: current + 1, selectedIdsJson: JSON.stringify(ids) } });
          if (!changed.count) throw new ConflictException('Sesja zmieniła się podczas zapisu.');
          return { correct, rating, kind, sentence: correctSentence(exercise, values), exercise: publicExercise(exercise) };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        break;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2002', 'P2034'].includes(error.code) && retry < 2) continue;
        throw error;
      }
    }
    if (!result) throw new ConflictException('Nie udało się zapisać odpowiedzi.');
    return { accepted: result, ...(await this.session(id)) };
  }

  private async runNext(): Promise<void> {
    if (this.working) return;
    this.working = true;
    let runningId: string | null = null;
    try {
      const queued = await this.prisma.clozeSession.findFirst({ where: { status: 'queued' }, orderBy: { createdAt: 'asc' } });
      if (!queued) return;
      const claimed = await this.prisma.clozeSession.updateMany({ where: { id: queued.id, status: 'queued' }, data: { status: 'running' } });
      if (!claimed.count) return;
      runningId = queued.id;
      const ids = [...new Set(parseJson<string[]>(queued.selectedIdsJson, []))];
      const assignments = parseJson<Record<string, string>>(queued.exerciseIdsJson, {});
      const kinds = parseJson<Record<string, string>>(queued.selectedKindsJson, {});
      const failures: Record<string, string> = {};
      const missing: Array<{ id: string; batch: number }> = [];
      for (const id of ids) {
        if (assignments[id]) continue;
        const present = await this.prisma.clozeExercise.findMany({ where: { lexicalSenseId: id }, orderBy: [{ batch: 'asc' }, { position: 'asc' }] });
        const used = await this.prisma.clozeExerciseUsage.findMany({ where: { exercise: { lexicalSenseId: id } }, select: { exerciseId: true } });
        const usedIds = new Set(used.map((item) => item.exerciseId));
        const last = kinds[id] === 'due' ? await this.prisma.clozeAttempt.findFirst({ where: { lexicalSenseId: id, reviewedAt: { lte: queued.createdAt } }, select: { exerciseId: true, reviewedAt: true }, orderBy: [{ reviewedAt: 'desc' }, { eventId: 'desc' }] }) : null;
        const blockedLatest = last && dayKey(last.reviewedAt) !== dayKey(queued.createdAt) ? last.exerciseId : null;
        const available = present.find((row) => !usedIds.has(row.id) && row.id !== blockedLatest && validContent(parseJson<Exercise>(row.contentJson, {} as Exercise), id, row.position));
        if (available) assignments[id] = available.id;
        else missing.push({ id, batch: Math.max(0, ...present.map((row) => row.batch)) + 1 });
      }
      const prepared = await this.prisma.clozeSession.updateMany({ where: { id: queued.id, status: 'running' }, data: { exerciseIdsJson: JSON.stringify(assignments), generationTotal: missing.length, generationProcessed: 0 } });
      if (!prepared.count) return;
      for (let offset = 0; offset < missing.length; offset += 5) {
        const group = missing.slice(offset, offset + 5);
        let generated: GenerationResult | undefined;
        try {
          generated = await this.generate(group.map((item) => item.id));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Nie udało się wygenerować ćwiczeń.';
          for (const { id, batch } of group) for (const position of [1, 2, 3, 4]) failures[`${id}:${batch}:${position}`] = message;
        }
        const active = await this.prisma.$transaction(async (tx) => {
          if (!await tx.clozeSession.findFirst({ where: { id: queued.id, status: 'running' }, select: { id: true } })) return false;
          const results = new Map(generated?.results.map((result) => [result.lexical_sense_id, result]) ?? []);
          for (const { id, batch } of group) {
            for (const slot of results.get(id)?.slots ?? []) {
              if (slot.exercise) {
                const row = await tx.clozeExercise.create({ data: { lexicalSenseId: id, batch, position: slot.position, contentJson: JSON.stringify(slot.exercise) } });
                if (!assignments[id]) assignments[id] = row.id;
              } else failures[`${id}:${batch}:${slot.position}`] = slot.failure?.reason || 'Nie udało się wygenerować ćwiczenia.';
            }
          }
          await tx.clozeSession.updateMany({ where: { id: queued.id, status: 'running' }, data: { failuresJson: JSON.stringify(failures), exerciseIdsJson: JSON.stringify(assignments), generationProcessed: { increment: group.length } } });
          return true;
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        if (!active) return;
      }
      await this.prisma.clozeSession.updateMany({ where: { id: queued.id, status: 'running' }, data: { status: 'ready', failuresJson: JSON.stringify(failures), generationRequested: missing.length > 0 } });
    } catch (error) {
      console.error('[Cloze generation worker]', error);
      if (runningId) {
        try { await this.prisma.clozeSession.updateMany({ where: { id: runningId, status: 'running' }, data: { status: 'failed' } }); }
        catch (saveError) { console.error('[Cloze generation failure state]', saveError); }
      }
    }
    finally { this.working = false; }
  }

  private async generate(ids: string[]): Promise<GenerationResult> {
    if (!process.env.OPENAI_API_KEY) throw new BadGatewayException('Brak konfiguracji OpenAI na serwerze.');
    if (profile.taxonomy?.sha256 !== taxonomyHash || profile.taxonomy?.schema_version !== taxonomy.schema_version) throw new ConflictException('Profil i taksonomia mają różne wersje.');
    const lexical = (await this.input.prepare(ids)).lexical_senses;
    const context = {
      lexical_senses: lexical,
      taxonomy: projectTaxonomyForGeneration(taxonomy, taxonomyHash),
      competence_profile: {
        taxonomy: profile.taxonomy, estimated_user_level: profile.estimated_user_level,
        competencies: profile.competencies,
      },
    };
    const instructions = `${readFileSync(join(root, 'SKILL.md'), 'utf8')}\n\n${reference('generation_rules.md')}\n\nExercise schema:\n${reference('exercise.schema.json')}\n\nBatch schema:\n${reference('generation_result.schema.json')}\n\nThe server has already validated the complete profile and taxonomy files, including their schema versions and SHA-256. The input contains every taxonomy category, construction, variant and relation plus every learner competency, projected to fields needed for exercise selection. The original file hash is supplied for consistency; do not hash this projection or reject it for omitting editorial metadata. Apply the skill rules to these candidates. Return the batch JSON object only. Every successful exercise requires a full Polish sentence_pl. A failure slot must state attempts (0–3) and reason.`;
    const url = process.env.OPENAI_RESPONSES_URL || 'https://api.openai.com/v1/responses';
    const headers = { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'content-type': 'application/json' };
    const request = async (endpoint: string, options: RequestInit): Promise<any> => {
      let response: Response;
      try { response = await fetch(endpoint, options); }
      catch (error) {
        const name = error instanceof Error ? error.name : 'UnknownError';
        const cause = error instanceof Error && error.cause && typeof error.cause === 'object' && 'code' in error.cause ? String(error.cause.code) : undefined;
        console.error('[Cloze generation connection failure]', { name, cause });
        throw new BadGatewayException(name === 'TimeoutError' || name === 'AbortError' ? 'Upłynął limit czasu połączenia z OpenAI.' : 'Nie udało się połączyć z OpenAI.');
      }
      let body: any;
      try { body = await response.json(); } catch { throw new BadGatewayException('OpenAI zwróciło nieczytelną odpowiedź.'); }
      if (!response.ok) {
        const code = typeof body?.error?.code === 'string' ? body.error.code : undefined;
        console.error('[Cloze generation API failure]', { lexicalSenseIds: ids, status: response.status, code });
        throw openAiGenerationFailure(response.status, body);
      }
      return body;
    };
    let raw = await request(url, {
      method: 'POST', headers,
      body: JSON.stringify({ model, instructions, input: JSON.stringify(context), max_output_tokens: 12000 + (ids.length - 1) * 5000, background: true }),
      signal: AbortSignal.timeout(60_000),
    }) as { id?: string; status?: string; incomplete_details?: { reason?: string }; output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
    const deadline = Date.now() + 15 * 60_000;
    let pollFailures = 0;
    while (raw.status === 'queued' || raw.status === 'in_progress') {
      if (!raw.id) throw new BadGatewayException('OpenAI nie podało identyfikatora generowania.');
      if (Date.now() >= deadline) throw new BadGatewayException('OpenAI nie zakończyło generowania w ciągu 15 minut.');
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        raw = await request(`${url}/${encodeURIComponent(raw.id)}`, { headers, signal: AbortSignal.timeout(30_000) });
        pollFailures = 0;
      } catch (error) {
        if (!(error instanceof BadGatewayException) || ++pollFailures >= 3) throw error;
      }
    }
    if (raw.status === 'incomplete') throw new BadGatewayException(raw.incomplete_details?.reason === 'max_output_tokens' ? 'OpenAI przerwało generowanie po osiągnięciu limitu długości odpowiedzi.' : 'OpenAI zwróciło niepełną odpowiedź.');
    if (raw.status !== 'completed') throw new BadGatewayException(`OpenAI zakończyło generowanie stanem: ${raw.status || 'nieznany'}.`);
    console.info('[Cloze generation response]', { lexicalSenseIds: ids, status: raw.status, response: raw });
    const text = raw.output_text || raw.output?.flatMap((item) => item.content || []).filter((part) => part.type === 'output_text').map((part) => part.text).join('');
    const generated = parseJson<GenerationResult>(text || '', {} as GenerationResult);
    if (!validateResult(generated) || generated.results.length !== ids.length || new Set(generated.results.map((result) => result.lexical_sense_id)).size !== ids.length || generated.results.some((result) => !ids.includes(result.lexical_sense_id))) throw new BadGatewayException('OpenAI zwróciło niepoprawną serię ćwiczeń.');
    const exerciseIds = generated.results.flatMap((result) => result.slots.flatMap((slot) => slot.exercise ? [slot.exercise.exercise_id] : []));
    if (new Set(exerciseIds).size !== exerciseIds.length || generated.results.some((result) => new Set(result.slots.map((slot) => slot.position)).size !== 4 || result.slots.some((slot) => slot.exercise && !validContent(slot.exercise, result.lexical_sense_id, slot.position)))) throw new BadGatewayException('OpenAI zwróciło niespójne ćwiczenia.');
    return generated;
  }
}
