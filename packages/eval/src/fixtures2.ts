import { type EvalCase } from './cases.js';

/**
 * M2 independent stress cases (dev set — tuning allowed, labels are ground truth).
 * Each targets a specific engine behavior: cross-file evidence, cross-file
 * contradiction, secret-adjacent orphans, multi-file verdicts, second-revision
 * staleness, and vacuous criteria.
 */
export const DEV_CASES_2: EvalCase[] = [
  {
    id: 'indirect-crossfile',
    caseClass: 'happy',
    holdout: false,
    prompt: 'Referral codes expire after 30 days, enforced in a shared helper.',
    criteria: [
      { id: 'c-gen', text: 'Generate referral code', keywords: ['referral', 'generate'] },
      { id: 'c-exp', text: 'Referral code expiry days', keywords: ['expir', 'days'] },
    ],
    constraints: [],
    base: { 'src/util.js': 'export const x = 1;\n' },
    head: {
      'src/util.js': 'export const x = 1;\n',
      'src/referral.js': [
        'import { isExpired } from "./referral-ttl.js";',
        'export function generateReferralCode() { return "R-" + Math.random().toString(36).slice(2); }',
        '',
      ].join('\n'),
      'src/referral-ttl.js': [
        '// Referral expiry in days.',
        'export const EXPIRY_DAYS = 30;',
        'export function isExpired(issuedMs, nowMs) { return nowMs - issuedMs > EXPIRY_DAYS * 86400000; }',
        '',
      ].join('\n'),
    },
    // Evidence composes across files: referral.js supplies "code", ttl file the rest.
    expected: { 'c-gen': 'supported', 'c-exp': 'supported' },
    expectedOrphans: [],
  },
  {
    id: 'contradiction-crossfile',
    caseClass: 'contradiction',
    holdout: false,
    prompt: 'Do not add any authentication bypass. Auth logic lives in src/auth.js.',
    criteria: [
      { id: 'c-authneg', text: 'No authentication bypass exists', keywords: ['auth', 'bypass'], negative: true, forbidden_terms: ['bypass'] },
    ],
    constraints: [{ rule: 'Do not add any authentication bypass', paths: ['src/auth.js'], severity: 'critical' }],
    base: {
      'src/auth.js': 'export function check(user, token) { return token === user.token; }\n',
      'src/helpers.js': 'export function fmt(x) { return String(x); }\n',
    },
    head: {
      'src/auth.js': 'export function check(user, token) { return token === user.token; }\n',
      'src/helpers.js': 'export function fmt(x) { return String(x); }\nexport function bypass(user) { return { ...user, admin: true }; }\n',
    },
    // Forbidden pattern lands in a different file than the keywords suggest.
    expected: { 'c-authneg': 'contradicted' },
    expectedOrphans: [],
  },
  {
    id: 'security-env-edit',
    caseClass: 'orphan_benign',
    holdout: false,
    prompt: 'Generate referral code.',
    criteria: [
      { id: 'c-gen', text: 'Generate referral code', keywords: ['referral', 'generate'] },
    ],
    constraints: [],
    base: {
      'src/referral.js': 'export function generateReferralCode() { return "R-0"; }\n',
      '.env': 'DEBUG=false\n',
    },
    head: {
      'src/referral.js': 'export function generateReferralCode() { return "R-1"; }\n',
      '.env': 'DEBUG=false\nADMIN_TOKEN=abc\n',
    },
    expected: { 'c-gen': 'supported' },
    // Secret-adjacent unrequested change: critical review item, never silent.
    expectedOrphans: ['.env'],
  },
  {
    id: 'multi-file-mixed',
    caseClass: 'mixed',
    holdout: false,
    prompt: 'Referral codes, server seat enforcement, owner notification on referral.',
    criteria: [
      { id: 'c-gen', text: 'Generate referral code', keywords: ['referral', 'generate'] },
      { id: 'c-seat', text: 'Server enforces seat limit', keywords: ['server', 'enforces', 'seat'] },
      { id: 'c-notify', text: 'Notify owner on referral event', keywords: ['notify', 'owner'] },
    ],
    constraints: [],
    base: { 'src/util.js': 'export const x = 1;\n' },
    head: {
      'src/util.js': 'export const x = 1;\n',
      'src/referral.js': 'export function generateReferralCode() { return "R-1"; }\n',
      'src/seats.js': [
        '// Server enforces seat limit after invite check.',
        'export function invite(team, user) {',
        '  if (team.used >= team.limit) throw new Error("seat limit");',
        '  team.used += 1;',
        '  return user;',
        '}',
        '',
      ].join('\n'),
    },
    expected: { 'c-gen': 'supported', 'c-seat': 'supported', 'c-notify': 'not_established' },
    expectedOrphans: [],
  },
  {
    id: 'stale-second-rev',
    caseClass: 'mixed',
    holdout: false,
    prompt: 'Generate referral code.',
    criteria: [
      { id: 'c-gen', text: 'Generate referral code', keywords: ['referral', 'generate'] },
    ],
    constraints: [],
    base: { 'src/util.js': 'export const x = 1;\n' },
    head: {
      'src/util.js': 'export const x = 1;\n',
      'src/referral.js': '// referral code\nexport function generateReferralCode() { return "R-1"; }\n',
    },
    expected: { 'c-gen': 'supported' },
    second: {
      // Implementation removed in a later revision: re-verification must follow
      // the new evidence, never parrot the old supported verdict.
      head: {
        'src/util.js': 'export const x = 1;\n',
        'src/referral.js': 'export const REMOVED = true;\n',
      },
      expected: { 'c-gen': 'not_established' },
    },
    expectedOrphans: [],
  },
  {
    id: 'vague-unverifiable',
    caseClass: 'runtime_unknown',
    holdout: false,
    prompt: 'Make it good.',
    criteria: [
      { id: 'c-vague', text: 'Make it good', keywords: [] },
    ],
    constraints: [],
    base: { 'src/util.js': 'export const x = 1;\n' },
    head: {
      'src/util.js': 'export const x = 1;\n',
      'src/app.js': 'export const APP = "demo";\n',
    },
    // Vacuous criterion: nothing to retrieve, nothing to claim.
    expected: { 'c-vague': 'not_established' },
    expectedOrphans: [],
  },
];

