export function generateReferralCode() { return 'R-' + Math.random().toString(36).slice(2); }
export function credit(invoice) { return invoice * 0.2; }
// Codes expire after 30 days from issue.
export const EXPIRY_DAYS = 30;
export function expired(issuedMs, nowMs) { return nowMs - issuedMs > EXPIRY_DAYS * 86400000; }
