import {
  type CaptureCompleteness,
  type EvidenceTier,
  type IntentKind,
  type IntentState,
  isCaptureCompleteness,
  isIntentKind,
  isIntentState,
} from './vocab.js';

export interface IntentConstraint {
  rule: string;
  paths?: string[];
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface AtomicCriterion {
  id: string;
  text: string;
  /** Terms/symbols/routes a retriever should look for. Empty = vague criterion. */
  keywords: string[];
  /** True when the approval explicitly recorded that this criterion is negatively scoped
   *  ("must NOT …") rather than a positive obligation. */
  negative?: boolean;
  /**
   * Minimum evidence tier that can establish this criterion (default E1_source).
   * Claims about test behavior need E2, staging E3, production E4. A positive
   * verdict on weaker evidence is downgraded — source code is not runtime proof.
   */
  requires_tier?: EvidenceTier;
  /**
   * For negative criteria: the concrete forbidden patterns (code/text fragments)
   * whose presence contradicts the requirement. A negative criterion without
   * forbidden terms cannot be assessed beyond not_established — related code
   * merely sharing vocabulary is not a violation.
   */
  forbidden_terms?: string[];
}

export interface IntentVersion {
  id: string;
  project_id: string;
  feature_id: string;
  version: number;
  kind: IntentKind;
  state: IntentState;
  exact_source_text: string;
  source_hash: string;
  source_agent?: string;
  session_id?: string;
  captured_at: string;
  capture_completeness: CaptureCompleteness;
  normalized_text: string;
  criteria: AtomicCriterion[];
  non_goals: string[];
  constraints: IntentConstraint[];
  ambiguity_flags: string[];
  approved_by?: string;
  approved_at?: string;
  supersedes_id?: string;
  effective_from_revision?: string;
}

export type IntentTransitionError =
  | { code: 'BAD_STATE'; message: string }
  | { code: 'MISSING_ACTOR'; message: string }
  | { code: 'EMPTY_CONTRACT'; message: string }
  | { code: 'VERSION_MISMATCH'; message: string };

/** Allowed lifecycle edges. `approved` is terminal for a version (amend → new version). */
const EDGES: Record<IntentState, IntentState[]> = {
  draft: ['clarification_needed', 'approved', 'withdrawn'],
  clarification_needed: ['draft', 'approved', 'withdrawn'],
  approved: ['superseded', 'withdrawn'],
  superseded: [],
  withdrawn: [],
};

export function canTransition(from: IntentState, to: IntentState): boolean {
  return EDGES[from].includes(to);
}

export interface ApproveInput {
  intent: IntentVersion;
  actor: string;
  at?: string;
  effective_from_revision?: string;
}

/**
 * Owner approval materializes an immutable approved version.
 * Rules: only draft/clarification_needed → approved; actor required (never inferred
 * from agent text); contract must contain ≥1 criterion or ≥1 constraint.
 */
export function approveIntent(
  input: ApproveInput,
): { ok: true; intent: IntentVersion } | { ok: false; error: IntentTransitionError } {
  const { intent } = input;
  const actor = input.actor.trim();
  if (actor.length === 0) {
    return { ok: false, error: { code: 'MISSING_ACTOR', message: 'Approval requires an authenticated actor, never agent-inferred consent.' } };
  }
  if (intent.state !== 'draft' && intent.state !== 'clarification_needed') {
    return { ok: false, error: { code: 'BAD_STATE', message: `Cannot approve from state '${intent.state}'. Only draft or clarification_needed versions are approvable.` } };
  }
  if (intent.criteria.length === 0 && intent.constraints.length === 0) {
    return { ok: false, error: { code: 'EMPTY_CONTRACT', message: 'Cannot approve an intent with no criteria and no constraints.' } };
  }
  const at = input.at ?? new Date().toISOString();
  const next: IntentVersion = {
    ...intent,
    state: 'approved',
    approved_by: actor,
    approved_at: at,
    ...(input.effective_from_revision !== undefined
      ? { effective_from_revision: input.effective_from_revision }
      : {}),
  };
  return { ok: true, intent: next };
}

/**
 * Amendment never mutates: it retires the old version and births version N+1 in draft.
 */
export function amendIntent(
  current: IntentVersion,
  mutate: (draft: IntentVersion) => IntentVersion,
  opts: { actor: string; at?: string },
): { ok: true; retired: IntentVersion; draft: IntentVersion } | { ok: false; error: IntentTransitionError } {
  if (opts.actor.trim().length === 0) {
    return { ok: false, error: { code: 'MISSING_ACTOR', message: 'Amendment requires an authenticated actor.' } };
  }
  if (current.state !== 'approved') {
    return { ok: false, error: { code: 'BAD_STATE', message: `Only approved versions can be amended (got '${current.state}').` } };
  }
  const at = opts.at ?? new Date().toISOString();
  const retired: IntentVersion = { ...current, state: 'superseded' };
  const base: IntentVersion = {
    ...current,
    state: 'draft',
    version: current.version + 1,
    supersedes_id: current.id,
    captured_at: at,
  };
  delete base.approved_by;
  delete base.approved_at;
  const draft = mutate({ ...base });
  return { ok: true, retired, draft };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

/** Runtime validation for untrusted payloads (MCP/hook/CLI boundaries). */
export function validateIntentVersion(v: unknown): { ok: true; value: IntentVersion } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!isRecord(v)) return { ok: false, errors: ['intent must be an object'] };
  if (typeof v['id'] !== 'string' || v['id'].length === 0) errors.push('id: nonempty string required');
  if (typeof v['project_id'] !== 'string' || v['project_id'].length === 0) errors.push('project_id: nonempty string required');
  if (typeof v['feature_id'] !== 'string' || v['feature_id'].length === 0) errors.push('feature_id: nonempty string required');
  if (typeof v['version'] !== 'number' || !Number.isInteger(v['version']) || v['version'] < 1) errors.push('version: positive integer required');
  if (!isIntentKind(v['kind'])) errors.push('kind: unknown IntentKind');
  if (!isIntentState(v['state'])) errors.push('state: unknown IntentState');
  if (typeof v['exact_source_text'] !== 'string' || v['exact_source_text'].length === 0) errors.push('exact_source_text: nonempty string required');
  if (typeof v['source_hash'] !== 'string' || !/^[0-9a-f]{64}$/.test(v['source_hash'])) errors.push('source_hash: sha256 hex required');
  if (typeof v['captured_at'] !== 'string' || Number.isNaN(Date.parse(v['captured_at']))) errors.push('captured_at: ISO timestamp required');
  if (!isCaptureCompleteness(v['capture_completeness'])) errors.push('capture_completeness: unknown value');
  if (typeof v['normalized_text'] !== 'string') errors.push('normalized_text: string required');
  if (!Array.isArray(v['criteria'])) errors.push('criteria: array required');
  else {
    v['criteria'].forEach((c: unknown, i: number) => {
      if (!isRecord(c) || typeof c['id'] !== 'string' || typeof c['text'] !== 'string' || !Array.isArray(c['keywords'])) {
        errors.push(`criteria[${i}]: {id,text,keywords[]} required`);
      }
    });
  }
  if (!Array.isArray(v['non_goals'])) errors.push('non_goals: array required');
  if (!Array.isArray(v['constraints'])) errors.push('constraints: array required');
  if (!Array.isArray(v['ambiguity_flags'])) errors.push('ambiguity_flags: array required');
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: v as unknown as IntentVersion };
}
