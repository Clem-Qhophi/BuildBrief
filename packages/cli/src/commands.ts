import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  approveIntent,
  extractDraft,
  type EvidencePointer,
  type IntentVersion,
  type QuizItem,
  type QuizResponse,
  type VerificationFinding,
} from '@buildbrief/domain';
import {
  answerQuiz,
  comprehensionMap,
  explainFeature,
  gradeResponse,
  makeQuiz,
  retireStale,
  roleTour,
} from '@buildbrief/learning';
import { collectManifest, safeJoin } from '@buildbrief/repo';
import { MetaApiProvider, metaConfigFromEnv, MockProvider, type ModelProvider } from '@buildbrief/model-meta';
import { RuleAssessor } from '@buildbrief/verifier';
import {
  autopsy,
  AUTOPSY_FAILURES,
  packsForFailures,
  renderHtml,
  renderJson,
  renderMarkdown,
  reverseCheck,
  verify,
  type AutopsyAttempt,
  type VerificationReport,
} from '@buildbrief/verifier';
import {
  appendEvent,
  latestRevision,
  loadViews,
  openProjectStore,
  readView,
  rebuildViews,
  writeView,
  type ProjectStore,
} from '@buildbrief/store';
import { headSha } from '@buildbrief/repo';
import { flag, requireFlag, type ParsedArgs } from './args.js';

function storeFor(cwd: string, project: string): ProjectStore {
  return openProjectStore(cwd, project);
}

function readReport(cwd: string, runId: string): VerificationReport {
  const p = join(cwd, '.buildbrief', 'reports', `${runId}.json`);
  return JSON.parse(readFileSync(p, 'utf8')) as VerificationReport;
}

function writeReportArtifacts(cwd: string, report: VerificationReport, format: string, out?: string): string {
  const dir = join(cwd, '.buildbrief', 'reports');
  mkdirSync(dir, { recursive: true });
  writeReportArtifactsJson(dir, report);
  const text = format === 'html' ? renderHtml(report) : format === 'json' ? renderJson(report) : renderMarkdown(report);
  const ext = format === 'html' ? 'html' : format === 'json' ? 'json' : 'md';
  const dest = out ?? join(dir, `${report.run_id}.${ext}`);
  writeFileSync(dest, text, 'utf8');
  return dest;
}

function writeReportArtifactsJson(dir: string, report: VerificationReport): void {
  writeFileSync(join(dir, `${report.run_id}.json`), renderJson(report), 'utf8');
}

export function cmdCapture(cwd: string, args: ParsedArgs): number {
  const project = requireFlag(args, 'project');
  const feature = flag(args, 'feature', 'general');
  let prompt = flag(args, 'prompt');
  const promptFile = flag(args, 'prompt-file');
  if (promptFile !== '') prompt = readFileSync(promptFile, 'utf8');
  if (prompt === '') throw new Error('provide --prompt "..." or --prompt-file <path>');
  const s = storeFor(cwd, project);
  const completeness = (flag(args, 'source', 'manual') === 'hook' ? 'hook_exact' : 'manual') as 'hook_exact' | 'manual';
  const draft = extractDraft({
    projectId: project,
    featureId: feature,
    prompt,
    ...(flag(args, 'agent') !== '' ? { sourceAgent: flag(args, 'agent') } : {}),
    ...(flag(args, 'session') !== '' ? { sessionId: flag(args, 'session') } : {}),
    completeness,
  });
  appendEvent(s, 'prompt.captured', project, {
    prompt,
    source_hash: draft.source_hash,
    source: flag(args, 'source', 'manual'),
    session_id: draft.session_id,
  });
  appendEvent(s, 'intent.extracted', project, { intent: draft });
  rebuildViews(s, project);
  console.log(`captured ${draft.id} — ${draft.criteria.length} draft criteria, ${draft.constraints.length} constraints, ${draft.ambiguity_flags.length} ambiguity flags (state: draft, NOT approved)`);
  return 0;
}

