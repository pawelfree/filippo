import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LexicalSensesService } from '../src/lexical-senses/lexical-senses.service';

const details = {
  schema_version: '3.0.0', lexical_item_it: 'ponte', language: 'it', part_of_speech: 'noun',
  definition_it: 'struttura per attraversare', definition_pl: 'most', glosses_pl: ['most'],
  usage: { register: 'neutral', patterns_it: [], collocations_it: [], constraints_pl: [] },
  examples: [{ sentence_it: 'Attraverso il ponte.', translation_pl: 'Przechodzę przez most.', origin: 'authored' }],
  evidence: { e1: { source_type: 'dictionary', locator: 'https://example.org/dizionario', supports: ['meaning', 'part_of_speech', 'register'] } },
};

test('lists, edits, and removes a stored LexicalSense', async () => {
  const stored = {
    id: 'sense-1', language: 'it', lexicalItem: 'ponte', definition: details.definition_it,
    detailsJson: JSON.stringify(details), identityKey: null, createdAt: new Date('2026-10-25T00:00:00Z'), updatedAt: new Date(), tasks: [], fsrsStates: [],
  };
  const updates: Array<Record<string, unknown>> = [];
  let deleted = false;
  const prisma = {
    lexicalSense: {
      findMany: async () => [stored],
      findUnique: async () => stored,
      update: async ({ data }: { data: Record<string, unknown> }) => { updates.push(data); return { ...stored, ...data }; },
      delete: async () => { deleted = true; return stored; },
    },
  };
  const service = new LexicalSensesService(prisma as never);

  const listed = await service.list();
  assert.equal(listed.length, 1);
  assert.equal(listed[0].definition_pl, 'most');

  const updated = await service.update('sense-1', { definition_it: 'costruzione per superare un ostacolo', definition_pl: 'konstrukcja do pokonania przeszkody' });
  assert.equal(updated.definition_it, 'costruzione per superare un ostacolo');
  assert.equal(updated.definition_pl, 'konstrukcja do pokonania przeszkody');
  const storedDetails = JSON.parse(String(updates[0].detailsJson));
  assert.equal(storedDetails.definition_it, 'costruzione per superare un ostacolo');
  assert.equal(storedDetails.definition_pl, 'konstrukcja do pokonania przeszkody');
  assert.equal(typeof updates[0].identityKey, 'string');

  assert.deepEqual(await service.remove('sense-1'), { id: 'sense-1' });
  assert.equal(deleted, true);
});
