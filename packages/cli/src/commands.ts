import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  approveIntent,
  type IntentVersion,
  type VerificationFinding,
} from '@buildbrief/domain';
import { MetaApiProvider, metaConfigFromEnv, MockProvider, type ModelProvider } from '@buildbrief/model-meta';
import { RuleAssessor } from '@buildbrief/verifier';
import {
  packsForFailures,
  renderHtml,
  renderJson,
  renderMarkdown,
  reverseCheck,
  verify,
  type VerificationReport,
} from '@buildbrief/verifier';
import {
  appendEvent,
  loadViews,
  openProjectStore,
  rebuildViews,
  type ProjectStore,
} from '@buildbrief/store';
import { headSha } from '@buildbrief/repo';
import { flag, requireFlag, type ParsedArgs } from './args.js';
import { extractDraft } from './extract.js';

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
