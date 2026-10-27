export function generateReferralCode() { return 'R-' + Math.random().toString(36).slice(2); }
export function credit(invoice) { return invoice * 0.2; }
