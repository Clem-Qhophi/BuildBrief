import { type EvalCase } from './cases.js';

/**
 * Holdout set: run in the same harness, NEVER used to tune the verifier.
 * A holdout failure is a recorded generalization gap, not a dev task.
 */
export const HOLDOUT_CASES: EvalCase[] = [
  {
    id: 'holdout-server-seat',
    caseClass: 'happy',
    holdout: true,
    prompt: 'Approve team invitation on server after seat check.',
    criteria: [
      { id: 'c-seat', text: 'Server approves team invitation', keywords: ['server', 'approves', 'invitation'] },
    ],
    constraints: [],
    base: { 'src/util.js': 'export const x = 1;\n' },
    head: {
      'src/util.js': 'export const x = 1;\n',
      'src/invites.js': [
        '// Server approves team invitation after seat check.',
        'export function approveInvite(team, user) {',
        '  if (team.seatsUsed >= team.seatLimit) return { ok: false, reason: "seat limit" };',
        '  team.seatsUsed += 1;',
        '  return { ok: true, user };',
        '}',
        '',
      ].join('\n'),
    },
    expected: { 'c-seat': 'supported' },
    expectedGrades: { 'c-seat': 'E1_source' },
    expectedOrphans: [],
  },
  {
    id: 'holdout-expire-limit',
    caseClass: 'partial',
    holdout: true,
    prompt: 'Expire referral code after days limit. Notify on expiry.',
    criteria: [
      { id: 'c-exp', text: 'Expire referral code after days limit', keywords: ['expire', 'referral', 'limit'] },
      { id: 'c-notify', text: 'Notify owner on expiry event', keywords: ['notify', 'owner', 'expiry'] },
    ],
    constraints: [],
    base: { 'src/util.js': 'export const x = 1;\n' },
    head: {
      'src/util.js': 'export const x = 1;\n',
      'src/referral.js': [
        '// Expire referral code after days limit (DAYS_LIMIT).',
        'export const DAYS_LIMIT = 30;',
        'export function expire(code, issuedMs, nowMs) {',
        '  return nowMs - issuedMs > DAYS_LIMIT * 86400000 ? { expired: true, code } : { expired: false, code };',
        '}',
        '',
      ].join('\n'),
    },
    expected: { 'c-exp': 'supported', 'c-notify': 'not_established' },
    expectedOrphans: [],
  },
];
