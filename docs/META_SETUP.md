# Meta Model API setup (exact user action)

Build Brief calls Meta only through `MetaApiProvider`
(`packages/model-meta/src/meta.ts`), validated 2026-10-28 against
https://dev.meta.ai/docs/authentication, `/docs/models`,
`/docs/structured-output`, `/docs/pricing-rate-limits`:

- Endpoint `POST https://api.llama.com/v1/chat/completions` (OpenAI-compatible; override with `BB_META_BASE_URL`; the older `api.meta.ai` default was retired in ADR-014).
- Model `muse-spark-1.3`, Standard mode (content NOT used for training).
- Auth `Authorization: Bearer` key in `BB_META_API_KEY` (fallback `MODEL_API_KEY`); keys look like `LLM_<id>_<secret>`.
- Structured output via `response_format: {type: "json_schema", ...}`.
- Pricing (Standard, per 1M): input $1.25, cached input $0.15, output $4.25.

## What you do (maintainer only, ~5 minutes)

1. Claim the $150 credit through the organizer-provided link (checklist H4).
2. Create a key, then set it for your shell only (never commit it):
   PowerShell: `$env:BB_META_API_KEY = 'LLM_...'` (or `MODEL_API_KEY`; `BB_` wins).
3. Smoke test (no code changes, ~$0.01):
   `bb verify --project demo --intent <ID> --repo <REPO> --provider meta`
   Without a key this fails loudly instead of fabricating results.
4. Optional caps: `BB_META_BASE_URL`, `BB_META_MODEL` (defaults shown above).

No key exists in this environment (checked 2026-10-28: both vars empty), so no
live call has been made. The deterministic `rules` provider remains the default;
`mock` serves tests. Every model call logs model, prompt hash, token usage, and
latency — never the key.
