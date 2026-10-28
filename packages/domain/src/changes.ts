import { type Disposition, isDisposition } from './vocab.js';

export type OrphanRisk = 'low' | 'medium' | 'high' | 'critical';

export interface CandidateUnrequestedChange {
  id: string;
  from_sha: string;
  to_sha: string;
  path: string;
  hunk_hash: string;
  mapped_requirement_ids: string[];
  risk: OrphanRisk;
  flags: string[];
  mapping_confidence: number;
  why_flagged: string;
  disposition?: Disposition;
}

export function validateDisposition(v: unknown): v is Disposition {
  return isDisposition(v);
}

/** Sensitive-path patterns that raise an orphan hunk's risk tier. */
export const SENSITIVE_PATH_RULES: { pattern: RegExp; flag: string; risk: OrphanRisk }[] = [
  { pattern: /(^|\/)auth(\/|[^/]*\.(ts|js|py|go|java)$)/i, flag: 'auth_file_touched', risk: 'critical' },
  { pattern: /(^|\/)(login|session|password|token|oauth)(\/|[^/]*\.(ts|js|py|go|java)$)/i, flag: 'identity_file_touched', risk: 'critical' },
  { pattern: /\.test\.(ts|js|tsx|jsx)$|\.spec\.(ts|js)$|__tests__\/|(^|\/)tests?\/|(^|\/)test_[^/]*\.py$|[^/]*_test\.py$|(^|\/)conftest\.py$/i, flag: 'test_file_touched', risk: 'high' },
  { pattern: /migrations?\//i, flag: 'migration_touched', risk: 'high' },
  { pattern: /(^|\/)schema\.(sql|prisma|ts)$/i, flag: 'schema_touched', risk: 'high' },
  { pattern: /package-lock\.json|pnpm-lock\.yaml|yarn\.lock|requirements.*\.txt|pyproject\.toml|go\.mod/i, flag: 'dependency_manifest_touched', risk: 'medium' },
  { pattern: /\.env(\.|$)|secrets?\//i, flag: 'secret_adjacent_touched', risk: 'critical' },
  { pattern: /Dockerfile|docker-compose.*\.ya?ml|\.github\/workflows\//i, flag: 'pipeline_config_touched', risk: 'medium' },
];

/** Maintenance-shaped hunks that must NOT be accused without stronger evidence. */
export const BENIGN_HUNK_HINTS: { pattern: RegExp; note: string }[] = [
  { pattern: /^\s*[-+]\s*$/m, note: 'whitespace_only' },
  { pattern: /prettier|eslint|ruff|black|gofmt/i, note: 'formatter_marker' },
  { pattern: /rename/i, note: 'possible_rename' },
];

export function riskForPath(path: string): { risk: OrphanRisk; flags: string[] } {
  let risk: OrphanRisk = 'low';
  const flags: string[] = [];
  const rank: OrphanRisk[] = ['low', 'medium', 'high', 'critical'];
  for (const rule of SENSITIVE_PATH_RULES) {
    if (rule.pattern.test(path)) {
      flags.push(rule.flag);
      if (rank.indexOf(rule.risk) > rank.indexOf(risk)) risk = rule.risk;
    }
  }
  return { risk, flags };
}
