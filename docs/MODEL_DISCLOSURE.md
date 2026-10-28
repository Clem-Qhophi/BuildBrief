# Model and tool disclosure

## Models

| Use | Model | Mode | When |
|:---|:---|:---|:---|
| Verdict proposals over evidence excerpts | `muse-spark-1.3` via `POST https://api.meta.ai/v1/chat/completions` | Standard (content NOT used for training) | Only with `--provider meta` and a key set; otherwise never called |
| Default assessment (deterministic) | `rules-v1` (lexical, in-repo) | Local, $0 | Default for CLI, eval, and all measured results |
| Test double | `mock-1` (fixture-driven) | Local | Unit tests only |

All reported benchmark numbers were produced by `rules-v1`. No live Meta call
has been made from this project to date (no key in the build environment).

## How the model is constrained

- Structured output only: `response_format: { type: 'json_schema', ... }`
  against the `BbVerdict` schema; non-conforming output is rejected, never parsed loosely.
- The model returns verdicts over evidence IDs it was given; it never supplies
  file paths or line numbers. The verifier re-attaches pointers, mechanically
  re-resolves every citation, and the adjudicator downgrades anything invalid —
  including model citations of unknown IDs.
- Transmitted excerpts are allowlisted, size-capped, and secret-scanned;
  secret-shaped files are cited by path with content withheld.
- Every call records model, prompt version + hash, token usage, and latency.

## Tools and frameworks

TypeScript + Node 24, Next.js 16 + React 19 (workbench), Git CLI (evidence),
`node:test`. Zero runtime dependencies in the verification core. Built with
Muse Code; architecture and all code reviewed by the project owner.
Pricing assumption for Standard `muse-spark-1.3` (per 1M, from official docs
2026-10-28): input $1.25, cached input $0.15, output $4.25 — re-verify at
submission time.
