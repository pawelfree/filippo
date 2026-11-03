import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BadGatewayException, BadRequestException, ConflictException, Inject, Injectable, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import Ajv2020 from 'ajv/dist/2020';
import { Rating } from 'ts-fsrs';
import { PrismaService } from '../database/prisma.service';
import { ExerciseGenerationInputService } from '../exercise-generation-input/exercise-generation-input.service';
import { FsrsService } from '../fsrs/fsrs.service';

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
function publicExercise(exercise: Exercise) {
  const { answer_keys: _answers, success_checks_by_answer_key: _checks, ...visible } = exercise;
  return visible;
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
  ) {}

  async onModuleInit(): Promise<void> {
    // A crash must not restart an already-running model attempt with a fresh budget.
    await this.prisma.clozeSession.updateMany({ where: { status: 'running' }, data: { status: 'failed' } });
    this.timer = setInterval(() => { void this.runNext(); }, 1000);
    void this.runNext();
  }
  onModuleDestroy(): void { if (this.timer) clearInterval(this.timer); }

  async createSession(countInput: unknown) {
    const count = Number(countInput);
    if (!Number.isInteger(count) || count < 1 || count > maxCount) throw new BadRequestException(`Podaj liczbę znaczeń od 1 do ${maxCount}.`);
    const now = new Date();
    const [senses, states] = await Promise.all([
      this.prisma.lexicalSense.findMany({ where: { language: 'it', detailsJson: { not: null } }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], select: { id: true, createdAt: true } }),
      this.prisma.fsrsState.findMany({ where: { learnerId: 'local' }, select: { lexicalSenseId: true, dueAt: true } }),
    ]);
    if (senses.length < count) throw new BadRequestException(`Dostępnych znaczeń: ${senses.length}. Wybierz mniejszą liczbę.`);
    const byId = new Map(states.map((state) => [state.lexicalSenseId, state]));
    const rank = (id: string) => { const state = byId.get(id); return !state ? 1 : state.dueAt <= now ? 0 : 2; };
    senses.sort((a, b) => rank(a.id) - rank(b.id) || a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id));
    const selected = senses.slice(0, count).map((sense) => sense.id);
    const existing = await this.prisma.clozeExercise.findMany({ where: { lexicalSenseId: { in: selected } }, select: { lexicalSenseId: true, position: true, contentJson: true } });
    const available = new Set(existing.filter((row) => validContent(parseJson<Exercise>(row.contentJson, {} as Exercise), row.lexicalSenseId, row.position)).map((row) => `${row.lexicalSenseId}:${row.position}`));
    const ready = selected.every((id) => [1, 2, 3, 4].every((position) => available.has(`${id}:${position}`)));
    const session = await this.prisma.clozeSession.create({ data: { selectedIdsJson: JSON.stringify(selected), status: ready ? 'ready' : 'queued' } });
    return this.session(session.id);
  }

  async session(id: string) {
    const session = await this.prisma.clozeSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Nie znaleziono sesji cloze.');
    const selected = parseJson<string[]>(session.selectedIdsJson, []);
    const failures = parseJson<Record<string, string>>(session.failuresJson, {});
    const common = { id: session.id, status: session.status, requestedCount: selected.length, completedCount: session.cursor, failures };
    if (session.status !== 'ready') return { ...common, current: null, finished: session.status === 'failed' };
    const rows = await this.prisma.clozeExercise.findMany({ where: { lexicalSenseId: { in: selected }, position: 1 } });
    const byId = new Map(rows.map((row) => [row.lexicalSenseId, row]));
    let index = session.cursor;
    while (index < selected.length && !byId.has(selected[index])) index += 1;
    if (index === selected.length) return { ...common, completedCount: selected.length, current: null, finished: true };
    const row = byId.get(selected[index])!;
    const exercise = parseJson<Exercise>(row.contentJson, {} as Exercise);
    if (!validContent(exercise, row.lexicalSenseId, 1)) throw new ConflictException('Zapisane ćwiczenie jest niepoprawne.');
    return { ...common, completedCount: index, current: { position: index, exerciseId: row.id, exercise: publicExercise(exercise) }, finished: false };
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
    let result: { correct: boolean; rating: number } | undefined;
    for (let retry = 0; retry < 3; retry += 1) {
      try {
        result = await this.prisma.$transaction(async (tx) => {
          const prior = await tx.clozeAttempt.findUnique({ where: { eventId } });
          if (prior) {
            if (prior.sessionId !== id || prior.position !== position || prior.responseJson !== JSON.stringify(values)) throw new ConflictException('Identyfikator odpowiedzi został już użyty.');
            return { correct: prior.correct, rating: prior.rating };
          }
          const session = await tx.clozeSession.findUnique({ where: { id } });
          if (!session || session.status !== 'ready') throw new ConflictException('Sesja nie jest gotowa.');
          const ids = parseJson<string[]>(session.selectedIdsJson, []);
          const rows = await tx.clozeExercise.findMany({ where: { lexicalSenseId: { in: ids }, position: 1 } });
          const byId = new Map(rows.map((row) => [row.lexicalSenseId, row]));
          let current = session.cursor;
          while (current < ids.length && !byId.has(ids[current])) current += 1;
          if (current !== position || current >= ids.length) throw new ConflictException('Ta pozycja sesji nie jest już aktualna.');
          const row = byId.get(ids[current])!;
          const exercise = parseJson<Exercise>(row.contentJson, {} as Exercise);
          if (!validContent(exercise, ids[current], 1) || Object.keys(values).length !== exercise.gaps.length || exercise.gaps.some((gap) => !(gap in values))) throw new BadRequestException('Odpowiedź nie pasuje do luk ćwiczenia.');
          const correct = Object.values(exercise.answer_keys).some((key) => exercise.gaps.every((gap) => values[gap].trim() === key.fragments[gap]));
          const rating = correct ? Rating.Easy : Rating.Again;
          const reviewedAt = new Date();
          await this.fsrs.applyReviewInTransaction(tx, { reviewEventId: `cloze:${eventId}`, lexicalSenseId: ids[current], rating, reviewedAt });
          await tx.clozeAttempt.create({ data: { eventId, sessionId: id, lexicalSenseId: ids[current], exerciseId: row.id, position: current, responseJson: JSON.stringify(values), correct, rating, reviewedAt } });
          const changed = await tx.clozeSession.updateMany({ where: { id, cursor: session.cursor }, data: { cursor: current + 1 } });
          if (!changed.count) throw new ConflictException('Sesja zmieniła się podczas zapisu.');
          return { correct, rating };
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
      const ids = parseJson<string[]>(queued.selectedIdsJson, []);
      const failures: Record<string, string> = {};
      for (const id of ids) {
        const present = await this.prisma.clozeExercise.findMany({ where: { lexicalSenseId: id } });
        const valid = new Set(present.filter((row) => validContent(parseJson<Exercise>(row.contentJson, {} as Exercise), id, row.position)).map((row) => row.position));
        if ([1, 2, 3, 4].every((position) => valid.has(position))) continue;
        try {
          const generated = await this.generate(id);
          const slots = generated.results[0].slots;
          for (const slot of slots) {
            if (valid.has(slot.position)) continue;
            if (slot.exercise) await this.prisma.clozeExercise.upsert({ where: { lexicalSenseId_position: { lexicalSenseId: id, position: slot.position } }, create: { lexicalSenseId: id, position: slot.position, contentJson: JSON.stringify(slot.exercise) }, update: { contentJson: JSON.stringify(slot.exercise) } });
            else failures[`${id}:${slot.position}`] = slot.failure?.reason || 'Nie udało się wygenerować ćwiczenia.';
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Nie udało się wygenerować ćwiczeń.';
          for (const position of [1, 2, 3, 4]) if (!valid.has(position)) failures[`${id}:${position}`] = message;
        }
        await this.prisma.clozeSession.update({ where: { id: queued.id }, data: { failuresJson: JSON.stringify(failures) } });
      }
      await this.prisma.clozeSession.update({ where: { id: queued.id }, data: { status: 'ready', failuresJson: JSON.stringify(failures) } });
    } catch (error) {
      console.error('[Cloze generation worker]', error);
      if (runningId) {
        try { await this.prisma.clozeSession.update({ where: { id: runningId }, data: { status: 'failed' } }); }
        catch (saveError) { console.error('[Cloze generation failure state]', saveError); }
      }
    }
    finally { this.working = false; }
  }

  private async generate(id: string): Promise<GenerationResult> {
    if (!process.env.OPENAI_API_KEY) throw new BadGatewayException('Brak konfiguracji OpenAI na serwerze.');
    if (profile.taxonomy?.sha256 !== taxonomyHash || profile.taxonomy?.schema_version !== taxonomy.schema_version) throw new ConflictException('Profil i taksonomia mają różne wersje.');
    const lexical = (await this.input.prepare([id])).lexical_senses[0];
    const allowed = new Set(['CAT-01', 'CAT-02', 'CAT-03', 'CAT-05', 'CAT-06', 'CAT-11', 'CAT-13']);
    const variants = taxonomy.variants.filter((variant: any) => allowed.has(variant.category_id || variant.construction_id?.slice(0, 6)) && ['A1', 'A2', 'B1'].includes(variant.cefr?.reference_level));
    const variantIds = new Set(variants.map((variant: any) => variant.id));
    const constructionIds = new Set(variants.map((variant: any) => variant.construction_id));
    const context = {
      lexical_senses: [lexical],
      taxonomy_subset: {
        schema_version: taxonomy.schema_version, full_file_sha256: taxonomyHash,
        categories: taxonomy.categories.filter((item: any) => allowed.has(item.id)),
        constructions: taxonomy.constructions.filter((item: any) => constructionIds.has(item.id)),
        variants,
      },
      competence_profile_subset: {
        taxonomy: profile.taxonomy, estimated_user_level: profile.estimated_user_level,
        competencies: profile.competencies.filter((item: any) => variantIds.has(item.taxonomy_node_id)),
      },
    };
    const instructions = `${readFileSync(join(root, 'SKILL.md'), 'utf8')}\n\n${reference('generation_rules.md')}\n\nExercise schema:\n${reference('exercise.schema.json')}\n\nBatch schema:\n${reference('generation_result.schema.json')}\n\nThe server has already validated the complete profile and taxonomy files, including their schema versions and SHA-256. The input contains their relevant subsets; do not rehash the subset or reject it for omitting unrelated variants. Apply the skill rules to these candidates. Return the batch JSON object only. Every successful exercise requires a full Polish sentence_pl. A failure slot must state attempts (0–3) and reason.`;
    let response: Response;
    try {
      response = await fetch(process.env.OPENAI_RESPONSES_URL || 'https://api.openai.com/v1/responses', {
        method: 'POST', headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({ model, instructions, input: JSON.stringify(context), max_output_tokens: 12000 }), signal: AbortSignal.timeout(180_000),
      });
    } catch { throw new BadGatewayException('Nie udało się połączyć z OpenAI.'); }
    if (!response.ok) throw new BadGatewayException(`OpenAI nie zwróciło ćwiczeń (HTTP ${response.status}).`);
    const raw = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
    const text = raw.output_text || raw.output?.flatMap((item) => item.content || []).filter((part) => part.type === 'output_text').map((part) => part.text).join('');
    const generated = parseJson<GenerationResult>(text || '', {} as GenerationResult);
    if (!validateResult(generated) || generated.results.length !== 1 || generated.results[0].lexical_sense_id !== id) throw new BadGatewayException('OpenAI zwróciło niepoprawną serię ćwiczeń.');
    const slots = generated.results[0].slots;
    if (new Set(slots.map((slot) => slot.position)).size !== 4 || new Set(slots.flatMap((slot) => slot.exercise ? [slot.exercise.exercise_id] : [])).size !== slots.filter((slot) => slot.exercise).length || slots.some((slot) => slot.exercise && !validContent(slot.exercise, id, slot.position))) throw new BadGatewayException('OpenAI zwróciło niespójne ćwiczenia.');
    return generated;
  }
}
