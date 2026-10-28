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

## ADR-013 (accepted 2026-10-28): Prompt Autopsy groups failed attempts, never accuses

- One autopsy per criterion over its failed findings (`partial` /
  `not_established` / `contradicted`), stale findings included — history is
  the point. Fewer than two attempts is refused with a pointer to `bb fix`.
  Output is Observed facts (ledger quotes) / Plausible causes (labeled
  hypotheses: stall, location-guess, unmoved blocker, destroyed proof,
  scope spill) / Unknowns (test output, agent prompts, orphan motive) plus
  one bounded next prompt. Causes never allege intent; orphans stay
  possibly-unrequested. Evidence spans reload from report JSONs, so autopsy
  works on any ledger with intact reports.

## ADR-012 (accepted 2026-10-28): Test-file risk parity across languages

- `test_file_touched` (high risk) covers pytest conventions (`test_*.py`,
  `*_test.py`, `tests+/` dirs, `conftest.py`) exactly as it covers JS/TS
  (`.test.*`, `.spec.*`, `__tests__/`). Rationale: the engine is lexical and
  language-agnostic, but path conventions are not — a deleted Python suite must
  trigger ADR-007 like a deleted JS suite. Near-miss names (`contest.py`,
  `latest.py`) are pinned low by unit test.

## ADR-011 (accepted 2026-10-28): Comprehension map counts only live answers, shows finding as context

- A map cell reaches `demonstrated` on ≥1 passing answer against a non-retired
  quiz pinned to the current revision — regardless of the criterion's finding.
  The finding (`supported`/`partial`/…) is displayed beside the status, not used
  to gate it: conflating verification strength with comprehension would make
  partial-finding criteria permanently unmeasurable. Old-revision answers never
  count (cell degrades to `stale`); criteria with questions but no answers are
  `untested`, with none are `unmeasured`. No percentages without denominators.

## ADR-010 (accepted 2026-10-28): Quiz grading honesty

- `locate` answers are graded mechanically (`gradeLocate`: file + overlapping
  range, no partial credit). `predict`/`explain_back` stay `pending` until a
  human grades them — no model judgment, no pseudo-scores, owner override always
  allowed. Questions are generated only from verified findings with path evidence
  and retire automatically when cited snippets move.

## ADR-009 (accepted 2026-10-28): Native integration via MCP + skill first, hooks template unverified

- Empirically (Muse 1.4.14): only the MCP server (JSON-RPC harness), the project
  skill (`muse skills validate`: valid), and the handlers (unit-tested,
  payload-defensive) count as functioning integration. The `.muse/hooks.json`
  inner schema is unpublished; two candidate shapes failed to fire under
  `muse exec` (details: `packages/muse/HANDLERS.md`). The template ships marked
  UNVERIFIED; live firing needs one interactive session. PreToolUse guard is
  advisory (exit 0 + warn) until block semantics are confirmed on the installed
  build — inventing an exit-code protocol would be fabrication.

## ADR-008 (accepted 2026-10-28): False-accusation metric counts medium+ only

- An unexpected orphan flag at low risk is informative-by-design (never silent about
  unmapped changes), not a false accusation. The eval's orphan precision counts only
  unexpected flags at medium risk or higher as FP; low-risk unexpected flags are
  reported as `informativeLow`. Rationale: punishing low-risk transparency would
  incentivize silence, which the product forbids.

## ADR-007 (accepted 2026-10-27): Deleted tests are always review items

- A deleted test file is flagged (`deleted_test_or_suite`, risk ≥ high) even when its content
  maps to an approved criterion — mapped ids are kept as context, not clearance. Rationale:
  deletion destroys proof; only a human disposition (`linked | explained | approved | rejected`)
  can retire it. Modifying a test maps normally.
