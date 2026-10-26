import { BadGatewayException, BadRequestException, ConflictException, HttpException, HttpStatus, Injectable, Inject, NotFoundException, OnModuleDestroy, OnModuleInit, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { Prisma, type LexicalSense } from '@prisma/client';
import Ajv2020 from 'ajv/dist/2020';
import { readFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { PrismaService } from '../database/prisma.service';

interface SenseRecord {
  schema_version: string;
  lexical_item_it: string;
  language: string;
  part_of_speech: string;
  definition_it: string;
  definition_pl: string;
  glosses_pl: string[];
  usage: { register: string; patterns_it: string[]; collocations_it: string[]; constraints_pl: string[] };
  examples: Array<{ sentence_it: string; translation_pl: string; origin: string; evidence_id?: string }>;
  evidence: Record<string, { source_type: string; locator: string; supports: string[] }>;
}

interface BatchResult {
  lexical_senses: SenseRecord[];
  deferred: Array<{ input_form_it: string; reason_code: string; needed_evidence_or_decision: string }>;
  coverage: Array<Record<string, unknown>>;
}

interface Selection { index: number; definition_pl: string; confirmedDistinct?: boolean }

const skillRoot = join(process.cwd(), '.ai/docs/create-lexical-senses');
const readSkill = (path: string): string => readFileSync(join(skillRoot, path), 'utf8');
const responseFormat = JSON.parse(readSkill('references/openai.response.format.json')) as { schema: object; strict: boolean };
const instructions = `${readSkill('SKILL.md')}\n\n${readSkill('references/creation.rules.md')}`;
const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateBatch = ajv.compile<BatchResult>(responseFormat.schema);
const validateSense = ajv.compile<SenseRecord>(JSON.parse(readSkill('references/lexicalsense.schema.json')));
const normalize = (value: string): string => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('it');
const identity = (record: SenseRecord): string => createHash('sha256').update([
  normalize(record.lexical_item_it), normalize(record.part_of_speech), normalize(record.definition_it),
].join('\u0000')).digest('hex');

function openAiFailure(status: number, body: unknown): Error {
  const code = typeof body === 'object' && body !== null && 'error' in body
    && typeof body.error === 'object' && body.error !== null && 'code' in body.error
    && typeof body.error.code === 'string' ? body.error.code : undefined;
  if (status === 401) return new UnauthorizedException('OpenAI odrzuciło klucz API. Sprawdź, czy serwer używa aktywnej wartości OPENAI_API_KEY.');
  if (status === 429) {
    const messages: Record<string, string> = {
      credit_balance_exhausted: 'Wyczerpano środki API. Dodaj kredyty w ustawieniach rozliczeń OpenAI.',
      organization_spend_limit_exceeded: 'Osiągnięto twardy limit wydatków organizacji OpenAI. Zmień go w ustawieniach organizacji.',
      project_spend_limit_exceeded: 'Osiągnięto twardy limit wydatków projektu OpenAI. Zmień go w ustawieniach projektu.',
      organization_usage_limit_exceeded: 'Osiągnięto miesięczny limit użycia organizacji OpenAI.',
      rate_limit_exceeded: 'OpenAI chwilowo ogranicza liczbę żądań. Poczekaj i spróbuj ponownie.',
    };
    return new HttpException(messages[code || ''] || 'OpenAI odrzuciło żądanie z powodu limitu. Sprawdź kredyty oraz limity wydatków projektu.', HttpStatus.TOO_MANY_REQUESTS);
  }
  return new BadGatewayException(`OpenAI zwróciło błąd (${status}). Spróbuj ponownie.`);
}

function evidenceFailures(record: SenseRecord): string[] {
  const evidence = Object.values(record.evidence);
  const supports = (claim: string): boolean => evidence.some((entry) => entry.supports.includes(claim));
  const failures: string[] = [];
  if (!supports('meaning')) failures.push('Brak dowodu oznaczonego `meaning`.');
  if (!supports('part_of_speech')) failures.push('Brak dowodu oznaczonego `part_of_speech`.');
  if (record.usage.register !== 'unknown' && !supports('register')) failures.push('Brak dowodu oznaczonego `register`.');
  if (record.usage.patterns_it.length > 0 && !supports('pattern')) failures.push('Brak dowodu oznaczonego `pattern`.');
  if (record.usage.constraints_pl.length > 0 && !supports('constraint')) failures.push('Brak dowodu oznaczonego `constraint`.');
  if (record.examples.some((example) => example.origin === 'attested' && (!example.evidence_id || !record.evidence[example.evidence_id]?.supports.includes('example')))) failures.push('Przykład poświadczony nie wskazuje dowodu oznaczonego `example`.');
  if (evidence.some((entry) => ['dictionary', 'corpus', 'lexical_database'].includes(entry.source_type) && !/^https?:\/\//i.test(entry.locator))) failures.push('Źródło słownikowe, korpusowe lub leksykalne nie ma adresu HTTP(S).');
  return failures;
}

function parseStored(record: LexicalSense): SenseRecord | null {
  if (!record.detailsJson) return null;
  try {
    const data: unknown = JSON.parse(record.detailsJson);
    return validateSense(data) ? data : null;
  } catch {
    return null;
  }
}

function publicSense(record: LexicalSense): Record<string, unknown> {
  const details = parseStored(record);
  return {
    id: record.id, lexical_item_it: record.lexicalItem, definition_it: record.definition,
    definition_pl: details?.definition_pl, part_of_speech: details?.part_of_speech,
  };
}

function sameItem(record: LexicalSense, proposal: SenseRecord): boolean {
  return normalize(record.lexicalItem) === normalize(proposal.lexical_item_it);
}

function equivalent(record: LexicalSense, proposal: SenseRecord): boolean {
  if (!sameItem(record, proposal)) return false;
  const details = parseStored(record);
  if (details?.part_of_speech && details.part_of_speech !== proposal.part_of_speech) return false;
  return record.identityKey === identity(proposal) || (details ? identity(details) === identity(proposal) : normalize(record.definition) === normalize(proposal.definition_it));
}

function possiblyEquivalent(record: LexicalSense, proposal: SenseRecord): boolean {
  if (!sameItem(record, proposal)) return false;
  const partOfSpeech = parseStored(record)?.part_of_speech;
  return !partOfSpeech || partOfSpeech === proposal.part_of_speech;
}

@Injectable()
export class LexicalSensesService implements OnModuleInit, OnModuleDestroy {
  private readonly checks = new Map<string, { items: string[]; expires: number }>();
  private readonly drafts = new Map<string, { records: SenseRecord[]; expires: number }>();
  private workerTimer?: NodeJS.Timeout;
  private working = false;

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    try { await this.prisma.lexicalSenseGenerationJob.updateMany({ where: { status: { in: ['queued', 'running'] } }, data: { status: 'failed', errorCode: 'server_restarted', errorMessage: 'Serwer został uruchomiony ponownie. Uruchom zadanie ponownie.', completedAt: new Date() } }); } catch { /* database may be unavailable at bootstrap */ }
    this.workerTimer = setInterval(() => { void this.runNextJob(); }, 500);
    void this.runNextJob();
  }

  onModuleDestroy(): void { if (this.workerTimer) clearInterval(this.workerTimer); }

  async createGenerationJob(body: { checkId?: unknown; items?: unknown }): Promise<{ id: string; status: string }> {
    this.pruneExpired();
    const items = this.verifiedItems(body);
    try {
      const job = await this.prisma.lexicalSenseGenerationJob.create({ data: { status: 'queued', itemsJson: JSON.stringify(items) } });
      return { id: job.id, status: job.status };
    } catch { throw new ServiceUnavailableException('Nie udało się zlecić generowania. Spróbuj ponownie.'); }
  }

  async generationJobs(): Promise<Array<Record<string, unknown>>> {
    try {
      const jobs = await this.prisma.lexicalSenseGenerationJob.findMany({ orderBy: { createdAt: 'desc' } });
      return jobs.map((job) => ({ id: job.id, status: job.status, items: JSON.parse(job.itemsJson), errorCode: job.errorCode, errorMessage: job.errorMessage, createdAt: job.createdAt, completedAt: job.completedAt }));
    } catch { throw new ServiceUnavailableException('Nie udało się odczytać zadań generowania.'); }
  }

  async retryGenerationJob(id: string): Promise<{ id: string; status: string }> {
    const failed = await this.prisma.lexicalSenseGenerationJob.findUnique({ where: { id } });
    if (!failed) throw new NotFoundException('Nie znaleziono zadania generowania.');
    if (failed.status !== 'failed') throw new BadRequestException('Ponowić można tylko nieudane zadanie.');
    const job = await this.prisma.lexicalSenseGenerationJob.create({ data: { status: 'queued', itemsJson: failed.itemsJson } });
    return { id: job.id, status: job.status };
  }

  private async runNextJob(): Promise<void> {
    if (this.working) return;
    this.working = true;
    try {
      const queued = await this.prisma.lexicalSenseGenerationJob.findFirst({ where: { status: 'queued' }, orderBy: { createdAt: 'asc' } });
      if (!queued) return;
      const claimed = await this.prisma.lexicalSenseGenerationJob.updateMany({ where: { id: queued.id, status: 'queued' }, data: { status: 'running', startedAt: new Date(), errorCode: null, errorMessage: null } });
      if (!claimed.count) return;
      const items = JSON.parse(queued.itemsJson) as string[];
      this.checks.set(queued.id, { items, expires: Date.now() + 10 * 60_000 });
      try {
        const batch = await this.generate({ checkId: queued.id, items }) as unknown as BatchResult & { validationWarnings?: unknown };
        await this.prisma.$transaction(async (tx) => {
          await tx.lexicalSenseGenerationJob.update({ where: { id: queued.id }, data: { status: 'ready', resultJson: JSON.stringify({ lexical_senses: batch.lexical_senses, deferred: batch.deferred, coverage: batch.coverage }), validationJson: batch.validationWarnings ? JSON.stringify(batch.validationWarnings) : null, completedAt: new Date() } });
          for (let index = 0; index < batch.lexical_senses.length; index += 1) await tx.lexicalSenseGenerationProposal.create({ data: { jobId: queued.id, senseJson: JSON.stringify(batch.lexical_senses[index]), validationWarningsJson: batch.validationWarnings ? JSON.stringify((batch.validationWarnings as Array<{ recordIndex: number }>).filter((warning) => warning.recordIndex === index)) : null } });
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Nie udało się wygenerować propozycji.';
        await this.prisma.lexicalSenseGenerationJob.update({ where: { id: queued.id }, data: { status: 'failed', errorCode: 'generation_failed', errorMessage: message, completedAt: new Date() } });
      } finally { this.checks.delete(queued.id); }
    } catch (error) { console.error('[LexicalSense generation worker failure]', error); }
    finally { this.working = false; }
  }

  async generationProposals(): Promise<Array<Record<string, unknown>>> {
    const proposals = await this.prisma.lexicalSenseGenerationProposal.findMany({ orderBy: { createdAt: 'asc' } });
    const related = await this.prisma.lexicalSense.findMany({ where: { language: 'it' } });
    return proposals.map((proposal) => {
      const sense = JSON.parse(proposal.senseJson) as SenseRecord;
      return { id: proposal.id, jobId: proposal.jobId, ...sense, validationWarnings: proposal.validationWarningsJson ? JSON.parse(proposal.validationWarningsJson) : [], matches: related.filter((stored) => sameItem(stored, sense)).map((stored) => ({ ...publicSense(stored), equivalent: equivalent(stored, sense), possible: possiblyEquivalent(stored, sense) })) };
    });
  }

  async saveGenerationProposal(id: string, body: { definition_pl?: unknown; confirmedDistinct?: unknown }): Promise<Record<string, unknown>> {
    const proposal = await this.prisma.lexicalSenseGenerationProposal.findUnique({ where: { id } });
    if (!proposal) throw new NotFoundException('Nie znaleziono propozycji.');
    if (typeof body.definition_pl !== 'string') throw new BadRequestException('Podaj polskie objaśnienie.');
    const draftId = randomUUID();
    this.drafts.set(draftId, { records: [JSON.parse(proposal.senseJson) as SenseRecord], expires: Date.now() + 60_000 });
    const result = await this.save({ draftId, selected: [{ index: 0, definition_pl: body.definition_pl, confirmedDistinct: body.confirmedDistinct === true }] });
    const verdict = result.results[0];
    if (verdict.status === 'saved') await this.prisma.lexicalSenseGenerationProposal.delete({ where: { id } });
    return verdict;
  }

  async rejectGenerationProposal(id: string): Promise<void> {
    const proposal = await this.prisma.lexicalSenseGenerationProposal.findUnique({ where: { id } });
    if (!proposal) throw new NotFoundException('Nie znaleziono propozycji.');
    await this.prisma.$transaction([
      this.prisma.rejectedLexicalSenseProposal.create({ data: { sourceProposalId: proposal.id, jobId: proposal.jobId, senseJson: proposal.senseJson, validationWarningsJson: proposal.validationWarningsJson } }),
      this.prisma.lexicalSenseGenerationProposal.delete({ where: { id } }),
    ]);
  }

  private pruneExpired(): void {
    const now = Date.now();
    for (const [key, value] of this.checks) if (value.expires < now) this.checks.delete(key);
    for (const [key, value] of this.drafts) if (value.expires < now) this.drafts.delete(key);
  }

  private cleanItems(value: unknown): string[] {
    if (!Array.isArray(value) || value.length < 1 || value.length > 30 || !value.every((item) => typeof item === 'string')) {
      throw new BadRequestException('Podaj od 1 do 30 włoskich słów lub wyrażeń.');
    }
    const items = value.map((item: string) => item.trim().replace(/\s+/g, ' '));
    if (items.some((item) => !item || item.length > 150) || new Set(items.map(normalize)).size !== items.length) {
      throw new BadRequestException('Usuń puste i powtórzone pozycje; każda może mieć maksymalnie 150 znaków.');
    }
    return items;
  }

  private async existingFor(items: string[]): Promise<LexicalSense[]> {
    const wanted = new Set(items.map(normalize));
    const records = await this.prisma.lexicalSense.findMany({ where: { language: 'it' } });
    return records.filter((record) => wanted.has(normalize(record.lexicalItem)));
  }

  private async storeGenerationResult(result: BatchResult): Promise<string | undefined> {
    try {
      const stored = await this.prisma.openAiGenerationResult.create({ data: {
        resultJson: JSON.stringify(result), outcome: 'received',
      } });
      return stored.id;
    } catch { return undefined; }
  }

  private async markGenerationResult(id: string | undefined, outcome: string, validation?: unknown): Promise<void> {
    if (!id) return;
    try { await this.prisma.openAiGenerationResult.update({ where: { id }, data: { outcome, validationJson: validation === undefined ? null : JSON.stringify(validation) } }); }
    catch { /* Failure to retain a log does not change the generation verdict. */ }
  }

  private async rejectGeneratedResponse(message: string, response: unknown, failures: unknown, resultId?: string): Promise<never> {
    await this.markGenerationResult(resultId, 'rejected_validation', failures);
    console.error('[OpenAI generation rejected response]', { failures, response });
    throw new BadGatewayException(message);
  }

  async check(body: { items?: unknown }): Promise<Record<string, unknown>> {
    this.pruneExpired();
    const items = this.cleanItems(body?.items);
    let existing: LexicalSense[];
    try { existing = await this.existingFor(items); }
    catch { throw new ServiceUnavailableException('Baza danych jest chwilowo niedostępna. Spróbuj ponownie.'); }
    const checkId = randomUUID();
    this.checks.set(checkId, { items, expires: Date.now() + 15 * 60_000 });
    return {
      checkId,
      items: items.map((input) => ({ input, existing: existing.filter((record) => normalize(record.lexicalItem) === normalize(input)).map(publicSense) })),
    };
  }

  async list(pageInput?: string, searchInput?: string): Promise<{ items: Array<Record<string, unknown>>; page: number; pageSize: number; total: number; totalPages: number }> {
    if (pageInput !== undefined && (!/^[1-9]\d*$/.test(pageInput) || !Number.isSafeInteger(Number(pageInput)))) throw new BadRequestException('Numer strony musi być dodatnią liczbą całkowitą.');
    if (searchInput !== undefined && (typeof searchInput !== 'string' || searchInput.length > 150)) throw new BadRequestException('Filtr może mieć najwyżej 150 znaków.');
    const requestedPage = pageInput === undefined ? 1 : Number(pageInput);
    const pageSize = 10;
    const search = searchInput?.trim();
    try {
      const filter = search ? Prisma.sql`language = 'it' AND (
        instr(lower(lexicalItem), lower(${search})) > 0 OR
        instr(lower(definition), lower(${search})) > 0 OR
        instr(lower(CASE WHEN json_valid(detailsJson) THEN json_extract(detailsJson, '$.definition_pl') ELSE '' END), lower(${search})) > 0
      )` : Prisma.sql`language = 'it'`;
      const [{ total: count }] = await this.prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`SELECT count(*) AS total FROM "LexicalSense" WHERE ${filter}`);
      const total = Number(count);
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const page = Math.min(requestedPage, totalPages);
      const ids = await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT id FROM "LexicalSense" WHERE ${filter} ORDER BY createdAt DESC, id DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`);
      const byId = await this.prisma.lexicalSense.findMany({ where: { id: { in: ids.map((item) => item.id) } } });
      const recordsById = new Map(byId.map((record) => [record.id, record]));
      const records = ids.map(({ id }) => recordsById.get(id)).filter((record): record is LexicalSense => !!record);
      return { items: records.map((record) => ({ ...publicSense(record), createdAt: record.createdAt, editable: !!parseStored(record) })), page, pageSize, total, totalPages };
    } catch { throw new ServiceUnavailableException('Baza danych jest chwilowo niedostępna. Spróbuj ponownie.'); }
  }

  async update(id: string, body: { definition_it?: unknown; definition_pl?: unknown }): Promise<Record<string, unknown>> {
    if (typeof body?.definition_it !== 'string' || typeof body?.definition_pl !== 'string') throw new BadRequestException('Podaj włoskie i polskie wyjaśnienie.');
    const definitionIt = body.definition_it.trim();
    const definitionPl = body.definition_pl.trim();
    if (!definitionIt || !definitionPl || definitionIt.length > 2000 || definitionPl.length > 2000) throw new BadRequestException('Wyjaśnienia muszą mieć od 1 do 2000 znaków.');
    let current: LexicalSense | null;
    try { current = await this.prisma.lexicalSense.findUnique({ where: { id } }); }
    catch { throw new ServiceUnavailableException('Baza danych jest chwilowo niedostępna. Spróbuj ponownie.'); }
    if (!current) throw new NotFoundException('Nie znaleziono LexicalSense.');
    const details = parseStored(current);
    if (!details) throw new BadRequestException('Ten LexicalSense nie ma poprawnego pełnego JSON-a i nie może być edytowany na tej stronie.');
    const updatedDetails = { ...details, definition_it: definitionIt, definition_pl: definitionPl };
    if (!validateSense(updatedDetails)) throw new BadRequestException('Zmienione wyjaśnienie nie spełnia kontraktu LexicalSense.');
    try {
      const updated = await this.prisma.lexicalSense.update({ where: { id }, data: {
        definition: definitionIt, detailsJson: JSON.stringify(updatedDetails), identityKey: identity(updatedDetails),
      } });
      return { ...publicSense(updated), createdAt: updated.createdAt, editable: true };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('Takie znaczenie jest już zapisane.');
      throw new ServiceUnavailableException('Nie udało się zapisać zmian. Spróbuj ponownie.');
    }
  }

  async remove(id: string): Promise<{ id: string }> {
    try {
      await this.prisma.lexicalSense.delete({ where: { id } });
      return { id };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') throw new NotFoundException('Nie znaleziono LexicalSense.');
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') throw new ConflictException('Nie można usunąć znaczenia powiązanego z zadaniami lub powtórkami.');
      throw new ServiceUnavailableException('Nie udało się usunąć znaczenia. Spróbuj ponownie.');
    }
  }

  private verifiedItems(body: { checkId?: unknown; items?: unknown }): string[] {
    const items = this.cleanItems(body?.items);
    const checked = typeof body.checkId === 'string' ? this.checks.get(body.checkId) : undefined;
    if (!checked || checked.expires < Date.now() || JSON.stringify(checked.items) !== JSON.stringify(items)) {
      throw new BadRequestException('Lista zmieniła się lub sprawdzenie wygasło. Sprawdź ją ponownie.');
    }
    return items;
  }

  async generate(body: { checkId?: unknown; items?: unknown }): Promise<Record<string, unknown>> {
    this.pruneExpired();
    const items = this.verifiedItems(body);
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new BadGatewayException('Brak konfiguracji OpenAI na serwerze.');
    let existing: Record<string, unknown>[];
    try { existing = (await this.existingFor(items)).map(publicSense); }
    catch { throw new ServiceUnavailableException('Baza danych jest chwilowo niedostępna. Spróbuj ponownie.'); }
    let response: Response;
    try {
      response = await fetch(process.env.OPENAI_RESPONSES_URL || 'https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-5', instructions,
          input: JSON.stringify({ items, existing_senses: existing, guidance: 'Nie powtarzaj istniejących znaczeń; zwróć nowe odczytania oraz coverage i deferred.' }),
          tools: [{ type: 'web_search' }], tool_choice: 'required', text: { format: responseFormat },
        }),
        signal: AbortSignal.timeout(180_000),
      });
    } catch (error) {
      const detail = error instanceof Error ? { name: error.name, message: error.message, cause: error.cause } : error;
      console.error('[OpenAI generation connection failure]', detail);
      throw new BadGatewayException('Nie udało się połączyć z OpenAI. Spróbuj ponownie.');
    }
    if (!response.ok) {
      let body: unknown;
      try { body = await response.json(); } catch { body = undefined; }
      console.error('[OpenAI generation API failure]', { status: response.status, response: body });
      throw openAiFailure(response.status, body);
    }
    let raw: unknown;
    try { raw = await response.json(); } catch { throw new BadGatewayException('OpenAI zwróciło nieczytelną odpowiedź.'); }
    console.info('[OpenAI generation response]', { status: response.status, response: raw });
    const output = raw as { output_text?: string; output?: Array<{ type?: string; status?: string; content?: Array<{ type?: string; text?: string }> }> };
    if (!output.output?.some((item) => item.type === 'web_search_call' && item.status === 'completed')) {
      await this.rejectGeneratedResponse('OpenAI nie potwierdziło wyszukiwania źródeł. Wynik nie został przyjęty.', raw, ['Brak zakończonego `web_search_call`.']);
    }
    const text = output.output_text || output.output?.flatMap((item) => item.content || []).filter((item) => item.type === 'output_text').map((item) => item.text).join('');
    let batch: unknown;
    try { batch = JSON.parse(text || ''); } catch { await this.rejectGeneratedResponse('OpenAI zwróciło niepoprawny JSON.', raw, ['Pole `output_text` nie jest poprawnym JSON-em.']); }
    if (!validateBatch(batch)) await this.rejectGeneratedResponse('Odpowiedź OpenAI nie spełnia kontraktu partii.', raw, validateBatch.errors || []);
    const validBatch = batch as BatchResult;
    const resultId = await this.storeGenerationResult(validBatch);
    const validationWarnings = validBatch.lexical_senses.flatMap((record, index) => {
      const warnings = evidenceFailures(record);
      return warnings.length ? [{ recordIndex: index, lexicalItem: record.lexical_item_it, warnings }] : [];
    });
    const coveredInputs = new Set(validBatch.coverage.map((item) => normalize(String(item.matched_input_form_it || item.input_form_it || item.lexical_item_it || ''))));
    if (items.some((item) => !coveredInputs.has(normalize(item)))) {
      await this.rejectGeneratedResponse('Odpowiedź OpenAI nie opisuje zakresu analizy wszystkich wejść.', raw, ['Brakuje wpisu `coverage` dla co najmniej jednej pozycji wejściowej.'], resultId);
    }
    if (new Set(validBatch.lexical_senses.map(identity)).size !== validBatch.lexical_senses.length) {
      await this.rejectGeneratedResponse('OpenAI zwróciło powtórzone znaczenia.', raw, ['W odpowiedzi występuje zduplikowana tożsamość znaczenia.'], resultId);
    }
    let related: LexicalSense[];
    try { related = await this.existingFor(validBatch.lexical_senses.map((record) => record.lexical_item_it).filter((item, index, all) => all.indexOf(item) === index)); }
    catch { throw new ServiceUnavailableException('Baza danych jest chwilowo niedostępna. Spróbuj ponownie.'); }
    const matches = validBatch.lexical_senses.map((record) => related.filter((stored) => sameItem(stored, record)).map((stored) => ({
      ...publicSense(stored), equivalent: equivalent(stored, record), possible: possiblyEquivalent(stored, record),
    })));
    const draftId = randomUUID();
    this.drafts.set(draftId, { records: validBatch.lexical_senses, expires: Date.now() + 60 * 60_000 });
    await this.markGenerationResult(resultId, validationWarnings.length ? 'accepted_with_warnings' : 'accepted', validationWarnings.length ? validationWarnings : undefined);
    return { draftId, ...validBatch, matches, validationWarnings };
  }

  async save(body: { draftId?: unknown; selected?: unknown }): Promise<{ results: Array<Record<string, unknown>> }> {
    const draft = typeof body?.draftId === 'string' ? this.drafts.get(body.draftId) : undefined;
    if (!draft || draft.expires < Date.now()) throw new BadRequestException('Wynik generowania wygasł. Wygeneruj go ponownie.');
    if (!Array.isArray(body.selected) || body.selected.length < 1 || body.selected.length > draft.records.length) throw new BadRequestException('Wybierz co najmniej jeden poprawny LexicalSense.');
    const selected = body.selected as Selection[];
    if (selected.some((item) => !Number.isInteger(item?.index) || item.index < 0 || item.index >= draft.records.length || typeof item.definition_pl !== 'string' || !item.definition_pl.trim() || item.definition_pl.length > 2000 || (item.confirmedDistinct !== undefined && typeof item.confirmedDistinct !== 'boolean')) || new Set(selected.map((item) => item.index)).size !== selected.length) {
      throw new BadRequestException('Wybór lub polskie objaśnienie są niepoprawne.');
    }
    const results: Array<Record<string, unknown>> = [];
    for (const item of selected) {
      const record = { ...draft.records[item.index], definition_pl: item.definition_pl.trim() };
      if (!validateSense(record)) throw new BadRequestException('Poprawiony LexicalSense nie spełnia schematu.');
      const key = identity(record);
      try {
        const result = await this.prisma.$transaction(async (tx) => {
          const candidates = await tx.lexicalSense.findMany({ where: { language: 'it' } });
          const duplicate = candidates.find((candidate) => equivalent(candidate, record));
          if (duplicate) return { index: item.index, status: 'conflict', id: duplicate.id };
          const possible = candidates.filter((candidate) => possiblyEquivalent(candidate, record));
          if (possible.length && !item.confirmedDistinct) return { index: item.index, status: 'review_required', existing: possible.map(publicSense) };
          const stored = await tx.lexicalSense.create({ data: {
            language: record.language, lexicalItem: record.lexical_item_it, definition: record.definition_it,
            detailsJson: JSON.stringify(record), identityKey: key,
          } });
          return { index: item.index, status: 'saved', id: stored.id };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        results.push(result);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === 'P2002' || error.code === 'P2034')) {
          results.push({ index: item.index, status: 'conflict' });
        } else throw new ServiceUnavailableException('Nie udało się zapisać do bazy. Spróbuj ponownie.');
      }
    }
    return { results };
  }
}
