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
- `npm test` — build + all unit suites (32 tests)
- `npm run test:eval` — seeded benchmark, 10 dev + 2 holdout (exit nonzero on failure)
- `node packages/cli/dist/src/main.js <cmd> --help` — CLI surface

## Conventions

- Pure deterministic logic first; model calls only behind `ModelProvider`, citations re-validated mechanically.
- Verdicts: `supported | partial | contradicted | not_established | not_applicable`. Default under uncertainty: `not_established`.
- Orphan hunks: `possibly unrequested` + human disposition. Never auto-revert, never "malicious".
- New behavior needs a maintained test in the package's `test/` dir (skill: durable-test-collateral).
- No secrets in repo, ledger, logs, or model payloads. `.buildbrief/` and `eval-results/` stay git-ignored.
- ASCII-only in CLI/report output (Windows console safety).

## Project Layout

- `packages/domain|store|repo|model-meta|verifier|cli|eval`, `samples/referral-demo`, `docs/`, `eval-results/` (ignored)
