import {
  nowIso,
  stableId,
  type IntentVersion,
  type RoleBrief,
} from '@buildbrief/domain';
import { type VerificationReport } from '@buildbrief/verifier';

export interface TourInput {
  id?: string;
  projectId: string;
  role: string;
  intent: IntentVersion;
  report: VerificationReport;
  quizIds?: string[];
  at?: string;
}

const NONTECHNICAL = new Set(['founder', 'marketing', 'support', 'product']);

/**
 * Builds a role-targeted brief from the approved intent and a verification
 * report. Every section carries its evidence ids; everything unverified lands
 * in `unknowns`. Business policy (pricing, obligations, guarantees) is NEVER
 * inferred from code — for non-technical roles that caveat is explicit.
 */
export function roleTour(input: TourInput): RoleBrief {
  const role = input.role.trim().toLowerCase() || 'engineer';
  const plain = NONTECHNICAL.has(role);
  const keyLocations = [...new Set(
    input.report.results.flatMap((r) => r.evidence.map((e) => e.path).filter((p) => p !== undefined)),
  )] as string[];

  const ruleLines = input.report.results.map((r) => {
    const loc = r.evidence
      .map((e) => (e.path !== undefined ? `${e.path}#L${e.line_start ?? 1}-${e.line_end ?? e.line_start ?? 1}` : null))
      .filter((x) => x !== null)
      .join(', ');
    const base = plain
      ? `${r.criterion.text}: ${r.finding.finding}`
      : `${r.criterion.text}: ${r.finding.finding} [${r.finding.evidence_grade}]${loc.length > 0 ? ` (${loc})` : ''}`;
    return { text: base, ids: r.evidence.map((e) => e.id) };
  });

  const openIssues = input.report.results
    .filter((r) => r.finding.finding !== 'supported')
    .map((r) => `${r.criterion.text} is ${r.finding.finding}: ${r.finding.rationale}`);
  const orphans = input.report.orphans.map(
    (o) => `${o.path} [${o.risk}] is possibly unrequested and awaits disposition (${o.flags.join(', ')})`,
  );

  const unknowns = [
    ...input.report.results.flatMap((r) => r.finding.missing_proof.map((m) => `${r.criterion.id}: ${m}`)),
    ...orphans.map((o) => `open: ${o}`),
  ];
  if (plain) {
    unknowns.push(
      'business policy (pricing, refunds, obligations) is NOT established from code comments or names — confirm with the owner',
    );
  }

  const lead = plain
    ? `${input.intent.feature_id}: what it does for you, what is proven, and what is still open.`
    : `${input.intent.feature_id} at ${input.report.checked_revision.slice(0, 7)}: approved contract vs revision-pinned evidence.`;

  return {
    id: input.id ?? stableId('tour', `${input.report.run_id}|${role}`),
    project_id: input.projectId,
    revision: input.report.checked_revision,
    role,
    sections: [
      {
        heading: 'Purpose',
        body: `${lead} Approved intent v${input.intent.version}: ${input.intent.normalized_text}`,
        evidence_ids: [],
      },
      {
        heading: 'Rules and status',
        body: ruleLines.map((l) => `- ${l.text}`).join('\n') || 'No criteria recorded.',
        evidence_ids: [...new Set(ruleLines.flatMap((l) => l.ids))],
      },
      {
        heading: 'Key locations',
        body: keyLocations.join(', ') || 'No source locations evidenced yet.',
        evidence_ids: [],
      },
      {
        heading: 'Open issues',
        body: [...openIssues, ...orphans].map((s) => `- ${s}`).join('\n') || 'None open.',
        evidence_ids: [],
      },
    ],
    unknowns,
    quiz_ids: input.quizIds ?? [],
    created_at: input.at ?? nowIso(),
  };
}
