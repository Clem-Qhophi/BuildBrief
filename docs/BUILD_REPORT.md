# BuildBrief — build report (master upgrade, BB-001 → BB-072 + BB-090 docs)

Date: 2026-11-01. Author: executing agent session. Reviewer: owner (Clem).
Governing plan: `docs/BUILD_BRIEF_MASTER_UPGRADE_PLAN.md`.
Progress log: `docs/IMPLEMENTATION_TRACKER.md`, `docs/PROGRESS.md`.
A claim without a file, log, or test result below is labelled UNVERIFIED.

## 1. Executive summary

The working tree at `c807012` (restore + fix pass, Quiz Studio, Settings
BYOK, source PDFs, master plan) was extended, without rewriting anything,
with: domain contracts (questions, checks, capabilities, 7 ledger event
types), an adaptive intake engine, an acceptance compiler, a Muse
turn-hook CLI with a controlled gate, `bb init` wiring reports, an Agent
Activity view, a Project Room upgrade (attention queue, coverage blocks,
founder/developer views), a Release Readiness view, and a 3-task A/B
harness. Every gate is green and every number below comes from executed
commands recorded in `.demo-tmp/` (git-ignored).

## 2. Document reconciliation (Keep / Adapt / Defer / Reject counts)

- Premise-audit v2 (10 pp): 9 audited premises → 3 KEEP (clarification,
  approval gate, acceptance compiler), 4 ADAPT (in-agent UX→3 tiers,
  monitoring→tiered, portability→2 adapters, stop-gate→deterministic-only
  blocks), 2 REJECT-as-stated (fine-tuning, in-agent UI everywhere).
  6 ranked options → 4 MUST adopted (compiler, stop-gate, portable intent,
  clarification budget), 1 SHOULD (research brief, deferred), 1 STRETCH
  (visual intent, deferred).
- Strategy v1.1 (9 pp): locked decisions kept (both modes, hybrid,
  both audiences); 6–10-week roadmap treated as post-hackathon, not
  4-day scope; budget figures treated as planning ranges, not quotes.
- Master Audit v2.0 (11 pp): layered assurance (A–H) adopted as the
  detection model; SQLite suggestion REJECTED (ADR-002 stands, JSONL
  kept); "catch everything" REJECTED as a guarantee.
