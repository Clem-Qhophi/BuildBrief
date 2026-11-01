import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

/** Only credential-free public GitHub repository URLs; never arbitrary remotes. */
export function publicGitHubRepository(input: string): { url: string; name: string } {
  let url: URL;
  try { url = new URL(input.trim()); } catch { throw new Error('GitHub repository URL must look like https://github.com/owner/project.'); }
  if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.port || url.username || url.password || url.search || url.hash) throw new Error('Use a public https://github.com/owner/project link without credentials, query parameters, or fragments.');
  const parts = url.pathname.replace(/\/$/, '').split('/').filter(Boolean);
  const owner = parts[0];
  const name = parts[1]?.replace(/\.git$/, '');
  if (parts.length !== 2 || !owner || !name || !/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(name) || name === '.' || name === '..') throw new Error('Paste the repository’s main GitHub URL, not a file, issue, or branch link.');
  return { url: `https://github.com/${owner}/${name}.git`, name };
}

export function importPublicGitHubRepository(root: string, input: string): { repo: string; origin: string; name: string } {
  const remote = publicGitHubRepository(input);
  const destination = join(root, '.buildbrief', 'checkouts', randomUUID());
  mkdirSync(destination, { recursive: true });
  const repo = join(destination, 'repository');
  try {
    execFileSync('git', ['clone', '--depth=1', '--single-branch', '--no-tags', '--', remote.url, repo], {
      encoding: 'utf8', timeout: 60_000, maxBuffer: 1_048_576,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'Never' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch { throw new Error('The public repository could not be downloaded. Check the URL and network connection. For private repositories, connect an existing local folder instead.'); }
  return { repo, origin: remote.url.replace(/\.git$/, ''), name: remote.name };
}
