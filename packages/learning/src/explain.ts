import { type IntentVersion } from '@buildbrief/domain';
import { type VerificationReport } from '@buildbrief/verifier';

export interface ExplanationRule {
  criterion_id: string;
  criterion_text: string;
  finding: string;
  evidence: { id: string; tier: string; path?: string; lines?: string }[];
  rationale: string;
  missing_proof: string[];
}

export interface Explanation {
  project_id: string;
  feature_id: string;
  requirement_version_id: string;
  revision: string;
  summary: string;
  rules: ExplanationRule[];
  unknowns: string[];
  provider: string;
  model: string;
}

/**
 * Deterministic explanation assembled ONLY from the approved intent and a
 * verification report. No model prose: every sentence traces to a finding,
 * an evidence pointer, or an explicit unknown.
 */
export function explainFeature(intent: IntentVersion, report: VerificationReport): Explanation {
  const counts: Record<string, number> = {};
  for (const r of report.results) counts[r.finding.finding] = (counts[r.finding.finding] ?? 0) + 1;
  const parts = Object.entries(counts).map(([k, v]) => `${v} ${k}`);
  const rules: ExplanationRule[] = report.results.map((r) => ({
    criterion_id: r.criterion.id,
    criterion_text: r.criterion.text,
    finding: r.finding.finding,
    evidence: r.evidence.map((e) => ({
      id: e.id,
      tier: e.tier,
      ...(e.path !== undefined ? { path: e.path } : {}),
      ...(e.line_start !== undefined ? { lines: `L${e.line_start}-${e.line_end ?? e.line_start}` } : {}),
    })),
    rationale: r.finding.rationale,
    missing_proof: r.finding.missing_proof,
  }));
  const unknowns: string[] = [];
  for (const r of report.results) {
    for (const m of r.finding.missing_proof) unknowns.push(`${r.criterion.id}: ${m}`);
  }
  for (const o of report.orphans) {
    unknowns.push(`possibly-unrequested change in ${o.path} [${o.risk}] awaits human disposition`);
  }
  return {
    project_id: intent.project_id,
    feature_id: intent.feature_id,
    requirement_version_id: intent.id,
    revision: report.checked_revision,
    summary: `${intent.feature_id}: ${report.results.length} criteria checked at ${report.checked_revision.slice(0, 7)} — ${parts.join(', ') || 'none'}.`,
    rules,
    unknowns,
    provider: report.provider,
    model: report.model,
  };
}