export function cmdList(cwd: string, args: ParsedArgs): number {
  const project = requireFlag(args, 'project');
  const s = storeFor(cwd, project);
  const views = rebuildViews(s, project);
  for (const i of Object.values(views.intents)) {
    console.log(`${i.id} v${i.version} [${i.state}] feature=${i.feature_id} criteria=${i.criteria.length}`);
  }
  return 0;
}

export function cmdApprove(cwd: string, args: ParsedArgs): number {
  const project = requireFlag(args, 'project');
  const actor = requireFlag(args, 'actor');
  const intentId = requireFlag(args, 'intent');
  const s = storeFor(cwd, project);
  const views = rebuildViews(s, project);
  const current = views.intents[intentId];
  if (current === undefined) throw new Error(`unknown intent ${intentId}`);
  const r = approveIntent({ intent: current as IntentVersion, actor });
  if (!r.ok) throw new Error(`cannot approve: ${r.error.message}`);
  appendEvent(s, 'intent.approved', project, { intent: r.intent, actor });
  rebuildViews(s, project);
  console.log(`approved ${r.intent.id} v${r.intent.version} by ${actor}`);
  return 0;
}

function chooseProvider(args: ParsedArgs): ModelProvider {
  const name = flag(args, 'provider', 'rules');
  if (name === 'rules') return new RuleAssessor();
  if (name === 'mock') return new MockProvider();
  if (name === 'meta') return new MetaApiProvider(metaConfigFromEnv());
  throw new Error(`unknown provider '${name}' (rules|mock|meta)`);
}

export async function cmdVerify(cwd: string, args: ParsedArgs): Promise<number> {
  const project = requireFlag(args, 'project');
  const intentId = requireFlag(args, 'intent');
  const repoRoot = flag(args, 'repo', cwd);
  const s = storeFor(cwd, project);
  const views = rebuildViews(s, project);
  const intent = views.intents[intentId] as IntentVersion | undefined;
  if (intent === undefined) throw new Error(`unknown intent ${intentId}`);
  const provider = chooseProvider(args);
  const base = flag(args, 'base') || undefined;
  appendEvent(s, 'verification.started', project, { intent_id: intentId, provider: provider.name });
  const report = await verify({
    projectId: project, intent, root: repoRoot, provider,
    ...(base !== undefined ? { baseRevision: base } : {}),
  });
  appendEvent(s, 'repo.snapshot.created', project, { revision: report.checked_revision, files: report.results[0]?.trace.searched_files ?? 0 });
  for (const r of report.results) {
    appendEvent(s, 'finding.recorded', project, { finding: r.finding });
  }
  for (const o of report.orphans) {
    appendEvent(s, 'change.orphan_flagged', project, { orphan: o });
  }
  rebuildViews(s, project);
  const dest = writeReportArtifacts(cwd, report, flag(args, 'format', 'md'), flag(args, 'out') || undefined);
  console.log(`run ${report.run_id} @ ${report.checked_revision} [${provider.name}/${provider.model}]`);
  for (const r of report.results) {
    console.log(`  [${r.finding.finding}/${r.finding.evidence_grade}] ${r.criterion.text}`);
  }
  for (const o of report.orphans) {
    console.log(`  orphan [${o.risk}] ${o.path}: ${o.why_flagged}`);
  }
  console.log(`report: ${dest}`);
  return 0;
}

export async function cmdRecheck(cwd: string, args: ParsedArgs): Promise<number> {
  const project = requireFlag(args, 'project');
  const intentId = requireFlag(args, 'intent');
  const s = storeFor(cwd, project);
  const before = rebuildViews(s, project);
  const oldIds = Object.values(before.findings)
    .filter((f: VerificationFinding) => f.requirement_version_id === intentId)
    .map((f: VerificationFinding) => f.id);
  const code = await cmdVerify(cwd, args);
  const after = rebuildViews(s, project);
  const freshIds = Object.values(after.findings)
    .filter((f: VerificationFinding) => f.requirement_version_id === intentId && !oldIds.includes(f.id))
    .map((f: VerificationFinding) => f.id);
  if (oldIds.length > 0) {
    appendEvent(s, 'evidence.invalidated', project, { finding_ids: oldIds, superseded_by_findings: freshIds });
    appendEvent(s, 'recheck.completed', project, { intent_id: intentId, invalidated: oldIds.length, fresh: freshIds.length });
    rebuildViews(s, project);
    console.log(`recheck: invalidated ${oldIds.length} older finding(s), recorded ${freshIds.length} fresh`);
  }
  return code;
}

