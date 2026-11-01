// Controlled gate (BB-050). Pure functions; no I/O, no side effects.
// Mirrors @buildbrief/domain MAX_GATE_LOOPS (= 3): after three automated
// repair loops the gate escalates to a human, never a fourth silent loop.
//
// Blocking honesty: a 'block' disposition is emitted ONLY when the caller
// passes enforcement 'blocking' (meaning the hook transport was proven to
// honour blocks on this machine). Anything else degrades to 'advisory' and
// says so. Model-only uncertainty is always advisory, never a hard block.

export const MAX_GATE_LOOPS = 3;

export function buildAutopsyPrompt(input) {
  const goal = input.goal ?? '(no goal stated)';
  const failures = (input.failures ?? []).map((f) => `- ${f}`).join('\n');
  const evidence = (input.evidence ?? []).map((e) => `- ${e}`).join('\n');
  const tried = (input.tried ?? []).map((t) => `- ${t}`).join('\n');
  const constraints = (input.constraints ?? []).map((c) => `- ${c}`).join('\n');
  return [
    `Goal: ${goal}`,
    `Failing checks:\n${failures === '' ? '- (none listed)' : failures}`,
    `Evidence:\n${evidence === '' ? '- (none listed)' : evidence}`,
    `Already tried:\n${tried === '' ? '- (nothing yet)' : tried}`,
    `Constraints (do not violate):\n${constraints === '' ? '- (none listed)' : constraints}`,
    'Acceptance: every failing check above passes on a new revision, and the new revision is reported back.',
  ].join('\n');
}

// input: { loops, deterministicFailures[], protectedViolations[], modelUncertainty[],
//          autopsy:{goal,failures,evidence,tried,constraints}, enforcement, override? }
export function evaluateGate(input) {
  const loops = input.loops ?? 0;
  const deterministicFailures = input.deterministicFailures ?? [];
  const protectedViolations = input.protectedViolations ?? [];
  const modelUncertainty = input.modelUncertainty ?? [];
  const override = input.override ?? null;
  const enforcement = input.enforcement ?? 'advisory';

  if (override !== null && typeof override.reason === 'string' && override.reason.length > 0
    && typeof override.actor === 'string' && override.actor.trim().length > 0) {
    return {
      disposition: 'open',
      loops,
      reason: `Human override by ${override.actor.trim()}: ${override.reason}`,
      autopsy_prompt: null,
    };
  }
  if (loops >= MAX_GATE_LOOPS) {
    return {
      disposition: 'escalate_human',
      loops,
      reason: `Repair loop cap reached (${MAX_GATE_LOOPS}). Automation stops; the owner decides: override, edit the contract, or abort.`,
      autopsy_prompt: null,
    };
  }
  const hard = [...protectedViolations, ...deterministicFailures];
  if (hard.length > 0) {
    const prompt = buildAutopsyPrompt(input.autopsy ?? {});
    if (enforcement === 'blocking') {
      return {
        disposition: 'blocked',
        loops: loops + 1,
        reason: `Blocked on deterministic evidence: ${hard.join('; ')}.`,
        autopsy_prompt: prompt,
      };
    }
    return {
      disposition: 'advisory',
      loops,
      reason: `Would block on: ${hard.join('; ')}. Transport cannot honour blocks here, so this is advisory only and does not stop the agent.`,
      autopsy_prompt: prompt,
    };
  }
  if (modelUncertainty.length > 0) {
    return {
      disposition: 'advisory',
      loops,
      reason: `Model-only uncertainty (never a hard block): ${modelUncertainty.join('; ')}.`,
      autopsy_prompt: null,
    };
  }
  return { disposition: 'open', loops, reason: 'No failing checks and no uncertainty recorded.', autopsy_prompt: null };
}
