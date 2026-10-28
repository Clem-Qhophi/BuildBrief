import { type EvalCase } from './cases.js';

/**
 * M2 holdout additions. Same rule as before: run, never tune.
 */
export const HOLDOUT_CASES_2: EvalCase[] = [
  {
    id: 'holdout-multi-seat',
    caseClass: 'mixed',
    holdout: true,
    prompt: 'Server approves team invitation after seat check. No invitation bypass. Banner copy may change.',
    criteria: [
      { id: 'c-seat', text: 'Server approves team invitation', keywords: ['server', 'approves', 'invitation'] },
      { id: 'c-nobypass', text: 'No invitation bypass exists', keywords: ['invitation', 'bypass'], negative: true, forbidden_terms: ['bypass'] },
    ],
    constraints: [],
    base: {
      'src/team.js': 'export function seats(team) { return team.limit - team.used; }\n',
      'src/ads.js': 'export const BANNER = "A";\n',
    },
    head: {
      'src/team.js': [
        '// Server approves team invitation after seat check.',
        'export function seats(team) { return team.limit - team.used; }',
        'export function approveInvite(team, user) {',
        '  if (team.used >= team.limit) return { ok: false };',
        '  team.used += 1;',
        '  return { ok: true, user };',
        '}',
        '',
      ].join('\n'),
      'src/ads.js': 'export const BANNER = "B";\n',
    },
    expected: { 'c-seat': 'supported', 'c-nobypass': 'supported' },
    expectedOrphans: ['src/ads.js'],
    maxUnexpectedRisk: 'low',
  },
  {
    id: 'holdout-indirect-discount',
    caseClass: 'happy',
    holdout: true,
    prompt: 'Credit twenty percent of first invoice using the shared money helper.',
    criteria: [
      { id: 'c-gen', text: 'Generate referral code', keywords: ['referral', 'generate'] },
      { id: 'c-credit', text: 'Credit twenty percent first invoice', keywords: ['credit', 'percent', 'invoice'] },
    ],
    constraints: [],
    base: {
      'src/money.js': 'export function percentOf(amount, pct) { return (amount * pct) / 100; }\n',
    },
    head: {
      'src/money.js': 'export function percentOf(amount, pct) { return (amount * pct) / 100; }\n',
      'src/referral.js': [
        'import { percentOf } from "./money.js";',
        '// Generate referral code. Credit twenty percent of first invoice.',
        'export function generateReferralCode() { return "R-" + Math.random().toString(36).slice(2); }',
        'export function credit(firstInvoice) { return percentOf(firstInvoice, 20); }',
        '',
      ].join('\n'),
    },
    expected: { 'c-gen': 'supported', 'c-credit': 'supported' },
    expectedOrphans: [],
  },
];
