export const REVIEW_OUTCOMES = ['accepted', 'changes_requested', 'more_evidence'] as const;
export type ReviewOutcome = (typeof REVIEW_OUTCOMES)[number];
export interface ReviewDecision {
  project_id: string;
  run_id: string;
  revision: string;
  requirement_version_id: string;
  outcome: ReviewOutcome;
  actor: string;
  note: string;
  at: string;
}

/** A human disposition of a specific report, never a verifier finding. */
export function makeReviewDecision(input: ReviewDecision): ReviewDecision {
  if (!input.actor.trim() || input.actor.trim().length > 120) throw new Error('Your name is required (up to 120 characters).');
  if (!input.note.trim() || input.note.trim().length > 2000) throw new Error('Explain your decision in up to 2000 characters.');
  if (!(REVIEW_OUTCOMES as readonly string[]).includes(input.outcome)) throw new Error('Choose an acceptance outcome.');
  if (!input.project_id || !input.requirement_version_id || !/^bb_run_[a-f0-9]+$/.test(input.run_id) || !/^[a-f0-9]{40}$/.test(input.revision) || !Number.isFinite(Date.parse(input.at))) throw new Error('A valid report, revision, and timestamp are required.');
  return { ...input, actor: input.actor.trim(), note: input.note.trim() };
}