- Conflicts resolved: hero headline (owner screenshot-selection over
  v2.0's proposal — then owner picked variant B, BB-062 done); SQLite
  (no migration); pricing (no pricing UI — owner decision); stop-gate
  hardness (v2.0's conservative reading wins).
- Full traceability matrix: `docs/BUILD_BRIEF_MASTER_UPGRADE_PLAN.md`
  Sections 2–3; task-level mapping: `docs/IMPLEMENTATION_TRACKER.md`.

## 3. Baseline vs final capability matrix

Baseline (`c807012`, verified 2026-10-31 → 2026-11-01): capture, approve,
verify (rules/mock/meta-shape), acceptance commands, orphans, packs,
autopsy, recheck, evidence viewer, handover, quiz/map, MCP (12 tools),
Muse capture/guard (unit-tested, live firing UNVERIFIED), CLI (15
commands), Oct-30 landing, Quiz Studio, Settings BYOK.
Final adds: domain contracts + 7 event types (BB-010), intake engine
(BB-030), acceptance compiler (BB-040), bb-hook + gate (BB-050), `bb init`
+ activity (BB-052), attention/coverage/modes (BB-060), readiness
(BB-071), A/B harness (BB-072), agent versions verified read-only
(BB-020 partial), submission refresh (BB-090 partial).
Unchanged and still open: BB-051 (second adapter), BB-020 remainder
(firing/payloads), BB-021 (live Meta call), BB-080 (HomeEvidenceNetwork
decision), BB-090 remainder (demo rehearsal, freeze, submit).

## 4. Per-task account

| ID | Status | Files | Tests (cmd, exit, counts) |
| --- | --- | --- | --- |
| BB-010 | done | `domain/src/{questions,checks,capabilities}.ts`, `events.ts`, `index.ts`, `store/src/views.ts`, 2 new test files | `node --test` on both: 8/8; full `npm test` 0 (78+7); eval 22/22+6/6 |
| BB-020 | partial | ADR-022, `cli` probe fix, `init.test.ts` shim test | `bb init` live: 3 versions detected; `npm test` 0 (98+14) |
| BB-030 | done | `packages/planning/*` + wiring (`tsconfig`, root `test`, lockfile) | 10 scenario tests; `npm test` 0 (88+14); eval green |
| BB-040 | done | `planning/src/compile.ts`, `test/compile.test.ts` | 5 tests; `npm test` 0 (93+14); eval green |
| BB-050 | done | `muse/lib/{gate,normalize}.js`, `handlers/bb-hook.js`, `test/gate.test.js`, HANDLERS.md | 7 tests; `npm test` 0 (93+14); live firing UNVERIFIED |
| BB-052 | done | `cmdInit`/`buildInitReport`, `init.test.ts`, `web/lib/activity.ts`+test, `app/activity/page.tsx`, nav, responsive, HTTP asserts | `npm test` 0 (95+14); HTTP 29/1 skip; Playwright 15 |
| BB-060 | done | `web/lib/assurance.ts`+test, workspace edits, run coverage block, HTTP asserts | `npm test` 0 (95+14); HTTP 32/1; Playwright 15 |
| BB-071 | done | `readinessSummary`+test, `app/readiness/page.tsx`, nav/responsive/HTTP | HTTP 33/1; Playwright 15 |
| BB-072 | done | `eval/src/ab.ts`, `eval/test/ab.test.ts`, `test:ab` script | `test:ab` 0 (3 AB-OK); `npm test` 0 (97+14); eval green |
| BB-090 | partial | ADR-022, SUBMISSION/DEMO refresh, this file | docs-only; no code gates affected |
| BB-021/051/080 | blocked/open | — | need owner (key, second agent, dead-code call) |

No task was silently dropped; deferred items carry reasons in the tracker.

## 5. Verification record

- `npx tsc -b --force`: 0 (each phase).
- `npm test`: 0 — final 97 unit + 14 hook-handler, 0 fail.
- `npm run test:eval`: 0 — 22/22 dev, 6/6 holdout, 2 documented gaps,
  verdicts P/R 1.00, orphans P/R 1.00.
- `npm run test:ab`: 0 — 3 AB-OK, agree=true ×3, 0 tokens.
- `npm run web:build`: 0 — `/activity`, `/quiz`, `/readiness` in routes.
- Web unit: 26 pass / 7 skip (7 HTTP need a live server by design).
- Disposable-server HTTP (fresh-seeded repo each run): 33 pass / 1 skip
  (GitHub import, network opt-in).
- Playwright `--workers=1`, fresh `E2E_REPO`: 15 passed (journey,
  product, story, responsive incl. new routes).
- Browser: landing + quiz + activity verified with 0 console errors;
  hero screenshots per variant + locked-B proof in `.demo-tmp/`.
- Live Meta calls: NONE made (no key). Model id `muse-spark-1.3` still
  UNVERIFIED live; owner may switch the default to Muse 1.0 with the
  exact model id.

## 6. Budget actually spent

Meta inference: $0.00 (no live calls; all work rules/mock/offline).
Engineering: agent session time only. No paid subscriptions, hosting, or
third-party services were used. Reserve untouched.

## 7. Known limitations and honesty list

- Hook firing, payload shapes, elicitation, and block semantics are
  UNVERIFIED on all three agents (versions only). Every surface that
  could imply otherwise says UNVERIFIED or advisory.
- `bb-hook` `block` has never fired live; the path is unit-tested only.
- A/B turns-to-acceptance is unmeasured by design (needs a live agent).
- Seeded/demo data is labelled wherever shown; the 22-case benchmark is
  a controlled check, not real-world accuracy.
- ADR-021's "HomeEvidenceNetwork is live" line is WRONG (grep proves
  dead); corrected in PROGRESS erratum, ADR left intact as history.
- Skipped tests: 7 web unit (need live server), 1 HTTP (needs network),
  documented in-suite.

## 8. Remaining backlog (prioritised)

- P0: BB-080 dead-code call (retire HomeEvidenceNetwork or keep
  knowingly + ADR); BB-090 demo rehearsal ×2, freeze Nov 3 12:00, submit
  Nov 4 18:00 GMT.
- P1: BB-020 interactive probes (throwaway hooks per agent); BB-021 one
  minimal live call; BB-051 second adapter only after its probes.
- P2: embedded SDK agent, cloud sync, visual-intent advisory, research
  briefs, pricing — each behind an explicit owner gate.

## 9. Owner decisions required

1. Commit this batch (file list below) from your shell.
2. HomeEvidenceNetwork: retire (like ScrollStory) or keep knowingly?
3. Agents for interactive probes: Muse only, or also codex/claude?
4. Meta key via environment + go-ahead for one minimal live call
   (model id for Muse 1.0 still needed if switching the default).
5. Demo rehearsal slot before the Nov 3 freeze.

## 10. Changed-file list for the owner commit

Committed since `c807012`: none (tree has 41 uncommitted paths).
Uncommitted now: modified — `AppShell.tsx`, `page.tsx`,
`run/[id]/page.tsx`, `workspace/page.tsx`, `product.spec.ts`,
`responsive.spec.ts`, `http.test.mjs`, `DECISIONS.md`,
`DEMO_SCRIPT.md`, `IMPLEMENTATION_TRACKER.md`, `PROGRESS.md`,
`SUBMISSION.md`, `package.json`, `package-lock.json`,
`cli/src/{commands,main}.ts`, `domain/src/{events,index}.ts`,
`eval/{package.json,tsconfig.json}`, `muse/HANDLERS.md`,
`store/src/views.ts`, `tsconfig.json`; new — `app/{activity,readiness}/`,
`lib/{activity,assurance}.ts`, `test/{activity,assurance}.test.mjs`,
`cli/test/init.test.ts`, `domain/src/{questions,checks,capabilities}.ts`,
`domain/test/contracts.test.ts`, `eval/src/ab.ts`, `eval/test/`,
`muse/{handlers/bb-hook.js,lib/,test/gate.test.js}`, `packages/planning/`,
`store/test/contracts.test.ts`, `docs/BUILD_REPORT.md` (this file).
No secrets, ledgers, caches, or generated files are staged: verify with
`git diff --cached | Select-String 'LLM_|BB_META_API_KEY\s*=\s*["'']?[A-Za-z0-9]{8}'`
before committing. Never `git add -A`.
