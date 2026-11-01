import {
  adjudicate,
  contentHash,
  newId,
  nowIso,
  resolveCitation,
  type AtomicCriterion,
  type CandidateUnrequestedChange,
  type EvidencePointer,
  type IntentVersion,
  type VerificationFinding,
} from '@buildbrief/domain';
import {
  type AssessmentInput,
  type EvidenceExcerpt,
  type ModelProvider,
} from '@buildbrief/model-meta';
import {
  captureSnapshot,
  lookupFile,
  scanSecrets,
  snippetHash,
  type Snapshot,
  type TestRun,
} from '@buildbrief/repo';
import { retrieve, type RetrievalTrace } from './retrieve.js';
import { reverseCheck } from './reverse.js';

export interface CoveringTestRun {
  run: TestRun;
  /** Repository-relative paths this run exercises. */
  covers: string[];
}

export interface VerifyOptions {
  projectId: string;
  intent: IntentVersion;
  root: string;
  provider: ModelProvider;
  testRuns?: CoveringTestRun[];
  baseRevision?: string;
  runId?: string;
  at?: string;
}

export interface CriterionResult {
  criterion: AtomicCriterion;
  trace: RetrievalTrace;
  evidence: EvidencePointer[];
  finding: VerificationFinding;
  adjudicatorNotes: string[];
  droppedEvidenceIds: string[];
}

export interface VerificationReport {
  run_id: string;
  project_id: string;
  requirement_version_id: string;
  checked_revision: string;
  base_revision: string | null;
  created_at: string;
  provider: string;
  model: string;
  results: CriterionResult[];
  orphans: CandidateUnrequestedChange[];
  summary: Record<string, number>;
  /**
   * Test runs attached to this verification (command, exit, counts, covers).
   * Empty when no tests were executed: grades then rest on source evidence
   * alone, and the renderers say so. Logs are content-addressed by hash only.
   */
  test_runs: CoveringTestRun[];
}

const MAX_EVIDENCE_PER_CRITERION = 4;
const EXCERPT_CHARS = 1500;

