#!/usr/bin/env node
// Functional check for the 30-day referral-code expiry (M5c genuine-correction proof).
// Copied to a demo repo root by the E2E journey / M5c procedure, then run as:
//   node expiry.check.mjs            (covers: src/referral.js)
// Imports the REAL src/referral.js via a .mjs copy in os.tmpdir(): the fixture
// repos carry no package.json, so a direct `.js` import is format-ambiguous.
// Exercises the real functions at the 30-day boundary. Exit 0 iff all pass.
import { copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const tmp = join(tmpdir(), `bb-referral-check-${Date.now()}-${process.pid}.mjs`);
copyFileSync(new URL('./src/referral.js', import.meta.url), tmp);
let failed = 0;
const check = (name, cond) => {
  console.log(`${cond ? 'pass' : 'FAIL'}: ${name}`);
  if (!cond) failed += 1;
};

try {
  const m = await import(pathToFileURL(tmp).href);
  check('credit(100) === 20', m.credit(100) === 20);
  const hasExpired = typeof m.expired === 'function';
  check('expired() is exported', hasExpired);
  check('EXPIRY_DAYS === 30', m.EXPIRY_DAYS === 30);
  if (!hasExpired) {
    check('31 days counts as expired', false);
    check('29 days counts as fresh', false);
  } else {
    const day = 86400000;
    check('31 days counts as expired', m.expired(0, 31 * day) === true);
    check('29 days counts as fresh', m.expired(0, 29 * day) === false);
  }
} finally {
  rmSync(tmp, { force: true });
}
process.exit(failed === 0 ? 0 : 1);
