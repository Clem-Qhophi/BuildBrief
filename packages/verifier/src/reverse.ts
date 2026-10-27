import {
  contentHash,
  riskForPath,
  type CandidateUnrequestedChange,
  type IntentVersion,
} from '@buildbrief/domain';
import { diffText, parseHunks } from '@buildbrief/repo';

export interface ReverseCheckInput {
  intent: IntentVersion;
  root: string;
  from: string;
  to: string;
}

/**
 * Maps each diff hunk to approved criteria by keyword overlap. Unmatched hunks
 * become *possibly unrequested* candidates with risk flags + human disposition.
 * Never accuses; never auto-reverts.
 */
export function reverseCheck(input: ReverseCheckInput): CandidateUnrequestedChange[] {
  let diff = '';
  try {
    diff = diffText(input.root, input.from, input.to);
  } catch {
    return [];
  }
  if (diff.trim().length === 0) return [];
  const hunks = parseHunks(diff, contentHash);
  const keywordSets = input.intent.criteria.map(
    (c) => new Set([...c.keywords, ...(c.forbidden_terms ?? [])].map((k) => k.toLowerCase())),
  );
  const constraintPaths = input.intent.constraints.flatMap((c) => c.paths ?? []);
  const orphans: CandidateUnrequestedChange[] = [];

  for (const h of hunks) {
    const bodyLow = h.body.toLowerCase();
    const pathLow = h.path.toLowerCase();
    const mapped = input.intent.criteria
      .filter((_, i) => {
        const keys = keywordSets[i] as Set<string>;
        return [...keys].some((k) => k.length > 2 && (bodyLow.includes(k) || pathLow.includes(k)));
      })
      .map((c) => c.id);
    const { risk, flags } = riskForPath(h.path);
    const extra: string[] = [];
    const deletedTest = h.kind === 'delete' && /test|spec|__tests__/i.test(h.path);
    if (deletedTest) extra.push('deleted_test_or_suite');
    if (constraintPaths.some((p) => h.path === p || h.path.startsWith(p))) extra.push('constraint_path_touched');
    // Deleting a test destroys proof: always a review item, even when the removed
    // content maps to an approved criterion (mapped ids kept as context, not clearance).
    if (mapped.length > 0 && !deletedTest) continue;
    orphans.push({
      id: `bb_orphan_${h.hash.slice(0, 18)}`,
      from_sha: input.from,
      to_sha: input.to,
      path: h.path,
      hunk_hash: h.hash,
      mapped_requirement_ids: mapped,
      risk: extra.includes('deleted_test_or_suite') && risk === 'low' ? 'high' : risk,
      flags: [...flags, ...extra, `hunk_${h.kind}`],
      mapping_confidence: 0.2,
      why_flagged: `hunk in ${h.path} matches no approved criterion keywords; treated as possibly unrequested, not misconduct`,
    });
  }
  return orphans;
}
