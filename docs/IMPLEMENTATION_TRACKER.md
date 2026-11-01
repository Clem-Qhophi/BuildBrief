# Implementation tracker — Master Upgrade Plan

Governing plan: `docs/BUILD_BRIEF_MASTER_UPGRADE_PLAN.md`.
Source documents: `docs/research/source/` (hashes in its README).
Rule: update this file **after every task**, never only at the end.
Status values: not-started / in-progress / done / blocked /
deferred (with reason). Evidence = file paths, command + exit code +
counts, screenshot/log paths under `.demo-tmp/` (git-ignored).

## Completed before this plan (restore + fix pass, 31 Oct 2026)

| ID | Task | Status | Evidence |
| --- | --- | --- | --- |
| PRE-1 | Restore Oct 30 landing ("Keep your idea in the picture.", TraceAtlas, atlas/connected-home CSS, lib/atlas) from `.next` sourcemaps + session delete-snapshots | done | Served HTML + browser screenshots verified; hashes 117/117 vs `.demo-tmp/full-revert-backup-20261031-200801` before the 5-file landing swap |
| PRE-2 | Fix pass: workspace provider wording, heading hierarchy, not-found recovery links, probe fragment, mobile CSS (mode-label dot, canvas note, table code) | done | `web:build` 0; HTTP suite green (below) |
| PRE-3 | Capture cross-project repo leak fix (`lib/connections.ts carriedRepo`) + unit test | done | `apps/web/test/connections.test.mjs` |
| PRE-4 | Test contracts updated to the Oct 30 landing (http, product, story) + `e2e/responsive.spec.ts` added | done | Playwright 13 passed + responsive 2 passed (`--workers=1`, fresh-seeded `audit2-repo`) |
| PRE-5 | Gates at close of fix pass | done | build 0 · `npm test` 0 · eval 22/22 + 6/6 + 2 gaps · web+HTTP 24 pass / 1 skipped (GitHub import, network opt-in) · logs in `.demo-tmp/recovery-snapshot-20261031-202551/` |
| PRE-6 | Source PDFs filed + verbatim extractions + reconciled master plan + this tracker | done | `docs/research/source/` (SHA-256 in README), `docs/BUILD_BRIEF_MASTER_UPGRADE_PLAN.md` |

## Master upgrade tasks