/**
 * Known-gap probes: suspected engine weaknesses, documented not gated.
 * A FAIL here is recorded evidence about the engine, never a release blocker.
 */
export const GAP_PROBES: EvalCase[] = [
  {
    id: 'gap-comment-mirage',
    caseClass: 'false_green',
    holdout: false,
    known_gap: true,
    prompt: 'Referral codes expire after 30 days.',
    criteria: [
      { id: 'c-exp', text: 'Referral code expiry days', keywords: ['expir', 'days'] },
    ],
    constraints: [],
    base: { 'src/util.js': 'export const x = 1;\n' },
    head: {
      'src/util.js': 'export const x = 1;\n',
      'src/referral.js': '// TODO: referral code expiry days - not implemented yet\nexport const x = 1;\n',
    },
    // Ground truth: no implementation exists. A lexical assessor that trusts
    // comments will report false confidence here.
    expected: { 'c-exp': 'not_established' },
    expectedOrphans: [],
  },
  {
    id: 'gap-vocabulary-miss',
    caseClass: 'partial',
    holdout: false,
    known_gap: true,
    prompt: 'Referral codes expire after 30 days.',
    criteria: [
      { id: 'c-exp', text: 'Referral code expiry days', keywords: ['referral', 'expir', 'days'] },
    ],
    constraints: [],
    base: { 'src/util.js': 'export const x = 1;\n' },
    head: {
      'src/util.js': 'export const x = 1;\n',
      // 2592000s == 30 days, but none of the criterion vocabulary appears:
      // implemented indirectly, invisible to lexical retrieval.
      'src/policy.js': 'export const TTL = 2592000;\nexport function alive(since) { return Date.now() - since < TTL * 1000; }\n',
    },
    expected: { 'c-exp': 'supported' },
    expectedOrphans: [],
  },
];
