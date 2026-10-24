export interface Category {
  id: string;
  name: string;
}

export interface Construction {
  id: string;
  category_id: string;
  name: string;
}

export interface Variant {
  id: string;
  construction_id: string;
  name: string;
  slug: string;
  definition: string;
  cefr?: {
    reference_level: string;
    level_range: { from: string; to: string };
    focus: string;
    description: string;
    mapping_status: string;
    [key: string]: unknown;
  };
  operational_profile?: Record<string, unknown>;
}

export interface Relation {
  source_id: string;
  target_id: string;
  type: string;
}

export interface Taxonomy {
  schema_version: string;
  language: string;
  categories: Category[];
  constructions: Construction[];
  variants: Variant[];
  relations: Relation[];
  metadata: Record<string, unknown>;
}
