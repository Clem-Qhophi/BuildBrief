import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildInitReport, probeCandidates } from '../src/commands.js';

describe('bb init wiring report', () => {
  it('reports installed versus missing agents without changing anything', () => {
    const dir = mkdtempSync(join(tmpdir(), 'bb-init-'));
    mkdirSync(join(dir, '.muse'), { recursive: true });
    writeFileSync(join(dir, '.muse', 'hooks.json'), '{}', 'utf8');
    const probe = (bin: string): string | null => (bin === 'muse' ? 'muse 1.4.14' : null);
    const lines = buildInitReport(dir, probe);
    const text = lines.join('\n');
    assert.match(text, /muse: muse 1\.4\.14/);
    assert.match(text, /codex: not found on PATH/);
    assert.match(text, /claude: not found on PATH/);
    assert.match(text, /hooks template.*present/);
    assert.match(text, /nothing was changed/);
  });

  it('is honest when no agents and no template exist', () => {
    const dir = mkdtempSync(join(tmpdir(), 'bb-init-empty-'));
    const lines = buildInitReport(dir, () => null).join('\n');
    assert.match(lines, /not found on PATH/);
    assert.match(lines, /hooks template.*absent/);
  });

  it('names windows shim candidates so .cmd installs are found', () => {
    const names = probeCandidates('codex');
    assert.ok(names.includes('codex'));
    if (process.platform === 'win32') assert.ok(names.includes('codex.cmd'));
  });
});