| ID | Task (plan section) | Status | Evidence / gate |
| --- | --- | --- | --- |
| BB-000 | Owner commits/tags the restored+fixed tree (rollback point) (§4.1) | done — pushed `8952c28` + `8c27ce9` + `c807012` + `4bd9304`, `origin/master` = `4bd9304` | Rollback = `4bd9304` (prior: `b3ee211` + `.demo-tmp` backups) |
| BB-001 | Phase 0 baseline audit: capability matrix + M4e/M5/M5c reconciliation, no code (§4) | done | Matrix in PROGRESS 2026-10-31 BB-001 entry; gates build 0, test 0 (70+7), eval 0 (22/22+6/6), web:build 0; HTTP/e2e not runnable in sandbox |
| BB-010 | Domain contracts: questions, decisions, acceptance checks, capability manifest, agent session/event, gate record; old-ledger compatibility tests (§5) | done 2026-11-01 | `domain/src/{questions,checks,capabilities}.ts` + 7 new event types + extended `ProjectViews`; 8 new tests green; full battery: npm test 0 (78+7), eval 22/22+6/6 |
| BB-020 | Capability verification probes per installed agent (Muse first) + ADR with real matrix; mock-first Meta path (§5) | partial 2026-11-01 — versions verified read-only (muse 1.4.14, codex-cli 0.164.0, claude 2.1.198; ADR-022); **Muse UserPromptSubmit firing PROVEN live with full provenance (ADR-024)**; **Stop proven ABSENT on this build (ADR-025 — gate stays advisory, no further debate)**; elicitation, PreToolUse/PostToolUse still UNVERIFIED | Payload logs `.demo-tmp/hook-probes/`; unverified items labelled |
| BB-021 | Single minimal live Meta validation call (needs owner key via env + explicit go-ahead) (§1, §5) | attempted 2026-11-01 — product path proven to Meta's gate; consistent HTTP 401 across default AND contributor model ids, so the model id is ruled out and the key/entitlement is the cause; parked at account gate | Report model id, latency, usage only |
| BB-030 | Adaptive intake engine (`packages/planning`) + contract card; three delivery tiers (§6) | done 2026-11-01 — engine only: `planning/src/plan.ts` (repo-fact skip, ranking via BB-010 scores, budget 6 + critical overflow with reason, stable ids, decide-for-me reversible-only); 10 scenario tests (5 greenfield + 5 existing-repo); contract-card UI deferred to BB-060 | npm test 0 (88+7), eval 22/22+6/6 |
| BB-040 | Acceptance compiler: test/build/path checks, "How this will be checked" (§6) | done 2026-11-01 — `planning/src/compile.ts` (negative→path, command→test, detected→build/lint, else labelled model; drafts refused; stable ids; revision-pinned); 5 compiler tests incl. seeded-referral shape + reproducibility | npm test 0 (93+7), eval 22/22+6/6 |
| BB-050 | Adapter #1 (extend `packages/muse`) + `bb-hook` normaliser + controlled gate (cap 3, override) (§7) | done 2026-11-01 — `muse/lib/{gate,normalize}.js` + `handlers/bb-hook.js` (allow/warn/block, advisory default, autopsy prompts, cap-3 escalation, recorded override); 7 tests; live firing UNVERIFIED (owner run needed) | npm test 0 (93+14), eval 22/22+6/6 |
| BB-051 | Adapter #2 (Codex or Claude Code) — same contract across agents (§7) | not-started | Portability demo: contract continues in second agent |
| BB-052 | Activity view + Git reconciliation labels + `bb init` (§7) | done 2026-11-01 — `bb init` inspect-only report (binaries, hooks template, MCP serve command; writes nothing); `web/lib/activity.ts` timeline with gap rows; `/activity` page + nav + responsive route + HTTP assertions | npm test 0 (95+14), eval 22/22+6/6, web+HTTP 29 pass/1 skip; Playwright 15 pass |
| BB-060 | Project Room/attention queue, coverage block on reports, founder/developer toggle, language pass (§8) | done 2026-11-01 — `web/lib/assurance.ts` + tests; workspace attention queue + founder summary + density toggle (developer default); run-report coverage block; HTTP assertions added | tsc 0, npm test 0 (95+14), eval 22/22+6/6, web:build 0, web+HTTP 32 pass/1 skip; Playwright 15 pass |
| BB-061 | Settings BYOK/provider section (§8) | done — code+verified 2026-11-01 | `settings/page.tsx:107-132` read-only; HTTP asserts `/Model provider/`; live :3103 `/settings` 200 with key presence + effective model + setup text; no key form, no live call |
| BB-062 | Landing Gate L: two hero variants, owner pick, sections rebuild (§8) | done 2026-11-01 — owner picked B; `page.tsx` static B hero + title, variant code removed; tests updated; live :3103 H1 verified + screenshot | Before/after screenshots; no silent hero swap |
| BB-070 | Quiz studio `/quiz` + `lib/study.ts` + tests; Features link (§9) | done — code+verified 2026-11-01 | `lib/study.ts` + 3 tests, `app/quiz/page.tsx`, nav + Features→`/quiz`; live :3103 `/quiz` 200; HTTP 26 pass; Playwright 15 pass incl. responsive `/quiz` |
| BB-071 | Release-readiness view + evidence export (§9) | done 2026-11-01 — `readinessSummary` + tests; `/readiness` page (per-feature draft/never-run/stale/attention/established, open gates, known limitations, ledger export + report links) + nav + responsive + HTTP assertions | tsc 0, npm test 0 (95+14), eval 22/22+6/6, web:build 0, web+HTTP 33 pass/1 skip; Playwright 15 pass |
| BB-072 | A/B harness: 3 tasks baseline vs assisted, honest results table (§9) | done 2026-11-01 — `eval/src/ab.ts` (`npm run test:ab`): invoice/auth-bypass/partial tasks, agree=true all 3, expectations met, 0 tokens (rules offline), turns unmeasured; + table unit tests | npm test 0 (97+14), eval 22/22+6/6 |
| BB-080 | Dead-code decision: ScrollStory / HomeEvidenceNetwork / lib/story (§11) | done 2026-11-01 — owner chose retire; `HomeEvidenceNetwork.tsx` deleted (grep: zero importers); ADR-023; ADR-021's wrong "live" line corrected via PROGRESS erratum, ADR left intact | ADR records retire or re-adopt, owner-approved |
| BB-090 | Demo script, README/submission docs, final BUILD_REPORT (§10–11) | partial 2026-11-01 — ADR-022, SUBMISSION/DEMO refresh, `docs/BUILD_REPORT.md` written; rehearsal, freeze, submit remain owner-scheduled | Demo rehearsed twice; freeze Nov 3 12:00; submit Nov 4 18:00 GMT |
| BB-100 | Connections experience + setup guide + server-side integration proof (owner review 2026-11-01) | done 2026-11-01 — `/connections` page + nav + activity/settings links; `/api/connections/test` (real spawn, 12 tools, scratch-ledger proof); `/api/connections/guide` (secret-free asserted); per-agent syntax verified via --help; in-agent runs still owner-side | tsc 0, npm test 0 (101+14), eval 22/22+6/6, web+HTTP 39/1, Playwright 15 |

## Open owner gates

1. BB-000 commit of the current tree.
2. Which agents are installed for BB-020 probing (Muse only, or also Codex / Claude Code)?
3. BB-021: Meta key via environment + explicit go-ahead for one minimal live call.
4. BB-062: hero variant (a) current headline + new subheading, or (b) accountability headline.
