// Seeded correction. This is a policy example, not a production authentication system.
export const RESET_LINK_VALID_MINUTES = 30;
export function inspectResetLink({ ageMinutes, alreadyUsed = false }) {
  if (alreadyUsed) return { allowed: false, message: 'This password reset link has already been used.' };
  if (!Number.isFinite(ageMinutes) || ageMinutes < 0) return { allowed: false, message: 'This password reset link is invalid.' };
  if (ageMinutes >= RESET_LINK_VALID_MINUTES) return { allowed: false, message: 'This password reset link has expired. Request a new link.' };
  return { allowed: true, message: 'You can choose a new password.' };
}
