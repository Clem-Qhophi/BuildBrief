import { contentHash, extractDraft, type IntentVersion } from '@buildbrief/domain';

export interface IdeaInput { project: string; idea: string; audience: string; behaviors: string; boundaries: string; questions: string }
export function ideaDraft(input: IdeaInput): IntentVersion {
  if (!input.project.trim() || input.project.length > 120) throw new Error('Project name is required (up to 120 characters).');
  if (!input.idea.trim()) throw new Error('Describe the product you want to build.');
  if (!input.behaviors.trim()) throw new Error('Add at least one thing a user should be able to do.');
  if (Object.values(input).join('\n').length > 20_000) throw new Error('Keep the initial brief under 20,000 characters.');
  const raw = [
    `Product idea:\n${input.idea.trim()}`,
    ...(input.audience.trim() ? [`Who it is for:\n${input.audience.trim()}`] : []),
    `What it should do:\n${input.behaviors.trim()}`,
    ...(input.boundaries.trim() ? [`Boundaries:\n${input.boundaries.trim()}`] : []),
    ...(input.questions.trim() ? [`Questions to resolve:\n${input.questions.trim()}`] : []),
  ].join('\n\n');
  // Audience and context are preserved, not silently promoted to requirements.
  const draft = extractDraft({ projectId: input.project.trim(), featureId: 'First build', prompt: input.behaviors.trim(), completeness: 'manual', sourceAgent: 'BuildBrief idea form' });
  return {
    ...draft, exact_source_text: raw, normalized_text: raw, source_hash: contentHash(raw),
    constraints: [...draft.constraints, ...input.boundaries.split(/\n+/).map((s) => s.trim()).filter(Boolean).map((rule) => ({ rule, severity: 'medium' as const }))],
    ambiguity_flags: [...draft.ambiguity_flags, ...input.questions.split(/\n+/).map((s) => s.trim()).filter(Boolean)],
  };
}

export function buildHandoff(intent: IntentVersion): string {
  if (intent.state !== 'approved') throw new Error('Approve this brief before creating a build handoff.');
  return [
    `# Build brief: ${intent.project_id}`, '',
    `Approved requirement version: ${intent.id} (v${intent.version})`,
    `Recorded approver: ${intent.approved_by ?? 'not recorded'}`, '',
    '## Original owner context', intent.exact_source_text, '',
    '## Approved requirements', ...intent.criteria.map((c) => `- ${c.text}`), '',
    '## Boundaries', ...(intent.constraints.length ? intent.constraints.map((c) => `- ${c.rule}`) : ['- No additional boundaries recorded; ask the owner before making scope decisions.']), '',
    '## Open questions', ...(intent.ambiguity_flags.length ? intent.ambiguity_flags.map((q) => `- ${q}`) : ['- No open questions recorded.']), '',
    '## Implementation handoff',
    '- Use this approved brief as the product contract. Do not silently resolve open business questions.',
    '- Propose a minimal implementation and acceptance checks for the requirements before expanding scope.',
    '- Build in a dedicated project directory and initialize Git if a repository does not exist.',
    '- Keep secrets out of code, prompts, logs, and reports.',
    '- Return the local repository path, changed files, checks actually run, and remaining gaps.',
    '- Save a reviewed Git commit through the owner\'s normal process before BuildBrief verification.',
    '- Do not claim the work is accepted: the owner reviews the implementation and evidence in BuildBrief.', '',
    'Next in BuildBrief: connect the repository to this same project and check the approved requirements.',
  ].join('\n');
}
