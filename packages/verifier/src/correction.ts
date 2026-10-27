import {
  buildCorrectionPack,
  type CorrectionPack,
  type IntentVersion,
  type VerificationFinding,
} from '@buildbrief/domain';
import { type CriterionResult } from './verify.js';

export interface PackRequest {
  id: string;
  projectId: string;
  intent: IntentVersion;
  results: CriterionResult[];
  at: string;
}

/**
 * Builds one correction pack per non-supported finding. Scope is bounded to the
 * evidence paths of that finding; protected paths come from intent constraints
 * plus auth/test/migration defaults. Unknowns are mandatory.
 */
export function packsForFailures(req: PackRequest): CorrectionPack[] {
  const packs: CorrectionPack[] = [];
  const protectedDefaults = ['auth/', '.env', 'migrations/', 'package-lock.json', 'pnpm-lock.yaml'];
  const constraintPaths = req.intent.constraints.flatMap((c) => c.paths ?? []);
  for (const r of req.results) {
    if (r.finding.finding === 'supported') continue;
    const scope = [...new Set(r.evidence.map((e) => e.path).filter((p) => p !== undefined))] as string[];
    const f: VerificationFinding = r.finding;
    const instructions = [
      `Goal: satisfy criterion "${r.criterion.text}" (finding: ${f.finding}).`,
      `Observed evidence: ${f.rationale}`,
      `Missing proof: ${f.missing_proof.join('; ') || 'see rationale'}.`,
      adjudicatorLine(r),
      'Implement the smallest change that satisfies the criterion within scope.',
      'Do NOT touch anything under do_not_touch without explicit owner approval.',
    ].join('\n');
    const built = buildCorrectionPack({
      id: req.id,
      project_id: req.projectId,
      finding_ids: [f.id],
      target_revision: f.checked_revision,
      diagnosis_hypotheses: [f.rationale],
      evidence_ids: f.evidence_ids,
      proposed_change_scope: scope.length > 0 ? scope : ['<unscoped: ask owner where this belongs>'],
      do_not_touch: [...new Set([...constraintPaths, ...protectedDefaults])],
      instructions,
      acceptance_commands: ['npm test'],
      unknowns: [...f.missing_proof, 'confirm intended behavior with the owner before changing, where ambiguous'],
      created_at: req.at,
    });
    if (built.ok) packs.push(built.pack);
  }
  return packs;
}

function adjudicatorLine(r: CriterionResult): string {
  if (r.adjudicatorNotes.length === 0) return 'Adjudicator: citations resolved mechanically.';
  return `Adjudicator notes: ${r.adjudicatorNotes.join(' | ')}`;
}
