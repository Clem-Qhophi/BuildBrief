/**
 * Canonical vocabularies. `missing` is intentionally NOT an internal finding —
 * it is a UI-only label for exhaustive-scope absence (blueprint §13.2).
 */
export const INTENT_KINDS = ['feature', 'constraint', 'non_goal', 'acceptance', 'business_rule'] as const;
export type IntentKind = (typeof INTENT_KINDS)[number];

export const INTENT_STATES = ['draft', 'clarification_needed', 'approved', 'superseded', 'withdrawn'] as const;
export type IntentState = (typeof INTENT_STATES)[number];

export const FINDINGS = ['supported', 'partial', 'contradicted', 'not_established', 'not_applicable'] as const;
export type Finding = (typeof FINDINGS)[number];

export const EVIDENCE_TIERS = ['E0_claim', 'E1_source', 'E2_test', 'E3_runtime', 'E4_production'] as const;
export type EvidenceTier = (typeof EVIDENCE_TIERS)[number];

export const CAPTURE_COMPLETENESS = [
  'hook_exact',
  'explicit_mcp',
  'transcript_import',
  'manual',
  'partial',
] as const;
export type CaptureCompleteness = (typeof CAPTURE_COMPLETENESS)[number];

export const DISPOSITIONS = ['explained', 'linked', 'approved', 'rejected', 'pending'] as const;
export type Disposition = (typeof DISPOSITIONS)[number];

export function isIntentKind(v: unknown): v is IntentKind {
  return typeof v === 'string' && (INTENT_KINDS as readonly string[]).includes(v);
}

export function isIntentState(v: unknown): v is IntentState {
  return typeof v === 'string' && (INTENT_STATES as readonly string[]).includes(v);
}

export function isFinding(v: unknown): v is Finding {
  return typeof v === 'string' && (FINDINGS as readonly string[]).includes(v);
}

export function isEvidenceTier(v: unknown): v is EvidenceTier {
  return typeof v === 'string' && (EVIDENCE_TIERS as readonly string[]).includes(v);
}

export function isCaptureCompleteness(v: unknown): v is CaptureCompleteness {
  return typeof v === 'string' && (CAPTURE_COMPLETENESS as readonly string[]).includes(v);
}

export function isDisposition(v: unknown): v is Disposition {
  return typeof v === 'string' && (DISPOSITIONS as readonly string[]).includes(v);
}

/** Numeric rank of an evidence tier — higher is stronger proof. E0=0 … E4=4. */
export function evidenceRank(tier: EvidenceTier): number {
  return EVIDENCE_TIERS.indexOf(tier);
}
