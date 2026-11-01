/**
 * Acceptance compiler (BB-040). Pure and deterministic: an approved intent
 * version plus repository signals in, AcceptanceCheck records out.
 *
 * Mapping, in order per criterion:
 * 1. Negative criterion with known protected paths -> `path` check.
 * 2. Recorded acceptance command present -> `test` check.
 * 3. Detected build/lint commands -> `build` / `lint` checks.
 * 4. Nothing deterministic applies -> `model` check (labelled, unexecuted).
 *
 * Per the cut line, build + test + path is a sufficient exit; `http`
 * checks are not compiled here. Model checks are records of needed
 * semantic judgement, never proof.
 */
import {
  stableId,
  validateAcceptanceCheck,
  type AcceptanceCheck,
  type IntentVersion,
} from '@buildbrief/domain';

/** Repository signals the compiler may use. Absent = unknown, never guessed. */
export interface CompileRepo {
  revision: string;
  /** Recorded acceptance command, e.g. 'npm test'. */
  testCommand?: string;
  /** Paths the acceptance command exercises. */
  testCovers?: string[];
  /** Detected build command, e.g. 'npm run build'. */
  buildCommand?: string;
  /** Detected lint command. */
  lintCommand?: string;
}

export interface CompileInput {
  project_id: string;
  intent: IntentVersion;
  repo: CompileRepo;
}

function checkId(intentVersionId: string, criterionId: string, type: string, extra = ''): string {
  return stableId('check', `${intentVersionId}|${criterionId}|${type}|${extra}`);
}

function base(intentVersionId: string, criterionId: string, revision: string): {
  id: string;
  intent_version_id: string;
  criterion_id: string;
  revision: string;
  status: 'pending';
  evidence_ids: string[];
} {
  return {
    id: '',
    intent_version_id: intentVersionId,
    criterion_id: criterionId,
    revision,
    status: 'pending',
    evidence_ids: [],
  };
}

/**
 * Compile an approved intent into executable checks. Refuses drafts:
 * only an owner-approved version may become checks.
 */
export function compileChecks(input: CompileInput): { ok: true; checks: AcceptanceCheck[] } | { ok: false; error: string } {
  const { intent, repo } = input;
  if (intent.state !== 'approved') {
    return { ok: false, error: `Refusing to compile intent in state '${intent.state}': approve it first.` };
  }
  if (intent.criteria.length === 0) {
    return { ok: true, checks: [] };
  }
  const protectedPaths = intent.constraints.flatMap((c) => c.paths ?? []);
  const checks: AcceptanceCheck[] = [];
  for (const criterion of intent.criteria) {
    if (criterion.negative === true && protectedPaths.length > 0) {
      checks.push({
        ...base(intent.id, criterion.id, repo.revision),
        id: checkId(intent.id, criterion.id, 'path'),
        type: 'path',
        protected_path: [...protectedPaths],
        expect: 'no changes under protected paths',
      });
      continue;
    }
    let mapped = false;
    if (repo.testCommand !== undefined && repo.testCommand !== '') {
      const covers = repo.testCovers !== undefined && repo.testCovers.length > 0 ? ` (covers: ${repo.testCovers.join(', ')})` : '';
      checks.push({
        ...base(intent.id, criterion.id, repo.revision),
        id: checkId(intent.id, criterion.id, 'test', repo.testCommand),
        type: 'test',
        command: repo.testCommand,
        expect: `exit 0${covers}`,
      });
      mapped = true;
    }
    if (repo.buildCommand !== undefined && repo.buildCommand !== '') {
      checks.push({
        ...base(intent.id, criterion.id, repo.revision),
        id: checkId(intent.id, criterion.id, 'build', repo.buildCommand),
        type: 'build',
        command: repo.buildCommand,
        expect: 'exit 0',
      });
      mapped = true;
    }
    if (repo.lintCommand !== undefined && repo.lintCommand !== '') {
      checks.push({
        ...base(intent.id, criterion.id, repo.revision),
        id: checkId(intent.id, criterion.id, 'lint', repo.lintCommand),
        type: 'lint',
        command: repo.lintCommand,
        expect: 'exit 0',
      });
      mapped = true;
    }
    if (!mapped) {
      checks.push({
        ...base(intent.id, criterion.id, repo.revision),
        id: checkId(intent.id, criterion.id, 'model'),
        type: 'model',
        expect: 'semantic judgement with cited evidence',
      });
    }
  }
  for (const check of checks) {
    const valid = validateAcceptanceCheck(check);
    if (!valid.ok) return { ok: false, error: `Compiled an invalid check: ${valid.errors.join('; ')}` };
  }
  return { ok: true, checks };
}
