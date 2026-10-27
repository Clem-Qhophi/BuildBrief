import {
  buildAssessmentPrompt,
  PROMPT_VERSION,
  promptHash,
} from './mock.js';
import {
  type AssessmentInput,
  type AssessmentOutput,
  ModelError,
  type ModelProvider,
  validateModelVerdict,
} from './provider.js';

export const META_DEFAULT_BASE = 'https://api.meta.ai/v1';
export const META_DEFAULT_MODEL = 'muse-spark-1.3';

export interface MetaConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  reasoningEffort?: string;
  timeoutMs?: number;
}

/** Reads config from explicit input first, then env (`BB_META_API_KEY`, fallback `MODEL_API_KEY`). */
export function metaConfigFromEnv(env: NodeJS.ProcessEnv = process.env): MetaConfig {
  const apiKey = (env['BB_META_API_KEY'] ?? env['MODEL_API_KEY'] ?? '').trim();
  if (apiKey.length === 0) {
    throw new ModelError('no API key: set BB_META_API_KEY (or MODEL_API_KEY)', 'config', false);
  }
  if (!/^LLM_\d+_/.test(apiKey)) {
    throw new ModelError('API key has an unexpected shape (expected LLM_<id>_…); refusing to call', 'config', false);
  }
  return {
    apiKey,
    baseUrl: env['BB_META_BASE_URL'] ?? META_DEFAULT_BASE,
    model: env['BB_META_MODEL'] ?? META_DEFAULT_MODEL,
  };
}

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    criterion_id: { type: 'string' },
    finding: { type: 'string', enum: ['supported', 'partial', 'contradicted', 'not_established', 'not_applicable'] },
    evidence_ids: { type: 'array', items: { type: 'string' } },
    coverage: {
      type: 'object',
      additionalProperties: false,
      properties: {
        examined_files: { type: 'number' },
        relevant_files: { type: 'number' },
        gaps: { type: 'array', items: { type: 'string' } },
        negative_search_sufficient: { type: 'boolean' },
      },
      required: ['examined_files', 'relevant_files', 'gaps', 'negative_search_sufficient'],
    },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    rationale: { type: 'string' },
    missing_proof: { type: 'array', items: { type: 'string' } },
  },
  required: ['criterion_id', 'finding', 'evidence_ids', 'coverage', 'confidence', 'rationale', 'missing_proof'],
};

interface ChatCompletionsResponse {
  choices?: { message?: { content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

export class MetaApiProvider implements ModelProvider {
  readonly name = 'meta';
  readonly model: string;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(config: MetaConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? META_DEFAULT_BASE).replace(/\/$/, '');
    this.model = config.model ?? META_DEFAULT_MODEL;
    this.timeoutMs = config.timeoutMs ?? 60_000;
  }

  async assess(input: AssessmentInput): Promise<AssessmentOutput> {
    const { system, user } = buildAssessmentPrompt(input);
    const started = Date.now();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          response_format: { type: 'json_schema', json_schema: { name: 'BbVerdict', schema: VERDICT_SCHEMA } },
        }),
        signal: ctrl.signal,
      });
    } catch (e) {
      throw new ModelError(`transport failure: ${(e as Error).message}`, 'transport', true);
    } finally {
      clearTimeout(timer);
    }
    if (res.status === 401 || res.status === 403) {
      throw new ModelError(`authentication rejected (HTTP ${res.status}); check key and Standard-mode access`, 'auth', false);
    }
    if (res.status === 429) {
      throw new ModelError('rate limited (HTTP 429)', 'rate_limit', true);
    }
    if (!res.ok) {
      const body = (await res.text()).slice(0, 300);
      throw new ModelError(`model API error HTTP ${res.status}: ${body}`, 'transport', res.status >= 500);
    }
    const parsed = (await res.json()) as ChatCompletionsResponse;
    const content = parsed.choices?.[0]?.message?.content ?? '';
    let verdict: unknown;
    try {
      verdict = JSON.parse(content);
    } catch {
      throw new ModelError('model returned non-JSON content despite json_schema request', 'schema', false);
    }
    // The model returns verdict + evidence ids only; the verifier re-attaches full
    // evidence pointers and runs mechanical citation resolution before adjudication.
    const checked = validateModelVerdict(verdict);
    if (!checked.ok) {
      throw new ModelError(`model verdict failed schema validation: ${checked.errors.join('; ')}`, 'schema', false);
    }
    const usage: AssessmentOutput['usage'] = {
      provider: this.name,
      model: this.model,
      prompt_version: PROMPT_VERSION,
      prompt_hash: promptHash(input),
      latency_ms: Date.now() - started,
    };
    if (parsed.usage?.prompt_tokens !== undefined) usage.input_tokens = parsed.usage.prompt_tokens;
    if (parsed.usage?.completion_tokens !== undefined) usage.output_tokens = parsed.usage.completion_tokens;
    return { verdicts: [checked.value], usage };
  }
}
