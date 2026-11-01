# BuildBrief roadmap: hackathon slice vs commercial product

Status 2026-10-29. Rule: never present the left column as the right one.

## A. Hackathon-ready (exists, proven)

- Capture → approve → verify → evidence → correction packs → recheck loop
  (CLI, MCP, web), deterministic rules engine, eval 22/22 + 6/6 holdout.
- Product shell: dark design system, dashboard, guided steppers, role tours,
  handover briefs, quiz, ledger export. Browser suite 4/4 (owner machine).
- Live Meta path: provider implemented, guards verified; first live call pending.

## B. Commercial foundations (genuinely missing)

1. **Authentication + multi-user.** Ledger is single-user local files; role
   briefs are views, not accounts. Needs auth, per-user permissions, audit.
2. **Hosted sync + collaboration.** No server persistence beyond the local
   workspace; no invitations, comments, or shared projects.
3. **Production hardening.** Rate limits, input quotas, background jobs for
   long verifications, error telemetry, backups.
4. **Billing + plans.** No metering, no tiers, no payment integration.
5. **Enterprise connectors.** GitHub App, CI checks, IDE plugins, Slack —
   only local CLI/MCP exist today.
6. **Model operations.** Provider failover, cost budgets, prompt versioning
   discipline, quality monitoring beyond the rules eval.

## Near-term order (no-regret)

1. Owner visual review + commit of the M6a shell.
2. First live Meta smoke (authorized) → record model/latency/usage.
3. Hackathon submission (video + demo + write-up) before Nov 4.
4. After submission: auth design first — it gates 1, 2, 5 and 6.
