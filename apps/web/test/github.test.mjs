import { test } from 'node:test';
import assert from 'node:assert/strict';
import { publicGitHubRepository } from '../lib/github.ts';

test('public GitHub URLs become canonical credential-free repository remotes', () => {
  assert.deepEqual(publicGitHubRepository('https://github.com/Example/my-product/'), { url: 'https://github.com/Example/my-product.git', name: 'my-product' });
  assert.equal(publicGitHubRepository('https://github.com/example/project.git').name, 'project');
});
test('GitHub import rejects credentials, other hosts, protocols, and deeper paths', () => {
  for (const input of ['https://secret@github.com/a/b', 'https://github.com/a/b?token=secret', 'https://github.com/a/b#token', 'http://github.com/a/b', 'https://github.com.evil.test/a/b', 'file:///etc/passwd', 'git@github.com:a/b', 'https://github.com/a/b/tree/main', 'https://github.com/a/%2e%2e', 'not a URL']) {
    assert.throws(() => publicGitHubRepository(input));
  }
});
