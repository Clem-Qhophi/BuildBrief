import { type EvalCase } from './cases.js';

/**
 * M3 holdout additions (Python). Same rule as before: run, never tune.
 * Tight mirrors of proven dev shapes, in the second language.
 */
export const HOLDOUT_CASES_3: EvalCase[] = [
  {
    id: 'holdout-py-seat',
    caseClass: 'mixed',
    holdout: true,
    prompt: 'Server approves team invitation after seat check. No invitation bypass. Banner copy may change.',
    criteria: [
      { id: 'c-seat', text: 'Server approves team invitation', keywords: ['server', 'approves', 'invitation'] },
      { id: 'c-nobypass', text: 'No invitation bypass exists', keywords: ['invitation', 'bypass'], negative: true, forbidden_terms: ['bypass'] },
    ],
    constraints: [],
    base: {
      'src/team.py': 'def seats(team):\n    return team["limit"] - team["used"]\n',
      'src/ads.py': 'BANNER = "A"\n',
    },
    head: {
      'src/team.py': [
        '# Server approves team invitation after seat check.',
        'def seats(team):',
        '    return team["limit"] - team["used"]',
        'def approve_invite(team, user):',
        '    if team["used"] >= team["limit"]:',
        '        return {"ok": False}',
        '    team["used"] += 1',
        '    return {"ok": True, "user": user}',
        '',
      ].join('\n'),
      'src/ads.py': 'BANNER = "B"\n',
    },
    expected: { 'c-seat': 'supported', 'c-nobypass': 'supported' },
    expectedOrphans: ['src/ads.py'],
    maxUnexpectedRisk: 'low',
  },
  {
    id: 'holdout-py-indirect-discount',
    caseClass: 'happy',
    holdout: true,
    prompt: 'Credit twenty percent of first invoice using the shared money helper.',
    criteria: [
      { id: 'c-gen', text: 'Generate referral code', keywords: ['referral', 'generate'] },
      { id: 'c-credit', text: 'Credit twenty percent first invoice', keywords: ['credit', 'percent', 'invoice'] },
    ],
    constraints: [],
    base: {
      'src/money.py': 'def percent_of(amount, pct):\n    return (amount * pct) / 100\n',
    },
    head: {
      'src/money.py': 'def percent_of(amount, pct):\n    return (amount * pct) / 100\n',
      'src/referral.py': [
        'from src.money import percent_of',
        '"""Generate referral code. Credit twenty percent of first invoice."""',
        'import random',
        'def generate_referral_code():',
        '    return "R-" + str(random.randint(1000, 9999))',
        'def credit(first_invoice):',
        '    return percent_of(first_invoice, 20)',
        '',
      ].join('\n'),
    },
    expected: { 'c-gen': 'supported', 'c-credit': 'supported' },
    expectedOrphans: [],
  },
];
