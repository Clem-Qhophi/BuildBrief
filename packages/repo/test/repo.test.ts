import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { contentHash } from '@buildbrief/domain';
import { collectManifest, safeJoin, scanSecrets } from '../src/index.js';
import { diffText, headSha, isGitRepo, parseHunks } from '../src/index.js';

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
