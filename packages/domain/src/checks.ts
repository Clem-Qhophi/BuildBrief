/**
 * Acceptance-check contracts (master plan Phase 1).
 * Compiled from an approved intent version (compiler itself is BB-040);
 * these types pin each check to a revision and record how it ran.
 * Every check is labelled deterministic or model-judged — a check is
 * never silently model-judged.
 */

export const CHECK_TYPES = ['test', 'build', 'lint', 'path', 'http', 'model'] as const;
export type CheckType = (typeof CHECK_TYPES)[number];

export const CHECK_STATUS = ['pending', 'pass', 'fail', 'skipped', 'unverifiable'] as const;
export type CheckStatus = (typeof CHECK_STATUS)[number];

/** Checks with these types run without any model call. */
export const DETERMINISTIC_CHECK_TYPES: readonly CheckType[] = ['test', 'build', 'lint', 'path'];

export interface AcceptanceCheck {
  id: string;
  intent_version_id: string;
  criterion_id: string;
  type: CheckType;
  /** Shell command for test|build|lint|http checks. Never set for path checks. */
  command?: string;
  /** Expected outcome, e.g. "exit 0" or "no match in protected paths". */
  expect?: string;
  /** For path checks: the protected paths this check guards. */
  protected_path?: string[];
  status: CheckStatus;
  /** Repository revision this check result belongs to. */
  revision: string;
  evidence_ids: string[];
  last_run_at?: string;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function isCheckType(v: unknown): v is CheckType {
  return typeof v === 'string' && (CHECK_TYPES as readonly string[]).includes(v);
}

function isCheckStatus(v: unknown): v is CheckStatus {
  return typeof v === 'string' && (CHECK_STATUS as readonly string[]).includes(v);
}

/** Runtime validation for untrusted payloads (MCP/hook/CLI boundaries). */
export function validateAcceptanceCheck(v: unknown): { ok: true; value: AcceptanceCheck } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!isRecord(v)) return { ok: false, errors: ['check must be an object'] };
  if (typeof v['id'] !== 'string' || v['id'].length === 0) errors.push('id: nonempty string required');
  if (typeof v['intent_version_id'] !== 'string' || v['intent_version_id'].length === 0) errors.push('intent_version_id: nonempty string required');
  if (typeof v['criterion_id'] !== 'string' || v['criterion_id'].length === 0) errors.push('criterion_id: nonempty string required');
  if (!isCheckType(v['type'])) errors.push('type: test|build|lint|path|http|model required');
  if (!isCheckStatus(v['status'])) errors.push('status: pending|pass|fail|skipped|unverifiable required');
  if (typeof v['revision'] !== 'string' || v['revision'].length === 0) errors.push('revision: nonempty string required');
  if (!Array.isArray(v['evidence_ids'])) errors.push('evidence_ids: array required');
  if (v['last_run_at'] !== undefined && (typeof v['last_run_at'] !== 'string' || Number.isNaN(Date.parse(v['last_run_at'])))) {
    errors.push('last_run_at: ISO timestamp required');
  }
  if (v['type'] === 'path' && v['command'] !== undefined) errors.push('path checks carry protected_path, never a command');
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: v as unknown as AcceptanceCheck };
}

/** True when the check runs without any model call. */
export function isDeterministicCheck(check: Pick<AcceptanceCheck, 'type'>): boolean {
  return (DETERMINISTIC_CHECK_TYPES as readonly string[]).includes(check.type);
}

/** Terminal outcomes: the check has a usable answer for its revision. */
export function isCheckSettled(check: Pick<AcceptanceCheck, 'status'>): boolean {
  return check.status === 'pass' || check.status === 'fail' || check.status === 'unverifiable';
}
