import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  contentHash,
  type EventType,
  isEventType,
  type LedgerEvent,
  newId,
  nowIso,
} from '@buildbrief/domain';

/** Canonical JSON: sorted keys, no whitespace. */
export function canonicalJson(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(',')}]`;
  if (typeof v === 'object' && v !== null) {
    const keys = Object.keys(v).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson((v as Record<string, unknown>)[k])}`).join(',')}}`;
  }
  return JSON.stringify(v) ?? 'null';
}

export interface ProjectStore {
  root: string;
  projectId: string;
}

export function openProjectStore(workspaceRoot: string, projectId: string): ProjectStore {
  // Pure handle: never touches the filesystem. Reads tolerate missing files;
  // writes create their directories. A read-only command must not leave a
  // `.buildbrief/` behind in whatever directory it ran from.
  return { root: join(workspaceRoot, '.buildbrief'), projectId };
}

function eventsPath(s: ProjectStore): string {
  return join(s.root, 'events.jsonl');
}

export function readEvents(s: ProjectStore, projectId?: string): LedgerEvent[] {
  const p = eventsPath(s);
  if (!existsSync(p)) return [];
  const lines = readFileSync(p, 'utf8').split('\n').filter((l) => l.trim().length > 0);
  const out: LedgerEvent[] = [];
  for (const line of lines) {
    const e = JSON.parse(line) as LedgerEvent;
    if (projectId !== undefined && e.project_id !== projectId) continue;
    out.push(e);
  }
  return out;
}

function lastHash(s: ProjectStore, projectId: string): string {
  const events = readEvents(s, projectId);
  return events.length === 0 ? 'GENESIS' : (events[events.length - 1] as LedgerEvent).hash;
}

export function appendEvent(
  s: ProjectStore,
  type: EventType,
  projectId: string,
  payload: Record<string, unknown>,
  opts: { id?: string; at?: string } = {},
): LedgerEvent {
  if (!isEventType(type)) throw new Error(`unknown event type: ${String(type)}`);
  const prev = lastHash(s, projectId);
  const id = opts.id ?? newId('evt');
  const at = opts.at ?? nowIso();
  const hash = contentHash(`${prev}|${type}|${projectId}|${at}|${canonicalJson(payload)}`);
  const event: LedgerEvent = { id, type, project_id: projectId, at, prev, hash, payload };
  mkdirSync(s.root, { recursive: true });
  appendFileSync(eventsPath(s), `${JSON.stringify(event)}\n`, 'utf8');
  return event;
}

/** Recomputes the hash chain; returns the first broken event id, or null when intact. */
export function verifyChain(s: ProjectStore, projectId: string): { ok: true } | { ok: false; brokenAt: string } {
  const events = readEvents(s, projectId);
  let prev = 'GENESIS';
  for (const e of events) {
    if (e.prev !== prev) return { ok: false, brokenAt: e.id };
    const recomputed = contentHash(`${e.prev}|${e.type}|${e.project_id}|${e.at}|${canonicalJson(e.payload)}`);
    if (recomputed !== e.hash) return { ok: false, brokenAt: e.id };
    prev = e.hash;
  }
  return { ok: true };
}

// ---- Materialized views ------------------------------------------------

export function viewPath(s: ProjectStore, name: string): string {
  return join(s.root, 'state', `${name}.json`);
}

export function readView<T>(s: ProjectStore, name: string, fallback: T): T {
  const p = viewPath(s, name);
  if (!existsSync(p)) return fallback;
  return JSON.parse(readFileSync(p, 'utf8')) as T;
}

export function writeView(s: ProjectStore, name: string, value: unknown): void {
  mkdirSync(dirname(viewPath(s, name)), { recursive: true });
  writeFileSync(viewPath(s, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
