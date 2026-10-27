import { type EvidenceTier, isEvidenceTier } from './vocab.js';

export interface EvidencePointer {
  id: string;
  tier: EvidenceTier;
  revision: string;
  path?: string;
  line_start?: number;
  line_end?: number;
  blob_hash?: string;
  snippet_hash?: string;
  ast_symbol?: string;
  test_run_id?: string;
  runtime_trace_id?: string;
  collected_at: string;
  is_stale: boolean;
  description: string;
}

export interface Coverage {
  examined_files: number;
  relevant_files: number;
  gaps: string[];
  /** True only when the examined scope is provably exhaustive for a negative claim. */
  negative_search_sufficient: boolean;
}

/** Result of mechanically re-resolving one evidence pointer against a repo snapshot. */
export type CitationCheck =
  | { ok: true }
  | { ok: false; reason: CitationFailure };

export type CitationFailure =
  | 'UNKNOWN_PATH'
  | 'LINE_OUT_OF_RANGE'
  | 'REVISION_MISMATCH'
  | 'HASH_MISMATCH'
  | 'STALE'
  | 'EXCLUDED_PATH';

export interface ResolvableEvidence extends EvidencePointer {
  /** File text at the pinned revision, when the tier requires source resolution. */
  file_text?: string;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export function validateEvidencePointer(v: unknown): { ok: true; value: EvidencePointer } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!isRecord(v)) return { ok: false, errors: ['evidence must be an object'] };
  if (typeof v['id'] !== 'string' || v['id'].length === 0) errors.push('id: nonempty string required');
  if (!isEvidenceTier(v['tier'])) errors.push('tier: unknown EvidenceTier');
  if (typeof v['revision'] !== 'string' || v['revision'].length === 0) errors.push('revision: nonempty string required');
  if (typeof v['collected_at'] !== 'string' || Number.isNaN(Date.parse(v['collected_at']))) errors.push('collected_at: ISO timestamp required');
  if (typeof v['is_stale'] !== 'boolean') errors.push('is_stale: boolean required');
  if (typeof v['description'] !== 'string') errors.push('description: string required');
  if (v['line_start'] !== undefined && (typeof v['line_start'] !== 'number' || v['line_start'] < 1)) errors.push('line_start: 1-based number required');
  if (v['line_end'] !== undefined && (typeof v['line_end'] !== 'number' || v['line_end'] < 1)) errors.push('line_end: 1-based number required');
  if (
    typeof v['line_start'] === 'number' &&
    typeof v['line_end'] === 'number' &&
    v['line_end'] < v['line_start']
  ) {
    errors.push('line_end must be >= line_start');
  }
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: v as unknown as EvidencePointer };
}

/**
 * Mechanical citation resolver. Pure function: no I/O, no model.
 * `lookup(path)` returns file text + owning revision, or null when absent/excluded.
 */
export function resolveCitation(
  ev: ResolvableEvidence,
  lookup: (path: string) => { text: string; revision: string } | null,
  checkedRevision: string,
): CitationCheck {
  if (ev.is_stale) return { ok: false, reason: 'STALE' };
  if (ev.tier === 'E0_claim') return { ok: true };
  if (ev.revision !== checkedRevision) return { ok: false, reason: 'REVISION_MISMATCH' };
  if (ev.tier === 'E2_test' || ev.tier === 'E3_runtime' || ev.tier === 'E4_production') {
    // Source-span checks below apply when a path span is attached; run/test identity
    // is validated by the store layer (run fingerprint match). Path-less pointers pass here.
    if (ev.path === undefined) return { ok: true };
  }
  if (ev.path === undefined) {
    // E1 without a path proves nothing about source.
    return ev.tier === 'E1_source' ? { ok: false, reason: 'UNKNOWN_PATH' } : { ok: true };
  }
  const file = lookup(ev.path);
  if (file === null) return { ok: false, reason: 'UNKNOWN_PATH' };
  if (file.revision !== ev.revision) return { ok: false, reason: 'REVISION_MISMATCH' };
  const lines = file.text.split('\n');
  if (ev.line_start !== undefined) {
    if (ev.line_start > lines.length) return { ok: false, reason: 'LINE_OUT_OF_RANGE' };
    const end = ev.line_end ?? ev.line_start;
    if (end > lines.length) return { ok: false, reason: 'LINE_OUT_OF_RANGE' };
  }
  return { ok: true };
}
