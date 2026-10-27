import { type Snapshot, lookupFile } from '@buildbrief/repo';

export interface CandidateSpan {
  path: string;
  line_start: number;
  line_end: number;
  matched: string[];
  /** matched keywords / total keywords, path hits weigh in via matched list. */
  score: number;
  preview: string;
}

export interface RetrievalTrace {
  criterion_id: string;
  searched_files: number;
  skipped_files: number;
  candidates: CandidateSpan[];
  /** True only when every manifest file was examined with no skips. */
  exhaustive: boolean;
}

const WINDOW = 3;

function normalize(s: string): string {
  return s.toLowerCase();
}

/**
 * Deterministic lexical retrieval. Scores keyword hits in file paths and in a
 * sliding window of source lines; returns spans centered on the best window.
 * No model, no embeddings — fully reproducible.
 */
export function retrieve(
  criterionId: string,
  keywords: string[],
  snap: Snapshot,
  root: string,
): RetrievalTrace {
  const keys = keywords.map(normalize).filter((k) => k.length > 1);
  const searched = snap.manifest.files;
  const candidates: CandidateSpan[] = [];

  for (const f of searched) {
    const entry = lookupFile(snap, root, f.path);
    if (entry === null) continue;
    const lines = entry.text.split('\n');
    const pathHits = keys.filter((k) => normalize(f.path).includes(k));

    let best: { idx: number; hits: string[] } | null = null;
    for (let i = 0; i < lines.length; i += 1) {
      const win = lines.slice(i, i + WINDOW).join('\n');
      const low = normalize(win);
      const hits = keys.filter((k) => low.includes(k));
      if (hits.length > 0 && (best === null || hits.length > best.hits.length)) {
        best = { idx: i, hits };
      }
    }
    const matched = [...new Set([...pathHits, ...(best?.hits ?? [])])];
    if (matched.length === 0) continue;
    const center = best?.idx ?? 0;
    const start = Math.max(1, center + 1 - WINDOW);
    const end = Math.min(lines.length, center + WINDOW + WINDOW);
    candidates.push({
      path: f.path,
      line_start: start,
      line_end: end,
      matched,
      score: matched.length / Math.max(1, keys.length) + (pathHits.length > 0 ? 0.1 : 0),
      preview: lines.slice(start - 1, end).join('\n').slice(0, 600),
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  // VCS/build output dirs can never hold evidence; every other skip (ignored,
  // symlinks, binaries, oversize, unreadable) voids an exhaustive negative claim.
  const materialSkips = snap.manifest.skipped.filter((s) => s.reason !== 'excluded').length;
  return {
    criterion_id: criterionId,
    searched_files: searched.length,
    skipped_files: snap.manifest.skipped.length,
    candidates: candidates.slice(0, 8),
    exhaustive: materialSkips === 0,
  };
}
