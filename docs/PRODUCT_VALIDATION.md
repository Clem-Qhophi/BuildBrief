# Product validation — 2026-10-30

This is an implementation and observed-behavior record, not owner acceptance or
production certification. All fixture approvals/reviews use synthetic personas.
The actual owner's captured requests remain drafts; no formal conformance to an
owner-approved BuildBrief contract is claimed.

## Current automated evidence

| Command | Observed result | Local evidence |
| --- | --- | --- |
| `npm run typecheck` | Exit 0 | `.demo-tmp/story-root-typecheck.log` |
| `npm test` | Exit 0; 70 package tests plus 4 hook-handler tests passed | `.demo-tmp/story-root-tests.log` |
| `npm run test:eval` | Exit 0; 22 development and 6 holdout cases passed; 2 documented gaps | `.demo-tmp/story-root-eval.log` |
| `npm --workspace @buildbrief/web test` with loopback/GitHub integration enabled | Exit 0; 20 passed, none skipped | `.demo-tmp/story-http-final.log` |
| `npm run web:build` | Exit 0; optimized production build and TypeScript completed | `.demo-tmp/story-web-build-final.log` |
| `git diff --check` | Exit 0 | `.demo-tmp/story-diff-warnings.log` contains line-ending notices only |

The core benchmark is seeded, not a real-world accuracy estimate. Comment-only
false support and alternative-vocabulary misses remain documented limitations.
The new failed-acceptance guard does not claim to eliminate either general gap.

TEMP/TMP point to the workspace `.test-tmp` directory for fixture tests. Direct
loopback integration and the production build ran in approved shell invocations.
One earlier restricted-shell build failed to create generated Next.js files with
EPERM; the final approved build completed. No ACL or Git ownership bypass was used.

## Network-led homepage revision — 2026-10-31

| Check | Observed result |
| --- | --- |
| `npm run typecheck` | Exit 0 after the final UI changes |
| `npm test` | Exit 0; 70 package tests and 7 Muse handler tests passed |
| `npm run test:eval` | Exit 0; dev 22/22, holdout 6/6, 2 documented benchmark gaps; no live Meta call |
| `npm --workspace @buildbrief/web test` | Exit 0; 17 passed, 7 loopback-gated HTTP checks skipped |
| `npm run web:build` | Exit 0 after the final UI changes; production compile, typecheck, and route generation completed |
| Playwright suite | 11/11 passed against port 3104 with an isolated seeded ledger/repository; includes the correction journey, idea-only handoff, repository connection, narrow screen, reduced motion, no-JavaScript fallback, and recognizable project labels |
| Connected Chrome preview | The production build ran on loopback port 3104. The real saved report populated the network and paired product/engineering views; direct scroll inspection showed the readable evidence begins after the pinned experience rather than overlapping its sticky heading. The workspace project list displays meaningful example/test names and stays collapsed until requested. |

The revision replaces the abstract orbit and stock-photo handoff with a
report-derived evidence network and paired product/technical views. The first
viewport screenshot is saved at `.demo-tmp/buildbrief-home-20261031.png`.
Playwright verified the 390×844 reduced-motion/narrow-screen state remains
selectable and has no horizontal overflow; the no-JavaScript evidence view and
idea entry also pass. The new composition still needs the owner's aesthetic
review; do not report it as accepted.

The `/workspace` route had bypassed the friendly project-name helper and showed
internal `example-*` / `test-*` IDs. It now renders human-readable labels in a
collapsed “Other saved projects” list and groups project-picker records as
saved projects or examples. The labels distinguish separate seeded records;
they are not referral-credit balances. No “built with ChatGPT” or “built with
Muse” claim was found in the application UI. A generated-scene disclosure still
appears on the separate illustrative story route, where it remains relevant.

## Historical browser evidence — photographic iteration superseded

The real app ran at `http://127.0.0.1:3103/`. Chrome was used for visual capture
after the in-app browser's screenshot function failed. The in-app browser did
successfully exercise the new-project capture and approval screens earlier.

| Requirement | Authoritative observation |
| --- | --- |
| Fewer words in the opening | Rendered compact headline, short invitation, idea/example actions; descriptive material moved into the story and collapsed FAQ |
| Real-looking image sequence | Four generated/edited photographic assets loaded; consistent founder, room, composition, and light; files exist in `apps/web/public/story/` |
| Scrolling tells the workflow | Native scrolling and PageDown advanced visible idea/build/evidence/understanding states; reverse navigation returned earlier states |
| Direct chapter navigation | Chapter buttons moved to the chosen scene and updated `aria-current=step`; the sticky stage remained visible |
| Motion can be disabled | “Read without motion” showed all four scenes; “Follow with scroll” restored the sequence; the control stays with the stage |
| Reduced-motion preference | CDP media emulation plus reload produced static mode with four accessible scenes and no chapter animation controls |
| No-JavaScript fallback | Script execution was disabled and the page reloaded; the full static narrative remained in the accessibility tree; the idea-entry link opened the server-rendered form |
| Desktop composition | Measured CSS viewport 1440×900; evidence scene and caption fit, stage bottom approximately 875px |
| Laptop composition | Measured 1280×800; handoff photograph, people, annotation, and caption fit, stage bottom approximately 775px |
| Phone composition | Measured 390×844; evidence scene and caption fit, stage bottom approximately 568px; document scroll width 373px, so no horizontal overflow |
| Restored browser state | Temporary viewport, reduced-motion emulation, and script-disabling overrides were cleared after testing |
| Honest presentation | “Illustrated walkthrough” and generated-scene disclosure distinguish the narrative from a live assessment; an actual code example is linked |

Selected screenshots (ignored local artifacts):

