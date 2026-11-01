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
- ADR-014 2026-10-28: default Meta host corrected to `api.llama.com`
  (was `api.meta.ai`; POST failed on both machines, docs + key shape
  agree). Test, `.env.example`, disclosure updated; build + model tests
  green. Model id `muse-spark-1.3` still unverified — owner smoke pending.
  Uncommitted; needs owner `git add` + commit.
- Product experience M6a 2026-10-29: dark design system (`globals.css`),
  app shell with sidebar nav + skip link (`layout.tsx`), Dashboard home
  (stats, next action, recent runs), workflow steppers on Connect/New.
  No backend or logic changes; every E2E selector string preserved.
  Gates: root tsc 0, `web:build` green. Browser visual review owner-side.
- M6a+ 2026-10-29: workflow steppers on Intent (step 3) and Run (step 4)
  pages. Static markup only; gates re-green (`tsc -b`, `web:build`).
- `docs/roadmap.md` 2026-10-29: hackathon slice vs commercial foundations
  split (auth, hosted sync, hardening, billing, connectors, model ops),
  with no-regret order. Tree re-verified `tsc -b` clean.
- M6b 2026-10-29: flagship slice. Skills installed
  (`.agents/skills/bb-frontend-direction`, `bb-web-quality-gate`; upstream
  sources recorded, no text vendored); libs evaluated, zero runtime deps
  added (shadcn/Motion/Bits/MagicUI/R3F rejected or deferred with reasons);
  AGENTS.md durable frontend guidelines. Dashboard rebuilt as intention
  flow + attention queue + run timeline; run page has verdict strip +
  expandable finding cards. Gates: `tsc -b` 0, `web:build` green, all E2E
  strings present. Visual review still owner-side.
- M6c 2026-10-29: supporting screens. Evidence Explorer (readable cited-line
  highlight, back-to-run link); changes review cards with recorded decisions;
  product-language ledes on handover/map/settings; step-5 stepper on recheck.
  Gates: `tsc -b` 0, `web:build` green, E2E/disposition strings verified.
- M6d 2026-10-29: revision comparison on run pages. Previous stored report
  for the same intent loads server-side; per-criterion improved / regressed /
  unchanged / new labels from verdict ranks, with honest "new revision
  proves nothing" copy. Gates: `tsc -b` 0, `web:build` green. Browser +
  E2E re-run owner-side.
- M6e 2026-10-29: Intent Studio guidance (draft/contract banner, criteria
  explainer with must-NOT semantics) + recheck checklist notice. Criteria
  table and all gates intact: `tsc -b` 0, `web:build` green.
- M7a 2026-10-29: two-experience IA. `/` is now a static product site
  (hero, problem, 5-step how-it-works, feature links, trust, FAQ, footer);
  dashboard moved to `/workspace`; nav has Home + Dashboard. Browser
  availability probed: none in sandbox (no browsers, no server) — visual
  validation is owner-side by constraint. Gates: `tsc -b` 0,
  `web:build` green.
- M6f 2026-10-29: real identity round (owner 0/10). SVG seal + wordmark,
  7-icon nav set, serif display type, selection/focus/microinteraction
  detail, grouped intention flow. ADR-015 records rejections. Gates:
  `tsc -b` 0, `web:build` green. Visual verdict owner-side.
- Full re-certification 2026-10-28 (sandbox, TEMP override): root `tsc -b`
  0, unit 68/68, eval 22/22 + holdout 6/6 (P/R 1.00, 2 known gaps),
  `web:build` green (all routes). No source changes; UI functionally
  covered by the owner-run browser suite.
- Milestone commit + push 2026-10-28 (owner): `b3ee211` (97 files, +6712)
  pushed to `github.com/Clem-Qhophi/BuildBrief`, branch `master`
  tracking `origin/master`. Junk file excluded; temp data ignored.

## 2026-10-29 — Complete local product journey

Owner request: a coherent product with landing page, features, a navigable app,
operator repository connection, and no signup. Exact request captured as draft
`bb_intent_2bae1c54c3641b070f` in project BuildBrief at the source checkout. No owner
approval was fabricated; no formal conformance verification is claimed.

Implemented and browser-checked:
- Separate public SiteShell and server-rendered AppShell; home, features, usage
  guide, working example, active navigation, project selection, report sections.
- Absolute local Git-root validation, persistent connections, project cookie,
  retained repository context, canonical report project context, inline connect
  and verification errors. Connected the actual BuildBrief checkout through UI.
