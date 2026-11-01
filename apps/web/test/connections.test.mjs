import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { carriedRepo, readConnections, resolveContext, saveConnection } from '../lib/connections.ts';

test('connection survives a fresh read and reconnecting preserves other projects', () => {
  const root = mkdtempSync(join(tmpdir(), 'bb-connections-'));
  try {
    const first = { project: 'one', repo: join(root, 'repo-one'), kind: 'local' };
    const second = { project: 'two', repo: join(root, 'repo-two'), kind: 'local' };
    saveConnection(root, first);
    saveConnection(root, second);
    const updated = { ...first, repo: join(root, 'new-repo') };
    saveConnection(root, updated);
    assert.deepEqual(readConnections(root), [second, updated]);
    assert.equal(JSON.parse(readFileSync(join(root, '.buildbrief', 'connections.json'), 'utf8')).length, 2);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('project switching never inherits the previous project repository', () => {
  const connections = [{ project: 'one', repo: join(tmpdir(), 'one'), kind: 'local' }];
  assert.equal(resolveContext(connections, {}, 'one').repo, connections[0].repo);
  assert.equal(resolveContext(connections, { project: 'two' }, 'one').repo, '');
  assert.equal(resolveContext(connections, { project: 'two', repo: join(tmpdir(), 'two') }, 'one').repo, join(tmpdir(), 'two'));
  assert.equal(resolveContext(connections, { project: '', repo: '' }, 'one').project, '');
});

test('capture never carries a previous project repository into a new project', () => {
  const connections = [{ project: 'one', repo: join(tmpdir(), 'one'), kind: 'local' }];
  // The new project's own saved repository is carried.
  assert.equal(carriedRepo(connections, 'one', connections[0].repo), connections[0].repo);
  // A repository owned by a different project is dropped, not inherited.
  assert.equal(carriedRepo(connections, 'two', connections[0].repo), '');
  // A fresh path no saved project owns is treated as user-typed and kept.
  assert.equal(carriedRepo(connections, 'two', join(tmpdir(), 'fresh')), join(tmpdir(), 'fresh'));
  assert.equal(carriedRepo(connections, 'two', ''), '');
});

test('relative repository paths and empty project names cannot be persisted', () => {
  const root = mkdtempSync(join(tmpdir(), 'bb-invalid-connection-'));
  try {
    assert.throws(() => saveConnection(root, { project: 'one', repo: '../other', kind: 'local' }), /absolute local path/);
    assert.throws(() => saveConnection(root, { project: '', repo: root, kind: 'local' }), /Project name/);
    assert.deepEqual(readConnections(root), []);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('corrupt configuration fails visibly without overwriting saved data', () => {
  const root = mkdtempSync(join(tmpdir(), 'bb-corrupt-connection-'));
  try {
    mkdirSync(join(root, '.buildbrief'));
    const file = join(root, '.buildbrief', 'connections.json');
    writeFileSync(file, '{broken');
    assert.throws(() => saveConnection(root, { project: 'one', repo: root, kind: 'local' }));
    assert.equal(readFileSync(file, 'utf8'), '{broken');
  } finally { rmSync(root, { recursive: true, force: true }); }
});
