# Progress

## 2026-10-27 (Tue) — Day 1

### Done
- Read `MASTER_BLUEPRINT.md` in full (721 lines). Canonical spec understood; §18 EPIC 00–07 = P0 path.
- Located both research PDFs in project root (earlier search-tool miss corrected via `Get-ChildItem`).
  Extraction via pypdf: both are the SAME 4-page Independent Reconciliation Audit, text-identical
  (MD5 `8890f444…`), differing only in container metadata. Both kept under `docs/research/` + README.
  Underlying A/B source docs are not on disk; their positions survive via blueprint + audit quotes.
- Environment: Node v24.11.1, npm 11.6.2, git 2.53, Python 3.14, npm registry reachable (PONG 862ms).
  PowerShell sandbox needed one `require_escalated` approval (ACL publication timeout) — recorded below.
- Spawned research subagent `meta-api-docs-validation` (Meta endpoint/auth/schema/hook-list validation).
- Wrote `docs/research/README.md`, `docs/DECISIONS.md` (ADR-001…006), `docs/ARCHITECTURE.md`,
  `docs/IMPLEMENTATION_PLAN.md`.

### Tests run
- PDF extraction + hash comparison (pass; evidence above). No code tests yet (nothing scaffolded).

### Next
Scaffold workspaces + EPIC 01/02 (domain, store, CLI capture/approve) with `node:test` suites.

## 2026-10-28 (Wed) — Day 2 (M2)

### Done
- Baseline re-verified: commit `67956fe` intact, 32/32 unit + 12/12 eval green before changes.
  Default sandbox used throughout (no escalation, no bypass).
- Engine stress: 6 new dev cases (cross-file evidence/contradiction, `.env` orphan,
  multi-file verdicts, second-revision staleness, vacuous criteria) + 4 CLI capture
  tests (ambiguity/conflict preserved, never auto-approved) + 2 known-gap probes
  (comment-mirage FP, vocabulary-miss FN — documented, gated out of metrics).
- Meta docs re-validated live (endpoint, Bearer `LLM_`, `muse-spark-1.3` Standard,
  `response_format:json_schema`); no key in env so no live call (see `docs/META_SETUP.md`).
- Native integration: stdio MCP server (7 tools, JSON-RPC harness green), project
  skill (`muse skills validate`: valid), hook handlers (capture/guard, 4/4 green).
  `.muse/hooks.json` ships as an UNVERIFIED template (ADR-009, empirical log kept).
- Integrated referral demo via MCP (`samples/referral-demo/mcp-loop.mjs`): capture,
  approve, verify, fix through the server; patch + CLI recheck flips expiry to
  supported with old findings invalidated. Provenance labels added to DEMO.md.
- Web/Understanding Studio scoped as plan-only (`docs/WEB_PLAN.md`); no mock UI built.

### Tests run
- `npm test`: 42/42 (32 dist suites + 4 CLI + 2 MCP + 4 handlers).
- `npm run test:eval`: dev 16/16, holdout 4/4; verdicts P/R 1.00 (21/0/0);
  orphans P/R 1.00 (5/0/0, 2 informative-low); gaps documented 2.
- `muse skills validate .agents/skills/build-brief`: valid.
- Scope reminder: controlled seeded benchmark only, not real-world accuracy.

### Next
M3: Meta live smoke (needs key) → `--provider meta` on one eval case → quiz +
role tour (WEB_PLAN phase 2 slice) → interactive-session hook firing test.

## Milestone log (append-only)

- M0 2026-10-27: audit + docs + plan complete; coding not started.
- M1 2026-10-27: P0 vertical slice works end-to-end (EPICs 01–07, minus web).
  Capture -> approve -> verify -> fix pack -> patch -> recheck demonstrated live via
  CLI on a seeded demo repo: expiry `not_established` -> `supported` across revisions,
  2 old findings invalidated, auth orphan held for disposition. See
  `samples/referral-demo/DEMO.md` for the replay script.
  Unit: 32/32 pass. Eval: 10/10 dev + 2/2 holdout, orphan precision/recall 1.00,
  0 fake citations, $0 model cost (rules-v1). Results in `eval-results/` (git-ignored).
  Commit: `67956fe` (new commit only; nothing pushed, history untouched).
- M2 2026-10-28: real integration + independent verification. MCP server, skill,
  handlers tested; eval 16 dev + 4 holdout + 2 documented gaps; Meta re-validated
  (no live call — no key); hooks template UNVERIFIED; web/Studio plan-only.
