# BuildBrief Audit — 2026-10-28 (execution audit, not a plan)

Method: every claim below was re-observed this session (fresh `npm test`,
`npm run test:eval`, MCP tool listing, route/CLI enumeration, source reads,
secret scan). Prior completion reports were treated as hypotheses.

## Ground truth (observed, not quoted)

- Unit tests: **60/60 pass** (56 package suites + 4 hook-handler tests). The
  brief's "42" is stale (predates M3d–M3i).
- Eval: **30 cases, all green** — 22 dev + 6 holdout + 2 documented gap probes.
  Verdicts P/R 1.00 (32/0/0); orphans P/R 1.00 (8/0/0, 2 informative-low).
  The brief's "20" is stale. Single reviewer (owner WIP); blueprint asks two.
- MCP tools: **12** (`bb_capture`, `bb_list_intents`, `bb_approve_intent`,
  `bb_get_context`, `bb_verify`, `bb_report`, `bb_make_fix_brief`,
  `bb_explain`, `bb_quiz`, `bb_tour`, `bb_map`, `bb_autopsy`). "Seven" is stale.
- CLI commands: **15** (capture, list, approve, verify, recheck, reverse, fix,
  report, explain, quiz, answer, grade, tour, map, autopsy).
- Web routes: **6 pages** (`/`, `/intent/[id]`, `/runs`, `/run/[id]`,
  `/changes`, `/map`) + **2 mutation APIs** (`/api/approve`, `/api/dispose`).
  Owner-verified live render 2026-10-28 (intent ledger + intent detail).
- Hooks: handlers unit-tested (4/4); firing shapes A/B failed under
  `muse exec`, template ships UNVERIFIED. "Live hooks" is **not verified**.
- Meta API: provider implemented + unit-tested against validated docs
  (`muse-spark-1.3`, Standard pricing); **zero live calls** — no
  `BB_META_API_KEY` in env. "Integration" = code + contract, not traffic.
- Secrets: scan clean (no `LLM_…`, AWS keys, or private-key blocks in code).
- VerificationReport carries **no test-run records** (command/log uncaptured).

## Inventory vs the 7 required experiences

- **Intent Memory — implemented + tested (CLI/MCP), read-only in web.**
  Capture/approve/versioning, ambiguity flags, constraints, session/agent
  attribution all work and are tested. Web shows source text, hash, criteria,
  constraints, ambiguities + approve button; no capture form; intent page
  omits session/agent attribution.
- **Verification Studio — partial.** Run page shows verdicts, grades,
  rationale, evidence spans, missing proof, adjudicator notes, orphans.
  Missing: no source-code viewer (cites lines, never shows them), no
  test-run records (see above), no verify/reverify trigger in web.
- **Correction Studio — engine done, web missing.** Fix packs + autopsy work
  via CLI/MCP (tested, demoed). Web has no fix-brief view, no export/copy,
  no reverify action. Nothing ever auto-marks resolved (verified in code).
- **Understanding Studio — engine done, web thin.** Explain/quiz/answer/
  grade/tour/map via CLI/MCP (tested, demoed). Web has `/map` only.
- **Project onboarding — not implemented.** Projects are CLI flags; repo
  connection is a CLI path; no connect flow, no status, no labeled demo
  project (only `BB_WORKSPACE` + "Looked in" line).
- **Team Handover — engine partial.** Role tours via CLI (tested). No teams,
  invites, or authorization model (single local user, no auth anywhere).
- **Project onboarding — DONE (M4d):** `/connect` status + `/new` capture
  flow + labeled `samples/demo-seed.mjs` (run live). **Handover — DONE
  (M4d):** `/handover` per-role briefs; invites explicitly out of scope in
  local mode (no access theater). **Settings — DONE (M4d):** read-only
  status + ledger export download + immutability note (no delete by design).
- **Settings/Integrations — not implemented.** No settings page, provider UI,
  privacy UI (disclosure docs exist), or data-management UI.

## Non-negotiables

Hold: immutable history, mechanical citation checks, stale distinguishable,
no tier promotion (adjudicator), env-only credentials, eval + tests green,
no fabricated results, no silent approval. **Fail:** permissions at API
layer (no auth on web mutations — localhost-only by convention, not
enforcement); test-run evidence not persisted; cloud sync/collab absent
(by design, P2).

## Known defects (all fixed same-session) / limitations

Fixed M3f–M3i: pack-id collision, lexicographic revision-max (CLI + web),
read-path ledger creation. Open: lexical engine gaps (2 documented probes);
single-language-per-case fixtures; hook firing unverified; no live Meta
traffic; web API without auth; quiz `predict` needs human grades by design.

## Dependency-ordered plan (P0 = hackathon vertical)

1. **P0 — web-connected loop:** DONE (M4a). `extractDraft` in domain core;
   `/api/capture|verify|fix|recheck`; `/new`; forms on intent/run pages;
   loopback bind.
2. **P0 — evidence viewer:** DONE (M4b) — `/evidence` with revision read,
   hash check, secret withholding (in `@buildbrief/repo`, 5 tests). Test-run
   persistence into report JSON: DONE (M4c) — `test_runs` on the report,
   renderer sections, web acceptance execution + display.
3. **P1 — Understanding web:** explain/quiz/answer-grade UI on intent page;
   tour selector; quiz needs human-grade queue for `predict`.
4. **P1 — onboarding depth:** connection-status card (repo path, branch,
   ledger path, provider reachability without leaking keys), labeled demo
   project seed script.
5. **P2 — consolidation + cloud:** route handlers call cmd layer (single
   implementation); API auth; cloud sync as separate layer; second reviewer
   for eval labels; Meta live adjudication measurement.

## Slice acceptance (this milestone)

In the browser, against a scratch ledger: new project capture → approve →
verify → inspect real spans → fix brief → patch → recheck → before/after
visible. No new verdict logic; every control backed by the ledger.
