import {
  type AssessmentInput,
  type AssessmentOutput,
  type ModelProvider,
  type ModelVerdict,
  promptHash,
} from '@buildbrief/model-meta';

/**
 * Deterministic rule assessor (`rules-v1`). Offline fallback and eval baseline.
 * It reasons ONLY over excerpt text it was given:
 * - negative criterion: a RECORDED forbidden pattern present in evidence →
 *   contradicted; exhaustive clean search → supported; otherwise not_established
 *   (a negative without recorded forbidden patterns can never contradict).
 * - positive criterion: all keywords present → supported; some → partial;
 *   none → not_established.
 * The verifier's adjudicator still gates every verdict (citations, grades, scope).
 */
export class RuleAssessor implements ModelProvider {
  readonly name = 'rules';
  readonly model = 'rules-v1';

  async assess(input: AssessmentInput): Promise<AssessmentOutput> {
    const started = Date.now();
    const verdict = this.judge(input);
    return {
      verdicts: [verdict],
      usage: {
        provider: this.name,
        model: this.model,
        prompt_version: 'bb-verify-v1',
        prompt_hash: promptHash(input),
        input_tokens: 0,
        output_tokens: 0,
        latency_ms: Date.now() - started,
      },
    };
  }

  private judge(input: AssessmentInput): ModelVerdict {
    const coverage = {
      examined_files: input.excerpts.length,
      relevant_files: input.excerpts.length,
      gaps: input.search_exhaustive ? [] : ['retrieval scope not exhaustive'],
      negative_search_sufficient: input.search_exhaustive,
    };
    const usedIds = input.excerpts.map((e) => e.evidence_id);
    const haystack = input.excerpts
      .map((e) => `${e.path ?? ''}\n${e.excerpt}`.toLowerCase())
      .join('\n---\n');
    const text = input.criterion_text.toLowerCase();
    const contentWords = text.split(/[^a-z0-9]+/).filter((w) => w.length > 3);
    const hits = contentWords.filter((w) => haystack.includes(w));
    const coverageRatio = contentWords.length === 0 ? 0 : hits.length / contentWords.length;

    if (input.excerpts.length === 0) {
      // Exhaustive clean search is the ONE case where absence is evidence:
      // a negative criterion with nowhere for the forbidden pattern to hide.
      if (input.negative && input.search_exhaustive) {
        return {
          criterion_id: input.criterion_id,
          finding: 'supported',
          evidence_ids: [],
          coverage,
          confidence: 0.6,
          rationale: 'exhaustive search of the checked revision found no occurrence of the forbidden pattern',
          missing_proof: [],
        };
      }
      return {
        criterion_id: input.criterion_id,
        finding: 'not_established',
        evidence_ids: [],
        coverage,
        confidence: 0.1,
        rationale: 'no evidence retrieved for this criterion at the checked revision',
        missing_proof: ['retrieve or widen search scope; add source or test evidence'],
      };
    }

    if (input.negative) {
      // Only recorded forbidden patterns can contradict — related code sharing
      // vocabulary with the criterion is not a violation (naive overlap over-accuses).
      const forbidden = input.forbidden_terms.map((t) => t.toLowerCase()).filter((t) => t.length > 0);
      if (forbidden.length === 0) {
        return {
          criterion_id: input.criterion_id,
          finding: 'not_established',
          evidence_ids: usedIds,
          coverage,
          confidence: 0.2,
          rationale: 'negative criterion records no forbidden patterns; related vocabulary alone cannot contradict it',
          missing_proof: ['record concrete forbidden patterns for this negative requirement'],
        };
      }
      const found = forbidden.filter((t) => haystack.includes(t));
      if (found.length > 0) {
        return {
          criterion_id: input.criterion_id,
          finding: 'contradicted',
          evidence_ids: usedIds,
          coverage,
          confidence: 0.7,
          rationale: `forbidden pattern evidenced in source (${found.slice(0, 5).join(', ')}) which contradicts the negative requirement`,
          missing_proof: [],
        };
      }
      if (input.search_exhaustive) {
        return {
          criterion_id: input.criterion_id,
          finding: 'supported',
          evidence_ids: usedIds,
          coverage,
          confidence: 0.6,
          rationale: 'exhaustive search found no occurrence of the recorded forbidden patterns',
          missing_proof: [],
        };
      }
      return {
        criterion_id: input.criterion_id,
        finding: 'not_established',
        evidence_ids: usedIds,
        coverage,
        confidence: 0.3,
        rationale: 'no forbidden occurrence in retrieved evidence, but search scope was not exhaustive',
        missing_proof: ['exhaustive-scope search or a targeted negative test'],
      };
    }

    if (coverageRatio >= 0.8) {
      return {
        criterion_id: input.criterion_id,
        finding: 'supported',
        evidence_ids: usedIds,
        coverage,
        confidence: 0.75,
        rationale: `evidence spans cover the criterion's operative terms (${hits.slice(0, 6).join(', ')})`,
        missing_proof: input.search_exhaustive ? [] : ['broader retrieval to rule out partial coverage'],
      };
    }
    if (coverageRatio >= 0.35) {
      return {
        criterion_id: input.criterion_id,
        finding: 'partial',
        evidence_ids: usedIds,
        coverage,
        confidence: 0.5,
        rationale: `evidence covers some operative terms (${hits.slice(0, 6).join(', ')}) but not all`,
        missing_proof: ['evidence for the uncovered sub-conditions'],
      };
    }
    return {
      criterion_id: input.criterion_id,
      finding: 'not_established',
      evidence_ids: usedIds,
      coverage,
      confidence: 0.25,
      rationale: 'retrieved evidence does not address the criterion',
      missing_proof: ['source or test evidence matching the criterion'],
    };
  }
}