- One-click labeled fixture scenario: isolated repository, seeded approval,
  original check, supplied correction commit, acceptance command, fresh recheck.
  Browser showed expiry not_established -> supported, E2_test; the partial credit
  finding and authentication review item remain visible.
- Evidence explorer opened the checked revision and verified the snippet hash.
  Understanding Studio feature chooser, generation of two grounded questions,
  and a real locate answer recorded as pass for example-reviewer.
- Mobile breakpoint checks: home and connection grids collapse, no horizontal
  document overflow; one main and one h1 on the homepage. Existing selector
  contract reviewed. Quiz/approval fields have accessible labels.
- No runtime dependency/client island added. Existing Motion evidence component,
  CLI, MCP, and pre-existing model-provider changes preserved.

Executed gates (logs in ignored .demo-tmp):
- npm run typecheck: exit 0 (typecheck.log).
- npm test: exit 0; 64 package tests + 4 hook tests = 68 (unit-tests.log).
- npm run test:eval: exit 0; 22/22 dev, 6/6 holdout, 2 documented gaps (eval.log).
  Seeded scope only; comment-mirage FP and vocabulary-miss FN remain documented.
- npm --workspace @buildbrief/web test with loopback integration enabled: exit 0;
  6/6 (4 connection tests, 2 real HTTP flows; web-flow-tests.log).
- npm run web:build: exit 0, all routes (web-build-final.log).
- git diff --check: exit 0 (line-ending notices only).

Environment: system TEMP caused baseline fixture Git config writes to fail.
Repeating with workspace .test-tmp TEMP/TMP passed without changing ACLs or Git
ownership safeguards. Sandbox direct loopback fetches were denied EACCES;
HTTP tests passed in the approved elevated invocation. The connected browser
was available and used for actual UI verification. The maintained Playwright
suite was extended; the whole owner-run mutation journey was not rerun here.

Remaining: live Meta provider validation, native hook lifecycle activation,
participant-only rules/submission review, fresh-user usability trial, recording,
and publishing/submission. No live model call, code commit, push, or deployment
was made. See docs/PRODUCT_EXPERIENCE.md and ADR-017.

## 2026-10-30 — Idea-first acceptance and photographic landing story

- Idea capture now precedes a repository: original context, audience, requested
  behavior, boundaries, questions, draft review, explicit approval, and a
  downloadable agent handoff. Connecting code later returns to the same brief.
- Public GitHub snapshot import complements local folders. Password recovery is
  the primary executable example, referral the secondary. A failed relevant
  acceptance command cannot leave a fresh source-only supported finding; exact
  coverage and revision checks are tested. Human acceptance decisions append
  separate events and never rewrite findings.
- The neutral public site and readable product brief are recorded in ADR-018.
  The owner's subsequent request for scroll storytelling is implemented in
  ADR-019: four consistent generated/edited photographic scenes, controlled by
  normal scrolling, with chapter navigation and an explicit static reading view.
  Less opening copy; actual idea/repository/example paths remain functional.
- Browser critique changed the hero composition, photo framing, phone navigation,
  annotation placement, and persistent reading-mode control. Actual 1440x900,
  1280x800, and 390x844 CSS viewport checks passed the observed layout bounds.
  Reduced motion and JavaScript-disabled reading/navigation were exercised;
  temporary browser overrides were restored. Screenshots and limits are listed
  in docs/PRODUCT_VALIDATION.md, not inferred from a build.
- Final executed gates: typecheck exit 0; npm test exit 0 (70 package tests plus
  4 handlers); seeded eval exit 0 (22 dev, 6 holdout, 2 documented gaps); web test
  exit 0 (20 passed including six live loopback integrations); production web
  build exit 0; diff check exit 0. Logs use the .demo-tmp/story-* names.
- No new runtime package, paid BuildBrief model call, owner-source commit, push,
  deployment, or submission. Native Muse capture remains a separately scoped
  task in docs/MUSE_PARALLEL_PROMPT.md; no Muse-owned file was changed here.
- Owner requests remain draft, including bb_intent_c0a20d67347f0d4436 for the
  visual story. This records implementation/testing, not owner acceptance.

## 2026-10-31 Quiz Studio gap audit (Phase 1) + build (Phase 2)

- Phase 1 ran as a workflow: 5 doc tracers, a falsification critic, one
  gap follow-up, and a synthesis. Only the blueprint scope returned complete
  evidence; the decisions/product-docs/webplan/research scopes did not, so
  the matrix below lists only critic-confirmed rows. Unverified this pass:
  ADRs beyond ADR-014/020, PRODUCT docs beyond the run and map pages,
  WEB_PLAN beyond role-tour and no-scores, and the research PDFs.
