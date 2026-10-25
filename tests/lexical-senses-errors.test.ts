import assert from 'node:assert/strict';
import { HttpException } from '@nestjs/common';
import { test } from 'node:test';
import { LexicalSensesService } from '../src/lexical-senses/lexical-senses.service';

test('explains an exhausted OpenAI credit balance', async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  const previousUrl = process.env.OPENAI_RESPONSES_URL;
  const previousFetch = globalThis.fetch;
  process.env.OPENAI_API_KEY = 'test-key';
  process.env.OPENAI_RESPONSES_URL = 'https://openai.example.test/v1/responses';
  globalThis.fetch = async () => new Response(JSON.stringify({ error: { code: 'credit_balance_exhausted' } }), {
    status: 429, headers: { 'content-type': 'application/json' },
  });

  try {
    const service = new LexicalSensesService({ lexicalSense: { findMany: async () => [] } } as never);
    const checked = await service.check({ items: ['ponte'] });
    await assert.rejects(
      service.generate({ checkId: String(checked.checkId), items: ['ponte'] }),
      (error: unknown) => error instanceof HttpException
        && error.getStatus() === 429
        && String(error.getResponse()).includes('Wyczerpano środki API'),
    );
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
    if (previousUrl === undefined) delete process.env.OPENAI_RESPONSES_URL;
    else process.env.OPENAI_RESPONSES_URL = previousUrl;
  }
});

test('returns a LexicalSense with evidence warnings for user review', async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  const previousUrl = process.env.OPENAI_RESPONSES_URL;
  const previousFetch = globalThis.fetch;
  process.env.OPENAI_API_KEY = 'test-key';
  process.env.OPENAI_RESPONSES_URL = 'https://openai.example.test/v1/responses';
  const generated = {
    output: [{ type: 'web_search_call', status: 'completed' }],
    output_text: JSON.stringify({
      lexical_senses: [{
        schema_version: '3.0.0', lexical_item_it: 'ponte', language: 'it', part_of_speech: 'noun',
        definition_it: 'struttura per attraversare', definition_pl: 'most', glosses_pl: ['most'],
        usage: { register: 'neutral', patterns_it: [], collocations_it: [], constraints_pl: [] },
        examples: [{ sentence_it: 'Attraverso il ponte.', translation_pl: 'Przechodzę przez most.', origin: 'authored' }],
        evidence: { e1: { source_type: 'dictionary', locator: 'https://example.org/dizionario', supports: ['meaning'] } },
      }],
      deferred: [],
      coverage: [{ lexical_item_it: 'ponte', part_of_speech: 'noun', selection_basis: 'general_use', notes_pl: 'Sprawdzono użycie.' }],
    }),
  };
  globalThis.fetch = async () => new Response(JSON.stringify(generated), { status: 200, headers: { 'content-type': 'application/json' } });
  const created: Record<string, unknown>[] = [];
  const updated: Record<string, unknown>[] = [];
  const prisma = {
    lexicalSense: { findMany: async () => [] },
    openAiGenerationResult: {
      create: async ({ data }: { data: Record<string, unknown> }) => { created.push(data); return { id: 'result-1' }; },
      update: async ({ data }: { data: Record<string, unknown> }) => { updated.push(data); return { id: 'result-1' }; },
    },
  };

  try {
    const service = new LexicalSensesService(prisma as never);
    const checked = await service.check({ items: ['ponte'] });
    const result = await service.generate({ checkId: String(checked.checkId), items: ['ponte'] }) as { lexical_senses: unknown[]; validationWarnings: Array<{ recordIndex: number; warnings: string[] }> };
    assert.equal(result.lexical_senses.length, 1);
    assert.equal(result.validationWarnings[0].recordIndex, 0);
    assert.match(result.validationWarnings[0].warnings.join(' '), /part_of_speech/);
    assert.equal(created.length, 1);
    assert.match(String(created[0].resultJson), /lexical_senses/);
    assert.doesNotMatch(String(created[0].resultJson), /web_search_call/);
    assert.equal(updated[0].outcome, 'accepted_with_warnings');
    assert.match(String(updated[0].validationJson), /part_of_speech/);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
    if (previousUrl === undefined) delete process.env.OPENAI_RESPONSES_URL;
    else process.env.OPENAI_RESPONSES_URL = previousUrl;
  }
});
