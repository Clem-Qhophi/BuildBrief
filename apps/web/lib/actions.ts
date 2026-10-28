import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { IntentVersion } from '@buildbrief/domain';
import { MetaApiProvider, metaConfigFromEnv, MockProvider, type ModelProvider } from '@buildbrief/model-meta';
import { countResults, headSha, recordTestRun } from '@buildbrief/repo';
import { RuleAssessor, renderMarkdown, verify, type CoveringTestRun } from '@buildbrief/verifier';
import { appendEvent, openProjectStore, rebuildViews } from '@buildbrief/store';

export type WebProvider = 'rules' | 'mock' | 'meta';

export function webProvider(name: string): ModelProvider {
  if (name === 'rules' || name === '') return new RuleAssessor();
  if (name === 'mock') return new MockProvider();
  if (name === 'meta') return new MetaApiProvider(metaConfigFromEnv());
  throw new Error(`unknown provider '${name}' (rules|mock|meta)`);
}

export interface VerifyParams {
  project: string;
  intent: IntentVersion;
  repo: string;
  base?: string;
  provider: WebProvider;
  /**
   * Optional acceptance command run in the repo before verifying (explicit
   * user action only). The run is recorded in the report; evidence whose
   * paths match `covers` upgrades to E2 on a passing run.
   */
  acceptCommand?: string;
  acceptCovers?: string[];
}

/** Runs one acceptance command in the repo and records the outcome. */
function runAcceptance(repo: string, command: string, covers: string[]): CoveringTestRun {
  const started = new Date().toISOString();
  // Shell executable only — Node appends its own invocation flags per
  // platform. The command runs only on explicit user submit, in their repo.
  const shell = process.platform === 'win32' ? (process.env['ComSpec'] ?? 'cmd.exe') : '/bin/sh';
  let exitCode = 0;
  let output = '';
  try {
    output = execSync(command, {
      cwd: repo,
      timeout: 120_000,
      maxBuffer: 1024 * 1024,
      encoding: 'utf8',
      shell,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (e) {
    const err = e as { status?: number; stdout?: string; stderr?: string; message?: string };
    exitCode = typeof err.status === 'number' ? err.status : 124;
    output = `${err.stdout ?? ''}\n${err.stderr ?? ''}\n${err.message ?? ''}`;
  }
  const log = output.length > 4000 ? `${output.slice(0, 4000)}\n…(truncated)` : output;
  const { passed, failed } = countResults(log);
  const finished = new Date().toISOString();
  return {
    run: recordTestRun({
      id: `bb_testrun_${Date.now().toString(36)}`,
      revision: headSha(repo) ?? '',
      command: command.split(/\s+/).filter((w) => w.length > 0),
      exit_code: exitCode,
      passed,
      failed,
      log,
      started_at: started,
      finished_at: finished,
    }),
    covers,
  };
}

/**
 * Same ledger writes as `bb verify`: started marker, snapshot, findings,
 * orphans, report artifacts. Returns the run id for redirect.
 */
export async function doVerify(root: string, params: VerifyParams): Promise<{ run_id: string; revision: string }> {
  const store = openProjectStore(root, params.project);
  const testRuns: CoveringTestRun[] = [];
  if (params.acceptCommand !== undefined && params.acceptCommand.trim() !== '') {
    testRuns.push(runAcceptance(params.repo, params.acceptCommand.trim(), params.acceptCovers ?? []));
  }
  appendEvent(store, 'verification.started', params.project, {
    intent_id: params.intent.id,
    provider: webProvider(params.provider).name,
  });
  const report = await verify({
    projectId: params.project,
    intent: params.intent,
    root: params.repo,
    provider: webProvider(params.provider),
    ...(params.base !== undefined && params.base !== '' ? { baseRevision: params.base } : {}),
    ...(testRuns.length > 0 ? { testRuns } : {}),
  });
  appendEvent(store, 'repo.snapshot.created', params.project, {
    revision: report.checked_revision,
    files: report.results[0]?.trace.searched_files ?? 0,
  });
  for (const r of report.results) {
    appendEvent(store, 'finding.recorded', params.project, { finding: r.finding });
  }
  for (const o of report.orphans) {
    appendEvent(store, 'change.orphan_flagged', params.project, { orphan: o });
  }
  rebuildViews(store, params.project);
  const dir = join(root, '.buildbrief', 'reports');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${report.run_id}.json`), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  writeFileSync(join(dir, `${report.run_id}.md`), `${renderMarkdown(report)}\n`, 'utf8');
  return { run_id: report.run_id, revision: report.checked_revision };
}
