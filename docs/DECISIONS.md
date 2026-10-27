# Architecture Decisions

Living log. Newest first. Status: proposed | accepted | superseded.

## ADR-001 (accepted 2026-10-27): TypeScript npm-workspaces monorepo, zero-runtime-dep core

- Choice: `packages/*` + `samples/*` under npm workspaces, strict `tsc`, `node:test` + assert.
- Why: Node 24 + npm 11 verified on this machine; no native modules, no network needed for tests,
  reproducible on a fresh Windows checkout with `npm install && npm test`.
- Blueprint §18 names pnpm; npm is the recorded equivalent (DoD allows equivalents).
- Upgrade path: unchanged — workspaces map 1:1 to the blueprint tree.

## ADR-002 (accepted 2026-10-27): JSONL append-only ledger, no SQLite in P0

- Choice: `.buildbrief/events.jsonl` (append-only) + materialized `state/*.json` views.
- Why: blueprint allows "JSONL or SQLite"; JSONL has zero deps, is human-inspectable for judges,
  and enforces immutability naturally. SQLite/Postgres later for multi-user sync (see roadmap).
- Secrets rule: raw prompts stay local; `.buildbrief/` is git-ignored by default; export is explicit.

## ADR-003 (accepted 2026-10-27): Deterministic evidence first, model second

- Choice: verifier pipeline = deterministic retrieval + citation resolver + rule adjudicator,
  with the Meta model as an *optional* assessor whose citations are re-validated mechanically.
- Why: blueprint invariants §1–§2 — verdicts must be reproducible without a model; offline fallback
  must degrade to `not_established`, never to a stale green.
- Verdict vocabulary (internal): `supported | partial | contradicted | not_established | not_applicable`.
  `missing` is a UI-only label for exhaustive-scope absence (§13.2).

## ADR-004 (accepted 2026-10-27): Reverse check speaks in hypotheses

- Orphan hunks are reported as `possibly_unrequested` with reasons + human disposition
  (`explained | linked | approved | rejected | pending`). Never auto-revert, never "malicious".

## ADR-005 (accepted 2026-10-27): Meta provider behind a typed interface, mock by default in tests

- `ModelProvider` interface; `MetaApiProvider` (fetch, Standard endpoint, structured JSON) +
  `MockProvider` (deterministic fixtures). Model name, prompt hash, token usage logged per call.
- Real Meta smoke test is a P0 gate but eval/tests must pass with zero network.
- Pending subagent validation of exact endpoint/auth/schema (see PROGRESS.md).

## ADR-006 (accepted 2026-10-27): CLI first, web second

- P0 demo surface = `bb` CLI + JSON/Markdown/HTML report export. Web workbench (Next.js) starts
  only after the slice rechecks green twice (blueprint hard-cut rule, §17).

## ADR-007 (accepted 2026-10-27): Deleted tests are always review items

- A deleted test file is flagged (`deleted_test_or_suite`, risk ≥ high) even when its content
  maps to an approved criterion — mapped ids are kept as context, not clearance. Rationale:
  deletion destroys proof; only a human disposition (`linked | explained | approved | rejected`)
  can retire it. Modifying a test maps normally.
