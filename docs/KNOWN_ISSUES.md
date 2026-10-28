# Known Issues

| Date | Issue | Impact | Mitigation / owner |
|:---|:---|:---|:---|
| 2026-10-27 | `muse.search` found no PDFs though two exist in root (binary-skip behavior) | Low — corrected via `Get-ChildItem`; audit complete | Prefer shell listing for binary inventory |
| 2026-10-27 | PowerShell default-sandbox calls fail: `Windows sandbox ACL update failed… publication lock timeout` | Medium — every shell call currently needs `require_escalated` approval | Proceed with approvals; re-test default sandbox later; all shell output still captured |
| 2026-10-27 | Underlying research docs A (21-section) and B (10-part) not on disk | Low — positions preserved via blueprint §2 + audit quotes | Do not cite A/B beyond what blueprint/audit state |
| 2026-10-27 | Meta endpoint/auth/schema — VALIDATED against official docs (subagent report on file) | None blocking — EPIC 04 proceeds with confirmed contract | Base `https://api.meta.ai/v1/chat/completions`, Bearer `LLM_…` key, `muse-spark-1.3`, `response_format:json_schema`, hooks incl. `UserPromptSubmit` in `.muse/hooks.json`, Standard $1.25/$0.15/$4.25 per 1M |
| 2026-10-27 | No commits yet; git identity/history empty | Low | First commit after scaffold + green tests; record pre-existing vs hackathon-new files |
| — | Participant waiver / portal rules unread (scoring, video, repo, new-work) | **High** | Human action: see HACKATHON_CHECKLIST.md items H1–H3 |
| — | $150 API credit claim + billing cap | **High** | Human action: checklist items H4–H5 |
| 2026-10-27 | CLI extractor emits coarse criteria only: no negative criteria, no `forbidden_terms`, no `requires_tier` | Medium — eval constructs them directly; CLI verdicts skew `partial`/`not_established` | P1: Meta-assisted extraction review (owner still approves every term) |
| 2026-10-27 | `MetaApiProvider` implemented + unit-tested but never called live (no key) | Medium — `--provider meta` fails loudly without key, by design | Human action: H4, then one Standard `muse-spark-1.3` smoke call |
| 2026-10-27 | RuleAssessor is lexical (keyword/forbidden overlap), not semantic | Medium — honest within benchmark; real-model adjudication is the P1 upgrade | Tracked: eval labels pin current behavior; Meta provider path exists |
| 2026-10-27 | Eval is single-language (JS/TS-shaped fixtures), one repo shape per case | Low for hackathon | P1: second language + multi-file feature areas |
| 2026-10-28 | `.muse/hooks.json` inner schema unpublished; no candidate fired under `muse exec` | Medium — native capture unproven; MCP+skill carry integration | Interactive-session test pending; template marked UNVERIFIED (ADR-009) |
| 2026-10-28 | No `BB_META_API_KEY`/`MODEL_API_KEY` in environment; no live Meta call made | Medium — rules provider is the only measured path | Human action: `docs/META_SETUP.md` (claim credit, set key, run `--provider meta`) |
| 2026-10-28 | Lexical engine trusts comments (gap-comment-mirage FP) and misses paraphrased behavior (gap-vocabulary-miss FN) | Medium — documented, gated out of release metrics | Real-model adjudication (P1) is the intended fix; gaps recorded in eval output |
| 2026-10-28 | PowerShell `Set-Content -Encoding utf8` writes BOM (broke first hooks.json) | Low — lesson recorded | Write JSON configs via `[IO.File]::WriteAllText` or `ConvertTo-Json` |
