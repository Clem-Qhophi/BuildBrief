# Hook handler notes (empirical, Muse Code 1.4.14)

Date: 2026-10-28. Method: `muse exec --provider echo` in a scratch project,
candidate `.muse/hooks.json` shapes, file-system observation of handler effects.
No interactive TUI session was available, so live firing is PARTIALLY verified.

## What the binary told us

| # | hooks.json shape | Muse response | Fired? |
|:--|:---|:---|:---|
| A | `{"hooks":{"UserPromptSubmit":[{"command":"node ..."}]}}` | `Hooks: 0 runnable - 1 warning` + `UnsupportedHandler: D66: unknown matcher-group field 'command' ... skipped` | NO (reproduced 2x) |
| B | `{"hooks":{"UserPromptSubmit":[{"matcher":"*","hooks":[{"type":"command","command":"node ..."}]}]}}` | No hooks line, no warning | NO observable effect |
| C | Same as B for `Stop` event | No hooks line, no warning | NO observable effect |
| - | Invalid JSON (BOM) | `MalformedConfig: expected value at line 1 column 1` | n/a (validator works) |

Additional facts (observed): `--trust-workspace` flips trust to
`trusted source=run-flag` without persisting; hook commands run with a
cleared environment (custom env vars do NOT arrive — handlers must use
default paths or argv); `muse exec` (headless) shows no evidence of firing
project hooks for `UserPromptSubmit` or `Stop` in any configuration tried.

One unexplained data point: a single capture record (`hello hook probe`,
rawBytes 300) appeared in the handler's default log location after the first
shape-A run. It did not reproduce in two controlled reruns, so it is treated
as an artifact, NOT as proof shape A works.

## Status

`.muse/hooks.json` in this repo is a TEMPLATE marked UNVERIFIED. Do not claim
native prompt capture works until an interactive session demonstrably appends
a record. The verified integration path for M2 is: MCP server (tested),
project skill (`muse skills validate`: valid), handlers (unit-tested,
payload-defensive). Live firing test = one interactive Muse session with the
template installed, then inspect the hook log. A direct handler unit test or
MCP harness run is NOT proof of a live Muse lifecycle event.

## 2026-10-30 re-validation (no live firing observed)

- The `muse` binary is not invokable from this sandbox (not on PATH for the
  sandbox user; the owner install dir is not listable), so `muse --version`
  and `muse exec` could not be re-run here. Installed version stays
  repo-recorded as 1.4.14 (2026-10-28) until the owner re-confirms.
- Official docs (`dev.meta.ai/docs/muse-code/extending`, fetched 2026-10-30)
  still list `UserPromptSubmit` among the lifecycle events; the full inner
  `hooks.json` schema is not published there. Independent third-party reports
  corroborate the Claude-compatible nested shape already in the template, but
  that is corroboration, not a live firing. No schema-required edit was made
  to `.muse/hooks.json`.
- `capture.js` now records, per event: `at`, `source: 'hook'`,
  probed `event` name (default `'unknown'`), `prompt` (exact text, truncated
  to 4000 chars), `promptLength` (full length), `truncated` flag,
  `promptHash` (sha256 hex of the FULL exact text, pre-truncation),
  `rawBytes`, plus `sessionId` / `projectRoot` / `agent` only when the
  payload carries them. Append failures are swallowed; the handler always
  exits 0 so a broken probe log can never block a user prompt.
- Known gap (unchanged): the hook log is a probe log, not a ledger ingest.
  Nothing pipes `captured.jsonl` into `bb capture` yet; the operator bridge
  is `bb capture --source hook --session <id> --prompt-file <prompt>`, which
  yields completeness `hook_exact` and state `draft`. See
  `docs/MUSE_CAPTURE_VALIDATION.md` for the isolated demo and verdict.

## 2026-11-01 bb-hook turn CLI + controlled gate (BB-050)

- `handlers/bb-hook.js`: reads one JSON doc from stdin
  `{ provider, event|payload, session_id?, project_id?, gate?, enforcement? }`,
  prints one JSON decision line, always exits 0. Decisions: `allow`
  (clean), `warn` (advisory findings, cap reached, or unproven transport),
  `block` (only with `enforcement: 'blocking'` plus deterministic
  failures or protected-path violations). Default enforcement is
  `advisory` because blocking semantics are unverified on the installed
  Muse build (see table above) — the CLI degrades honestly and says so.
- `lib/normalize.js`: maps muse/codex/claude hook payloads to
  prompt_submitted, tool_proposed/completed, turn_ended, session
  started/ended. Anything unmapped returns `{ supported: false }` with a
  reason; gaps are never claimed as captured.
- `lib/gate.js`: pure gate — clean turns open; hard evidence blocks
  (loop counter +1) or warns with an autopsy fix prompt (goal, failing
  checks, evidence, prior attempts, constraints, new-revision acceptance);
  model-only uncertainty is advisory; loops >= 3 escalate to the human;
  a reasoned human override opens the gate and is recorded.
- Live firing of bb-hook decisions is UNVERIFIED until the owner runs it
  against an interactive session (same standing caveat as capture/guard).
