import { type Finding } from '@buildbrief/domain';

/** Failed verdicts eligible as autopsy attempts (blueprint §13.4). */
export const AUTOPSY_FAILURES: Finding[] = ['partial', 'not_established', 'contradicted'];

export interface AutopsyEvidence {
  path: string;
  line_start?: number;
  line_end?: number;
  tier: string;
}

export interface AutopsyOrphan {
  path: string;
  risk: string;
  flags: string[];
}

export interface AutopsyAttempt {
  run_id: string;
  revision: string;
  finding: Finding;
  grade: string;
  rationale: string;
  missing_proof: string[];
  evidence: AutopsyEvidence[];
  orphans: AutopsyOrphan[];
  /** True when a correction pack for the previous attempt existed in the ledger. */
  had_prior_pack: boolean;
}

export interface AutopsyInput {
  criterion_id: string;
  criterion_text: string;
  constraint_paths: string[];
  /** Chronological; stale findings from earlier revisions ARE attempts. */
  attempts: AutopsyAttempt[];
}

export interface AutopsyNextPrompt {
  goal: string;
  failure_summary: string;
  allowed_files: string[];
  forbidden_files: string[];
  acceptance_commands: string[];
  report_line: string;
  text: string;
}

export interface AutopsyReport {
  criterion_id: string;
  criterion_text: string;
  attempt_count: number;
  observed: string[];
  plausible_causes: string[];
  unknowns: string[];
  next_prompt: AutopsyNextPrompt;
}

export type AutopsyResult =
  | { ok: true; report: AutopsyReport }
  | { ok: false; reason: string };

const PROTECTED_DEFAULTS = ['auth/', '.env', 'migrations/', 'package-lock.json', 'pnpm-lock.yaml'];

function short(sha: string): string {
  return sha.slice(0, 7);
}

function span(e: AutopsyEvidence): string {
  if (e.line_start !== undefined && e.line_end !== undefined) return `${e.path}#L${e.line_start}-${e.line_end}`;
  return e.path;
}

/**
 * Prompt Autopsy (blueprint §13.4): groups ≥2 failed attempts for one
 * criterion and reports Observed facts / Plausible causes / Unknowns plus one
 * scoped next prompt. Deterministic and evidence-bound: every observed line
 * quotes ledger data (revisions, verdicts, spans, flags); causes are labeled
 * hypotheses, never accusations; anything not in the ledger is an Unknown.
 */
