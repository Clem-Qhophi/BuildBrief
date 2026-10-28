import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { contentHash } from '@buildbrief/domain';
import { collectManifest, safeJoin, scanSecrets } from '../src/index.js';
import { diffText, headSha, isGitRepo, parseHunks } from '../src/index.js';
import { snippetHash, viewEvidence } from '../src/index.js';

function makeTree(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'bb-repo-'));
  for (const [rel, text] of Object.entries(files)) {
    const abs = join(root, rel);
    mkdirSync(join(abs, '..'), { recursive: true });
    writeFileSync(abs, text);
  }
  return root;
}

function gitInit(root: string): void {
  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 't@t.t'], { cwd: root });
  execFileSync('git', ['config', 'user.name', 't'], { cwd: root });
  execFileSync('git', ['add', '-A'], { cwd: root });
  execFileSync('git', ['commit', '-qm', 'init'], { cwd: root });
}

describe('manifest + path safety', () => {
  it('lists files, skips binaries/symlinks/env, blocks traversal', () => {
    const root = makeTree({
      'src/a.ts': 'export const x = 1;\n',
      '.env': 'KEY=secret\n',
      'img.png': 'fakepng',
    });
    try {
      symlinkSync(join(root, 'src', 'a.ts'), join(root, 'link.ts'));
    } catch { /* Windows without dev rights: skip symlink case */ }
    const m = collectManifest(root, null);
    const paths = m.files.map((f) => f.path);
    assert.ok(paths.includes('src/a.ts'));
    assert.ok(!paths.includes('.env'));
    assert.ok(!paths.includes('img.png'));
    assert.ok(m.skipped.some((s) => s.path === 'link.ts' || s.reason === 'binary_excluded'));
    assert.throws(() => safeJoin(root, '../escape.ts'), /escapes repository root/);
    assert.throws(() => safeJoin(root, '/abs/path.ts'), /escapes repository root/);
  });

  it('resolves relative roots without breaking traversal defense', () => {
    // Relative root pointing at a real directory: legitimate access works,
    // escape attempts still throw.
    const cwd = process.cwd();
    process.chdir(tmpdir());
    try {
      const base = mkdtempSync(join(tmpdir(), 'bb-relroot-'));
      mkdirSync(join(base, 'src'), { recursive: true });
      writeFileSync(join(base, 'src', 'a.ts'), 'export const x = 1;\n');
      const name = base.split(/[\\/]/).pop() as string;
      const p = safeJoin(name, 'src/a.ts');
      assert.ok(p.endsWith(join(name, 'src', 'a.ts')));
      assert.throws(() => safeJoin(name, '../escape.ts'), /escapes repository root/);
      assert.throws(() => safeJoin(name, 'src/../../escape.ts'), /escapes repository root/);
    } finally {
      process.chdir(cwd);
    }
  });

  it('flags secret-shaped content', () => {
    const root = makeTree({ 'src/k.ts': 'const key = "LLM_123_abcDEF1234567890_xyz";\n' });
    const m = collectManifest(root, null);
    const hits = scanSecrets(root, m);
    assert.equal(hits.length, 1);
    assert.equal(hits[0]?.kind, 'meta_api_key');
  });
});

describe('git adapter + hunks', () => {
  it('reads HEAD, diffs revisions, parses hunks', () => {
    const root = makeTree({ 'src/a.ts': 'line1\nline2\n' });
    gitInit(root);
    assert.equal(isGitRepo(root), true);
    const sha1 = headSha(root);
    assert.match(sha1 ?? '', /^[0-9a-f]{40}$/);
    writeFileSync(join(root, 'src', 'a.ts'), 'line1\nline2 changed\nnewline\n');
    writeFileSync(join(root, 'src', 'auth.ts'), 'token check\n');
    execFileSync('git', ['add', '-A'], { cwd: root });
    execFileSync('git', ['commit', '-qm', 'second'], { cwd: root });
    const sha2 = headSha(root);
    const hunks = parseHunks(diffText(root, sha1 as string, sha2), contentHash);
    const paths = hunks.map((h) => h.path).sort();
    assert.deepEqual(paths, ['src/a.ts', 'src/auth.ts']);
    assert.ok(hunks.every((h) => /^[0-9a-f]{64}$/.test(h.hash)));
    assert.ok(hunks.some((h) => h.kind === 'add'));
  });
});

describe('evidence viewer', () => {
  const TEXT = 'line one\nline two\nline three\nline four\nline five\n';
  function seeded(): { root: string; rev: string } {
    const root = makeTree({ 'src/a.ts': TEXT });
    gitInit(root);
    return { root, rev: headSha(root) as string };
  }
  const ptr = (over: Record<string, unknown> = {}) => ({
    id: 'bb_ev_1',
    path: 'src/a.ts',
    line_start: 2,
    line_end: 3,
    tier: 'E1_source',
    description: 'span',
    ...over,
  });

  it('reads the cited revision and verifies the snippet hash', () => {
    const { root, rev } = seeded();
    const v = viewEvidence({ repo: root, revision: rev, pointer: { ...ptr(), snippet_hash: snippetHash(TEXT, 2, 3) } });
    assert.equal(v.withheld, undefined);
    assert.match(v.provenance ?? '', /cited revision/);
    assert.match(v.hashCheck ?? '', /verified/);
    assert.ok((v.lines ?? []).some((l) => l.cited && l.text === 'line two'));
  });

  it('reports a hash mismatch instead of showing blind trust', () => {
    const { root, rev } = seeded();
    const v = viewEvidence({ repo: root, revision: rev, pointer: { ...ptr(), snippet_hash: 'deadbeef' } });
    assert.match(v.hashCheck ?? '', /differs/);
  });

  it('withholds secret-adjacent files by path only', () => {
    const { root, rev } = seeded();
    const v = viewEvidence({ repo: root, revision: rev, pointer: { ...ptr(), path: '.env' } });
    assert.match(v.withheld ?? '', /withheld/);
    assert.equal(v.lines, undefined);
  });

  it('rejects escaping paths', () => {
    const { root, rev } = seeded();
    const v = viewEvidence({ repo: root, revision: rev, pointer: { ...ptr(), path: '../escape.ts' } });
    assert.match(v.withheld ?? '', /escapes/);
  });

  it('falls back to the worktree with an explicit label when the revision is gone', () => {
    const { root } = seeded();
    const v = viewEvidence({ repo: root, revision: '0'.repeat(40), pointer: ptr() });
    assert.match(v.provenance ?? '', /current worktree/);
    assert.ok((v.lines ?? []).length > 0);
  });

  it('withholds oversized files instead of rendering them', () => {
    const root = makeTree({ 'src/big.bin': `${'x'.repeat(300 * 1024)}` });
    gitInit(root);
    const rev = headSha(root) as string;
    const v = viewEvidence({
      repo: root,
      revision: rev,
      pointer: { ...ptr(), path: 'src/big.bin', line_start: 1, line_end: 1 },
    });
    assert.match(v.withheld ?? '', /too large/);
    assert.equal(v.lines, undefined);
  });
});
