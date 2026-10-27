import { type Coverage, type EvidencePointer } from './evidence.js';
import { type EvidenceTier, type Finding, evidenceRank, isFinding } from './vocab.js';

export interface VerificationFinding {
  id: string;
  project_id: string;
  requirement_version_id: string;
  criterion_id: string;
  checked_revision: string;
  finding: Finding;
  evidence_ids: string[];
  evidence_grade: EvidenceTier;
  coverage: Coverage;
  /** 0..1, always accompanied by rationale + missing_proof; never a proof substitute. */
  confidence: number;
  rationale: string;
  missing_proof: string[];
  provider: string;
  model: string;
  prompt_version: string;
  run_id: string;
  created_at: string;
  stale: boolean;
  human_disposition?: 'accepted' | 'rejected' | 'needs_review';
}

export interface ProposedVerdict {
  criterion_id: string;
  finding: Finding;
  evidence: EvidencePointer[];
  coverage: Coverage;
  confidence: number;
  rationale: string;
  missing_proof: string[];
}

/**
 * Adjudicator — deterministic downgrade rules applied AFTER any model assessment,
 * and used directly by the rule-based assessor. Each rule fires independently;
 * the weakest applicable outcome wins (contradicted > not_established > partial).
 *
 * 1. No evidence → not_established (never supported/partial from thin air).
 * 2. Any citation failing mechanical resolution → not_established.
 * 3. Claim of `supported`/`partial` requires ≥ E1 grade on real source/test evidence.
 * 4. `contradicted` requires ≥1 valid contradicting pointer; bare absence never contradicts.
 * 5. Production/runtime claims (E3/E4) on E1-or-lower evidence → not_established.
 * 6. Negative-scope "missing…" claims require negative_search_sufficient, else not_established.
 */
export interface AdjudicationContext {
  requiresTier?: EvidenceTier;
  /**
   * Set ONLY when a negative criterion faced a provably exhaustive clean search.
   * Absence is then evidence: the no-evidence and weak-grade downgrades are waived.
   */
  exhaustiveNegative?: boolean;
}

export function adjudicate(
  proposed: ProposedVerdict,
  citationResults: Map<string, boolean>,
  ctx: AdjudicationContext = {},
): { finding: Finding; reasons: string[]; grade: EvidenceTier } {
  const reasons: string[] = [];
  const requiresTier = ctx.requiresTier ?? 'E1_source';
  // Only a clean `supported` absence claim is rescuable; partial support of an
  // absence, or a contradiction without evidence, is still not_established.
  const absenceProven = ctx.exhaustiveNegative === true && proposed.finding === 'supported';
  let finding = proposed.finding;

  const valid = proposed.evidence.filter((e) => citationResults.get(e.id) === true);
  const invalid = proposed.evidence.filter((e) => citationResults.get(e.id) !== true);
  if (invalid.length > 0) {
    reasons.push(`${invalid.length} citation(s) failed mechanical resolution: ${invalid.map((e) => e.id).join(', ')}`);
  }

  const bestGrade: EvidenceTier = valid.length === 0
    ? 'E0_claim'
    : valid
        .map((e) => e.tier)
        .sort((a, b) => evidenceRank(b) - evidenceRank(a))[0] as EvidenceTier;

  if (!absenceProven && (proposed.evidence.length === 0 || valid.length === 0)) {
    if (finding !== 'not_established' && finding !== 'not_applicable') {
      reasons.push('no mechanically valid evidence; downgraded to not_established');
      finding = 'not_established';
    }
    return { finding, reasons, grade: bestGrade };
  }

  if (invalid.length > 0 && (finding === 'supported' || finding === 'partial')) {
    reasons.push('valid subset retained; positive claim requires all cited spans to resolve — downgraded to not_established');
    finding = 'not_established';
    return { finding, reasons, grade: bestGrade };
  }

  if (!absenceProven && (finding === 'supported' || finding === 'partial') && evidenceRank(bestGrade) < 1) {
    reasons.push('positive claim on E0 assertions only; downgraded to not_established');
    finding = 'not_established';
  }

  if (
    finding === 'contradicted' &&
    !valid.some((e) => /contradict|incompatible|violates|only (ui|client|front)/i.test(e.description))
  ) {
    reasons.push('contradiction asserted without incompatible evidence; downgraded to not_established');
    finding = 'not_established';
  }

  const claimsAbsence = /absent|missing|no (such|matching)|does not exist|nowhere/i.test(proposed.rationale);
  if (claimsAbsence && !proposed.coverage.negative_search_sufficient) {
    reasons.push('absence claimed without exhaustive search scope; downgraded to not_established');
    finding = 'not_established';
  }

  if (
    !absenceProven &&
    (finding === 'supported' || finding === 'partial') &&
    evidenceRank(bestGrade) < evidenceRank(requiresTier)
  ) {
    reasons.push(
      `positive claim on ${bestGrade} cannot satisfy required tier ${requiresTier} (source is not runtime proof); downgraded to not_established`,
    );
    finding = 'not_established';
  }

  return { finding, reasons, grade: bestGrade };
}

export function isValidConfidence(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1;
}

export function validateProposedVerdict(v: unknown): { ok: true; value: ProposedVerdict } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (typeof v !== 'object' || v === null) return { ok: false, errors: ['verdict must be an object'] };
  const r = v as Record<string, unknown>;
  if (typeof r['criterion_id'] !== 'string' || r['criterion_id'].length === 0) errors.push('criterion_id required');
  if (!isFinding(r['finding'])) errors.push('finding: unknown Finding');
  if (!Array.isArray(r['evidence'])) errors.push('evidence: array required');
  if (typeof r['coverage'] !== 'object' || r['coverage'] === null) errors.push('coverage required');
  if (!isValidConfidence(r['confidence'])) errors.push('confidence: 0..1 required');
  if (typeof r['rationale'] !== 'string' || r['rationale'].length === 0) errors.push('rationale required');
  if (!Array.isArray(r['missing_proof'])) errors.push('missing_proof: array required');
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: v as unknown as ProposedVerdict };
}
