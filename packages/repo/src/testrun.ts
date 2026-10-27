import { contentHash } from '@buildbrief/domain';

export interface TestRun {
  id: string;
  revision: string;
  command: string[];
  exit_code: number;
  passed: number;
  failed: number;
  /** sha256 of the raw log; logs live outside the ledger, content-addressed. */
  log_hash: string;
  started_at: string;
  finished_at: string;
}

export interface TestRunInput {
  id: string;
  revision: string;
  command: string[];
  exit_code: number;
  passed: number;
  failed: number;
  log: string;
  started_at: string;
  finished_at: string;
}

export function recordTestRun(input: TestRunInput): TestRun {
  if (!Number.isInteger(input.exit_code)) throw new Error('exit_code must be an integer');
  if (input.passed < 0 || input.failed < 0) throw new Error('passed/failed must be ≥ 0');
  const { log, ...rest } = input;
  return { ...rest, log_hash: contentHash(log) };
}

/** Minimal TAP-ish counter: counts `✔/ok` passes and `✖/not ok` failures. */
export function countResults(log: string): { passed: number; failed: number } {
  let passed = 0;
  let failed = 0;
  for (const line of log.split('\n')) {
    const t = line.trim();
    if (/^(ok|✔|pass|PASS)[\s:]/.test(t) || t === 'ok') passed += 1;
    else if (/^(not ok|✖|fail|FAIL)[\s:]/.test(t)) failed += 1;
  }
  return { passed, failed };
}
