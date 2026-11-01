# Architecture Decisions

Living log. Newest first. Status: proposed | accepted | superseded.

## ADR-025 (accepted 2026-11-01): Stop hook does not fire; the gate stays advisory

- Owner probe 2026-11-01 (same scratch project, same byte-clean file,
  same session): UserPromptSubmit fired twice, including the probe
  prompt, while a completed turn (prompt answered, session exited)
  produced NO Stop record. Control and experiment in one session, so
  this is a finding about the Stop event, not the file or setup.
- Consequence: on Muse Code 1.4.14 nothing may depend on blocking a
  turn. `bb-hook` and the guard stay advisory permanently on this
  build; their `block` code path remains implemented and unit-tested
  but dormant behind the proven-transport requirement, which this build
  cannot meet. PreToolUse/PostToolUse were not probed and stay
  UNVERIFIED (this result implies nothing about them either way).

## ADR-024 (accepted 2026-11-01): Muse UserPromptSubmit hook firing proven

- Owner probe 2026-11-01 (scratch project, nested matcher/hooks shape):
  the hook fired on Muse Code 1.4.14. The captured record carries
  `event: UserPromptSubmit`, full session id, project root, exact prompt
  text plus sha256, and byte counts. Earlier `MalformedConfig` failures
  were caused by PowerShell writing the file with a UTF-8 BOM, not by the
  schema — byte-clean JSON loads.
- Still UNVERIFIED: PreToolUse, PostToolUse, Stop and all other events;
  elicitation rendering; block semantics. The guard and bb-hook stay
  advisory until those are proven the same way.

## ADR-023 (accepted 2026-11-01): Retire the unwired HomeEvidenceNetwork island

- Owner decision (BB-080 closed as retire): `HomeEvidenceNetwork.tsx`
  (both exports, `HomeEvidenceNetwork` and `HandoffBridge`) was never
  imported by any route — grep across the tree found only its own
  definition — and its `home-network*` / `handoff-*` classes exist in no
  stylesheet, so mounting it would render unstyled markup. Deleted.
- This corrects ADR-021's claim that the component "is live on the
  landing page": that line was wrong (proven by grep 2026-11-01, erratum
  in PROGRESS). ADR-021 itself is left intact as history.
- Recovery: the file remains in git history (`8c27ce9` and earlier).

## ADR-022 (accepted 2026-11-01): Agent versions verified on the owner machine

- Probbed 2026-11-01 with `--version` (read-only, no workload):
  Muse Code 1.4.14 (matches the repo-recorded 1.4.14), codex-cli 0.164.0,
  Claude Code 2.1.198. `bb init` reports all three live (it previously
  missed Windows `.cmd` shims because Node cannot exec them without a
  shell — fixed by probing through `cmd.exe /c`, with a unit test).
- Still UNVERIFIED for every agent: hook firing, event payload shapes,
  elicitation rendering, and block semantics. Those need interactive
  sessions (BB-020 remainder). No capability matrix row may cite this ADR
  as firing evidence.

## ADR-021 (accepted 2026-10-31): Retire the unwired scroll-story code

- The Oct 30 TraceAtlas evidence network is canonical per owner (ADR-020).
  The older photographic ScrollStory island was never imported by any
  route, so its code, data, and unit tests are removed: ScrollStory.tsx,
  lib/story.ts, test/story.test.mjs. The e2e story.spec.ts stays because it
  covers the live TraceAtlas map, not the retired island.
- HomeEvidenceNetwork.tsx was named in the same retirement proposal but is
  live on the landing page and stays. Public story image assets under
  apps/web/public/story/ are untouched by this change.

## ADR-020 (accepted 2026-10-31): Evidence network leads the public product story

- The owner found the initial photographic scroll story too basic and asked for
  the result too basic and asked the network to answer what the product actually
  does. ADR-019's stock-like photo handoff is removed from the homepage. The real
  stored evidence graph leads; a saved report is rendered in the first screen.
- The opening network connects an approved requirement, the original build,
  cited source, the recorded acceptance command, and its verdict. Its labels,
  status, file path, revision, and test counts come from the selected seeded
  report. It shows the before/after run comparison without presenting the
  fixture as customer data. If no report exists, the network is explicitly a
  concept and offers the real example.
- The scrollytelling Atlas remains the deeper hands-on view. The former generic
  capability cards and generated-photo handoff are replaced with two views of
  the same finding: a plain-language product explanation and its technical
  source/test details. Idea-first, existing-repository, and example paths remain
  visible; no signup or AI call is required to start.
- Native chapter navigation, manual exploration, a static readable evidence
  list, and reduced-motion layout keep the story operable. The second real run
  page uses the same graph component while retaining its product brief and
  technical report. User projects are never selected for the public homepage.
- The production build and web tests pass. The old preview on port 3103 stayed
  stale, so the built revision was opened on a separate loopback port for review.
  The desktop first screen was visually inspected. At the mobile breakpoint,
  the story remained selectable and measurements showed no horizontal overflow;
  a mobile screenshot timed out. The owner has not accepted the aesthetic, and
  no score is self-awarded.

