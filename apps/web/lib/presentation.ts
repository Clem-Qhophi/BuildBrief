export const FINDING_LANGUAGE: Record<string, { label: string; explanation: string }> = {
  supported: { label: 'Evidence found', explanation: 'The available evidence supports this requirement. Read its proof level before relying on it.' },
  partial: { label: 'Partly covered', explanation: 'Some of the requirement is supported, but further work or proof is still needed.' },
  contradicted: { label: 'Doesn’t match', explanation: 'The cited evidence conflicts with this requirement. Review the mismatch before accepting the work.' },
  not_established: { label: 'Not enough proof', explanation: 'The check could not establish this requirement. That does not prove it is absent.' },
  not_applicable: { label: 'Doesn’t apply', explanation: 'This requirement was assessed as not applicable in the checked scope.' },
};
export function findingLanguage(finding: string) {
  return FINDING_LANGUAGE[finding] ?? FINDING_LANGUAGE['not_established']!;
}
export function proofLanguage(grade: string): string {
  if (grade === 'E2_test') return 'Includes recorded test evidence';
  if (grade === 'E1_source') return 'Code evidence only';
  if (grade === 'E3_staging') return 'Includes staging evidence';
  if (grade === 'E4_production') return 'Includes production evidence';
  return 'No execution proof recorded';
}
export function projectName(project: string): string {
  const reset = /^example-reset-([a-f0-9]{8})$/.exec(project);
  if (reset) return `Password recovery example · ${reset[1]!.slice(-4)}`;
  const referral = /^example-referral-([a-f0-9]{8})$/.exec(project);
  if (referral) return `Referral credit example · ${referral[1]!.slice(-4)}`;
  const testId = (value: string) => value.length >= 20 ? ` · ${value.slice(-4)}` : '';
  if (/^test-github(?:-|$)/i.test(project)) return `GitHub import test${testId(project)}`;
  if (/^test-collection(?:-|$)/i.test(project)) return `Collection test${testId(project)}`;
  if (/^test-connection(?:-|$)/i.test(project)) return `Repository connection test${testId(project)}`;
  if (/^test-/i.test(project)) return `Workspace test${testId(project)}`;
  return project;
}
