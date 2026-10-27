import { contentHash } from '@buildbrief/domain';
import {
  type AssessmentInput,
  type AssessmentOutput,
  ModelError,
  type ModelProvider,
} from './provider.js';

/**
 * Prompt builder shared by the Meta provider and the mock.
 * Versioned: any wording change bumps PROMPT_VERSION so runs stay comparable.
 */
export const PROMPT_VERSION = 'bb-verify-v1';
export const MAX_EXCERPT_CHARS = 4000;
export const MAX_EXCERPTS = 12;

const SYSTEM = [
  'You assess whether ONE approved requirement criterion is established by the quoted',
  'repository evidence at the pinned commit. Evidence items are the ONLY basis for a positive',
  'claim. Rules: (1) cite only evidence ids you were given; (2) if the evidence is insufficient,',
  'say not_established and list the exact missing proof; (3) absence is contradicted only with',
  'directly incompatible evidence, otherwise not_established; (4) never claim production or',
  'runtime proof from source or test evidence alone.',
].join(' ');

export function buildAssessmentPrompt(input: AssessmentInput): { system: string; user: string } {
  const excerpts = input.excerpts.slice(0, MAX_EXCERPTS).map((e) => {
    const head = `[${e.evidence_id}] tier=${e.tier}${e.path !== undefined ? ` path=${e.path}` : ''}${
      e.line_start !== undefined ? ` lines=${e.line_start}-${e.line_end ?? e.line_start}` : ''
    }`;
    return `${head}\n${e.excerpt.slice(0, MAX_EXCERPT_CHARS)}`;
  });
  const user = [
    `Criterion (${input.criterion_id}${input.negative ? ', NEGATIVE requirement: must NOT happen' : ''}): ${input.criterion_text}`,
    `Checked revision: ${input.revision}`,
    `Retrieval scope exhaustive: ${input.search_exhaustive ? 'yes' : 'no'}`,
    'Evidence:',
    ...excerpts,
    'Return one verdict object: {criterion_id, finding, evidence_ids, coverage, confidence, rationale, missing_proof}.',
  ].join('\n');
  return { system: SYSTEM, user };
}

export function promptHash(input: AssessmentInput): string {
  const { system, user } = buildAssessmentPrompt(input);
  return contentHash(`${PROMPT_VERSION}\n${system}\n${user}`);
}

/** Deterministic stand-in: returns fixture verdicts keyed by criterion id. For tests/eval only. */
export class MockProvider implements ModelProvider {
  readonly name = 'mock';
  readonly model = 'mock-1';
  readonly calls: AssessmentInput[] = [];

  constructor(private readonly fixtures: Record<string, AssessmentOutput['verdicts'][number]> = {}) {}

  async assess(input: AssessmentInput): Promise<AssessmentOutput> {
    this.calls.push(input);
    const started = Date.now();
    const template = this.fixtures[input.criterion_id] ?? {
      criterion_id: input.criterion_id,
      finding: 'not_established' as const,
      evidence_ids: [],
      coverage: { examined_files: 0, relevant_files: 0, gaps: ['mock: no fixture'], negative_search_sufficient: false },
      confidence: 0,
      rationale: 'mock provider has no fixture for this criterion',
      missing_proof: ['real assessment unavailable'],
    };
    return {
      verdicts: [
        {
          criterion_id: input.criterion_id,
          finding: template.finding,
          evidence_ids: template.evidence_ids,
          coverage: template.coverage,
          confidence: template.confidence,
          rationale: template.rationale,
          missing_proof: template.missing_proof,
        },
      ],
      usage: {
        provider: this.name,
        model: this.model,
        prompt_version: PROMPT_VERSION,
        prompt_hash: promptHash(input),
        input_tokens: 0,
        output_tokens: 0,
        latency_ms: Date.now() - started,
      },
    };
  }
}

export function configError(message: string): ModelError {
  return new ModelError(message, 'config', false);
}
