import { contentHash, newId, nowIso } from './ids.js';
import {
  type AtomicCriterion,
  type IntentConstraint,
  type IntentVersion,
} from './intent.js';
import { type CaptureCompleteness } from './vocab.js';

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'on', 'for', 'with', 'must', 'should',
  'that', 'this', 'it', 'is', 'are', 'be', 'as', 'by', 'at', 'from', 'will', 'can', 'after',
]
);

const PROHIBITION = /\b(do not|don't|never|must not|mustn't|forbidden|no changes? to)\b/i;

/**
 * Deterministic draft extraction (rules, no model). Splits the raw prompt into
 * sentences; prohibition sentences become constraints, questions become ambiguity
 * flags, the rest become candidate criteria with keyword terms. Output is ALWAYS
 * draft — approval is a separate, human-only step.
 */
export function extractDraft(input: {
  id?: string;
  projectId: string;
  featureId: string;
  prompt: string;
  sourceAgent?: string;
  sessionId?: string;
  completeness: CaptureCompleteness;
  at?: string;
}): IntentVersion {
  const at = input.at ?? nowIso();
  const sentences = input.prompt
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const criteria: AtomicCriterion[] = [];
  const constraints: IntentConstraint[] = [];
  const ambiguity: string[] = [];
  let n = 0;

  for (const s of sentences) {
    if (s.endsWith('?')) {
      ambiguity.push(`open question in prompt: "${s.slice(0, 120)}"`);
      continue;
    }
    if (PROHIBITION.test(s)) {
      constraints.push({ rule: s, severity: /auth|login|password|token|secret|test/i.test(s) ? 'critical' : 'medium' });
      continue;
    }
    n += 1;
    criteria.push({ id: `d-c${n}`, text: s, keywords: keywordsOf(s), negative: false });
  }

  const draft: IntentVersion = {
    id: input.id ?? newId('intent'),
    project_id: input.projectId,
    feature_id: input.featureId,
    version: 1,
    kind: 'feature',
    state: 'draft',
    exact_source_text: input.prompt,
    source_hash: contentHash(input.prompt),
    captured_at: at,
    capture_completeness: input.completeness,
    normalized_text: input.prompt,
    criteria,
    non_goals: [],
    constraints,
    ambiguity_flags: ambiguity,
  };
  if (input.sourceAgent !== undefined) draft.source_agent = input.sourceAgent;
  if (input.sessionId !== undefined) draft.session_id = input.sessionId;
  return draft;
}

export function keywordsOf(sentence: string): string[] {
  const words = sentence
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
  return [...new Set(words)].slice(0, 8);
}
