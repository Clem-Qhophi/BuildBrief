

/** One evidence excerpt offered to the model. Already redacted + size-capped by the caller. */
export interface EvidenceExcerpt {
  evidence_id: string;
  path?: string;
  line_start?: number;
  line_end?: number;
  tier: string;
  excerpt: string;
}

export interface AssessmentInput {
  criterion_id: string;
  criterion_text: string;
  negative: boolean;
  /** Concrete forbidden patterns for negative criteria (empty when unrecorded). */
  forbidden_terms: string[];
  revision: string;
  excerpts: EvidenceExcerpt[];
  /** True when the retrieval scope was provably exhaustive (router registries, etc.). */
  search_exhaustive: boolean;
}

export interface ModelUsage {
  provider: string;
  model: string;
  prompt_version: string;
  prompt_hash: string;
  input_tokens?: number;
  output_tokens?: number;
  latency_ms: number;
}

/**
 * What the model returns: a verdict over evidence IDs. The verifier re-attaches
 * full evidence pointers and runs mechanical citation resolution + adjudication.
 * The model NEVER supplies file paths or line numbers — only ids it was given.
 */
export interface ModelVerdict {
  criterion_id: string;
  finding: 'supported' | 'partial' | 'contradicted' | 'not_established' | 'not_applicable';
  evidence_ids: string[];
  coverage: { examined_files: number; relevant_files: number; gaps: string[]; negative_search_sufficient: boolean };
  confidence: number;
  rationale: string;
  missing_proof: string[];
}

export interface AssessmentOutput {
  verdicts: ModelVerdict[];
  usage: ModelUsage;
}

const MODEL_FINDINGS = ['supported', 'partial', 'contradicted', 'not_established', 'not_applicable'] as const;

export function validateModelVerdict(v: unknown): { ok: true; value: ModelVerdict } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (typeof v !== 'object' || v === null) return { ok: false, errors: ['verdict must be an object'] };
  const r = v as Record<string, unknown>;
  if (typeof r['criterion_id'] !== 'string' || r['criterion_id'].length === 0) errors.push('criterion_id required');
  if (typeof r['finding'] !== 'string' || !(MODEL_FINDINGS as readonly string[]).includes(r['finding'])) {
    errors.push('finding: unknown Finding');
  }
  // Unknown ids are tolerated here (dropped at attach time); non-string ids are not.
  if (!Array.isArray(r['evidence_ids']) || !r['evidence_ids'].every((e) => typeof e === 'string')) {
    errors.push('evidence_ids: string[] required');
  }
  const cov = r['coverage'] as Record<string, unknown> | undefined;
  if (
    typeof cov !== 'object' || cov === null ||
    typeof cov['examined_files'] !== 'number' || typeof cov['relevant_files'] !== 'number' ||
    !Array.isArray(cov['gaps']) || typeof cov['negative_search_sufficient'] !== 'boolean'
  ) {
    errors.push('coverage: {examined_files, relevant_files, gaps, negative_search_sufficient} required');
  }
  if (typeof r['confidence'] !== 'number' || !Number.isFinite(r['confidence']) || r['confidence'] < 0 || r['confidence'] > 1) {
    errors.push('confidence: 0..1 required');
  }
  if (typeof r['rationale'] !== 'string' || r['rationale'].length === 0) errors.push('rationale required');
  if (!Array.isArray(r['missing_proof']) || !r['missing_proof'].every((e) => typeof e === 'string')) {
    errors.push('missing_proof: string[] required');
  }
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: v as unknown as ModelVerdict };
}

export interface ModelProvider {
  readonly name: string;
  readonly model: string;
  assess(input: AssessmentInput): Promise<AssessmentOutput>;
}

export class ModelError extends Error {
  constructor(
    message: string,
    readonly kind: 'auth' | 'rate_limit' | 'transport' | 'schema' | 'config',
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'ModelError';
  }
}