export function cmdReverse(cwd: string, args: ParsedArgs): number {
  const project = requireFlag(args, 'project');
  const intentId = requireFlag(args, 'intent');
  const repoRoot = flag(args, 'repo', cwd);
  const from = requireFlag(args, 'from');
  const to = flag(args, 'to', headSha(repoRoot) ?? '');
  if (to === '') throw new Error('target repo has no commits');
  const s = storeFor(cwd, project);
  const views = rebuildViews(s, project);
  const intent = views.intents[intentId] as IntentVersion | undefined;
  if (intent === undefined) throw new Error(`unknown intent ${intentId}`);
  const orphans = reverseCheck({ intent, root: repoRoot, from, to });
  for (const o of orphans) appendEvent(s, 'change.orphan_flagged', project, { orphan: o });
  rebuildViews(s, project);
  if (orphans.length === 0) console.log('no possibly-unrequested changes flagged');
  for (const o of orphans) console.log(`[${o.risk}] ${o.path} — ${o.why_flagged} (flags: ${o.flags.join(', ')})`);
  return 0;
}

export function cmdFix(cwd: string, args: ParsedArgs): number {
  const runId = requireFlag(args, 'run');
  const s = storeFor(cwd, requireFlag(args, 'project'));
  const project = requireFlag(args, 'project');
  const report = readReport(cwd, runId);
  const views = rebuildViews(s, project);
  const intent = views.intents[report.requirement_version_id] as IntentVersion | undefined;
  if (intent === undefined) throw new Error('intent for report not found in ledger');
  const packs = packsForFailures({ id: `pack-${runId}`, projectId: project, intent, results: report.results, at: new Date().toISOString() });
  for (const p of packs) appendEvent(s, 'correction.pack_created', project, { pack: p });
  rebuildViews(s, project);
  if (packs.length === 0) console.log('nothing to fix: all criteria supported');
  for (const p of packs) {
    console.log(`--- pack ${p.id} (finding: ${p.finding_ids.join(',')}) ---`);
    console.log(p.instructions);
    console.log(`scope: ${p.proposed_change_scope.join(', ')} | do_not_touch: ${p.do_not_touch.join(', ')}`);
    console.log(`acceptance: ${p.acceptance_commands.join(' && ')}`);
    console.log(`unknowns: ${p.unknowns.join('; ')}`);
  }
  return 0;
}

export function cmdReport(cwd: string, args: ParsedArgs): number {
  const runId = requireFlag(args, 'run');
  const report = readReport(cwd, runId);
  const format = flag(args, 'format', 'md');
  const text = format === 'html' ? renderHtml(report) : format === 'json' ? renderJson(report) : renderMarkdown(report);
  const out = flag(args, 'out');
  if (out !== '') writeFileSync(out, text, 'utf8');
  else console.log(text);
  return 0;
}

function loadIntent(cwd: string, project: string, intentId: string): { store: ProjectStore; intent: IntentVersion } {
  const store = storeFor(cwd, project);
  const views = rebuildViews(store, project);
  const intent = views.intents[intentId] as IntentVersion | undefined;
  if (intent === undefined) throw new Error(`unknown intent ${intentId}`);
  return { store, intent };
}

function loadQuizzes(cwd: string, project: string): { store: ProjectStore; quizzes: QuizItem[] } {
  const store = storeFor(cwd, project);
  return { store, quizzes: readView<QuizItem[]>(store, 'quizzes', []) };
}

