// The same checks run against both the incomplete and corrected fixture.
import { inspectResetLink } from './src/recovery.mjs';
let failed = 0;
const check = (name, actual, expected) => {
  const passed = actual === expected;
  console.log(`${passed ? 'pass' : 'FAIL'}: ${name}`);
  if (!passed) failed += 1;
};
check('fresh password reset link allows recovery', inspectResetLink({ ageMinutes: 5 }).allowed, true);
check('password reset links expire at the 30 minute boundary', inspectResetLink({ ageMinutes: 30 }).allowed, false);
check('old password reset links remain expired after 31 minutes', inspectResetLink({ ageMinutes: 31 }).allowed, false);
check('already-used reset link is rejected', inspectResetLink({ ageMinutes: 5, alreadyUsed: true }).allowed, false);
check('invalid link age is rejected', inspectResetLink({ ageMinutes: -1 }).allowed, false);
process.exitCode = failed === 0 ? 0 : 1;
