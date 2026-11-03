type RecordValue = Record<string, any>;

function projectCefr(cefr: RecordValue): RecordValue {
  return {
    reference_level: cefr.reference_level,
    focus: cefr.focus,
    ...(cefr.aspects ? {
      aspects: cefr.aspects.map((aspect: RecordValue) => ({
        aspect_id: aspect.aspect_id,
        title: aspect.title,
        reference_level: aspect.reference_level,
        focus: aspect.focus,
        description: aspect.description,
      })),
    } : {}),
  };
}

function projectOperationalProfile(profile: RecordValue): RecordValue {
  return {
    phenomenon_type: profile.phenomenon_type,
    annotation: profile.annotation,
    ...(profile.rule_cases_scope ? { rule_cases_scope: profile.rule_cases_scope } : {}),
    ...(profile.more_specific_annotation_targets ? { more_specific_annotation_targets: profile.more_specific_annotation_targets } : {}),
    ...(profile.rule_cases ? {
      rule_cases: profile.rule_cases.map((item: RecordValue) => ({
        case_id: item.case_id,
        title: item.title,
        conditions: item.conditions,
        excluded_contexts: item.excluded_contexts,
        rule: item.rule,
        rule_status: item.rule_status,
        agreement_controller: item.agreement_controller,
        cefr: projectCefr(item.cefr),
      })),
    } : {}),
    ...(profile.normative_cases ? {
      normative_cases: profile.normative_cases.map((item: RecordValue) => ({
        case_id: item.case_id,
        construction: item.construction,
        classification_note: item.classification_note,
        normative_status: item.normative_status,
        cefr: projectCefr(item.cefr),
      })),
    } : {}),
  };
}

export function projectTaxonomyForGeneration(taxonomy: RecordValue, fullFileSha256: string) {
  return {
    schema_version: taxonomy.schema_version,
    language: taxonomy.language,
    full_file_sha256: fullFileSha256,
    categories: taxonomy.categories.map((item: RecordValue) => ({ id: item.id, name: item.name })),
    constructions: taxonomy.constructions.map((item: RecordValue) => ({ id: item.id, category_id: item.category_id, name: item.name })),
    variants: taxonomy.variants.map((item: RecordValue) => ({
      id: item.id,
      construction_id: item.construction_id,
      name: item.name,
      definition: item.definition,
      cefr: projectCefr(item.cefr),
      ...(item.operational_profile ? { operational_profile: projectOperationalProfile(item.operational_profile) } : {}),
    })),
    relations: taxonomy.relations.map((item: RecordValue) => ({ source_id: item.source_id, target_id: item.target_id, type: item.type })),
  };
}
