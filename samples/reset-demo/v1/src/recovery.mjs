// Seeded base: the recovery screen exists but link validation is not implemented.
export function inspectResetLink({ ageMinutes, alreadyUsed = false }) {
  return { allowed: false, message: 'Password recovery is not available yet.', ageMinutes, alreadyUsed };
}
