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
  Commit: `c5be482` (new commit only; nothing pushed, history untouched).
- M3a 2026-10-28: Understanding Studio slice. `bb explain/quiz/answer/grade/tour`
  + `bb_explain/bb_quiz/bb_tour` MCP tools; deterministic explain, locate+predict
  generation, mechanical locate grading, human grading for open answers, auto-retire
  on evidence movement, role tours with explicit unknowns. Live demo: locate pass,
  predict pending→owner pass, 2 questions retired after patch. Also fixed relative-root
  `safeJoin` blindness found live. Unit 49/49; eval unchanged 16/16 + 4/4.
- M3b 2026-10-28: web workbench (`apps/web`, Next 16 + React 19). Intents, intent
  detail + approve, runs, run detail, changes + dispositions — all over the real
  ledger, no new verdict logic. `next build` green; data layer probed on a real
  demo ledger. Live HTTP render UNVERIFIED (sandbox denies sockets); first browser
  open on the owner machine is the smoke test.
- M3c 2026-10-28: submission kit. SUBMISSION, DEMO_SCRIPT (10-min runbook),
  VIDEO_OUTLINE, MODEL_DISCLOSURE, PRIVACY, FAILURE_CASES; README claims
  re-verified; gates re-run green (49 unit, 16/16 + 4/4 eval, web build).
  Recording + portal submit remain owner actions.
- M3d 2026-10-28: Comprehension Map. `comprehensionMap` (6 honest states,
  ADR-011) + `bb map` + `bb_map` MCP tool + workbench `/map` page.
  Live demo: 2 criteria demonstrated at rev 85c04a9 (locate mechanical pass,
  predict owner pass), both stale after v4 commit; MCP bb_map smoke-tested.
  Gates: 50/50 unit, 16/16 + 4/4 eval, web build green (incl. /map).
- M3e 2026-10-28: second-language eval set. 6 Python dev + 2 Python holdout
  cases (30 total); `expectedRisk` harness assertion; ADR-012 test-file parity
  fix (failing unit test first, then `SENSITIVE_PATH_RULES` extension).
  Gates: 51/51 unit, dev 22/22 + holdout 6/6, verdicts P/R 1.00 (32/0/0),
  orphans P/R 1.00 (8/0/0, 2 informative-low), web build green.
- M3f 2026-10-28: demo dry run + script hardening. Executed DEMO_SCRIPT end to
  end on scratch dirs: all expects matched (partial/not_established/critical
  orphan → fix → supported + 2 invalidated → Studio pass/pending → map).
  Fixed drift: `$BB` double-`node` bug, bare-`bb` commands, missing
  `Set-Location` (CLI ledgers live in CWD), mcp-loop's unrunnable hint, stale
  16/4 counts in SUBMISSION/VIDEO_OUTLINE; added `map` to the script and a
  read-path cache wart to KNOWN_ISSUES. Verbatim re-run of the corrected setup
  passes; repo root confirmed clean of stray ledgers.
- M3g 2026-10-28: Prompt Autopsy (blueprint §13.4). Pure `autopsy()` in
  verifier + `bb autopsy` (ledger loader) + `bb_autopsy` MCP tool; 4 unit
  tests incl. seeded 3-attempt timeline. Live on dryrun ledger: credit
  criterion dissected over 2 partials (stall named, pack lineage shown),
  expiry correctly refused (1 failure → `bb fix`). Found + fixed live:
  pack-id collision dropped all but the last pack per run (now
  `pack-<run>-<finding>`, regression-tested). MCP smoke green.
  Gates: 56/56 unit, dev 22/22 + holdout 6/6, verdicts/orphans P/R 1.00,
  web build green.
- M3h 2026-10-28: stability pass. Fresh-clone simulation (clean copy, `npm
  install`, build, 56/56 unit, 22/22+6/6 eval, web build) all green. Full
  DEMO_SCRIPT reset run verbatim: all sections matched after one fix.
  Found + fixed live: map "current revision" used lexicographic SHA-max,
  wrongly pinning v2 as current on the reset ledger (new shared
  `latestRevision`, time-ordered, 2 regression tests; CLI + web fixed).
  Flakiness hunt: unit 58/58 ×3 identical, eval ×2 byte-identical
  (normalized), metrics unchanged. Repo root clean of stray ledgers.
