# Hackathon Checklist

Deadline: **Nov 4, 2026, 9:00 PM ET = Nov 5, 02:00 UTC = Nov 5, 02:00 Ghana time.**
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
- [x] E5: Report export (JSON/MD/HTML) + sample fixture reproducible (M1–M2).
- [x] E6: MCP capture + hook handlers tested, hooks.json honestly UNVERIFIED; orphan demo live (M2).
- [x] E7: Quiz + role tour + comprehension map + autopsy on same-revision evidence (M3a/M3d/M3g).
- [x] E8: Benchmark at 30 cases (22 dev + 6 holdout, JS/TS + Python) green + stable; README current; demo rehearsed from reset twice (M3f/M3h) + owner eyeball of workbench.
- [ ] E9 (Nov 4 ≤18:00 Ghana): Private-window link check, submit, save receipt.

## Submission kit (docs assembled Oct 28 — M3c; recording + submit remain)

- [x] Source repo (pending owner commit), README (<5 min setup, claims verified)
- [x] Runnable demo + timed script (`docs/DEMO_SCRIPT.md`) + sample project
- [x] Model/tool disclosure, eval commands + honest results, privacy statement
- [x] Architecture note, failure cases, competition checklist
- [x] No credentials anywhere (verified: keys env-only, ledger/logs clean)
- [ ] Recording (owner action, see `docs/VIDEO_OUTLINE.md`)
- [ ] Portal submit + receipt (Nov 4, owner action)