function saveQuizzes(store: ProjectStore, quizzes: QuizItem[]): void {
  writeView(store, 'quizzes', quizzes);
}

export function cmdExplain(cwd: string, args: ParsedArgs): number {
  const project = requireFlag(args, 'project');
  const { intent } = loadIntent(cwd, project, requireFlag(args, 'intent'));
  const report = readReport(cwd, requireFlag(args, 'run'));
  const ex = explainFeature(intent, report);
  console.log(ex.summary);
  for (const r of ex.rules) {
    console.log(`\n[${r.finding}] ${r.criterion_text}`);
    for (const e of r.evidence) {
      console.log(`  evidence ${e.id} [${e.tier}]${e.path !== undefined ? ` ${e.path}${e.lines !== undefined ? `#${e.lines}` : ''}` : ''}`);
    }
    console.log(`  ${r.rationale}`);
    for (const m of r.missing_proof) console.log(`  missing proof: ${m}`);
  }
  if (ex.unknowns.length > 0) {
    console.log('\nUnknowns (not established — ask the owner, do not guess):');
    for (const u of ex.unknowns) console.log(`  - ${u}`);
  }
  return 0;
}

function allReportEvidence(cwd: string): Map<string, EvidencePointer> {
  const dir = join(cwd, '.buildbrief', 'reports');
  const byId = new Map<string, EvidencePointer>();
  let files: string[] = [];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  } catch {
    return byId;
  }
  for (const f of files) {
    try {
      const report = JSON.parse(readFileSync(join(dir, f), 'utf8')) as VerificationReport;
      for (const r of report.results) {
        for (const e of r.evidence) byId.set(e.id, e);
      }
    } catch {
      continue;
    }
  }
  return byId;
}

export function cmdQuiz(cwd: string, args: ParsedArgs): number {
  const project = requireFlag(args, 'project');
  const { store, intent } = loadIntent(cwd, project, requireFlag(args, 'intent'));
  const report = readReport(cwd, requireFlag(args, 'run'));
  const typesFlag = flag(args, 'types', 'locate,predict');
  const types = typesFlag.split(',').map((t) => t.trim()).filter((t) => t === 'locate' || t === 'predict' || t === 'explain_back') as ('locate' | 'predict' | 'explain_back')[];
  const fresh = makeQuiz({
    projectId: project, intent, report,
    ...(types.length > 0 ? { types } : {}),
  });
  const { quizzes: stored } = loadQuizzes(cwd, project);
  const known = new Set(stored.map((q) => q.id));
  const merged = [...stored, ...fresh.filter((q) => !known.has(q.id))];

  const repoRoot = flag(args, 'repo');
  let finalList = merged;
  if (repoRoot !== '') {
    const manifest = collectManifest(repoRoot, null);
    const current = new Map<string, string>();
    for (const f of manifest.files) {
      try {
        current.set(f.path, readFileSync(safeJoin(repoRoot, f.path), 'utf8'));
      } catch {
        continue;
      }
    }
    finalList = retireStale(merged, headSha(repoRoot) ?? report.checked_revision, current, allReportEvidence(cwd));
  }
  saveQuizzes(store, finalList);
  for (const q of fresh) {
    console.log(`--- [${q.type}/${q.status}] ${q.id} ---`);
    console.log(q.prompt);
    if (q.type === 'locate') console.log('(answer with file path and line range; graded mechanically)');
    else console.log('(open response; graded by a human owner, never by a model)');
  }
  const retired = finalList.filter((q) => q.status === 'retired').length;
  if (retired > 0) console.log(`note: ${retired} stored question(s) retired (evidence moved)`);
  return 0;
}

