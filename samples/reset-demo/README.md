# Password recovery acceptance example

This isolated, deliberately seeded example checks a product requirement:
password reset links must expire after 30 minutes and be single-use.

The v2 fixture implements a usable-looking recovery result and rejects a reused
link, but omits expiry and invalid-age checks. The v3 fixture adds the policy.
The same acceptance script fails against v2 and passes against v3. Its output,
source citations, and different Git revisions are recorded in BuildBrief.

The example app uses a simulated account, a synthetic link, and an injected test
clock. It sends no email, accepts no actual password, and changes no real account.
The response is produced by executing the actual source from the selected
fixture commit, after comparing it with the allowlisted fixture source.

The 30-minute duration is this example's approved product requirement, not a
universal security standard. OWASP recommends single-use reset tokens with an
appropriate expiry period:
https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html

This is not a full authentication implementation or a security certification.
Token generation, storage, account enumeration, delivery, rate limiting, session
invalidation, and production deployment are outside the fixture's scope.
