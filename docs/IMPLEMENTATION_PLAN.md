# Implementation Plan

Source of truth: `MASTER_BLUEPRINT.md`. Day plan starts **Tue Oct 27** (today).

## Priority table

| # | Feature | Pri | Acceptance |
|:--|:---|:---:|:---|
| 1 | Capture + draft extraction + owner approval + versioning | P0 | Raw prompt hashed; drafts distinct from approved; unauthorized approve rejected; amendment → new version |
| 2 | Safe repo read: manifest, ignore rules, SHA pinning, citation resolver | P0 | Bad line/SHA refused; `.env` + symlinks excluded; binaries/size-bounded |
| 3 | Verifier: retrieval → evidence → adjudicated verdict + unknowns + grades | P0 | Real line citations; insufficient evidence ⇒ `not_established`; E1≠E4; forged citations rejected |
| 4 | Recheck on new revision + staleness | P0 | Status changes only after fresh verify; history immutable |
| 5 | Correction pack → real patch → recheck (not simulated) | P0 | Pack consumed by agent; new SHA; finding flips with evidence |
| 6 | Eval harness: ≥20 dev + 10 holdout cases, per-class precision/recall | P0 | Runner exits nonzero on failure; counts + cost/latency reported, hand-edit-proof |
| 7 | CLI + JSON/Markdown/HTML report | P0 | Full loop runnable from terminal; report cites every claim |
| 8 | Muse `UserPromptSubmit` + MCP capture; one constraint warning | P1 | Hook fires on installed build; outside-scope writes detected post-commit, honestly labeled |
| 9 | Reverse check: deleted-test / auth-edit flagged as possibly unrequested | P1 | Deleted test alerted; approved refactor not accused |
| 10 | One predict/locate quiz + one role tour (Marketing/Founder) | P1 | Citations valid at same revision; stale questions retired; `Unmeasured` shown when no data |
| 11 | Prompt Autopsy (only if P0 stable) | P1 | Causes labeled hypothesis; next prompt constrained; retry measured |
| 12 | Comprehension Map (only with real quiz data) | P1 | Else 2–3 module rows marked `Unmeasured` |
| — | GitHub App, mobile, push digests, billing, multi-tenant, auto-PRs, CI gates | P2 | Roadmap only — see `docs/roadmap.md` |

P2 items are preserved in `docs/roadmap.md` and are **not** built for the submission.

## EPIC order (dependency-gated)

- EPIC 00 — repo hygiene, toolchain, `.gitignore`, `.buildbriefignore`, env example ✅ today
- EPIC 01 — `packages/domain`: schemas, ids, intent state machine
- EPIC 02 — `packages/store` + `packages/cli`: capture/list/approve
- EPIC 03 — `packages/repo`: git adapter, manifest, diff, citation resolver
- EPIC 04 — `packages/model-meta`: provider interface, Meta client, mock
- EPIC 05 — `packages/verifier`: retrieval, adjudication, reverse-map
- EPIC 06 — correction packs + recheck
- EPIC 07 — `packages/eval` + `samples/referral-demo` + labels
- EPIC 08 — report export (CLI surface; web deferred per ADR-006)
- EPIC 09–12 — P1s, in priority order, only when P0 rechecks green twice

## Hard cuts (from blueprint §17)

Oct 29: citations/unknowns unstable → narrow criteria, drop broad verdicts. Oct 31: no end-to-end
→ freeze surfaces, fix evidence engine. Nov 1: Muse adapter unstable → CLI/MCP + Meta API demo,
document fallback. Nov 2: quizzes weak → drop scoring map. Nov 3: blocker fixes only.

## Backlog

P2 detail lives in `docs/roadmap.md`. Acceptance criteria ride with each EPIC above; this section
tracks P0/P1 spillover if hard-cut rules fire.