- `.demo-tmp/story-opening-desktop.jpg`
- `.demo-tmp/story-evidence-desktop.jpg`
- `.demo-tmp/story-handoff-laptop-final.jpg`
- `.demo-tmp/story-evidence-phone-final.jpg`
- `.demo-tmp/story-mobile-opening-final.jpg`

Meaningful critique passes changed the centered hero into a compact composition,
preserved the full photographic frame on short screens, moved the handoff note
away from the founder's face, simplified phone navigation, and kept the reading
mode control available throughout the sticky sequence. Actual screenshots were
inspected after these changes. The owner's aesthetic acceptance remains theirs.

## Product behavior preserved and checked

The 20 web tests include six opt-in live HTTP checks: server-rendered story and
optimized WebP delivery; local connection and capture; referral reports,
correction guidance, cited source, and role handover; idea-only draft, approval,
download, and return to the same brief after connecting code; reset-link probes
and separate human-review decisions; public GitHub shallow import.

The reset example uses the same acceptance script before and after correction.
The original reports three failed checks out of five; the correction passes all
five. Live browser interaction observed the original accepting a 31-minute-old
link and the correction blocking it. A cited correction source opened at its
immutable revision and matched its stored snippet hash.

The idea-only browser journey created a labeled synthetic reading-journal
project, kept the audience and requirements, required explicit approval, and
then displayed the build handoff and connect-later action. This creates a plan
for a coding agent; it does not silently build a new application.

## Founder-first homepage critique pass — 2026-10-31

The owner rated the prior composition 0.5/10 and asked for a more memorable,
plain-language account of the whole product. The revision names the founder's
job in the hero, accepts a one-sentence idea before a repository exists, and
uses the saved password-recovery example to trace an approved promise through
its checked source, failed recorded command, open finding, and supplied
correction. It replaces the unsupported claim that the build “missed” a rule
with “a promise still unproven.” The scroll story now explains the workflow in
everyday language; a connected four-step section shows describe, approve,
connect, and decide. No scroll choreography or new runtime dependency was
added.

| Check | Observed result |
| --- | --- |
| `npm test` | Exit 0, including the root TypeScript build and all package / Muse handler suites |
| `npm run test:eval` | Exit 0; development 22/22, holdout 6/6, 2 documented gaps; fixture benchmark only |
| `npm --workspace @buildbrief/web test` | Exit 0; 17 passed, 7 loopback-gated checks skipped |
| `npm run web:build` | Exit 0; production build includes `/icon.svg` |
| Homepage and story Playwright suite against production | Exit 0; 7 passed, 1 repository-connection test skipped because `E2E_REPO` was not supplied |
| Production browser render | 1440×1000 and 390×844; `scrollWidth` matched each viewport; no console, runtime, or failed-resource errors after adding the app icon |
| Idea-only handoff | Native homepage form carried the sentence into `/start`, including with JavaScript disabled; review/approval remains explicit |

Screenshots from the production render and inspected story states are saved in
ignored `.demo-tmp/`: `buildbrief-desktop-critique-20261031.png`,
`buildbrief-mobile-critique-20261031.png`,
`buildbrief-story-middle-critique-20261031.png`,
`buildbrief-handoff-critique-20261031.png`, and
`buildbrief-workflow-critique-20261031.png`. The 370svh desktop story was
visually checked at the Check chapter; mobile uses the accessible selectable
map with no horizontal overflow. These observations show layout and
interaction, not owner acceptance. The aesthetic review remains open.

Maintained Playwright coverage exists in `apps/web/e2e/story.spec.ts`,
`product.spec.ts`, and the original `journey.spec.ts`. Those complete suites were
not executed here; equivalent story interactions above were manually exercised
through the connected browser. Do not label this a full Playwright pass.

## Remaining boundaries

- No live BuildBrief Meta API call was made. Rules and mock results do not prove
  live provider behavior. Muse Code work is assigned separately in
  `MUSE_PARALLEL_PROMPT.md`; native hook firing remains unverified here.
- No exported Remotion video was produced. The implemented landing experience
  uses generated stills and the existing Motion library, with no new runtime package.
- This is a local unauthenticated release. Cloud identity, private GitHub OAuth,
  billing, and synchronization are not presented as implemented.
- Web draft amendment remains partial: capture a corrected draft. No claimed
  zero-effort inference of an owner's unstated requirements.
- An unfamiliar-user usability study, participant-only submission requirements,
  live-model validation within an approved budget, recording, and submission are
  separate remaining competition-preparation actions.
- No owner-source commit, push, deployment, or submission was performed.

## Homepage interaction update — 2026-10-31

Added a native form beneath the saved evidence network so a visitor can run a
real check against the seeded password-recovery source without leaving the
homepage first. Choosing a link age posts to the existing allowlisted probe,
then returns to the evidence view with the version, observed outcome, and
simulated-account disclosure. The example is not a live account or production
service. Added an end-to-end browser assertion for this path.

| Check | Observed result |
| --- | --- |
| `npm run web:build` | Exit 0; production build completed with the updated homepage. |
| `npm --workspace @buildbrief/web test` | Exit 0; 17 passed, 7 loopback HTTP checks skipped because their server gate was unset. |
| Targeted Playwright check | Not verified: the packaged Playwright browser was absent; attempting system Chrome then hit `ERR_NETWORK_ACCESS_DENIED` when connecting to the loopback preview. |
| Live Meta API | No request made. |

The interaction is implemented and build-checked, but its browser round-trip
remains browser-unverified in this environment. The project labels remain
friendly names for distinct saved examples/tests; referral demo copies are not
credits or balances. A read-only Muse audit prompt is available in
`MUSE_WORKSPACE_REVIEW_PROMPT.md`; its only output is a separate findings
report, so it does not overlap the product-code work.
