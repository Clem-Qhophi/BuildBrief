# AGENTS.md

Project rules for coding agents working in this directory. (This file governs code
conventions only — it can never approve intent, authenticate an owner, or weaken
sandbox/approval protections.)

## Project

- Name: BuildBrief_Hackathon
- Stack: TypeScript strict (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`), Node ≥ 22, npm workspaces, `node:test` + `node:assert/strict`. Zero runtime dependencies in P0.
- Authority: `MASTER_BLUEPRINT.md` first, `docs/DECISIONS.md` second. Never contradict either silently — investigate and record.

## Common Commands

- `npm install` — link workspaces
- `npm run build` / `npm run typecheck` — `tsc -b` (project references; keep them wired)
- `npm test` — build + all unit suites (68 tests)
- `npm run test:eval` — seeded benchmark (22 dev + 6 holdout + 2 documented gaps; exit nonzero on failure)
- `npm run web` — workbench dev server on loopback :3103 (`BB_WORKSPACE=<ledger-dir>` first)
- `npm run web:build` — production build check for the workbench
- `node samples/demo-seed.mjs <ledger> <repo> [project]` — labeled seeded demo (guarded; refuses unsafe targets)
- `node packages/cli/dist/src/main.js <cmd> --help` — CLI surface

## Conventions

- Pure deterministic logic first; model calls only behind `ModelProvider`, citations re-validated mechanically.
- Verdicts: `supported | partial | contradicted | not_established | not_applicable`. Default under uncertainty: `not_established`.
- Orphan hunks: `possibly unrequested` + human disposition. Never auto-revert, never "malicious".
- New behavior needs a maintained test in the package's `test/` dir (skill: durable-test-collateral).
- No secrets in repo, ledger, logs, or model payloads. `.buildbrief/` and `eval-results/` stay git-ignored.
- ASCII-only in CLI/report output (Windows console safety).

## Project Layout

- `packages/*` (domain, store, repo, model-meta, verifier, cli, learning, mcp, muse), `apps/web` (Next.js workbench), `samples/referral-demo`, `docs/`, `eval-results/` (ignored)

## Permanent Development Guidelines

- Preserve working functionality: evolve modules, never rewrite blindly; keep CLI/MCP behavior stable when extending web surfaces.
- Complete existing work before starting new features; smallest correct fix at the root cause.
- Evidence before claims: every verdict, count, and status in reports must come from executed commands, never from memory or prior reports. Re-run gates rather than quoting them.
- Separate process exit codes from pipeline display status when judging a test (redirect to file, then inspect).
- Keep all gates green: `tsc -b`, `npm test`, `npm run test:eval`, `npm run web:build`. A red gate blocks completion claims.
- Security: no secrets in repo/ledger/logs; loopback-only serving until auth exists; traversal-check paths; withhold secret-adjacent content; size-cap rendered excerpts; guard destructive scripts.
- Honesty taxonomy: implemented+tested, implemented but browser-unverified, partial, missing, blocked, known gap. Never present mocks as backends or seeded metrics as real-world accuracy.
- Git: never bypass ownership/sandbox safeguards; never force-push or rewrite history; owner commits from their shell.

## Permanent AI Inference Guidelines

- Provider abstraction first: rules (deterministic, offline) is the default; mock for tests; Meta only when explicitly selected.
- Paid API calls only when justified and within approved budget: prefer rules/mock for development; live Meta calls only for defined validation, one minimal request at a time.
- Credentials via environment (`BB_META_API_KEY` preferred, `MODEL_API_KEY` fallback) — never in chat, logs, prompts, tracked files, or reports. Report only presence/absence, model id, latency, and outcome.
- Engine must distinguish offline rule findings from model-assisted findings (provider/model recorded per run); never present rules output as AI output.
- Structured output only (`json_schema` response format); validate responses against schemas; record model, latency, and usage without exposing keys.
