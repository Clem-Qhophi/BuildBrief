# First-Run Audit: Founder and Builder Journeys (2026-10-31)

Scope: read-only audit of the BuildBrief workbench (`apps/web`) first-run
experience. Only this report is new. No application code, tests,
configuration, ledgers, connections, image assets, or any other file was
changed. Owner work in the tree was preserved untouched (other-agent
untracked files were read as evidence, never edited).

Model note: this session runs in Muse Code powered by the Muse Spark coding
model. That describes the assistant, not the product: it proves nothing
about BuildBrief's Meta Model API integration, and no live Meta Model API
call was made during this audit (see section 7).

How to read the citations: `path:line` refers to the file as inspected in
this session. Browser-dependent behavior is marked code-backed, not
browser-verified: no browser or dev server was run here (the maintained
e2e suites are explicitly owner-run; `apps/web/e2e/journey.spec.ts:1-3`
states listening sockets are denied in sandboxes).

## 1. Journey 1 - Founder with only an idea, no repository

Actual steps and state transitions in code:

1. `/` hero form (`apps/web/app/page.tsx:23-30`) submits by GET to `/start`,
   pre-filling the idea field. Copy states plainly that this is a draft and
   nothing is approved (`page.tsx:29`, `start/page.tsx:7,14`).
2. `/start` form (`apps/web/app/start/page.tsx:9-15`) POSTs to `/api/start`
   with project, idea, audience, behaviors, boundaries, questions.
3. `/api/start` (`apps/web/app/api/start/route.ts:7-21`) validates
   (project/idea/behaviors required, 20,000-char cap in
   `apps/web/lib/idea.ts:5-8`), appends `prompt.captured` (source
   `idea_form`) and `intent.extracted`, sets the `bb-project` cookie, and
   redirects to `/intent/<id>?project=...`.
4. Intent page (`apps/web/app/intent/[id]/page.tsx:48-130`) shows state
   `draft`, the exact source text, criteria table, boundaries, questions,
   and an approve form requiring an owner name. Approval POSTs to
   `/api/approve`, which records `intent.approved` with the entered actor
   (`apps/web/app/api/approve/route.ts:7-24`). The page discloses that the
   entered name is recorded, not authenticated (`intent/[id]/page.tsx:129`,
   repeated in `how-it-works/page.tsx:7` and `ProductBrief.tsx:26`).
5. After approval with no repository connected, a handoff card appears
   (`intent/[id]/page.tsx:134`): download the approved build brief
   (`/api/brief`) and "Connect the code when it exists", linking to
   `/connect?project=...&method=local&intent=...`.

