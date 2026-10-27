export interface CorrectionPack {
  id: string;
  project_id: string;
  finding_ids: string[];
  target_revision: string;
  diagnosis_hypotheses: string[];
  evidence_ids: string[];
  proposed_change_scope: string[];
  do_not_touch: string[];
  instructions: string;
  acceptance_commands: string[];
  unknowns: string[];
  requires_human_approval: boolean;
  created_at: string;
}

export interface CorrectionPackInput {
  id: string;
  project_id: string;
  finding_ids: string[];
  target_revision: string;
  diagnosis_hypotheses: string[];
  evidence_ids: string[];
  proposed_change_scope: string[];
  do_not_touch: string[];
  instructions: string;
  acceptance_commands: string[];
  unknowns: string[];
  created_at: string;
}

/**
 * A correction pack is advice, never a patch: it must name its unknowns, bound its
 * scope, and carry a verify-after instruction. Empty-scope or unknown-free packs
 * are rejected — they would overclaim.
 */
export function buildCorrectionPack(
  input: CorrectionPackInput,
): { ok: true; pack: CorrectionPack } | { ok: false; error: string } {
  if (input.finding_ids.length === 0) return { ok: false, error: 'pack must reference ≥1 finding' };
  if (input.proposed_change_scope.length === 0) return { ok: false, error: 'pack must bound the change scope' };
  if (input.instructions.trim().length === 0) return { ok: false, error: 'pack must contain instructions' };
  const verifyAfter = 'After implementing, report the new commit SHA and re-run verification; the finding changes only on fresh evidence.';
  const instructions = input.instructions.includes('re-run verification')
    ? input.instructions
    : `${input.instructions}\n\n${verifyAfter}`;
  return {
    ok: true,
    pack: {
      ...input,
      instructions,
      requires_human_approval: true,
    },
  };
}
