/**
 * Append-only ledger events. Events are facts; `state/*` views are derived.
 * Every event carries: id, type, project_id, at, actor/source, payload, hash-chain prev.
 */
export const EVENT_TYPES = [
  'prompt.captured',
  'intent.extracted',
  'intent.approved',
  'intent.superseded',
  'repo.snapshot.created',
  'verification.started',
  'finding.recorded',
  'evidence.invalidated',
  'change.orphan_flagged',
  'change.dispositioned',
  'correction.pack_created',
  'agent.patch_reported',
  'recheck.completed',
  'quiz.answer_submitted',
  'role.tour_generated',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export interface LedgerEvent {
  id: string;
  type: EventType;
  project_id: string;
  at: string;
  /** previous event hash in this project chain ('GENESIS' for first). */
  prev: string;
  /** self hash over (prev + canonical payload). */
  hash: string;
  payload: Record<string, unknown>;
}

export function isEventType(v: unknown): v is EventType {
  return typeof v === 'string' && (EVENT_TYPES as readonly string[]).includes(v);
}