No dead end: every screen names the next action, and the no-repository
state is a first-class path (workspace steps in
`intent/[id]/page.tsx:62` show "Describe your idea / Review and approve /
Give your agent the brief / Connect code when ready").

## 2. Journey 2 - Builder with a local repository or public GitHub URL

1. `/connect` (`apps/web/app/connect/page.tsx:9-53`) offers two tabs:
   Public GitHub link (default) and Folder on this computer. Tab choice is a
   query-param link (`page.tsx:19,26`), server-rendered, no client state.
2. POST to `/api/connect`
   (`apps/web/app/api/connect/route.ts:10-39`): GitHub path validates the
   URL shape (`lib/github.ts` via `publicGitHubRepository`), downloads a
   local snapshot, and derives the project name from the repository when
   omitted (`route.ts:22-24`); local path requires an absolute path that is
   a Git checkout with at least one commit (`route.ts:31-33`), normalized to
   `rev-parse --show-toplevel` before saving. Nothing is installed, run, or
   changed in the original repository (stated at `connect/page.tsx:34,42,52`
   and `how-it-works/page.tsx:14`).
3. On success the connection is saved as kind `local` with optional origin
   (`route.ts:34`, `lib/connections.ts:17-24`), the `bb-project` cookie is
   set, and the user lands on `/new?project=...&connected=1` (or back on the
   intent when `intent` was passed and exists, `route.ts:38`). `/new` shows
   a "Repository connected" confirmation (`app/new/page.tsx:37`).
4. `/new` form POSTs to `/api/capture`
   (`apps/web/app/api/capture/route.ts:8-24`), which creates a draft and
   redirects to `/intent/<id>?project=...&repo=...`, preserving the repo
   context for the verify form (`intent/[id]/page.tsx:137-173`). The verify
   form offers providers rules (default, offline), mock, and meta, with an
   explicit note that without an acceptance command grades rest on source
   evidence alone (`page.tsx:171`).

No dead end; error paths redirect back to `/connect` with the message
shown in an alert role (`connect/page.tsx:28`, `connect/route.ts:37`).

## 3. Journey 3 - Idea first, then connect the coding agent's repository

The round trip is wired: the approved-brief handoff links to
`/connect?project=...&method=local&intent=...`
(`intent/[id]/page.tsx:134`); the connect form carries `intent` as a
hidden field (`connect/page.tsx:31`); `/api/connect` returns to
`/intent/<id>?project=...&connected=1` when that intent exists in the
project (`connect/route.ts:38`).

Gap (Fix 1): the intent page never reads the `connected` parameter - a
full-file read of `intent/[id]/page.tsx` (227 lines) contains zero
references to `connected`, so the founder lands back with no confirmation
that anything changed. The sibling `/new` page does render the notice
(`new/page.tsx:37`). The state did change (connection saved, cookie set),
but the screen does not say so.

## 4. Journey 4 - Visitor follows the evidence example and product story

Homepage scroll (`app/page.tsx:13-68`): hero with idea entry, intro bar
("A real saved example"), the evidence map section (`#product-map`),
handoff bridge, four-step loop (each step ends in a link:
`page.tsx:49-53`), trust FAQ, closing CTA. Every section explains the next
action; labels stay in plain language ("Not enough proof",
"Doesn't apply" via `lib/presentation.ts:1-17`).

The evidence story is the `TraceAtlas` component
(`app/components/TraceAtlas.tsx:21-97`), rendered with `journey=true` on
the homepage when a reset example is saved (`page.tsx:41`), else a "Load
the real example" form that POSTs to `/api/example` with `return=home`
(`page.tsx:41`, `api/example/route.ts:7-19`). The five chapters
(Describe, Connect, Check, Recheck, Understand) are defined in
`lib/atlas.ts:43-49`. Fixture-vs-finding-vs-decision separation is
explicit in code and labels:

- Fixture: board label "Seeded example" (`TraceAtlas.tsx:65`), "Deliberately
  seeded fixture; actual stored reports" (`TraceAtlas.tsx:94`), demo page
  disclaimers (`demo/page.tsx:37,47`), seeded-approval provenance
  (`lib/example.ts:30,35`: actor "Seeded example persona (not owner
  approval)").
- Finding: per-criterion badges and proof text (`TraceAtlas.tsx:84`,
  `presentation.ts` language), test-result block with the warning "They do
  not certify a production system" (`TraceAtlas.tsx:80`).
- Decision: dedicated "Your decision" node linking to `#review-decision`
  (`TraceAtlas.tsx:81`); the run report's `ProductBrief` review form
  records outcome/actor/note as `review.decision_recorded`, separate from
  findings (`ProductBrief.tsx:23-27`).

`/demo` (`app/demo/page.tsx:11-51`) offers Password recovery and Referral
credit tabs, runs a fresh example per scenario on POST, compares original
build vs supplied correction with links to both stored reports, and closes
with "Now bring your own product" linking to `/connect?project=&repo=`
(`page.tsx:50`) - which resolves to the LOCAL tab because the connect
page treats any present `repo` parameter, even empty, as local
(`connect/page.tsx:16`). A repo-less founder clicking it meets the folder
form first (Fix 2). The GitHub tab is one click away, so this is a wrong
default, not a dead end.

Unwired second story (Fix 3): `app/components/ScrollStory.tsx` (with
`lib/story.ts` and `public/story/` assets) is imported by no route - a
repo-wide search for `ScrollStory` returns only its own definition. The
maintained `story.spec.ts` tests the `TraceAtlas` homepage map, not this
component. Two story systems currently coexist, one of them dead.

## 5. Project picker, workspace list, and names

The picker (`AppShell.tsx:20-32`) shows the `projectName()` display label
plus a connection-kind line: "Prepared example / rules-based",
"Local copy from GitHub", "Local repository", or "Idea stage / no
repository yet". Saved projects split into "Saved projects" and
"Examples" optgroups (`AppShell.tsx:26-27`), and the examples group
carries the disclaimer "Each example copy is a local test workspace, not
a real referral account or credit balance" (`AppShell.tsx:29`).

Raw-id mapping (`lib/presentation.ts:18-28`): `example-reset-*` becomes
"Password recovery demo copy", `example-referral-*` becomes "Referral
expiry demo copy", `test-github-*` / `test-collection-*` /
`test-connection-*` become "GitHub import test" / "Collection test" /
"Repository connection test" with last-4 suffixes against collisions. The
`test-github-*` ids originate from the web package's own HTTP tests
(`apps/web/test/http.test.mjs:209`), i.e. test workspaces, not user data.

Checked in this workspace: the ledger (`.buildbrief/events.jsonl`,
read-only listing of distinct project ids) contains only `BuildBrief`
(10 events); no `Test GitHub` / `Test Collection` entries exist here, and
neither string appears anywhere in code. No B2B/MVP wording exists in
`apps/web`. Referral-looking entries are demo copies by construction:
`createExample` builds an isolated fixture repo under
`.buildbrief/examples/`, approves with a seeded non-owner persona, and
saves kind `example` (`lib/example.ts:11-46`). The word "balance" appears
in the app only as CSS `text-wrap` and that one disclaimer - no balances,
accounts, or credits exist as concepts.

One leak (Fix 5): Settings shows raw ids (`settings/page.tsx:69`:
`projects.join(', ')`), bypassing `projectName()`.

## 6. Fixes (at most five, ordered by user impact)

Confirmed bugs (backed by code above):

1. Intent page drops the `connected=1` return signal. After journey 3 the
   founder sees the same draft screen with no confirmation. Fix: render the
   "Repository connected" notice on the intent page when `connected=1`,
   mirroring `new/page.tsx:37`, naming the connected project. Acceptance:
   connect an existing intent's project, land on the intent, see a visible
   confirmation; nothing else on the page changes.
2. `/demo` closing CTA defaults repo-less founders to the local tab. Fix:
   change `demo/page.tsx:50` to `/connect?project=&method=github` (entry
   point fix; leave `connect/page.tsx:16` semantics alone). Acceptance: the
   link lands with the "Public GitHub link" tab active.
3. Two story systems, one unwired. `ScrollStory.tsx` + `story.ts` are dead
   code; `TraceAtlas` is wired and e2e-covered. These are the other
   agent's untracked files, so this needs an owner decision, not a silent
   cleanup: wire it into a route or remove it. Acceptance: exactly one
   story component is imported by app routes and the owner-run e2e suite
   stays green.
4. `/api/capture` silently defaults a missing project to the literal name
   `demo` (`api/capture/route.ts:10`). Fix: return 400 like a missing
   prompt. Acceptance: project-less POST returns 400 and creates no
   project.
5. Settings ledger row shows raw project ids (`settings/page.tsx:69`).
   Fix: map through `projectName()`. Acceptance: no raw
   `example-referral-*` / `test-*` id is visible on the page.

Recommendations (not bugs):

- Keep the approval-identity disclosure where it is; unauthenticated actor
  names are stated at entry, approval, review, and guide level.
- No B2B/MVP/jargon cleanup needed: none found in app copy.
- The H1 "Proof comes out" (`page.tsx:21`) is softened immediately by the
  FAQ ("What does 'not enough proof' mean", "no ... production guarantee"
  in `how-it-works/page.tsx:14`); no language change proposed.

Not fixed / not verified: narrow-screen and reduced-motion handling exists
in code (`globals.css:317-345`, `atlas.css:132,175,267`,
`TraceAtlas.tsx:35-40` gating cinematic mode on wide viewport, ready
state, and no-preference, with static fallbacks) but was not exercised in
a browser here - the e2e suites covering it (`story.spec.ts:34-57`) are
owner-run. Scroll-chaining and touch behavior are therefore code-backed
claims only.

## 7. Meta Model API usage

None. No `BB_META_API_KEY` was read, set, or transmitted; no provider call
of any kind was made. The product surfaces the Meta provider honestly: the
verify form lists it as one option with its key requirement
(`intent/[id]/page.tsx:153-157`), Settings reports key presence only,
never the value (`settings/page.tsx:10-14,77`), and runs record
provider/model per report (`lib/ledger.ts:108`). The guide states
automatic native prompt capture remains unverified
(`how-it-works/page.tsx:13`). The Muse Spark model powering this audit
session is unrelated to that integration.

## 8. Files inspected and commands run

Inspected (read-only): `AGENTS.md`, `MASTER_BLUEPRINT.md`,
`docs/DECISIONS.md`, `apps/web/AGENTS.md`, `apps/web/app/page.tsx`,
`start/page.tsx`, `connect/page.tsx`, `new/page.tsx`,
`workspace/page.tsx`, `demo/page.tsx`, `intent/[id]/page.tsx`,
`changes/page.tsx`, `settings/page.tsx`, `how-it-works/page.tsx`,
`api/start|connect|capture|approve|verify|example|select-project/route.ts`,
`components/AppShell.tsx`, `SiteShell.tsx`, `TraceAtlas.tsx`,
`ScrollStory.tsx`, `ProductBrief.tsx`, `lib/context.ts`,
`connections.ts`, `ledger.ts`, `presentation.ts`, `atlas.ts`,
`story.ts`, `idea.ts`, `example.ts`, `actions.ts`, `github.ts`
(imports only), `e2e/journey.spec.ts`, `e2e/story.spec.ts`,
`test/http.test.mjs` (one line), `samples/demo-seed.mjs` (labels only),
`globals.css` + `atlas/connected-home/landing.css` (media queries only).

Commands actually run (all read-only): a `node -e` distinct-project-id
listing over `.buildbrief/events.jsonl` (result: only `BuildBrief`);
`Test-Path` checks; `git status`/`git diff --stat` for change
confirmation; `Measure-Object`/`Get-ChildItem` for file inventory. No
build, no test suite, no dev server, no browser, no form submissions, no
writes outside this report.