- Confirmed implemented+tested: rules VERIFY path, FIX+RECHECK, ADR-020
  TraceAtlas, ADR-014 Meta provider shape, run report page, /map
  Understanding Studio, role tour + handover, counts-only no-score map,
  mechanical citation/adjudication, stored evidence rows, seeded benchmark
  (22/22 dev, 6/6 holdout at that time). One drift noted: docs/META_SETUP.md
  still documents the old api.meta.ai URL while code uses api.llama.com.
- Claimed-gap dispositions: (a) quiz has no workspace-level entry -
  CONFIRMED, no apps/web/app/quiz existed; (b) Settings shows key presence
  without setup help - CONFIRMED; (c) dead code - CORRECTED: ScrollStory.tsx
  and lib/story.ts are dead, HomeEvidenceNetwork.tsx is live on the landing
  page; (d) Features Understanding Studio links to a docs anchor -
  CONFIRMED at apps/web/app/features/page.tsx.
- Phase 2 built the Quiz Studio: apps/web/lib/study.ts (aggregateCells,
  quizTypeCounts) with apps/web/test/study.test.mjs (3 tests), a server-only
  apps/web/app/quiz/page.tsx (summary, by-feature, by-category, general
  mixed; empty states name the next action), AppShell nav entry
  Test yourself, and the Features link now points at /quiz.
  Extended apps/web/test/http.test.mjs (quiz studio render on a checked
  example) and apps/web/e2e/responsive.spec.ts (/quiz route).
- Phase 2 gates, each by real exit code: typecheck 0; web tests 21 pass,
  0 fail, 7 HTTP skip without a live server; npm run build 0; npm test 0
  (70 + 7 pass); test:eval 0 (dev 22/22, holdout 6/6, 2 documented gaps);
  web:build 0 with /quiz in the route list. Sandbox Temp is not writable,
  so suite runs used a .demo-tmp temp override; the first eval attempt
  failed on that environment limit, not on code.

## 2026-10-31 Quiz Studio Phases 3-5: Settings BYOK, dead-code retirement, hardening

- Phase 3 extended Settings with a read-only Model provider section: rules
  default offline, Meta only when selected in a verify form with a key set,
  effective model from BB_META_MODEL or META_DEFAULT_MODEL, PowerShell setup
  instructions, and no form that accepts or stores a key. No live Meta call.
- Phase 4 retired dead code: deleted ScrollStory.tsx, lib/story.ts, and
  test/story.test.mjs after grep confirmed no route imports them. The
  proposal also named HomeEvidenceNetwork.tsx, but it is live on the landing
  page and stays; e2e story.spec.ts stays because it covers the live
  TraceAtlas map. Recorded as ADR-021.
- Phase 5 fixed a docs truth drift the audit surfaced: META_SETUP.md now
  documents the api.llama.com default and BB_META_API_KEY precedence per
  code. MODEL_DISCLOSURE.md needed no change. KNOWN_ISSUES.md keeps its
  dated Oct 27 row (accurate history; ADR-014 records the correction).
- Final gates, each by real exit code: typecheck 0; web tests 19 pass,
  0 fail, 7 HTTP skip without a live server; npm test 0; test:eval 0
  (dev 22/22, holdout 6/6, 2 documented gaps); web:build 0 with /quiz and
  /settings in the route list. Quality gate rechecked on the quiz and
  settings pages; no e2e selector renamed.

## 2026-10-31 Quiz Studio loopback and browser handoff (pending owner run)

- Not executed in the agent sandbox: listening sockets are denied there, so
  no disposable server could start and no browser exists. The HTTP suite
  (including the new quiz-studio test), the Playwright responsive and journey
  specs, and the desktop + 390px /quiz screenshots are committed and
  skip-gated, awaiting the owner run below. Unit, eval, and build gates are
  green above; nothing here upgrades them to a live-server claim.
- Exact owner run: copy .demo-tmp/bb-video-workspace to a NEW .demo-tmp dir
  (never the repo-root workspace), start it with node node_modules/next/dist/bin/next start -H 127.0.0.1 -p 3106 and BB_WORKSPACE pointing at the copy, then BB_WEB_TEST_URL=http://127.0.0.1:3106 plus E2E_REPO at a fresh seeded repo for npm --workspace @buildbrief/web test; reseed a throwaway repo per journey guidance and run npx playwright test --config apps/web/e2e/playwright.config.ts --workers=1. Record exit codes and counts here.