function coversPath(covered: string, path: string): boolean {
  const declared = covered.replaceAll('\\', '/').replace(/^\.\//, '');
  const candidate = path.replaceAll('\\', '/').replace(/^\.\//, '');
  return declared.endsWith('/') ? candidate.startsWith(declared) : candidate === declared;
}

function testGradeUpgrade(
  ev: EvidencePointer,
  runs: CoveringTestRun[],
  revision: string,
): EvidencePointer {
  if (ev.tier !== 'E1_source' || ev.path === undefined) return ev;
  const hit = runs.find(
    (r) =>
      r.run.revision === revision &&
      r.run.exit_code === 0 &&
      r.run.failed === 0 &&
      r.covers.some((c) => coversPath(c, ev.path as string)),
  );
  if (hit === undefined) return ev;
  return { ...ev, tier: 'E2_test', test_run_id: hit.run.id };
}

export async function verify(opts: VerifyOptions): Promise<VerificationReport> {
  if (opts.intent.state !== 'approved') {
    throw new Error(`cannot verify: intent version ${opts.intent.id} is '${opts.intent.state}', not approved`);
  }
  const runId = opts.runId ?? newId('run');
  const at = opts.at ?? nowIso();
  const snap: Snapshot = captureSnapshot(opts.root);
  const revision = snap.revision;
  const runs = opts.testRuns ?? [];
  // Secret-shaped content is never transmitted to a model: path cited, content withheld.
  const secretPaths = new Set(scanSecrets(opts.root, snap.manifest).map((h) => h.path));
  const secretGaps: string[] = [];

  const results: CriterionResult[] = [];
  for (const criterion of opts.intent.criteria) {
    // Negative criteria are retrieved by their forbidden patterns as well as
    // their vocabulary: absence must be checked where a violation could hide.
    const searchTerms = criterion.negative === true
      ? [...criterion.keywords, ...(criterion.forbidden_terms ?? [])]
      : criterion.keywords;
    const trace = retrieve(criterion.id, searchTerms, snap, opts.root);
    const evidence: EvidencePointer[] = [];
    const excerpts: EvidenceExcerpt[] = [];
    for (const cand of trace.candidates.slice(0, MAX_EVIDENCE_PER_CRITERION)) {
      const entry = lookupFile(snap, opts.root, cand.path);
      if (entry === null) continue;
      const lines = entry.text.split('\n');
      const end = Math.min(cand.line_end, lines.length);
      const manifestEntry = snap.manifest.files.find((f) => f.path === cand.path);
      const pointer: EvidencePointer = {
        id: contentHash(`ev|${runId}|${criterion.id}|${cand.path}|${cand.line_start}|${end}`).slice(0, 18),
        tier: 'E1_source',
        revision,
        path: cand.path,
        line_start: cand.line_start,
        line_end: end,
        snippet_hash: snippetHash(entry.text, cand.line_start, end),
        collected_at: at,
        is_stale: false,
        // Negative criteria: the span is candidate contradicting evidence, which the
        // adjudicator requires before any `contradicted` verdict may stand.
        description: criterion.negative === true
          ? `source span possibly contradicting negative requirement (${cand.matched.join(', ')})`
          : `source span matching ${cand.matched.join(', ')}`,
      };
      if (manifestEntry?.sha256 !== undefined) pointer.blob_hash = manifestEntry.sha256;
      const upgraded = testGradeUpgrade(
        { ...pointer, id: `bb_ev_${pointer.id}` },
        runs,
        revision,
      );
      evidence.push(upgraded);
      const redacted = secretPaths.has(cand.path);
      if (redacted) secretGaps.push(`${cand.path}: content withheld (secret-shaped strings detected)`);
      excerpts.push({
        evidence_id: upgraded.id,
        path: cand.path,
        line_start: cand.line_start,
        line_end: end,
        tier: upgraded.tier,
        excerpt: redacted
          ? '[withheld: secret-shaped content detected in this file; path cited, content not transmitted]'
          : lines.slice(cand.line_start - 1, end).join('\n').slice(0, EXCERPT_CHARS),
      });
    }

    const input: AssessmentInput = {
      criterion_id: criterion.id,
      criterion_text: criterion.text,
      negative: criterion.negative === true,
      forbidden_terms: criterion.forbidden_terms ?? [],
      revision,
      excerpts,
      search_exhaustive: trace.exhaustive,
    };
    const out = await opts.provider.assess(input);
    const modelVerdict = out.verdicts[0];
    const known = new Map(evidence.map((e) => [e.id, e]));
    const droppedEvidenceIds: string[] = [];
    const attached: EvidencePointer[] = [];
    if (modelVerdict !== undefined) {
      for (const id of modelVerdict.evidence_ids) {
        const e = known.get(id);
        if (e === undefined) droppedEvidenceIds.push(id);
        else attached.push(e);
      }
    }
    const citationResults = new Map<string, boolean>();
    for (const e of attached) {
      const check = resolveCitation(e, (p) => lookupFile(snap, opts.root, p), revision);
      citationResults.set(e.id, check.ok);
    }
    const fallback = {
      criterion_id: criterion.id,
      finding: 'not_established' as const,
      evidence: attached,
      coverage: {
        examined_files: trace.searched_files,
        relevant_files: trace.candidates.length,
        gaps: ['provider returned no verdict', ...secretGaps],
        negative_search_sufficient: false,
      },
      confidence: 0,
      rationale: 'provider returned no verdict',
      missing_proof: ['re-run assessment'],
    };
    const proposed = modelVerdict === undefined
      ? fallback
      : {
        criterion_id: criterion.id,
        finding: modelVerdict.finding,
        evidence: attached,
        coverage: {
          examined_files: trace.searched_files,
          relevant_files: Math.max(trace.candidates.length, modelVerdict.coverage.relevant_files),
          gaps: [...modelVerdict.coverage.gaps, ...secretGaps],
          negative_search_sufficient: modelVerdict.coverage.negative_search_sufficient && trace.exhaustive,
        },
        confidence: modelVerdict.confidence,
        rationale: modelVerdict.rationale,
        missing_proof: modelVerdict.missing_proof,
      };
    const { finding, reasons, grade } = adjudicate(proposed, citationResults, {
      requiresTier: criterion.requires_tier ?? 'E1_source',
      // Absence is evidence only for a negative criterion with an exhaustive
      // clean search: nothing retrieved, nothing attached, nowhere left to hide.
      exhaustiveNegative:
        criterion.negative === true && trace.exhaustive && attached.length === 0 && droppedEvidenceIds.length === 0,
    });
    // File-level acceptance failures cannot identify a particular failing
    // assertion, but they must prevent an unqualified supported verdict for
    // evidence in that file. Preserve source citations and explain uncertainty;
    // do not invent a criterion-specific contradiction from a failed suite.
    const failingRuns = runs.filter((r) => r.run.revision === revision &&
      (r.run.exit_code !== 0 || r.run.failed > 0) &&
      attached.some((e) => e.path !== undefined && r.covers.some((c) => coversPath(c, e.path as string))));
    const acceptanceBlocked = finding === 'supported' && failingRuns.length > 0;
    const acceptanceNote = acceptanceBlocked
      ? `Recorded acceptance command failed for a cited path (${failingRuns.map((r) => r.run.command.join(' ')).join('; ')}); source support is insufficient until the failure is resolved. File-level coverage does not identify the failing criterion.`
      : '';
    if (acceptanceBlocked) reasons.push(acceptanceNote);
    const suffix = droppedEvidenceIds.length > 0
      ? ` [model cited unknown evidence ids, ignored: ${droppedEvidenceIds.join(', ')}]`
      : '';
    const record: VerificationFinding = {
      id: `bb_finding_${contentHash(`finding|${runId}|${criterion.id}`).slice(0, 18)}`,
      project_id: opts.projectId,
      requirement_version_id: opts.intent.id,
      criterion_id: criterion.id,
      checked_revision: revision,
      finding: acceptanceBlocked ? 'not_established' : finding,
      evidence_ids: attached.map((e) => e.id),
      evidence_grade: grade,
      coverage: proposed.coverage,
      confidence: acceptanceBlocked ? Math.min(proposed.confidence, 0.3) : proposed.confidence,
      rationale: proposed.rationale + suffix + (acceptanceBlocked ? ` ${acceptanceNote}` : ''),
      missing_proof: acceptanceBlocked ? [...proposed.missing_proof, 'Resolve the recorded acceptance failure and verify again.'] : proposed.missing_proof,
      provider: opts.provider.name,
      model: opts.provider.model,
      prompt_version: out.usage.prompt_version,
      run_id: runId,
      created_at: at,
      stale: false,
    };
    results.push({ criterion, trace, evidence, finding: record, adjudicatorNotes: reasons, droppedEvidenceIds });
  }

  const orphans = reverseMap(opts, revision);
  const summary: Record<string, number> = {};
  for (const r of results) summary[r.finding.finding] = (summary[r.finding.finding] ?? 0) + 1;

  return {
    run_id: runId,
    project_id: opts.projectId,
    requirement_version_id: opts.intent.id,
    checked_revision: revision,
    base_revision: opts.baseRevision ?? null,
    created_at: at,
    provider: opts.provider.name,
    model: opts.provider.model,
    results,
    orphans,
    summary,
    test_runs: runs,
  };
}

function reverseMap(opts: VerifyOptions, revision: string): CandidateUnrequestedChange[] {
  const base = opts.baseRevision ?? opts.intent.effective_from_revision ?? null;
  if (base === null) return [];
  return reverseCheck({ intent: opts.intent, root: opts.root, from: base, to: revision });
}
