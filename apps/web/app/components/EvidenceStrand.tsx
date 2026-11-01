'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

export interface StrandEvidence {
  id: string;
  tier: string;
  path?: string;
  lineStart?: number;
  lineEnd?: number;
  description: string;
  testBacked: boolean;
}

export interface StrandRow {
  criterionId: string;
  text: string;
  finding: string;
  grade: string;
  rationale: string;
  missing: string[];
  stale: boolean;
  evidence: StrandEvidence[];
}

type Filter = 'all' | 'attention' | 'established' | 'unproven';

const FILTERS: { id: Filter; label: string; match: (f: string) => boolean }[] = [
  { id: 'all', label: 'All criteria', match: () => true },
  { id: 'attention', label: 'Needs attention', match: (f) => f === 'partial' || f === 'contradicted' },
  { id: 'established', label: 'Established', match: (f) => f === 'supported' },
  { id: 'unproven', label: 'Unproven', match: (f) => f !== 'supported' && f !== 'partial' && f !== 'contradicted' },
];

function Thread({ finding, index }: { finding: string; index: number }) {
  const reduce = useReducedMotion();
  const dashed = finding !== 'supported' && finding !== 'partial' && finding !== 'contradicted';
  return (
    <svg className={`thread thread-${finding}`} viewBox="0 0 120 24" preserveAspectRatio="none" aria-hidden="true">
      <motion.path
        d="M2 12 C 38 3, 82 21, 118 12"
        fill="none"
        strokeWidth="2.6"
        strokeDasharray={dashed ? '5 5' : undefined}
        initial={reduce ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: reduce ? 0 : 0.55, delay: reduce ? 0 : Math.min(index * 0.06, 0.36), ease: 'easeOut' }}
      />
      <circle cx="2" cy="12" r="3" className="thread-dot" />
      <circle cx="118" cy="12" r={finding === 'supported' ? 3.5 : 3} className="thread-dot" fill={finding === 'supported' ? 'currentColor' : 'none'} />
    </svg>
  );
}

export default function EvidenceStrand({ rows, runId, repo }: { rows: StrandRow[]; runId: string; repo: string }) {
  const reduce = useReducedMotion();
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<string | null>(null);
  const counts = useMemo(() => {
    const m = new Map<Filter, number>();
    for (const f of FILTERS) m.set(f.id, rows.filter((r) => f.match(r.finding)).length);
    return m;
  }, [rows]);
  const visible = rows.filter((r) => FILTERS.find((f) => f.id === filter)!.match(r.finding));

  if (rows.length === 0) return null;

  return (
    <div className="strand">
      <div className="strand-head" aria-hidden="true">
        <span>Requested</span><span>Thread of proof</span><span>Cited evidence</span><span>Verdict</span>
      </div>
      <div className="strand-filters" role="group" aria-label="Filter criteria by verdict">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className="chipbtn"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
          >
            {f.label} ({counts.get(f.id) ?? 0} of {rows.length})
          </button>
        ))}
      </div>
      <motion.ul className="strand-list" layout={!reduce}>
        <AnimatePresence initial={false}>
          {visible.map((r, i) => {
            const expanded = open === r.criterionId;
            return (
              <motion.li
                key={r.criterionId}
                className={`strand-row strand-${r.finding}${r.stale ? ' is-stale' : ''}`}
                {...(reduce ? {} : { layout: 'position' as const, exit: { opacity: 0, y: -6 } })}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduce ? 0 : 0.22, ease: 'easeOut' }}
              >
                <button
                  type="button"
                  className="strand-main"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? null : r.criterionId)}
                >
                  <span className="strand-criterion">
                    <span className="strand-text">{r.text}</span>
                    <span className="evidence">grade {r.grade}{r.stale ? ' · stale' : ''}</span>
                  </span>
                  <Thread finding={r.finding} index={i} />
                  <span className="strand-evidence">
                    {r.evidence.length === 0 ? (
                      <span className="no-cite">no citation yet</span>
                    ) : (
                      r.evidence.slice(0, 3).map((e) => (
                        <span key={e.id} className="cite">
                          {e.path ?? e.id}
                          {e.lineStart !== undefined ? `#L${e.lineStart}-${e.lineEnd ?? e.lineStart}` : ''} [{e.tier}]
                          {e.testBacked ? ' test-backed' : ''}
                        </span>
                      ))
                    )}
                    {r.evidence.length > 3 ? <span className="evidence">+{r.evidence.length - 3} more below</span> : null}
                  </span>
                  <span className={`badge stamp ${r.finding}`}>{r.finding}</span>
                </button>
                <AnimatePresence initial={false}>
                  {expanded ? (
                    <motion.div
                      key="body"
                      className="strand-body"
                      initial={reduce ? false : { height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      {...(reduce ? {} : { exit: { height: 0, opacity: 0 } })}
                      transition={{ duration: reduce ? 0 : 0.25, ease: 'easeOut' }}
                    >
                      <p>{r.rationale}</p>
                      {r.missing.length > 0 ? <p><strong>Missing proof:</strong> {r.missing.join('; ')}</p> : null}
                      {r.evidence.map((e) => (
                        <p key={e.id} className="evidence">
                          <code>{e.id}</code> — {e.description}
                          {e.path !== undefined && repo !== '' ? (
                            <> <a href={`/evidence?run=${encodeURIComponent(runId)}&evidence=${encodeURIComponent(e.id)}&repo=${encodeURIComponent(repo)}`}>view source</a></>
                          ) : null}
                        </p>
                      ))}
                      {r.evidence.length === 0 ? (
                        <p className="muted">This thread ends open: no mechanically valid citation was stored for this criterion at this revision.</p>
                      ) : null}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </motion.ul>
      {visible.length === 0 ? <p className="muted">No criteria in this group for this run.</p> : null}
    </div>
  );
}