## ADR-019 (superseded by ADR-020): Scroll-controlled photographic product story

- The owner's updated objective explicitly requests a visual landing-page story
  driven by scrolling, generated/edited photographic scenes, and far less copy
  on the opening screen. This overrides the local frontend skill's prohibition
  on scroll storytelling and ADR-016's single-client-island limit for this public
  explainer only. Existing report motion and backend semantics are preserved.
- Compared directions: (1) abstract evidence diagram, (2) cinematic 3D objects,
  (3) the same founder carrying an idea through a build, a discovered gap, and a
  shared understanding. Choose the human story: it makes the job relatable to
  nontechnical visitors and directly answers the request for photographic scenes.
- Four consistent generated/edited images live in `apps/web/public/story/`.
  Prompt set and provenance are in `docs/VISUAL_STORY_ASSETS.md`. The sequence is
  explicitly illustrative, with a separate link to the executed recovery example.
  No synthetic photograph or annotation is presented as a customer or live run.
- Use the already-installed Motion 14.7.1: `useScroll`, bounded chapter changes,
  opacity transitions, subtle image framing, and a scroll-progress line. Native
  scrolling stays under the user's control; no wheel interception, autoplay,
  scroll lock, or additional runtime dependency. Chapter buttons and keyboard
  scrolling offer direct navigation. The public story is a separate client island.
- The complete static sequence is server rendered. Reduced motion keeps that
  reading view; “Read without motion” explicitly offers it to any visitor.
  Images use Next Image optimization, responsive sizing, reserved space, and
  descriptive alternatives. Captions and annotations are real HTML.
- Remotion remains an optional tool for an exported video, not a requirement for
  scroll-driven playback. R3F, Drei, and Rive would add a different rendering
  system for a story already expressed by photographs and DOM relationships.
  No new tool is described as installed merely because its documentation was read.
- Maintained checks: `apps/web/test/story.test.mjs` and
  `apps/web/e2e/story.spec.ts`, plus the public product journey. Browser review
  must inspect actual scrolling, framing, mobile layout, and motion alternatives;
  compilation alone is insufficient.

## ADR-018 (accepted 2026-10-30): Idea-first product acceptance, neutral design, tangible example

- The owner rejected the dark/copper branding and requested a minimal professional
  product usable by technical and nontechnical people. Neutral light surfaces,
  system sans typography, black actions, and semantic status colors supersede
  ADR-015's display typography and the dark/copper palette clauses in the local
  frontend/strand skills. The evidence relationships, accessible findings,
  reduced-motion support, and single existing Motion island remain intact.
- Product category: product acceptance and understanding for AI-built software.
  The original approved request, revision-bound proof, next agent handoff,
  explicit human decision, and assessed understanding form one record. This is
  a positioning choice, not a claim of a new market or exclusive invention.
- `/start` captures idea, audience, behaviors, boundaries, and questions without
  a repository. Only behaviors become draft criteria; context is retained and
  questions remain explicit. Nothing auto-approves. An approved brief downloads
  as an agent handoff. Connecting code later returns to that same brief. The app
  does not claim to generate, commit, or test a new product from this form.
