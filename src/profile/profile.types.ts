export interface ProfileAssessment {
  assessed_at: string | null;
  source: string;
  method: string;
  evidence_count: number;
  evidence_window_start: string | null;
  evidence_window_end: string | null;
  algorithm_version: string | null;
}

export type TaskType = 'fill_blank';

export interface ProfileDifficulty {
  code: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  contexts: Array<{
    task_type: TaskType;
    grammar_context: string;
    communication_context: string;
  }>;
  evidence: Array<{
    activity_id: string;
    item_id: string;
    observed_at: string;
    task_type: TaskType;
    expected_answer: string;
    learner_answer: string;
  }>;
}

export interface Competency {
  taxonomy_node_id: string;
  alpha: number;
  beta: number;
  mastery: number;
  confidence: number;
  trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  trend_state: {
    previous_mastery: number | null;
    smoothed_delta: number;
    assessable_updates: number;
  };
  exposure: {
    tasks_shown: number;
    tasks_attempted: number;
    last_shown_at: string | null;
    task_types_seen: TaskType[];
  };
  performance: {
    first_attempts: number;
    first_attempt_correct: number;
    last_attempt_at: string | null;
  };
  difficulties: ProfileDifficulty[];
  assessment: ProfileAssessment;
}

export interface CompetenceProfile {
  schema_version: string;
  profile_id: string;
  learner_id: string;
  language: string;
  taxonomy: {
    id: string;
    schema_version: string;
    sha256: string;
    uri: string;
  };
  bayesian_model: {
    prior_alpha: number;
    prior_beta: number;
    confidence_scale: number;
    diagnostic_weights: {
      direct: number;
      indirect: number;
      not_assessable: number;
    };
    trend_ema_factor: number;
    trend_threshold: number;
    trend_min_effective_n: number;
  };
  estimated_user_level: {
    cefr_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | null;
    confidence: number;
    assessment: {
      assessed_at: string | null;
      source: string;
      method: string;
      evidence_count: number;
      algorithm_version: string | null;
    };
  };
  created_at: string;
  updated_at: string;
  competencies: Competency[];
}
