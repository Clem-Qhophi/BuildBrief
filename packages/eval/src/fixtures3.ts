import { type EvalCase } from './cases.js';

/**
 * M3 second-language set (dev — tuning allowed, labels are ground truth).
 * Python mirrors of the JS/TS shapes: happy path with pytest tests, partial,
 * cross-file contradiction, deleted-test review item, unmapped test edit, and
 * a multi-file mixed verdict. The engine is lexical and language-agnostic, but
 * path conventions are not: these cases drove the `test_file_touched` parity
 * fix for `test_*.py` / `*_test.py` / `tests+/` (see SENSITIVE_PATH_RULES).
 */
export const DEV_CASES_3: EvalCase[] = [
  {
    id: 'py-happy-referral',
    caseClass: 'happy',
    holdout: false,
    prompt: 'Add referral codes. Codes expire after 30 days.',
    criteria: [
      { id: 'c-gen', text: 'Generate referral code', keywords: ['referral', 'generate'] },
      { id: 'c-exp', text: 'Referral code expiry is thirty days', keywords: ['expir', 'days'] },
    ],
    constraints: [],
    base: { 'src/util.py': 'X = 1\n' },
    head: {
      'src/util.py': 'X = 1\n',
      'src/referral.py': [
        '"""Generate referral code. Codes expire after EXPIRY_DAYS."""',
        'import random',
        'EXPIRY_DAYS = 30',
        'def generate_referral_code():',
        '    return "R-" + str(random.randint(1000, 9999))',
        'def is_expired(issued_ms, now_ms):',
        '    return now_ms - issued_ms > EXPIRY_DAYS * 86400_000',
        'def credit(first_invoice):',
        '    return first_invoice * 0.2',
        '',
      ].join('\n'),
      'tests/test_referral.py': [
        'from src.referral import generate_referral_code, is_expired, EXPIRY_DAYS',
        'def test_generate_referral_code():',
        '    assert generate_referral_code().startswith("R-")',
        'def test_referral_expiry_boundary():',
        '    assert is_expired(0, 31 * 86400_000) is True',
        '    assert EXPIRY_DAYS == 30',
        '',
      ].join('\n'),
    },
    expected: { 'c-gen': 'supported', 'c-exp': 'supported' },
    expectedGrades: { 'c-gen': 'E2_test', 'c-exp': 'E2_test' },
    expectedOrphans: [],
    testRuns: [{ command: ['pytest', '-q'], covers: ['src/referral.py'], exitCode: 0 }],
  },
  {
    id: 'py-partial-credit',
    caseClass: 'partial',
    holdout: false,
    prompt: 'Add referral credit of 20% on first invoice. Codes expire after 30 days.',
    criteria: [
      { id: 'c-credit', text: 'Credit twenty percent first invoice with monthly cap', keywords: ['credit', 'invoice', 'percent'] },
      { id: 'c-exp', text: 'Referral code expiry days', keywords: ['expir', 'days'] },
    ],
    constraints: [],
    base: { 'src/util.py': 'X = 1\n' },
    head: {
      'src/util.py': 'X = 1\n',
      'src/referral.py': [
        '"""Generate referral code. Credit twenty percent of first invoice."""',
        'import random',
        'def generate_referral_code():',
        '    return "R-" + str(random.randint(1000, 9999))',
        'def credit(first_invoice):',
        '    return first_invoice * 0.2',
        '',
      ].join('\n'),
    },
    // 5 of 7 operative words present (no "with"/"monthly") → partial; no
    // expiry vocabulary anywhere → not_established. No `with` statement: the
    // word itself is an operative term and must stay absent.
    expected: { 'c-credit': 'partial', 'c-exp': 'not_established' },
    expectedOrphans: [],
  },
  {
    id: 'py-contradiction-bypass',
    caseClass: 'contradiction',
    holdout: false,
    prompt: 'Do not add any authentication bypass. Auth logic lives in src/auth.py.',
    criteria: [
      { id: 'c-authneg', text: 'No authentication bypass exists', keywords: ['auth', 'bypass'], negative: true, forbidden_terms: ['bypass'] },
    ],
    constraints: [{ rule: 'Do not add any authentication bypass', paths: ['src/auth.py'], severity: 'critical' }],
    base: {
      'src/auth.py': 'def check(user, token):\n    return token == user["token"]\n',
      'src/helpers.py': 'def fmt(x):\n    return str(x)\n',
    },
    head: {
      'src/auth.py': 'def check(user, token):\n    return token == user["token"]\n',
      'src/helpers.py': 'def fmt(x):\n    return str(x)\n\ndef bypass(user):\n    return {**user, "admin": True}\n',
    },
    expected: { 'c-authneg': 'contradicted' },
    expectedOrphans: [],
  },
  {
    id: 'py-deleted-test',
    caseClass: 'deleted_test',
    holdout: false,
    prompt: 'Generate referral code. Keep the referral test suite green.',
    criteria: [
      { id: 'c-gen', text: 'Generate referral code', keywords: ['referral', 'generate'] },
    ],
    constraints: [],
    base: {
      'src/referral.py': 'def generate_referral_code():\n    return "R-1"\n',
      'tests/test_referral.py': 'from src.referral import generate_referral_code\ndef test_generate():\n    assert generate_referral_code() == "R-1"\n',
    },
    head: {
      'src/referral.py': 'def generate_referral_code():\n    return "R-1"\n',
    },
    expected: { 'c-gen': 'supported' },
    // Deleting a pytest file destroys proof: high-risk review item (ADR-007),
    // same as a deleted .test.js suite.
    expectedOrphans: ['tests/test_referral.py'],
    expectedRisk: { 'tests/test_referral.py': 'high' },
  },
  {
    id: 'py-test-modified',
    caseClass: 'orphan_benign',
    holdout: false,
    prompt: 'Generate referral code.',
    criteria: [
      { id: 'c-gen', text: 'Generate referral code', keywords: ['referral', 'generate'] },
    ],
    constraints: [],
    base: {
      'src/referral.py': 'def generate_referral_code():\n    return "R-1"\n',
      'tests/test_referral.py': 'from src.referral import generate_referral_code\ndef test_generate():\n    assert generate_referral_code() == "R-1"\n',
    },
    head: {
      'src/referral.py': 'def generate_referral_code():\n    return "R-1"\n',
      'tests/test_referral.py': 'from src.referral import generate_referral_code\ndef test_generate():\n    assert generate_referral_code() == "R-1"\n',
      // Unmapped content in a NEW test file (single hunk, no shared context):
      // flagged as possibly unrequested at high risk, like any test edit.
      'tests/test_deploy.py': '"""Deployment checklist helpers."""\nDEPLOY_REGION = "eu-west-1"\n\ndef staging_url():\n    return "https://staging.example.invalid"\n',
    },
    expected: { 'c-gen': 'supported' },
    expectedOrphans: ['tests/test_deploy.py'],
    expectedRisk: { 'tests/test_deploy.py': 'high' },
  },
  {
    id: 'py-multi-mixed',
    caseClass: 'mixed',
    holdout: false,
    prompt: 'Referral codes, server seat enforcement, owner notification on referral.',
    criteria: [
      { id: 'c-gen', text: 'Generate referral code', keywords: ['referral', 'generate'] },
      { id: 'c-seat', text: 'Server enforces seat limit', keywords: ['server', 'enforces', 'seat'] },
      { id: 'c-notify', text: 'Notify owner on referral event', keywords: ['notify', 'owner'] },
    ],
    constraints: [],
    base: { 'src/util.py': 'X = 1\n' },
    head: {
      'src/util.py': 'X = 1\n',
      'src/referral.py': 'def generate_referral_code():\n    return "R-1"\n',
      'src/seats.py': [
        '# Server enforces seat policy after invite check.',
        'def invite(team, user):',
        '    if team["used"] >= team["max"]:',
        '        raise ValueError("seat policy")',
        '    team["used"] += 1',
        '    return user',
        '',
      ].join('\n'),
    },
    // 3 of 4 operative words for the seat rule ("limit" never appears) →
    // partial; notification vocabulary absent entirely → not_established.
    expected: { 'c-gen': 'supported', 'c-seat': 'partial', 'c-notify': 'not_established' },
    expectedOrphans: [],
  },
];
