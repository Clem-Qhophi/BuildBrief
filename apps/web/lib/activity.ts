import type { AgentEvent, AgentSession, GateRecord } from '@buildbrief/domain';

export interface TimelineRow {
  at: string;
  kind: 'session' | 'event' | 'gate' | 'gap';
  label: string;
  detail?: string;
  capturedVia?: string;
}

const EVENT_LABELS: Record<string, string> = {
  session_started: 'Session started',
  prompt_submitted: 'Prompt submitted',
  tool_proposed: 'Tool proposed',
  permission_decided: 'Permission decided',
  tool_completed: 'Tool completed',
  file_changed: 'File changed',
  command_run: 'Command run',
  test_completed: 'Test completed',
  turn_ended: 'Turn ended',
  session_ended: 'Session ended',
};

export interface ActivityInput {
  sessions: AgentSession[];
  sessionEvents: Record<string, AgentEvent[]>;
  gates: Record<string, GateRecord>;
}

/**
 * Builds a session timeline with explicit gap markers. A session with no
 * captured events, or with no observed end, is labelled as unobserved —
 * never rendered as quiet. Pure; counts only, no scores.
 */
export function buildTimeline(input: ActivityInput): TimelineRow[] {
  const rows: TimelineRow[] = [];
  const sessions = [...input.sessions].sort((a, b) => (a.started_at < b.started_at ? -1 : 1));
  for (const session of sessions) {
    rows.push({
      at: session.started_at,
      kind: 'session',
      label: `Session ${session.id} started`,
      detail: `Provider ${session.provider}`,
    });
    const events = [...(input.sessionEvents[session.id] ?? [])].sort((a, b) => (a.at < b.at ? -1 : 1));
    for (const event of events) {
      rows.push({
        at: event.at,
        kind: 'event',
        label: EVENT_LABELS[event.name] ?? event.name,
        capturedVia: event.captured_via,
      });
    }
    const gate = input.gates[session.id];
    if (gate !== undefined) {
      const row: TimelineRow = {
        at: gate.at,
        kind: 'gate',
        label: `Gate ${gate.disposition} after ${gate.loops} repair loop${gate.loops === 1 ? '' : 's'}`,
      };
      if (gate.disposition === 'override') row.detail = `Overridden by ${gate.override_actor ?? 'owner'}`;
      rows.push(row);
    }
    if (events.length === 0) {
      rows.push({
        at: session.started_at,
        kind: 'gap',
        label: 'No captured events for this session',
        detail: 'Reconcile against the git diff before trusting this timeline — hooks may have been missed or the session may have crashed.',
      });
    } else if (!events.some((e) => e.name === 'session_ended')) {
      rows.push({
        at: events[events.length - 1]?.at ?? session.started_at,
        kind: 'gap',
        label: 'Session end not observed',
        detail: 'The session may have been interrupted; later events may be missing.',
      });
    }
  }
  return rows;
}
