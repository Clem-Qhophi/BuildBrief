import { findingLanguage, proofLanguage } from './presentation.ts';

export interface AtlasInput {
  run_id: string; project_id: string; requirement_version_id: string; checked_revision: string; provider: string;
  results: { criterion: { id: string; text: string }; finding: { finding: string; evidence_grade: string; rationale: string; missing_proof: string[] }; evidence: { id: string; path?: string; line_start?: number; line_end?: number; test_run_id?: string }[] }[];
  test_runs?: { run: { id: string; command: string[]; exit_code: number; passed: number; failed: number }; covers: string[] }[];
}
export interface AtlasCriterion {
  id: string; text: string; status: string; label: string; proof: string; rationale: string; missing: string[];
  sources: { id: string; path: string; lines: string; href: string }[];
}
export interface AtlasRun {
  id: string; project: string; revision: string; provider: string; criteria: AtlasCriterion[];
  tests: { id: string; command: string; passed: number; failed: number; exit: number; covers: string[] }[];
  reportHref: string; briefHref: string; understandHref: string; repo: string;
}
export function atlasFromReport(report: AtlasInput, repo = ''): AtlasRun {
  const params = new URLSearchParams({ project: report.project_id, ...(repo ? { repo } : {}) });
  const reportHref = `/run/${encodeURIComponent(report.run_id)}?${params}`;
  return {
    id: report.run_id, project: report.project_id, revision: report.checked_revision, provider: report.provider, repo,
    criteria: report.results.map((r) => ({
      id: r.criterion.id, text: r.criterion.text, status: r.finding.finding,
      label: findingLanguage(r.finding.finding).label, proof: proofLanguage(r.finding.evidence_grade),
      rationale: r.finding.rationale, missing: r.finding.missing_proof,
      sources: r.evidence.filter((e) => e.path !== undefined).map((e) => ({ id: e.id, path: e.path!, lines: e.line_start === undefined ? '' : `L${e.line_start}${e.line_end === undefined ? '' : `–${e.line_end}`}`, href: `/evidence?${new URLSearchParams({ run: report.run_id, evidence: e.id, ...(repo ? { repo } : {}) })}` })),
    })),
    tests: (report.test_runs ?? []).map((t) => ({ id: t.run.id, command: t.run.command.join(' '), passed: t.run.passed, failed: t.run.failed, exit: t.run.exit_code, covers: t.covers })),
    reportHref, briefHref: `/intent/${encodeURIComponent(report.requirement_version_id)}?${params}`,
    understandHref: `${reportHref}&view=technical#understand`,
  };
}

export type AtlasNode = 'request' | 'product' | 'source' | 'tests' | 'decision' | 'understand';
export const ATLAS_NODES: { id: AtlasNode; label: string; x: number; y: number }[] = [
  { id: 'request', label: 'What you asked', x: 15, y: 50 },
  { id: 'product', label: 'The build', x: 49, y: 50 },
  { id: 'source', label: 'Source evidence', x: 83, y: 24 },
  { id: 'tests', label: 'Recorded checks', x: 83, y: 76 },
  { id: 'decision', label: 'Your decision', x: 49, y: 14 },
  { id: 'understand', label: 'Your understanding', x: 49, y: 87 },
];
export const ATLAS_CHAPTERS: { label: string; title: string; body: string; node: AtlasNode }[] = [
  { label: 'Describe', title: 'Start with the promise.', body: 'Your idea comes first. Review what should happen before a repository even exists.', node: 'request' },
  { label: 'Connect', title: 'See the product behind the screen.', body: 'Connect the implementation to the exact request. A finished interface is only part of the picture.', node: 'product' },
  { label: 'Check', title: 'A missing rule has nowhere to hide.', body: 'Follow the available source and recorded checks. Uncertainty stays visible until there is better proof.', node: 'tests' },
  { label: 'Recheck', title: 'A correction earns a fresh check.', body: 'Compare the original report with the supplied correction. A new version alone is never the proof.', node: 'source' },
  { label: 'Understand', title: 'Make it something you can own.', body: 'Inspect the proof, make your decision, and help the next person understand why the feature works.', node: 'understand' },
];
export function atlasChapter(progress: number) { return Number.isFinite(progress) ? Math.min(4, Math.max(0, Math.floor(progress * 5))) : 0; }