export function cmdAnswer(cwd: string, args: ParsedArgs): number {
  const project = requireFlag(args, 'project');
  const quizId = requireFlag(args, 'quiz');
  const actor = requireFlag(args, 'actor');
  const text = requireFlag(args, 'text');
  const { store } = loadQuizzes(cwd, project);
  const quizzes = readView<QuizItem[]>(store, 'quizzes', []);
  const quiz = quizzes.find((q) => q.id === quizId);
  if (quiz === undefined) throw new Error(`unknown quiz ${quizId}`);
  const evidence = allReportEvidence(cwd);
  const pointers = quiz.evidence_ids.map((id) => evidence.get(id)).filter((e) => e !== undefined);
  const response = answerQuiz({ quiz, actor, text, evidence: pointers });
  const responses = readView<QuizResponse[]>(store, 'responses', []);
  responses.push(response);
  writeView(store, 'responses', responses);
  appendEvent(store, 'quiz.answer_submitted', project, { response });
  rebuildViews(store, project);
  console.log(`recorded ${response.id}: graded ${response.graded}${response.graded_by !== undefined ? ` by ${response.graded_by}` : ' (awaiting human grade)'}`);
  return 0;
}

export function cmdGrade(cwd: string, args: ParsedArgs): number {
  const project = requireFlag(args, 'project');
  const responseId = requireFlag(args, 'response');
  const grade = requireFlag(args, 'grade');
  if (grade !== 'pass' && grade !== 'fail') throw new Error("--grade must be 'pass' or 'fail'");
  const by = requireFlag(args, 'by');
  const store = storeFor(cwd, project);
  const responses = readView<QuizResponse[]>(store, 'responses', []);
  const idx = responses.findIndex((r) => r.id === responseId);
  if (idx === -1) throw new Error(`unknown response ${responseId}`);
  responses[idx] = gradeResponse(responses[idx] as QuizResponse, grade, by);
  writeView(store, 'responses', responses);
  console.log(`graded ${responseId}: ${grade} by ${by}`);
  return 0;
}

export function cmdMap(cwd: string, args: ParsedArgs): number {
  const project = requireFlag(args, 'project');
  const { intent } = loadIntent(cwd, project, requireFlag(args, 'intent'));
  const store = storeFor(cwd, project);
  const views = rebuildViews(store, project);
  const quizzes = readView<QuizItem[]>(store, 'quizzes', []);
  const responses = readView<QuizResponse[]>(store, 'responses', []);
  const repoRoot = flag(args, 'repo');
  const intentFindings = Object.values(views.findings).filter(
    (f: VerificationFinding) => f.requirement_version_id === intent.id,
  );
  const currentRevision = repoRoot !== ''
    ? (headSha(repoRoot) ?? '')
    : latestRevision(intentFindings);
  if (currentRevision === '') {
    throw new Error('cannot determine current revision: pass --repo <dir> or verify first');
  }
  const findings = new Map<string, string>();
  for (const f of intentFindings) {
    findings.set(f.criterion_id, `${f.finding}${f.stale ? ' (stale)' : ''}`);
  }
  const cells = comprehensionMap({
    criteria: intent.criteria.map((c) => ({ id: c.id, text: c.text })),
    findings,
    quizzes: quizzes.filter((q) => q.project_id === project),
    responses,
    currentRevision,
  });
  console.log(`comprehension map: ${intent.feature_id} v${intent.version} @ ${currentRevision.slice(0, 7)}`);
  for (const c of cells) {
    console.log(`[${c.status}] ${c.criterion_id} (finding: ${c.finding}; quizzes: ${c.quiz_count}, pass: ${c.pass}, fail: ${c.fail}, pending: ${c.pending})`);
    console.log(`  ${c.note}`);
  }
  return 0;
}

export function cmdTour(cwd: string, args: ParsedArgs): number {
  const project = requireFlag(args, 'project');
  const { store, intent } = loadIntent(cwd, project, requireFlag(args, 'intent'));
  const report = readReport(cwd, requireFlag(args, 'run'));
  const role = flag(args, 'role', 'engineer');
  const brief = roleTour({ projectId: project, role, intent, report });
  appendEvent(store, 'role.tour_generated', project, { tour: brief });
  rebuildViews(store, project);
  console.log(`# ${role} tour: ${intent.feature_id} @ ${brief.revision.slice(0, 7)}`);
  for (const s of brief.sections) {
    console.log(`\n## ${s.heading}\n${s.body}`);
  }
  console.log('\nUnknowns (not established — confirm with the owner):');
  for (const u of brief.unknowns) console.log(`- ${u}`);
  return 0;
}

