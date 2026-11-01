/**
 * Agent adapter contracts (master plan Phase 1).
 * Capabilities are negotiated per installed provider version and surfaced
 * to the user. An adapter must never claim an event it cannot capture or
 * an enforcement power its hooks do not have.
 */

export const ADAPTER_EVENTS = [
  'session_started',
  'prompt_submitted',
  'tool_proposed',
  'permission_decided',
  'tool_completed',
  'file_changed',
  'command_run',
  'test_completed',
  'turn_ended',
  'session_ended',
] as const;
export type AdapterEventName = (typeof ADAPTER_EVENTS)[number];

export const EVENT_AVAILABILITY = ['synchronous', 'asynchronous', 'unavailable'] as const;
export type EventAvailability = (typeof EVENT_AVAILABILITY)[number];

export const ELICITATION_MODES = ['native', 'text', 'none'] as const;
export type ElicitationMode = (typeof ELICITATION_MODES)[number];

export const ENFORCEMENT_MODES = ['advisory', 'blocking', 'unsupported'] as const;
export type EnforcementMode = (typeof ENFORCEMENT_MODES)[number];

export const CAPTURE_SOURCES = ['hook', 'git-reconcile', 'manual'] as const;
export type CaptureSource = (typeof CAPTURE_SOURCES)[number];

export const GATE_DISPOSITIONS = ['advisory', 'blocked_deterministic', 'override'] as const;
export type GateDisposition = (typeof GATE_DISPOSITIONS)[number];

/** Hard cap on automated repair loops before a human is asked. */
export const MAX_GATE_LOOPS = 3;

export interface CapabilityManifest {
  provider: string;
  provider_version: string;
  transport: string;
  events: Record<AdapterEventName, EventAvailability>;
  elicitation: ElicitationMode;
  enforcement: EnforcementMode;
  approvals_supported: boolean;
  probed_at: string;
}

export interface AgentSession {
  id: string;
  project_id: string;
  provider: string;
  intent_version_id?: string;
  started_at: string;
  ended_at?: string;
}

export interface AgentEvent {
  id: string;
  session_id: string;
  project_id: string;
  name: AdapterEventName;
  captured_via: CaptureSource;
  at: string;
  detail?: Record<string, unknown>;
}

export interface GateRecord {
  session_id: string;
  project_id: string;
  loops: number;
  disposition: GateDisposition;
  override_reason?: string;
  override_actor?: string;
  at: string;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function oneOf(list: readonly string[]) {
  return (v: unknown): v is string => typeof v === 'string' && list.includes(v);
}

const isAdapterEventName = oneOf(ADAPTER_EVENTS as readonly string[]);
const isAvailability = oneOf(EVENT_AVAILABILITY as readonly string[]);
const isElicitation = oneOf(ELICITATION_MODES as readonly string[]);
const isEnforcement = oneOf(ENFORCEMENT_MODES as readonly string[]);
const isCaptureSource = oneOf(CAPTURE_SOURCES as readonly string[]);
const isGateDisposition = oneOf(GATE_DISPOSITIONS as readonly string[]);

/** Runtime validation for untrusted payloads (MCP/hook/CLI boundaries). */
export function validateCapabilityManifest(v: unknown): { ok: true; value: CapabilityManifest } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!isRecord(v)) return { ok: false, errors: ['manifest must be an object'] };
  if (typeof v['provider'] !== 'string' || v['provider'].length === 0) errors.push('provider: nonempty string required');
  if (typeof v['provider_version'] !== 'string' || v['provider_version'].length === 0) errors.push('provider_version: nonempty string required (never "unknown")');
  if (typeof v['transport'] !== 'string' || v['transport'].length === 0) errors.push('transport: nonempty string required');
  if (!isRecord(v['events'])) errors.push('events: object required');
  else {
    for (const name of ADAPTER_EVENTS) {
      if (!isAvailability((v['events'] as Record<string, unknown>)[name])) errors.push(`events.${name}: synchronous|asynchronous|unavailable required`);
    }
  }
  if (!isElicitation(v['elicitation'])) errors.push('elicitation: native|text|none required');
  if (!isEnforcement(v['enforcement'])) errors.push('enforcement: advisory|blocking|unsupported required');
  if (typeof v['approvals_supported'] !== 'boolean') errors.push('approvals_supported: boolean required');
  if (typeof v['probed_at'] !== 'string' || Number.isNaN(Date.parse(v['probed_at']))) errors.push('probed_at: ISO timestamp required');
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: v as unknown as CapabilityManifest };
}

/** Runtime validation for untrusted hook payloads. */
export function validateAgentEvent(v: unknown): { ok: true; value: AgentEvent } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!isRecord(v)) return { ok: false, errors: ['agent event must be an object'] };
  if (typeof v['id'] !== 'string' || v['id'].length === 0) errors.push('id: nonempty string required');
  if (typeof v['session_id'] !== 'string' || v['session_id'].length === 0) errors.push('session_id: nonempty string required');
  if (typeof v['project_id'] !== 'string' || v['project_id'].length === 0) errors.push('project_id: nonempty string required');
  if (!isAdapterEventName(v['name'])) errors.push('name: known adapter event required');
  if (!isCaptureSource(v['captured_via'])) errors.push('captured_via: hook|git-reconcile|manual required');
  if (typeof v['at'] !== 'string' || Number.isNaN(Date.parse(v['at']))) errors.push('at: ISO timestamp required');
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: v as unknown as AgentEvent };
}

/** Runtime validation for gate records. Overrides require a reason and a human actor. */
export function validateGateRecord(v: unknown): { ok: true; value: GateRecord } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!isRecord(v)) return { ok: false, errors: ['gate record must be an object'] };
  if (typeof v['session_id'] !== 'string' || v['session_id'].length === 0) errors.push('session_id: nonempty string required');
  if (typeof v['project_id'] !== 'string' || v['project_id'].length === 0) errors.push('project_id: nonempty string required');
  if (typeof v['loops'] !== 'number' || !Number.isInteger(v['loops']) || v['loops'] < 0 || v['loops'] > MAX_GATE_LOOPS) {
    errors.push(`loops: integer 0-${MAX_GATE_LOOPS} required`);
  }
  if (!isGateDisposition(v['disposition'])) errors.push('disposition: advisory|blocked_deterministic|override required');
  if (v['disposition'] === 'override') {
    if (typeof v['override_reason'] !== 'string' || v['override_reason'].length === 0) errors.push('override_reason: required for human overrides');
    if (typeof v['override_actor'] !== 'string' || v['override_actor'].trim().length === 0) errors.push('override_actor: required for human overrides');
  }
  if (typeof v['at'] !== 'string' || Number.isNaN(Date.parse(v['at']))) errors.push('at: ISO timestamp required');
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: v as unknown as GateRecord };
}

/**
 * After a failed repair loop, decide whether automation may continue.
 * At the cap the gate escalates to a human — never a fourth silent loop.
 */
export function gateAfterLoop(loops: number): 'blocked' | 'escalate_human' {
  return loops >= MAX_GATE_LOOPS ? 'escalate_human' : 'blocked';
}
