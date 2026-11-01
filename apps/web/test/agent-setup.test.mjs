import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agentSetups, buildMcpGuide, detectAgents, EXPECTED_TOOL_COUNT, mcpServerPath } from '../lib/agent-setup.ts';

test('agent detection never throws and versions are strings or null', () => {
  const versions = detectAgents();
  assert.deepEqual(Object.keys(versions).sort(), ['claude', 'codex', 'muse']);
  for (const version of Object.values(versions)) {
    assert.ok(version === null || (typeof version === 'string' && version.length > 0));
  }
});

test('setup distinguishes verified registration from unverified manual steps', () => {
  const setups = agentSetups('/srv/serve.js', { muse: 'Muse Code 1.4.14', codex: null, claude: '2.1.198' });
  const byId = new Map(setups.map((s) => [s.id, s]));
  assert.equal(byId.get('muse').mcpCommand, null);
  assert.equal(byId.get('muse').mcpVerified, false);
  assert.match(byId.get('codex').mcpCommand ?? '', /codex mcp add buildbrief -- node \/srv\/serve\.js/);
  assert.equal(byId.get('codex').mcpVerified, true);
  assert.match(byId.get('claude').mcpCommand ?? '', /claude mcp add buildbrief -- node \/srv\/serve\.js/);
  assert.equal(EXPECTED_TOOL_COUNT, 12);
});

test('guide carries install paths but never secrets or ledger data', () => {
  const guide = buildMcpGuide('/srv/serve.js', { muse: null, codex: null, claude: null });
  assert.match(guide, /node \/srv\/serve\.js/);
  assert.match(guide, /12 tools/);
  assert.match(guide, /UNVERIFIED|unverified/);
  assert.doesNotMatch(guide, /LLM_[A-Za-z0-9]/);
  assert.doesNotMatch(guide, /BB_META_API_KEY\s*=\s*["']?[A-Za-z0-9]/);
  assert.doesNotMatch(guide, /events\.jsonl/);
});

test('mcp server path resolves to the built server', () => {
  assert.match(mcpServerPath(), /serve\.js$/);
});
