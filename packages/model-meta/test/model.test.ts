import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAssessmentPrompt,
  metaConfigFromEnv,
  MockProvider,
  PROMPT_VERSION,
  validateModelVerdict,
} from '../src/index.js';

describe('model-meta', () => {
  it('builds a deterministic prompt carrying only allowlisted excerpts', () => {
    const input = {
      criterion_id: 'c1',
      criterion_text: 'Codes expire after 30 days',
      negative: false,
      forbidden_terms: [],
      revision: 'abc',
      excerpts: [{ evidence_id: 'e1', path: 'src/r.ts', line_start: 3, line_end: 5, tier: 'E1_source', excerpt: 'expiry = 30' }],
      search_exhaustive: false,
    };
    const a = buildAssessmentPrompt(input);
    const b = buildAssessmentPrompt(input);
    assert.equal(a.user, b.user);
    assert.ok(a.user.includes('e1'));
    assert.equal(PROMPT_VERSION, 'bb-verify-v1');
  });

  it('mock returns fixtures and records calls', async () => {
    const mock = new MockProvider({
      c1: {
        criterion_id: 'c1', finding: 'supported', evidence_ids: ['e1'],
        coverage: { examined_files: 2, relevant_files: 2, gaps: [], negative_search_sufficient: false },
        confidence: 0.8, rationale: 'span shows expiry', missing_proof: [],
      },
    });
    const out = await mock.assess({
      criterion_id: 'c1', criterion_text: 't', negative: false, forbidden_terms: [], revision: 'r',
      excerpts: [], search_exhaustive: false,
    });
    assert.equal(out.verdicts[0]?.finding, 'supported');
    assert.deepEqual(out.verdicts[0]?.evidence_ids, ['e1']);
    assert.equal(mock.calls.length, 1);
    assert.ok(out.usage.prompt_hash.length === 64);
  });

  it('validates model verdicts strictly', () => {
    assert.equal(validateModelVerdict({}).ok, false);
    assert.equal(
      validateModelVerdict({
        criterion_id: 'c', finding: 'missing', evidence_ids: [], coverage: {
          examined_files: 0, relevant_files: 0, gaps: [], negative_search_sufficient: false,
        }, confidence: 1, rationale: 'x', missing_proof: [],
      }).ok,
      false,
    );
  });

  it('refuses to configure without a shaped key', () => {
    assert.throws(() => metaConfigFromEnv({}), /no API key/);
    assert.throws(() => metaConfigFromEnv({ BB_META_API_KEY: 'nope' }), /unexpected shape/);
    const cfg = metaConfigFromEnv({ BB_META_API_KEY: 'LLM_123_secretpart' });
    assert.equal(cfg.model, 'muse-spark-1.3');
    assert.equal(cfg.baseUrl, 'https://api.meta.ai/v1');
  });
});
