import { createHash, randomBytes } from 'node:crypto';

/** Stable short hex id, e.g. `bb_intent_a3f9c1…`. */
export function newId(prefix: string): string {
  return `bb_${prefix}_${randomBytes(9).toString('hex')}`;
}

/** Deterministic id for fixtures/benchmarks: same seed → same id. */
export function stableId(prefix: string, seed: string): string {
  const hex = createHash('sha256').update(seed).digest('hex').slice(0, 18);
  return `bb_${prefix}_${hex}`;
}

/** Canonical content hash (sha256 hex) for prompts, snippets, payloads. */
export function contentHash(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

/** ISO-8601 UTC timestamp. */
export function nowIso(): string {
  return new Date().toISOString();
}
