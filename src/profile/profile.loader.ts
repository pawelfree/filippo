import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import type { Taxonomy } from '../taxonomy/taxonomy.types';
import type { CompetenceProfile } from './profile.types';

const dataDirectory = join(process.cwd(), '.ai', 'docs', 'competence_profile');
const taxonomyDataPath = join(process.cwd(), '.ai', 'docs', 'grammar_taxonomy', 'taxonomy.json');

export function loadCompetenceProfile(
  taxonomy: Taxonomy,
  directory = dataDirectory,
  taxonomyPath = taxonomyDataPath,
): CompetenceProfile {
  const schema = JSON.parse(readFileSync(join(directory, 'profile.schema.json'), 'utf8')) as object;
  const data: unknown = JSON.parse(readFileSync(join(directory, 'profile.json'), 'utf8'));
  // The profile schema uses valid conditional subschemas that inherit object shape from their parent.
  const ajv = new Ajv2020({ allErrors: true, strictTypes: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  if (!validate(data)) {
    const details = (validate.errors ?? [])
      .map((error) => `${error.instancePath || '/'} ${error.message ?? 'is invalid'}`)
      .join('\n');
    throw new Error(`Competence profile does not match profile.schema.json:\n${details}`);
  }

  const profile = data as CompetenceProfile;
  const taxonomyBytes = readFileSync(taxonomyPath);
  const taxonomyHash = createHash('sha256').update(taxonomyBytes).digest('hex');
  const consistencyErrors: string[] = [];

  if (profile.taxonomy.schema_version !== taxonomy.schema_version) {
    consistencyErrors.push(
      `Profile refers to taxonomy schema ${profile.taxonomy.schema_version}; loaded taxonomy is ${taxonomy.schema_version}.`,
    );
  }
  if (profile.taxonomy.sha256 !== taxonomyHash) {
    consistencyErrors.push(
      `Profile taxonomy SHA-256 is ${profile.taxonomy.sha256}; current taxonomy SHA-256 is ${taxonomyHash}.`,
    );
  }

  const expectedIds = new Set(taxonomy.variants.map((variant) => variant.id));
  const actualIds = profile.competencies.map((competency) => competency.taxonomy_node_id);
  const actualIdSet = new Set(actualIds);
  const duplicates = actualIds.filter((id, index) => actualIds.indexOf(id) !== index);
  const missing = [...expectedIds].filter((id) => !actualIdSet.has(id));
  const extra = [...actualIdSet].filter((id) => !expectedIds.has(id));
  if (duplicates.length || missing.length || extra.length) {
    consistencyErrors.push(
      `Competency IDs do not match taxonomy variants (duplicates: ${duplicates.join(', ') || 'none'}; missing: ${missing.join(', ') || 'none'}; unknown: ${extra.join(', ') || 'none'}).`,
    );
  }

  for (const competency of profile.competencies) {
    const { exposure, performance } = competency;
    const issues: string[] = [];
    const model = profile.bayesian_model;
    const effectiveN = competency.alpha + competency.beta - model.prior_alpha - model.prior_beta;
    const expectedMastery = competency.alpha / (competency.alpha + competency.beta);
    const expectedConfidence = effectiveN / (effectiveN + model.confidence_scale);
    const expectedTrend = effectiveN < model.trend_min_effective_n
      ? 'insufficient_data'
      : competency.trend_state.smoothed_delta > model.trend_threshold
        ? 'improving'
        : competency.trend_state.smoothed_delta < -model.trend_threshold
          ? 'declining'
          : 'stable';

    if (exposure.tasks_attempted > exposure.tasks_shown) issues.push('attempted tasks exceed shown tasks');
    if (performance.first_attempts > exposure.tasks_attempted) issues.push('graded attempts exceed attempted tasks');
    if (performance.first_attempt_correct > performance.first_attempts) issues.push('correct attempts exceed graded attempts');
    if (effectiveN < -1e-9) issues.push('effective evidence is below zero');
    if (Math.abs(competency.mastery - expectedMastery) > 1e-9) issues.push('mastery does not match alpha / (alpha + beta)');
    if (Math.abs(competency.confidence - expectedConfidence) > 1e-9) issues.push('confidence does not match effective evidence and confidence scale');
    if (competency.trend !== expectedTrend) issues.push(`trend does not match model state (expected ${expectedTrend})`);
    if (competency.trend_state.assessable_updates !== competency.assessment.evidence_count) {
      issues.push('trend updates and assessment evidence count differ');
    }
    if ((competency.trend_state.assessable_updates === 0) !== (competency.trend_state.previous_mastery === null)) {
      issues.push('previous mastery must be null only before the first assessable update');
    }
    if (issues.length) consistencyErrors.push(`${competency.taxonomy_node_id}: ${issues.join('; ')}.`);
  }

  if (consistencyErrors.length) {
    throw new Error(`Competence profile is inconsistent with the active taxonomy or its own counts:\n${consistencyErrors.join('\n')}`);
  }

  return profile;
}
