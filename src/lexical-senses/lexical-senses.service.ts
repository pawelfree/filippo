import { BadGatewayException, BadRequestException, Injectable, Inject, ServiceUnavailableException } from '@nestjs/common';
import { Prisma, type LexicalSense } from '@prisma/client';
import Ajv2020 from 'ajv/dist/2020';
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
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
export class LexicalSensesService {
  private readonly checks = new Map<string, { items: string[]; expires: number }>();
  private readonly drafts = new Map<string, { records: SenseRecord[]; expires: number }>();

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

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
    } catch {
      throw new BadGatewayException('Nie udało się połączyć z OpenAI. Spróbuj ponownie.');
    }
    if (!response.ok) throw new BadGatewayException(`OpenAI zwróciło błąd (${response.status}). Spróbuj ponownie.`);
    let raw: unknown;
    try { raw = await response.json(); } catch { throw new BadGatewayException('OpenAI zwróciło nieczytelną odpowiedź.'); }
    const output = raw as { output_text?: string; output?: Array<{ type?: string; status?: string; content?: Array<{ type?: string; text?: string }> }> };
    if (!output.output?.some((item) => item.type === 'web_search_call' && item.status === 'completed')) {
      throw new BadGatewayException('OpenAI nie potwierdziło wyszukiwania źródeł. Wynik nie został przyjęty.');
    }
    const text = output.output_text || output.output?.flatMap((item) => item.content || []).filter((item) => item.type === 'output_text').map((item) => item.text).join('');
    let batch: unknown;
    try { batch = JSON.parse(text || ''); } catch { throw new BadGatewayException('OpenAI zwróciło niepoprawny JSON.'); }
    if (!validateBatch(batch)) throw new BadGatewayException('Odpowiedź OpenAI nie spełnia kontraktu partii.');
    for (const record of batch.lexical_senses) {
      if (!validateSense(record) || !record.examples.every((example) => example.origin !== 'attested' || (example.evidence_id && record.evidence[example.evidence_id]))) {
        throw new BadGatewayException('Wygenerowany LexicalSense nie spełnia reguł skilla.');
      }
      const evidence = Object.values(record.evidence);
      const supports = (claim: string) => evidence.some((entry) => entry.supports.includes(claim));
      if (!supports('meaning') || !supports('part_of_speech') ||
          (record.usage.register !== 'unknown' && !supports('register')) ||
          (record.usage.patterns_it.length > 0 && !supports('pattern')) ||
          (record.usage.constraints_pl.length > 0 && !supports('constraint')) ||
          record.examples.some((example) => example.origin === 'attested' && (!example.evidence_id || !record.evidence[example.evidence_id]?.supports.includes('example'))) ||
          evidence.some((entry) => ['dictionary', 'corpus', 'lexical_database'].includes(entry.source_type) && !/^https?:\/\//i.test(entry.locator))) {
        throw new BadGatewayException('Wygenerowany LexicalSense nie ma wystarczających dowodów dla swoich twierdzeń.');
      }
    }
    const coveredInputs = new Set(batch.coverage.map((item) => normalize(String(item.matched_input_form_it || item.input_form_it || item.lexical_item_it || ''))));
    if (items.some((item) => !coveredInputs.has(normalize(item)))) {
      throw new BadGatewayException('Odpowiedź OpenAI nie opisuje zakresu analizy wszystkich wejść.');
    }
    if (new Set(batch.lexical_senses.map(identity)).size !== batch.lexical_senses.length) {
      throw new BadGatewayException('OpenAI zwróciło powtórzone znaczenia.');
    }
    let related: LexicalSense[];
    try { related = await this.existingFor(batch.lexical_senses.map((record) => record.lexical_item_it).filter((item, index, all) => all.indexOf(item) === index)); }
    catch { throw new ServiceUnavailableException('Baza danych jest chwilowo niedostępna. Spróbuj ponownie.'); }
    const matches = batch.lexical_senses.map((record) => related.filter((stored) => sameItem(stored, record)).map((stored) => ({
      ...publicSense(stored), equivalent: equivalent(stored, record), possible: possiblyEquivalent(stored, record),
    })));
    const draftId = randomUUID();
    this.drafts.set(draftId, { records: batch.lexical_senses, expires: Date.now() + 60 * 60_000 });
    return { draftId, ...batch, matches };
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