## 2026-11-01 Verification: live-server evidence supplied + tracker corrections

- Owner-side verification 2026-11-01: disposable workspace on :3106 +
  fresh-seeded repo. Web+HTTP 26 pass / 0 fail / 1 skipped; Playwright
  single-worker 15 passed. :3103 restarted on the new build: `/`, `/quiz`,
  `/settings` 200, all 9 core routes 200, browser console 0 errors.
- Erratum to the 2026-10-31 entries above: `HomeEvidenceNetwork.tsx` is
  NOT live on the landing. Grep finds only its own definition; the landing
  imports TraceAtlas (`app/page.tsx:3`). History is not rewritten; the two
  deleted files stay retired under ADR-021, HomeEvidenceNetwork awaits the
  owner's retire-or-keep decision (BB-080 partial).
- Tracker reconciled: BB-061 and BB-070 marked done with the evidence in
  this entry; BB-080 marked partial as above. `docs/BUILD_REPORT.md` is
  still missing (agent chat close-out is not the file).

## 2026-10-31 BB-001 baseline audit (no code except one test assertion)

- Tree: master b3ee211, ~100 uncommitted files (restore+fix pass, Quiz
  Studio, Settings BYOK, audit fixes). Rollback: git HEAD plus
  .demo-tmp/full-revert-backup-20261031-200801 and landing-backup. BB-000
  waived by owner instruction to start; no commit made.
- Capability matrix (status + proof, all re-verified this pass):
  capture /start, /new, MCP bb_capture: implemented+tested (idea/capture
  tests, cli tests, mcp.test.ts, journey N1-N2, http N1). Muse capture
  hook: handler implemented+tested (7 handler tests); live lifecycle
  firing UNVERIFIED (see docs/MUSE_CAPTURE_VALIDATION.md). Approval +
  versioning: implemented+tested (named actor, no self-approval; journey,
  http). Verify rules: implemented+tested (verifier 66-93, journey 79-94,
  http). Verify mock: implemented+tested (provider option + tests).
  Verify meta: implemented, live call BLOCKED (no key; shape refusal
  tested model.test.ts:59-65; wrong endpoint drift fixed in META_SETUP).
  Acceptance commands + recorded runs: implemented+tested (runAcceptance,
  genuine reverify commits real fix, http node expiry.check.mjs:113).
  Orphan triage: implemented+tested (reverse check, /changes dispose,
  eval orphan precision 1.00). Correction packs: implemented+tested
  (verifier 95-117, journey 103-144). Prompt autopsy: implemented+tested
  (verifier autopsy.ts + tests, CLI bb_autopsy, MCP wired). Recheck:
  implemented+tested (recheck.completed, journey reverify flip).
  Evidence viewer: implemented+tested (journey N3, http evidence hash).
  Handover/role tours: implemented+tested (journey 152-164, http 126-129,
  learning 177-187). Explanation + quiz + map: implemented+tested at
  unit level (learning 119-175, study 3 tests) and map HTTP; quiz-page
  HTTP assertions skip-gated without a server. MCP inventory: 12 tools
  (bb_capture, bb_list_intents, bb_approve_intent, bb_get_context,
  bb_verify, bb_report, bb_make_fix_brief, bb_explain, bb_quiz, bb_tour,
  bb_map, bb_autopsy) - no bb_intake anywhere. CLI surface:
  implemented+tested. GitHub import: unit-tested; live import
  skip-gated (needs BB_WEB_TEST_GITHUB=1). Ledger export: tested
  (journey settings download). Settings/provider: working incl. BYOK
  section (new test asserts /Model provider/ on /settings).
- M4e/M5/M5c reconciliation: M4e conditions hold (demo-seed guards
  demo-seed.mjs:32-50, output truncation actions.ts:56, viewport
  layout.tsx:4, journey N/A-N4 + responsive spec present; browser parts
  still owner-gated). M5 stay-conditional: browser run, live Meta key,
  and baseline commit remain owner-side. M5c genuine-fix journey intact
  (journey.spec.ts:118-129 commits real fix and reverifies).
- Gates this pass, real exit codes: npm run build 0; npm test 0 (70+7
  pass, 0 fail); test:eval 0 (dev 22/22, holdout 6/6, 2 gaps);
  web:build 0 (/quiz, /map, /settings in route list); web tests 19
  pass, 0 fail, 7 HTTP skip. HTTP/Playwright not executed in sandbox
  (listening sockets denied); last evidence PRE-5 (24 pass/1 skip,
  13+2) stands unconfirmed, not contradicted.