- Owner verified the live workbench render (intent ledger + intent detail,
  stale/fresh findings correct); added the missing Map nav link from the
  screenshots. Web README now records render VERIFIED.
- M4a 2026-10-28 (audit slice): `docs/AUDIT.md` — ground truth 60/60 unit,
  30 eval, 12 MCP tools, 15 CLI cmds (brief's 42/20/7 corrected), hooks NOT
  live-verified, Meta zero live calls, test-runs unpersisted. Moved
  `extractDraft` to domain core. Web-connected loop: `/api/capture|verify|
  fix|recheck` + `/new` onboarding-lite + verify/packs/recheck forms on
  intent/run pages; dev/prod bound to loopback (mutation APIs have no auth).
  Gates: 60/60 unit, 22/22+6/6 eval, web build green (13 routes). Browser
  click-through of the new loop is owner-verified, not sandbox-verified.
- M4b 2026-10-28 (audit slice, part 2): Understanding Studio web —
  `/api/quiz|answer|grade` on the learning engine plus explanation, role
  tours, and Q&A with human grading on the run page. Source-evidence viewer
  (`/evidence`, `git show` at the cited revision, hash check, secret
  withholding) moved into `@buildbrief/repo` core with 5 unit tests.
  `/settings` connection-status page; server bound to loopback. Gates:
  65/65 unit, eval unchanged, web build green (19 routes). New-loop and
  Studio click-throughs remain owner-verified.
- M4c 2026-10-28: test-run persistence. `VerificationReport.test_runs`
  carries attached runs (logs content-addressed by hash only); md/html
  renderers gain a Test-runs section with an honest empty state. Web
  verify/recheck accept an explicit acceptance command (+ covers paths):
  executed in the repo, recorded, E2-upgrading on pass. Run page shows the
  runs table + per-evidence test-backed markers; `/evidence` shows the
  covering run. Live probe: pass → E2_test, exit-3 → E1_source, no log
  leak. Gates: 67/67 unit, eval unchanged, web build green.
- M4d 2026-10-28: onboarding + handover + export. `/connect` status
  (workspace/ledger/repo/provider, all read-only) feeding `/new`; labeled
  demo seed script (`samples/demo-seed.mjs`, run live: partial/
  not_established/critical orphan as expected); `/handover` per-role briefs
  (honest: understanding shared, no access theater — local mode, no
  invites); ledger export download + immutability note in Settings.
  Gates: 67/67 unit, eval unchanged, web build green (22 routes).
- M4e 2026-10-28 (validation, PARTIAL — browser journeys owner-gated):
  security fixes (seed-script destructive guards incl. live refusal tests,
  viewer size caps, viewport meta + responsive tables, threat-model note);
  Meta still blocked (no key); bind still EACCES from sandbox. Independent
  seat-invite repo via CLI: supported/not_established/not_established all
  correct; one real extractor gap (unlisted "No X is ever Y" negative
  phrasing becomes an unprovable positive). UX fixes (run links keep
  project, intent links map + connection). Gates: 68/68 unit, eval
  unchanged, web build green (22 routes).
- M5 2026-10-28 (readiness, no features): P1 reconciled (exec-350 -1 =
  pipeline artifact; clean exits 0/0/0); guidelines in AGENTS.md; P2 route
  cross-check green + Playwright suite written-not-executed with owner
  procedure; P3 Meta still keyless; P4/P5 static pass clean; P6 release
  record `docs/M5_RELEASE_READINESS.md`. Gates re-verified: tsc 0, 68/68,
  22/22+6/6, web build green. Verdict: CONDITIONAL PASS (3 owner items).
- M5a 2026-10-28: e2e setup corrected. `@playwright/test@1.64.1` declared +
  installed (runner only, no browsers); spec type-checks; `--list`
  discovers 14/14 (config/imports/fixtures valid — executed, not assumed).
  README fixed: seed paths under `.demo-tmp` (guard-approved), per-terminal
  env (E2E_REPO re-set in T2), chromium install step, success/failure guide.
  Gates: 68/68 unit, web build green. Execution remains owner-side.
- M5a completion: temp-workspace seed green; all guard branches live-tested
  (root/equal/file/occupied refusals, user files intact); 14/14 discovered;
  secrets clean; no-key Meta state re-confirmed with usage passthrough
  audited. Full gates last green with zero package changes since (docs +
  e2e-only delta). Browser execution + live Meta + commit stay owner-side.
- M5b 2026-10-28: suite refactored to one serial journey (12 steps) + 3
  isolated negatives after a 7/14 owner run. Strict assertions only (no
  vacuous conditional passes); reverify asserts a genuinely new commit +
  revision on page; roles switch via real links; no invented scores.
  Validated: spec type-checks, 4/4 discovered, root tsc clean. Browser
  execution stays owner-side.
- M3i 2026-10-28: read-only stores stay read-only. `openProjectStore` no
  longer mkdirs; `appendEvent`/`writeView` create dirs lazily, and
  `rebuildViews` skips its write when no events exist. Verified live: a
  failed `bb map` in an empty dir leaves no `.buildbrief/`. 2 new unit
  tests. Gates: 60/60 unit, eval unchanged 22/22 + 6/6, web build green.
- M5c 2026-10-28: genuine-correction proof closed. CLI in `.demo-tmp/m5c-*`:
  expiry `not_established`/E0 (run a0e9352c @d6685e1, no evidence) ->
  `supported`/E1 (run ffca3cc2 @a6d0778, src/referral.js#L1-6), 2 old
  findings invalidated, auth orphan persists; functional check red exit 1
  -> green 5 pass exit 0. New fixture `samples/referral-demo/expiry.check.mjs`.
  Journey now captures the expiry requirement, asserts the before state,
  commits the real v3 fix + check, and re-verifies with it as the
  acceptance command (expects `supported` + `E2_test`); N3 self-provisions
  via API. README reseed-before-rerun. Gates: spec tsc 0, 4/4 discovered,
  root tsc 0, 68/68 unit. Browser run owner-side.
- Owner browser run 2026-10-28 (pre-M5c suite): 4 passed, 0 failed,
  15.9 s, Windows, corroborated by `apps/web/test-results/.last-run.json`
  (`status: passed`, `failedTests: []`, kept out of git). Limitation at
  that point: the reverify step used an empty commit, so a new revision
  did not prove a real source-code correction. M5c genuine-fix suite is
  written + statically validated (spec tsc 0, 4/4 discovered) and awaits
  its own owner browser run. Live Meta inference and production
  readiness remain unvalidated.
- Owner browser run 2026-10-28 (M5c genuine-fix suite): 4 passed, 0 failed,
  22.8 s, Windows. Server log shows the whole loop at HTTP 200 with zero
  500s (connect/new/capture/approve/verify/evidence/fix/recheck/role
  tour/handover/settings/export, negatives 400 + 404 as designed); ledger
  shows the journey + self-provisioned N3 projects. Genuine-correction
  demonstration is now browser-proven, not just CLI-proven.
- Meta readiness (no-cost paths, sandbox): no key -> clean `config` error
  exit 1; malformed key -> shape rejection before any transport; `mock`
  provider end-to-end green. No key material stored or logged. Smallest
  live smoke (owner, authorized): one `bb verify --provider meta` on the
  m5c intent (2 criteria = ~2 calls), then clear the session key.
- Full re-certification 2026-10-28 (sandbox, TEMP override): root `tsc -b`
  0, unit 68/68, eval 22/22 + holdout 6/6 (P/R 1.00, 2 known gaps),
  `web:build` green (all routes). No source changes; UI functionally
  covered by the owner-run browser suite.
