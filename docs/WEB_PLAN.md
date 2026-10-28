# Web dashboard + Understanding Studio — scoped plan (M3)

Constraint: no mock interfaces. Every pixel reads the real ledger
(`.buildbrief/events.jsonl`, `state/views.json`) and stored reports
(`.buildbrief/reports/*.json`). If the backend cannot answer, the UI shows
the gap — never a fabricated value.

## Phase 1: workbench (read-only over M2 outputs) — BUILT 2026-10-28 (M3b)

- `apps/web` (Next.js, local-first): routes `/projects`, `/intent/:id`,
  `/verify/:run`, `/changes`, `/fix/:pack`. Data via API routes that shell out
  to `bb report` / read views — no new database, no new verdict logic.
- Intent Timeline: raw prompts, draft criteria, ambiguity flags, approve button
  (calls `bb approve` server-side with the session actor; approval still explicit).
- Verification Workspace: criterion ledger left, findings center, evidence drawer
  right (path + line range + revision + grade; stale badges from ledger state).
- Changes tab: orphan list with risk, flags, and disposition buttons
  (`explained | linked | approved | rejected` → `bb` disposition event).
- Correction Studio: pack text, copy/export, recheck trigger; no "fixed" state
  until a fresh verify lands.
- Acceptance: every claim on screen resolves to a ledger event or report
  pointer; `npm run web` starts locally; responsive + keyboard navigable.

## Phase 2: Understanding Studio v1 (grounded, minimal)

- `bb explain` (new verifier function, P1): feature summary bound to the
  approved intent version + same-revision evidence ids + explicit unknowns.
- One quiz per verified feature: a single `predict` question generated from a
  supported finding (behavior + location), with rubric = the evidence spans;
  answers checked against the rubric, human override kept.
- Role tour v1: Founder/Engineer/Marketing brief assembled from intent +
  findings + orphans (no invented business policy; unknown billing/pricing
  stays unknown).
- Comprehension Map: DEFERRED until ≥5 answered quizzes exist; until then show
  `Unmeasured` rows (no heat colors without data).
- Acceptance: quiz references resolve at the pinned revision or the question
  is retired automatically; no scores, streaks, or rankings in v1.

## Explicit non-goals (stay in roadmap.md)

GitHub App/OAuth, push notifications, billing, multi-tenancy, auto-PR writes,
voice/mobile, spaced repetition, break-it lab. The dashboard must remain a
thin reader over the ledger — all intelligence stays in `packages/verifier`.
