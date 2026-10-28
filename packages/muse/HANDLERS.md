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
template installed, then inspect `.buildbrief/captures.jsonl`.
