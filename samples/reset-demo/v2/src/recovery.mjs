// Seeded incomplete build. The account and link are synthetic test data.
export function inspectResetLink({ ageMinutes, alreadyUsed = false }) {
  if (alreadyUsed) return { allowed: false, message: 'This password reset link has already been used.' };
  return { allowed: true, message: 'You can choose a new password.' };
}
