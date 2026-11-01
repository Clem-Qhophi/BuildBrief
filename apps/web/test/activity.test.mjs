import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTimeline } from '../lib/activity.ts';

function session(id, started_at = '2026-11-01T10:00:00.000Z') {
  return { id, project_id: 'p', provider: 'muse', started_at };
}

function event(session_id, name, at) {
  return { id: `${session_id}-${name}`, session_id, project_id: 'p', name, captured_via: 'hook', at };
}

test('activity orders sessions and labels provenance', () => {
  const rows = buildTimeline({
    sessions: [session('s1')],
    sessionEvents: {
      s1: [
        event('s1', 'session_ended', '2026-11-01T10:05:00.000Z'),
        event('s1', 'file_changed', '2026-11-01T10:02:00.000Z'),
      ],
    },
    gates: {},
  });
  assert.deepEqual(rows.map((r) => r.kind), ['session', 'event', 'event']);
  assert.equal(rows[1].label, 'File changed');
  assert.equal(rows[1].capturedVia, 'hook');
});

test('killed and silent sessions show gaps, never quiet', () => {
  const rows = buildTimeline({
    sessions: [session('silent'), session('killed')],
    sessionEvents: {
      silent: [],
      killed: [event('killed', 'file_changed', '2026-11-01T10:03:00.000Z')],
    },
    gates: { killed: { session_id: 'killed', project_id: 'p', loops: 3, disposition: 'override', override_reason: 'demo', override_actor: 'Owner', at: '2026-11-01T10:04:00.000Z' } },
  });
  const gaps = rows.filter((r) => r.kind === 'gap');
  assert.equal(gaps.length, 2);
  assert.match(gaps[0].detail ?? '', /git diff/);
  assert.match(gaps[1].label, /end not observed/);
  assert.match(rows.find((r) => r.kind === 'gate').label, /override|Gate/);
});

test('empty input builds an empty timeline', () => {
  assert.deepEqual(buildTimeline({ sessions: [], sessionEvents: {}, gates: {} }), []);
});
