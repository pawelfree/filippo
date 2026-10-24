import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020';
import type { Taxonomy } from './taxonomy.types';

const dataDirectory = join(process.cwd(), '.ai', 'docs', 'grammar_taxonomy');

export function loadTaxonomy(directory = dataDirectory): Taxonomy {
  const schema = JSON.parse(readFileSync(join(directory, 'taxonomy.schema.json'), 'utf8')) as object;
  const data: unknown = JSON.parse(readFileSync(join(directory, 'taxonomy.json'), 'utf8'));
  const ajv = new Ajv2020({ allErrors: true });
  const validate = ajv.compile(schema);

  if (!validate(data)) {
    const details = (validate.errors ?? [])
      .map((error) => `${error.instancePath || '/'} ${error.message ?? 'is invalid'}`)
      .join('\n');
    throw new Error(`Taxonomy does not match taxonomy.schema.json:\n${details}`);
  }

  return data as Taxonomy;
}