- Public HTTPS GitHub import now supplements local Git connections (extending
  ADR-017's local-only entry). Only canonical github.com owner/repository URLs
  are accepted; credentials, other protocols/hosts, ports, and URL parameters
  are rejected. A bounded, noninteractive shallow clone goes to a unique local
  checkout. Connection installs no packages and executes no repository code.
  Private repositories use a local checkout. Reconnect for a fresh snapshot.
- Password recovery becomes the primary example; referral remains available.
  Users execute allowlisted fixture source from the selected immutable commit
  with a synthetic clock. The same acceptance script fails before and passes
  after the supplied correction. Thirty-minute expiry is the example owner's
  policy, not a universal security standard; this is not full authentication.
- Relevant failed acceptance runs prevent a source-only `supported` finding.
  A broad file-level failure yields `not_established`, not an invented criterion
  contradiction. E2 requires matching revision, successful exit, no reported
  failures, and an exact declared path (or explicit directory suffix). Sibling
  files do not inherit coverage. Historical reports remain immutable and the
  product view warns when recorded acceptance tests failed.
- `review.decision_recorded` is a distinct append-only event tied to the report,
  intent version, and revision. Entered reviewer identity is not authenticated.
  Accepting a version never rewrites automated findings or accepts future code.
- No runtime dependency or client island added. Native forms and query links
  provide the new behavior. Maintained domain/verifier/web tests cover these
  boundaries; live loopback checks supplement source/build validation.

## ADR-017 (accepted 2026-10-29): Public entry, persistent local projects, executable example

- Owner requested the complete product journey: landing page, features, a clear
  workspace, and connecting an operator's own repository without signup. Keep
  the blueprint's local Git adapter and explicit approval; add no hosted auth,
  OAuth, billing, or remote clone facade.
- Root layout owns only document structure. `SiteShell` provides public
  navigation; the server-rendered `AppShell` provides active navigation, project
  switching, and context-aware links. Existing CLI/MCP and E2E selector contracts
  remain intact. No new runtime dependency or client island was added.
- A connection POST validates an absolute Git checkout with a commit, records
  its canonical root in `.buildbrief/connections.json`, and selects the project
  with an HttpOnly/SameSite=Strict local cookie. This is app configuration, never
  intent approval. Query parameters can override selection; switching projects
  must not inherit another project's repository. Reports use their stored project
  identity, preserving deep links even when a different project is selected.
- `/demo` runs only after a native form POST. It creates a unique isolated
  fixture checkout under `.buildbrief/examples/`, records explicitly seeded
  persona approval, verifies v2, commits the supplied v3 correction in that
  fixture only, runs its acceptance command, and rechecks. Existing directories
  are never reset or deleted. User repository changes and approvals remain human
  actions. The sample has no external AI calls and claims no real-world accuracy.
- Privacy copy distinguishes offline rules from explicitly selected provider
  context transmission. Learning navigation now offers real per-feature entry
  points rather than asking operators to construct query parameters.
- Maintained checks: `apps/web/test/` (connection persistence and opt-in live
  loopback API tests), `apps/web/e2e/product.spec.ts` (browser regression coverage).


## ADR-016 (accepted 2026-10-29): Evidence Strand flagship, one Motion island

- Owner rated ADR-015's result 1/10 and mandated a creative transformation
  with seven named resources plus R3F/Drei/Rive evaluated. Three directions
  were compared: (A) archival broadsheet (ADR-015, already rejected by the
  owner), (B) 3D Evidence Universe in R3F (heavy WebGL bundle, weak task
  comprehension, duplicated a11y fallback), (C) Evidence Strand — every
  criterion drawn as a thread Requested → Cited evidence → Verdict, broken
  or dashed exactly where proof is missing. C wins on comprehension,
  differentiation, performance, and hackathon risk. It supersedes ADR-015's
  "server-rendered interactions only" and "Motion rejected" clauses only.
- Accepted runtime: `motion` 14.7.1 (MIT, `motion/react`) in ONE lazy client
  island (`EvidenceStrand`) for filter/expand/draw-in motion the user caused,
  with `useReducedMotion`. Everything else stays server-rendered; the
  findings `<details>` list remains the no-JS equivalent. Reason recorded as
  required by the web quality gate: CSS cannot do layout/presence animation
  for thread filtering without re-implementing it worse.
- Evaluated and rejected for the bundle (guidance absorbed, code not taken):
  shadcn/ui (MIT, but Tailwind + Radix rewrite of a working CSS system);
  React Bits (MIT + Commons Clause — sale restriction, decorative focus);
  R3F/Drei/Three (MIT, ~WebGL bundle for a graph that reads better in 2D);
  Rive (runtime + authored binary assets we cannot QA); UI UX Pro Max
  (MIT skill; its `uipro` installer is an unreviewed remote script — read
  guidance only, never executed); Remotion (special licence requiring a
  company licence in some cases — no distribution without owner approval;
  video is not a blocker for the product).
- Installed as guidance: `.agents/skills/bb-evidence-strand` (original text,
  upstream URLs, no vendored code) alongside the two ADR-015 skills.

## ADR-015 (accepted 2026-10-29): Zero-dependency product identity

- Owner rated the workbench UI 1/10 then 0/10: correct — it was unstyled
  structure. Response: bespoke SVG brand mark + icon set, serif display
  type (Georgia, no downloads), grouped intention flow, server-rendered
  interactions only.
- Rejected for the bundle: shadcn/ui (needs Tailwind + rewrite), Motion
  (CSS covers needs), React Bits/Magic UI (decoration), R3F/Drei/Rive
  (weight, no visual QA possible), Remotion (video is not the product),
  uipro installer (unreviewed, Muse support unconfirmed).
- Installed as guidance only: two project-local skills
  (`.agents/skills/bb-frontend-direction`, `bb-web-quality-gate`) with
  upstream URLs recorded and no upstream text vendored.

## ADR-014 (accepted 2026-10-28): Llama API base URL is api.llama.com, not api.meta.ai

- Conflict: our assumed default (`https://api.meta.ai/v1`) vs public Llama
  docs (`https://api.llama.com/v1/chat/completions`) and the `LLM_<id>_` key shape.
- Evidence: live `POST` to the assumed host fails at transport level on two
  machines while docs agree on `api.llama.com`; `BB_META_BASE_URL` override
  already existed, so this changes only the default.
- Choice: `META_DEFAULT_BASE = 'https://api.llama.com/v1'`; test, `.env.example`,
  and disclosure doc updated. Model id `muse-spark-1.3` still UNVERIFIED —
  the first live smoke will confirm or correct it from the API error body.

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