export function cmdAutopsy(cwd: string, args: ParsedArgs): number {
  const project = requireFlag(args, 'project');
  const { intent } = loadIntent(cwd, project, requireFlag(args, 'intent'));
  const onlyCriterion = flag(args, 'criterion');
  const store = storeFor(cwd, project);
  const views = rebuildViews(store, project);
  const failures = new Set<string>(AUTOPSY_FAILURES);
  const byCriterion = new Map<string, VerificationFinding[]>();
  for (const f of Object.values(views.findings)) {
    if (f.requirement_version_id !== intent.id) continue;
    if (!failures.has(f.finding)) continue;
    const list = byCriterion.get(f.criterion_id) ?? [];
    list.push(f);
    byCriterion.set(f.criterion_id, list);
  }
  const criterionIds = onlyCriterion !== ''
    ? [onlyCriterion]
    : intent.criteria.map((c) => c.id);
  const packs = Object.values(views.packs);
  const orphans = Object.values(views.orphans);
  let any = false;
  for (const cid of criterionIds) {
    const criterion = intent.criteria.find((c) => c.id === cid);
    if (criterion === undefined) {
      console.log(`${cid}: not a criterion of this intent`);
      continue;
    }
    const failed = (byCriterion.get(cid) ?? []).sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
    if (failed.length < 2) {
      console.log(`${cid}: only ${failed.length} failed attempt(s) — autopsy needs at least two; use 'bb fix' for a single failure`);
      continue;
    }
    const attempts: AutopsyAttempt[] = failed.map((f, i) => {
      let evidence: AutopsyAttempt['evidence'] = [];
      try {
        const rep = readReport(cwd, f.run_id);
        const row = rep.results.find((r) => r.criterion.id === cid);
        evidence = (row?.evidence ?? [])
          .filter((e) => e.path !== undefined)
          .map((e) => ({
            path: e.path as string,
            ...(e.line_start !== undefined ? { line_start: e.line_start } : {}),
            ...(e.line_end !== undefined ? { line_end: e.line_end } : {}),
            tier: e.tier,
          }));
      } catch {
        console.log(`warning: report ${f.run_id} not on disk; evidence for that attempt unavailable`);
      }
      const prev = i > 0 ? failed[i - 1] : undefined;
      return {
        run_id: f.run_id,
        revision: f.checked_revision,
        finding: f.finding,
        grade: f.evidence_grade,
        rationale: f.rationale,
        missing_proof: f.missing_proof,
        evidence,
        orphans: orphans
          .filter((o) => o.to_sha === f.checked_revision)
          .map((o) => ({ path: o.path, risk: o.risk, flags: o.flags })),
        had_prior_pack: prev !== undefined && packs.some((p) => p.finding_ids.includes(prev.id)),
      };
    });
    const result = autopsy({
      criterion_id: cid,
      criterion_text: criterion.text,
      constraint_paths: intent.constraints.flatMap((c) => c.paths ?? []),
      attempts,
    });
    if (result.ok !== true) {
      console.log(`${cid}: ${result.ok === false ? result.reason : 'autopsy refused'}`);
      continue;
    }
    any = true;
    const rep = result.report;
    console.log(`\nautopsy: ${criterion.text} (${rep.attempt_count} failed attempts)`);
    console.log('\nObserved facts:');
    for (const l of rep.observed) console.log(`  - ${l}`);
    console.log('\nPlausible causes (hypotheses, not accusations):');
    for (const l of rep.plausible_causes) console.log(`  - ${l}`);
    console.log('\nUnknowns:');
    for (const l of rep.unknowns) console.log(`  - ${l}`);
    console.log('\nScoped next prompt:\n' + rep.next_prompt.text);
  }
  if (!any && onlyCriterion === '') console.log('no criterion has two failed attempts yet');
  return 0;
}
