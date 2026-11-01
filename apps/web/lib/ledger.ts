import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import type { EvidencePointer } from '@buildbrief/domain';
import type { ReviewDecision } from '@buildbrief/domain';
import { readConnections } from './connections';
import { readResetExample as resetState } from './reset-example';
import { atlasFromReport, type AtlasInput } from './atlas';
export { readResetExample } from './reset-example';
import {
  openProjectStore,
  readEvents,
  readView,
  rebuildViews,
  type ProjectStore,
} from '@buildbrief/store';

/** Workspace whose .buildbrief ledger this workbench reads. */
export function workspaceRoot(): string {
  if (process.env['BB_WORKSPACE'] !== undefined && process.env['BB_WORKSPACE'] !== '') {
    return resolve(process.env['BB_WORKSPACE']);
  }
  // Default: the Build Brief repo itself (two levels up from apps/web).
  return resolve(process.cwd(), '..', '..');
}

export function ledgerExists(root: string): boolean {
  return existsSync(join(root, '.buildbrief', 'events.jsonl'));
}

function storeFor(root: string): ProjectStore {
  return openProjectStore(root, '_web');
}

export function listProjects(root: string): string[] {
  const connected = readConnections(root).map((c) => c.project);
  const events = ledgerExists(root) ? readEvents(storeFor(root)) : [];
  return [...new Set([...connected, ...events.map((e) => e.project_id)])].sort();
}

export interface IntentRow {
  id: string;
  feature: string;
  version: number;
  state: string;
  criteria: number;
  approvedBy?: string;
}

export function listIntents(root: string, project: string): IntentRow[] {
  const views = rebuildViews(storeFor(root), project);
  return Object.values(views.intents)
    .sort((a, b) => (a.feature_id < b.feature_id ? -1 : 1))
    .map((i) => ({
      id: i.id,
      feature: i.feature_id,
      version: i.version,
      state: i.state,
      criteria: i.criteria.length,
      ...(i.approved_by !== undefined ? { approvedBy: i.approved_by } : {}),
    }));
}

export function getViews(root: string, project: string): ReturnType<typeof rebuildViews> {
  return rebuildViews(storeFor(root), project);
}

export function listReviewDecisions(root: string, project: string, run: string): ReviewDecision[] {
  return readEvents(storeFor(root), project)
    .filter((e) => e.type === 'review.decision_recorded')
    .map((e) => e.payload['decision'] as ReviewDecision)
    .filter((d) => d?.run_id === run);
}

export interface RunRow {
  id: string;
  project: string;
  revision: string;
  intent: string;
  created: string;
  summary: string;
  provider: string;
}

export function listRuns(root: string): RunRow[] {
  const dir = join(root, '.buildbrief', 'reports');
  if (!existsSync(dir)) return [];
  const rows: RunRow[] = [];
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    try {
      const r = JSON.parse(readFileSync(join(dir, f), 'utf8')) as {
        run_id: string;
        project_id: string;
        checked_revision: string;
        requirement_version_id: string;
        created_at: string;
        summary: Record<string, number>;
        provider: string;
        model: string;
      };
      rows.push({
        id: r.run_id,
        project: r.project_id ?? '',
        revision: r.checked_revision,
        intent: r.requirement_version_id,
        created: r.created_at,
        summary: Object.entries(r.summary ?? {}).map(([k, v]) => `${k}=${v}`).join(', ') || 'no criteria',
        provider: `${r.provider}/${r.model}`,
      });
    } catch {
      continue;
    }
  }
  return rows.sort((a, b) => (a.created < b.created ? 1 : -1));
}

export interface QuizRow {
  id: string;
  project_id: string;
  type: string;
  revision: string;
  status: string;
  criterion_ids: string[];
  prompt: string;
  rubric: string[];
}

export function listQuizzes(root: string): QuizRow[] {
  return readView<QuizRow[]>(storeFor(root), 'quizzes', []);
}

export interface ResponseRow {
  id: string;
  quiz_id: string;
  actor_id: string;
  response_text: string;
  graded: string;
  graded_by?: string;
}

export function listResponses(root: string): ResponseRow[] {
  return readView<ResponseRow[]>(storeFor(root), 'responses', []);
}

/** Every evidence pointer across all stored reports, by pointer id. */
export function allReportEvidence(root: string): Map<string, EvidencePointer> {
  const byId = new Map<string, EvidencePointer>();
  const dir = join(root, '.buildbrief', 'reports');
  let files: string[] = [];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  } catch {
    return byId;
  }
  for (const f of files) {
    try {
      const report = JSON.parse(readFileSync(join(dir, f), 'utf8')) as {
        results: { evidence: EvidencePointer[] }[];
      };
      for (const r of report.results) {
        for (const e of r.evidence) byId.set(e.id, e);
      }
    } catch {
      continue;
    }
  }
  return byId;
}

export function readReportFile(root: string, runId: string): unknown | null {
  if (runId === '' || basename(runId) !== runId || runId.includes('/') || runId.includes('\\')) return null;
  const p = join(root, '.buildbrief', 'reports', `${runId}.json`);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

/** Public entry may expose only labeled built-in examples, never a user's project. */
export function landingAtlas(root: string, requested = '') {
  const candidates = readConnections(root).filter((c) => c.kind === 'example' && /^example-reset-[a-f0-9]{8}$/.test(c.project));
  const connection = requested ? candidates.find((c) => c.project === requested) : candidates.at(-1);
  if (!connection) return null;
  const state = resetState(root, connection.project);
  if (!state) return null;
  const before = readReportFile(root, state.before) as AtlasInput | null;
  const after = readReportFile(root, state.after) as AtlasInput | null;
  if (!before || !after || before.project_id !== connection.project || after.project_id !== connection.project || before.run_id !== state.before || after.run_id !== state.after || before.checked_revision !== state.beforeRevision || after.checked_revision !== state.afterRevision || !Array.isArray(before.results) || !Array.isArray(after.results)) return null;
  try { return { project: connection.project, before: atlasFromReport(before, connection.repo), after: atlasFromReport(after, connection.repo), probe: state.latestProbe ?? null }; }
  catch { return null; }
}
