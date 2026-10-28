# Hackathon Checklist

Deadline: **Nov 4, 2026, 9:00 PM ET = Nov 5, 02:00 UTC = Nov 4, 21:00 Ghana time.**
Internal freeze: **Nov 4, 18:00 Ghana time**. Dates subject to organizer change.

## Human-gated (needs your account access — engineering cannot do these)

- [ ] H1: Read signed participant waiver + submission form; save version/date. Confirm judging,
  tracks/themes, video length, repo visibility, team rules, new-work/IP terms.
- [ ] H2: Read `#rules`/announcements on the event Discord once; ask remaining questions once.
- [ ] H3: Confirm track (default: Indie Developer, Build for Your World) and theme.
- [ ] H4: Claim $150 Meta credit via organizer link; verify activation with one Standard `muse-spark-1.3`
  call; set a spending cap if available. Record request ID/cost — never the key.
- [ ] H5: Approve any publish/deploy/billing action explicitly (never assumed).

## Engineering gates

- [x] E1 (Oct 27): Plan + architecture + decisions written; Meta docs validation DONE (all five confirmed).
- [x] E2 (Oct 27, early): Capture → approve → evidence lookup works from CLI.
- [x] E3 (Oct 27, early): Structured verifier + adjudicator; unknowns honest; 10 dev eval cases green.
- [x] E4 (Oct 27, early): Correction pack → real patch → recheck demonstrated live; benchmark running (10 dev + 2 holdout green).
- [x] M2-E5: Eval expanded (16 dev + 4 holdout + 2 documented gaps); verdict precision/recall reported.
- [x] M2-E6: MCP server + project skill + hook handlers tested; hooks.json template honestly UNVERIFIED; Meta docs re-validated, no key in env (see `docs/META_SETUP.md`).
- [ ] E5 (Oct 31): Report export + sample fixture reproducible (web deferred to `docs/WEB_PLAN.md`).
- [ ] E7 (Nov 2): One quiz + one role tour on same-revision evidence (planned, not built).
- [ ] E5 (Oct 31): Report export (JSON/MD/HTML) + sample fixture reproducible.
      Cut rule: no end-to-end → freeze surfaces, fix evidence engine.
- [ ] E6 (Nov 1): Muse hook/MCP capture or documented fallback; one orphan-change demo.
- [ ] E7 (Nov 2): One quiz + one role tour on same-revision evidence.
- [ ] E8 (Nov 3): Benchmark freeze, security pass, README, full demo rehearsed twice from reset.
- [ ] E9 (Nov 4 ≤18:00 Ghana): Private-window link check, submit, save receipt.

## Submission kit (assembled Nov 3)

Runnable demo or replay-labeled recording · source repo · README (<5 min setup) · sample project ·
model/tool disclosure · eval commands + honest results · privacy statement · architecture note ·
failure cases · competition checklist · no credentials anywhere.
