import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Module, RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { NestFactory } from '@nestjs/core';
import Ajv2020 from 'ajv/dist/2020';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ExerciseGenerationInputController } from '../src/exercise-generation-input/exercise-generation-input.controller';
import { ExerciseGenerationInputService } from '../src/exercise-generation-input/exercise-generation-input.service';

const details = {
  part_of_speech: 'noun', definition_pl: 'most',
  usage: { register: 'neutral', patterns_it: [], collocations_it: ['il ponte di pietra'], constraints_pl: [] },
  examples: [{ sentence_it: 'Attraverso il ponte.', translation_pl: 'Przechodzę przez most.', origin: 'authored' }],
  evidence: { e1: { source_type: 'dictionary', locator: 'https://example.org', supports: ['meaning'] } },
};
const record = (id: string, detailsJson = JSON.stringify(details)) => ({
  id, language: 'it', lexicalItem: `ponte ${id}`, definition: 'struttura per attraversare', detailsJson,
});

test('prepares schema-valid exercise input in requested order without provenance fields', async () => {
  const prisma = { lexicalSense: { findMany: async () => [record('sense-a'), record('sense-b')] } };
  const service = new ExerciseGenerationInputService(prisma as never);
  const result = await service.prepare(['sense-b', 'sense-a']);
  assert.deepEqual(Object.keys(result), ['lexical_senses']);
  assert.deepEqual(result.lexical_senses.map((sense) => sense.id), ['sense-b', 'sense-a']);
  assert.deepEqual(result.lexical_senses[0].examples_it, ['Attraverso il ponte.']);
  assert.equal('evidence' in result.lexical_senses[0], false);
  assert.equal('glosses_pl' in result.lexical_senses[0], false);

  const schema = JSON.parse(readFileSync(join(process.cwd(), '.ai/docs/generate-lexical-exercises/references/lexical_sense_input.schema.json'), 'utf8'));
  const validate = new Ajv2020().compile(schema);
  for (const sense of result.lexical_senses) assert.equal(validate(sense), true, JSON.stringify(validate.errors));
});

test('rejects invalid IDs, missing senses and incomplete stored details', async () => {
  const prisma = { lexicalSense: { findMany: async () => [record('sense-a')] } };
  const service = new ExerciseGenerationInputService(prisma as never);
  await assert.rejects(service.prepare([]), { status: 400 });
  await assert.rejects(service.prepare(['sense-a', 'sense-a']), { status: 400 });
  await assert.rejects(service.prepare(['sense-a', 'missing']), { status: 404 });
  const incomplete = new ExerciseGenerationInputService(
    { lexicalSense: { findMany: async () => [record('sense-a', '{')] } } as never,
  );
  await assert.rejects(incomplete.prepare(['sense-a']), { status: 422 });
});

@Module({
  controllers: [ExerciseGenerationInputController],
  providers: [{ provide: ExerciseGenerationInputService, useValue: { prepare: async (ids: string[]) => ({ lexical_senses: ids }) } }],
})
class InputEndpointTestModule {}

test('registers the read-only input route and injects its service', async () => {
  const app = await NestFactory.createApplicationContext(InputEndpointTestModule, { logger: false });
  try {
    const controller = app.get(ExerciseGenerationInputController);
    assert.equal(Reflect.getMetadata(PATH_METADATA, ExerciseGenerationInputController), 'api/lexical-senses');
    assert.equal(Reflect.getMetadata(PATH_METADATA, controller.prepare), 'exercise-generation-input');
    assert.equal(Reflect.getMetadata(METHOD_METADATA, controller.prepare), RequestMethod.POST);
    assert.deepEqual(await controller.prepare({ ids: ['sense-a'] }), { lexical_senses: ['sense-a'] });
  } finally {
    await app.close();
  }
});
