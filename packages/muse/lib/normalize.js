// Hook-event normaliser (BB-050). Maps one provider's hook JSON into the
// common AgentEvent shape. Never throws, never invents: anything unmapped
// comes back { supported: false } with a reason, so gaps stay visible.

const EVENT_ALIASES = {
  UserPromptSubmit: 'prompt_submitted',
  PreToolUse: 'tool_proposed',
  PostToolUse: 'tool_completed',
  Stop: 'turn_ended',
  SessionEnd: 'session_ended',
  SessionStart: 'session_started',
};

const KNOWN_PROVIDERS = ['muse', 'codex', 'claude'];

function firstString(payload, keys) {
  if (payload === null || typeof payload !== 'object') return undefined;
  for (const k of keys) {
    const v = payload[k];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  for (const nest of ['params', 'payload', 'hook', 'context']) {
    const inner = payload[nest];
    if (inner !== null && typeof inner === 'object' && !Array.isArray(inner)) {
      for (const k of keys) {
        const v = inner[k];
        if (typeof v === 'string' && v.length > 0) return v;
      }
    }
  }
  return undefined;
}

// provider: 'muse' | 'codex' | 'claude'. raw: parsed hook payload (or null).
export function normalizeHookEvent(provider, raw) {
  if (!KNOWN_PROVIDERS.includes(provider)) {
    return { supported: false, reason: `unknown provider '${String(provider)}' (muse|codex|claude)` };
  }
  if (raw === null || typeof raw !== 'object') {
    return { supported: false, reason: 'empty or unparseable hook payload' };
  }
  const rawName = firstString(raw, ['hook_event_name', 'hookEventName', 'event_name', 'eventName', 'event', 'hook_event']);
  if (rawName === undefined) {
    return { supported: false, reason: 'hook payload carries no event name' };
  }
  const name = EVENT_ALIASES[rawName] ?? null;
  if (name === null) {
    return { supported: false, reason: `unmapped ${provider} event '${rawName}' (not claimed as captured)` };
  }
  const out = { supported: true, name, captured_via: 'hook', provider };
  const sessionId = firstString(raw, ['session_id', 'sessionId', 'sessionID']);
  if (sessionId !== undefined) out.session_id = sessionId;
  return out;
}
