# BuildBrief product experience

## What the owner asked to fix

The existing verification engine had a thin and confusing entry experience. The
homepage inherited the workbench sidebar, repository inspection did not save a
connection, navigation dropped project/repository context, and Understanding
Studio opened a query-parameter dead end. Existing work was preserved and extended.

## The connected product

| Entry | Purpose | Actual operation |
| --- | --- | --- |
| `/` | Show what acceptance means and orient a visitor | The first screen maps a saved request to source, recorded test, and verdict; the scrollable Atlas follows it through correction and understanding; idea-first, repository, and example actions remain available |
| `/start` | Capture a new product before code exists | Idea, audience, behaviors, boundaries, questions → draft → explicit approval → downloadable agent handoff |
| `/features` | Explain the available package and its limits | Intent, evidence, change review, correction/recheck, learning, handoff |
| `/how-it-works` | Give the founder and a new operator usable instructions | Steps, evidence grades, agent setup, data boundaries |
| `/demo` | Try a relatable failure and its correction | Primary password recovery with interactive original/corrected source; secondary referral example; immutable before/after reports |
| `/connect` | Start with the operator's own work, or attach code later | Public GitHub shallow snapshot or validated local Git root; return to the same approved new-project brief |
| `/new` → `/intent/:id` | Capture and review intent | Exact request, extracted draft, explicit human approval, then verification |
| `/workspace` | Make the next action clear | Current project, latest findings, draft review, run history; the project switcher separates saved examples from the owner's projects and gives generated test workspaces readable labels with short ID tails |
| `/runs` → `/run/:id` → `/evidence` | Understand, inspect, and decide | Plain-language product brief, technical detail, revision-bound citations, named human review decisions separate from findings |
| `/changes` | Resolve scope questions | Human disposition of possibly unrequested changes |
| `/map` | Enter learning without knowing a URL schema | Feature chooser links to explanations, questions, role tours and maps |
| `/settings` | Inspect local operation and export | Provider presence, local status, raw ledger export |

No signup, account, hosted backend, or subscription is required or represented as
implemented. Source edits in real projects remain in the operator's coding tool.

## How to show the product

1. Start on the homepage and follow the real saved password-recovery request to its source, failed acceptance command, and review verdict. State that it is a seeded rules-based example.
2. Capture an idea without a repository; show review, approval, and the build handoff.
   Open Example and run it. Explain that the versions are seeded test conditions.
3. Compare the original and recheck reports. The expiry finding improves on a
   different commit, with the acceptance command and evidence grade visible.
4. Open cited source. Show the revision and snippet-hash check.
5. In the secondary referral case, show the authentication change that still requires human review. Do not
   suggest that fixing expiry automatically resolved the whole project.
6. Generate a correction brief from the original report and show its protected
   scope. Then open Understanding Studio on the recheck, generate questions,
   answer a locate question, and inspect the resulting assessment.
7. Connect a public GitHub URL or real local checkout to show the workflow beyond
   the example. A human reviews and approves its actual request.

Positioning, sourced research, and the recommended judging story:
[PRODUCT_POSITIONING.md](PRODUCT_POSITIONING.md). The isolated Muse Code task is
ready to copy from [MUSE_PARALLEL_PROMPT.md](MUSE_PARALLEL_PROMPT.md).

## Competition priorities after this work

The [official public event page](https://dev.meta.ai/events/global-hackathon),
checked 2026-10-29, describes the indie track in terms of creativity, technical
ambition, and whether the project works. The recommendation is to demonstrate a
complete, inspectable intent-to-evidence-to-understanding loop, rather than adding
disconnected screens or accounts. This is a product recommendation, not a claim
about winning probability or unpublished judging weights.

Remaining priorities, in order:

1. Validate one bounded live Meta assessment with the approved credentials and
   spend budget. No live call was made in this work; rules and mock tests do not
   establish live model quality.
2. Have an unfamiliar person try their own repo without coaching. Observe where
   they hesitate, especially criterion review and choosing useful acceptance tests.
3. Rehearse and record the actual before/after story, including the remaining
   partial finding and human-review item. Avoid presenting the fixture as organic
   agent output or benchmark results as general accuracy.
4. Verify participant-only submission requirements, track, video/repo obligations,
   and waiver. The public event page does not establish those private details.
5. Keep automatic hooks honestly unverified until a real lifecycle test succeeds.

## Validation commands

```powershell
npm run typecheck
npm test
npm run test:eval
npm run web:build
npm --workspace @buildbrief/web test

# Optional HTTP integration checks against the running loopback app.
# E2E_REPO must be an existing disposable fixture checkout with a commit.
$env:BB_WEB_TEST_URL = 'http://127.0.0.1:3103'
$env:E2E_REPO = 'C:\path\to\fixture-checkout'
npm --workspace @buildbrief/web test

# Maintained browser regressions, including the original mutation journey.
# Re-seed the dedicated journey fixture first; see journey.spec.ts.
npx playwright test --config apps/web/e2e/playwright.config.ts
```

In the restricted Windows shell, the unit/eval suites require TEMP and TMP set
to the existing workspace `.test-tmp` directory. Direct HTTP tests require an
approved shell with loopback access. This changes neither system ACLs nor Git
ownership protections. Browser checks can use the connected in-app browser.

## Honest remaining limits

- Rules can mistake comments for implementation and miss alternative vocabulary.
- Source evidence is not runtime assurance; test evidence covers only recorded
  commands and declared coverage. No production correctness guarantee is made.
- Local approval records an entered name, not authenticated identity.
- Web draft editing/amendment is partial: capture a corrected draft instead.
- Public GitHub imports are local shallow snapshots, not GitHub OAuth or cloud
  sync. No packages or repository code run merely by connecting. Private repos
  use the local-folder route. Reconnect to obtain a new remote snapshot.
- The loopback server has no authentication and must remain local.
- The newly captured owner request remains draft; this work does not self-approve
  that requirement or claim formal BuildBrief conformance to it.
