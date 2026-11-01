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
| BB-000 | Owner commits/tags the restored+fixed tree (rollback point) (§4.1) | waived — owner instructed start 2026-10-31 | No commit made; rollback = git HEAD b3ee211 + .demo-tmp/full-revert-backup-20261031-200801 + landing-backup-20261031-195948 |
| BB-001 | Phase 0 baseline audit: capability matrix + M4e/M5/M5c reconciliation, no code (§4) | done | Matrix in PROGRESS 2026-10-31 BB-001 entry; gates build 0, test 0 (70+7), eval 0 (22/22+6/6), web:build 0; HTTP/e2e not runnable in sandbox |
| BB-010 | Domain contracts: questions, decisions, acceptance checks, capability manifest, agent session/event, gate record; old-ledger compatibility tests (§5) | not-started | Unit tests per schema; fixture ledger verifies identically |
| BB-020 | Capability verification probes per installed agent (Muse first) + ADR with real matrix; mock-first Meta path (§5) | not-started | Payload logs `.demo-tmp/hook-probes/`; unverified items labelled |
| BB-021 | Single minimal live Meta validation call (needs owner key via env + explicit go-ahead) (§1, §5) | blocked — owner key/approval | Report model id, latency, usage only |
| BB-030 | Adaptive intake engine (`packages/planning`) + contract card; three delivery tiers (§6) | not-started | 5+5 scenario tests; Playwright journey green |
| BB-040 | Acceptance compiler: test/build/path checks, "How this will be checked" (§6) | not-started | Seeded intent compiles ≥1 test + ≥1 path check, reproducible |
| BB-050 | Adapter #1 (extend `packages/muse`) + `bb-hook` normaliser + controlled gate (cap 3, override) (§7) | not-started | Live protected-path block or honest advisory; loop cap tested |
| BB-051 | Adapter #2 (Codex or Claude Code) — same contract across agents (§7) | not-started | Portability demo: contract continues in second agent |
| BB-052 | Activity view + Git reconciliation labels + `bb init` (§7) | not-started | Killed-session timeline shows git-reconcile gaps |
| BB-060 | Project Room/attention queue, coverage block on reports, founder/developer toggle, language pass (§8) | not-started | Screenshots desktop + 390/320; quality-gate checklist |
| BB-061 | Settings BYOK/provider section (§8) | done — code+verified 2026-11-01 | `settings/page.tsx:107-132` read-only; HTTP asserts `/Model provider/`; live :3103 `/settings` 200 with key presence + effective model + setup text; no key form, no live call |
| BB-062 | Landing Gate L: two hero variants, owner pick, sections rebuild (§8) | blocked — owner pick at gate | Before/after screenshots; no silent hero swap |
| BB-070 | Quiz studio `/quiz` + `lib/study.ts` + tests; Features link (§9) | done — code+verified 2026-11-01 | `lib/study.ts` + 3 tests, `app/quiz/page.tsx`, nav + Features→`/quiz`; live :3103 `/quiz` 200; HTTP 26 pass; Playwright 15 pass incl. responsive `/quiz` |
| BB-071 | Release-readiness view + evidence export (§9) | not-started | Per-project green/stale/never-run accuracy |
| BB-072 | A/B harness: 3 tasks baseline vs assisted, honest results table (§9) | not-started | Turns/violations/unrequested changes/tokens recorded |
| BB-080 | Dead-code decision: ScrollStory / HomeEvidenceNetwork / lib/story (§11) | partial — ScrollStory.tsx, lib/story.ts, test/story.test.mjs deleted (ADR-021); HomeEvidenceNetwork.tsx still present but unwired (grep: only its own definition) — owner decision needed: retire or keep knowingly | ADR records retire or re-adopt, owner-approved |
| BB-090 | Demo script, README/submission docs, final BUILD_REPORT (§10–11) | not-started | Demo rehearsed twice; freeze Nov 3 12:00; submit Nov 4 18:00 GMT |

## Open owner gates

1. BB-000 commit of the current tree.
2. Which agents are installed for BB-020 probing (Muse only, or also Codex / Claude Code)?
3. BB-021: Meta key via environment + explicit go-ahead for one minimal live call.
4. BB-062: hero variant (a) current headline + new subheading, or (b) accountability headline.