export function autopsy(input: AutopsyInput): AutopsyResult {
  const attempts = input.attempts.filter((a) => (AUTOPSY_FAILURES as string[]).includes(a.finding));
  if (attempts.length < 2) {
    return {
      ok: false,
      reason: `only ${attempts.length} failed attempt(s) for ${input.criterion_id}; autopsy needs at least two — use 'bb fix' for a single failure`,
    };
  }
  const observed: string[] = [];
  const plausible: string[] = [];
  const unknowns: string[] = [];

  attempts.forEach((a, i) => {
    const n = i + 1;
    const ev = a.evidence.length > 0
      ? `evidence at ${a.evidence.map(span).join(', ')}`
      : 'no evidence cited';
    observed.push(`attempt ${n} @ ${short(a.revision)} (${a.run_id}): ${a.finding}/${a.grade} — ${ev}`);
    if (a.missing_proof.length > 0) {
      observed.push(`attempt ${n} missing proof: ${a.missing_proof.join('; ')}`);
    }
    for (const o of a.orphans) {
      observed.push(`attempt ${n} also touched ${o.path} (${o.risk}; ${o.flags.join(', ') || 'no flags'})`);
    }
    if (i > 0) {
      observed.push(a.had_prior_pack
        ? `attempt ${n} ran after a bounded correction pack for attempt ${n - 1} and still failed`
        : `attempt ${n} had no correction pack for attempt ${n - 1} in the ledger (guidance gap, or pack made outside the ledger)`);
    }
  });

  const verdicts = attempts.map((a) => a.finding);
  if (new Set(verdicts).size === 1) {
    plausible.push(`verdict unchanged (${verdicts[0]}) across ${attempts.length} attempts — the changes so far do not address what the verdict measures`);
  } else {
    plausible.push(`verdict moved ${verdicts.join(' → ')} — later attempts changed the evidence shape but did not establish the criterion`);
  }

  const fileSets = attempts.map((a) => new Set(a.evidence.map((e) => e.path)));
  const union = [...new Set(attempts.flatMap((a) => a.evidence.map((e) => e.path)))];
  const stable = fileSets.every((s) => s.size === fileSets[0]?.size && [...s].every((p) => fileSets[0]?.has(p) === true));
  if (attempts.some((a) => a.evidence.length === 0)) {
    plausible.push('at least one attempt cites no evidence at all — the implementation may be missing rather than misplaced');
  } else if (stable) {
    plausible.push(`same evidence files across attempts (${union.join(', ') || 'none'}) but the missing proof never materialized — the fix likely belongs inside these files, not new ones`);
  } else {
    plausible.push(`evidence files shift between attempts (${union.join(', ')}) — the agent may be guessing at the location; pin the owning module before retrying`);
  }

  const firstMissing = attempts[0]?.missing_proof.join('; ') ?? '';
  if (firstMissing !== '' && attempts.every((a) => a.missing_proof.join('; ') === firstMissing)) {
    plausible.push(`the blocker never moved: every attempt reports the same missing proof ("${firstMissing}")`);
  }
  attempts.forEach((a, i) => {
    for (const o of a.orphans) {
      if (o.flags.includes('deleted_test_or_suite')) {
        plausible.push(`attempt ${i + 1} deleted ${o.path} — proof destroyed; verdicts after that rest on thinner evidence`);
      }
      if (o.flags.includes('constraint_path_touched')) {
        plausible.push(`attempt ${i + 1} touched protected path ${o.path} — effort spilled outside the approved scope`);
      }
    }
  });
  if (attempts.some((a) => a.finding === 'contradicted')) {
    plausible.push('at least one attempt contradicts the criterion — check whether the code and the requirement disagree, not just whether the code is incomplete');
  }

  const hasTestEvidence = attempts.some((a) => a.evidence.some((e) => e.tier === 'E2_test' || e.tier === 'E3_runtime' || e.tier === 'E4_production'));
  if (!hasTestEvidence) {
    unknowns.push('no test-grade evidence in any attempt — the ledger cannot tell whether tests were run or what they reported');
  }
  unknowns.push('the agent\'s exact prompts and intermediate actions are not in the ledger — causes above are hypotheses over verdicts and diffs, not observations of intent');
  unknowns.push('unmapped changes carry no motive — orphans are possibly unrequested, never misconduct');

  const failureSummary = attempts
    .map((a, i) => `attempt ${i + 1} @ ${short(a.revision)}: ${a.finding} (${a.rationale})`)
    .join(' ');
  const forbidden = [...new Set([...input.constraint_paths, ...PROTECTED_DEFAULTS])];
  const text = [
    `Goal: ${input.criterion_text}`,
    `Failure summary: ${failureSummary}`,
    `Allowed files: ${union.length > 0 ? union.join(', ') : '<unscoped: ask owner where this belongs>'}`,
    `Do NOT touch: ${forbidden.join(', ')} without explicit owner approval.`,
    `Acceptance: the criterion above holds; run: npm test.`,
    'After implementing, report the new commit SHA and what remains unresolved.',
  ].join('\n');

  return {
    ok: true,
    report: {
      criterion_id: input.criterion_id,
      criterion_text: input.criterion_text,
      attempt_count: attempts.length,
      observed,
      plausible_causes: plausible,
      unknowns,
      next_prompt: {
        goal: input.criterion_text,
        failure_summary: failureSummary,
        allowed_files: union,
        forbidden_files: forbidden,
        acceptance_commands: ['npm test'],
        report_line: 'After implementing, report the new commit SHA and what remains unresolved.',
        text,
      },
    },
  };
}
