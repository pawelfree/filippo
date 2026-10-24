import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { loadTaxonomy } from '../src/taxonomy/taxonomy.loader';

const source = join(process.cwd(), '.ai', 'docs', 'grammar_taxonomy');

test('loads the repository taxonomy after schema validation', () => {
  const taxonomy = loadTaxonomy();
  assert.equal(taxonomy.schema_version, '1.3.0');
  assert.equal(taxonomy.categories.length, 16);
  assert.equal(taxonomy.variants.length, 348);
});

test('rejects taxonomy data that does not match its schema', () => {
  const directory = mkdtempSync(join(tmpdir(), 'filippo-taxonomy-'));
  try {
    const schema = readFileSync(join(source, 'taxonomy.schema.json'), 'utf8');
    const taxonomy = JSON.parse(readFileSync(join(source, 'taxonomy.json'), 'utf8'));
    taxonomy.schema_version = 'invalid';
    writeFileSync(join(directory, 'taxonomy.schema.json'), schema);
    writeFileSync(join(directory, 'taxonomy.json'), JSON.stringify(taxonomy));

    assert.throws(() => loadTaxonomy(directory), /Taxonomy does not match taxonomy\.schema\.json:[\s\S]*\/schema_version/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
