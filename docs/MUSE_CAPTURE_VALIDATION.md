# Muse Prompt-Capture Validation (2026-10-30)

Scope: native Muse Code `UserPromptSubmit` capture for BuildBrief.
Assignment write scope was `packages/muse/`, `.muse/hooks.json` (only if the
installed schema requires it), this document, and ignored
`.demo-tmp/muse-capture-validation/` artifacts. Nothing else was touched.

## 1. Verdict: handler/MCP-only (NOT real-lifecycle-verified)

A real interactive `UserPromptSubmit` lifecycle event was NOT observed firing
on the installed build in this session. What is verified:

- `packages/muse/handlers/capture.js` is unit-tested (7/7) and records exact
  prompt text, its sha256, and useful provenance, exiting 0 without approving.
- The MCP/skill/CLI fallback path is exercised end to end on synthetic input:
  handler record -> `bb capture --source hook` -> ledger draft with
  `capture_completeness: hook_exact`, state `draft`, and a `source_hash`
  identical to the handler's `promptHash`.
- `.muse/hooks.json` remains an UNVERIFIED template. No live firing proof
  exists yet. A handler unit test or MCP harness run is not proof of a live
  Muse lifecycle hook, and this report does not present it as such.

Blocked item: one interactive Muse session with the template installed must
demonstrably append a record. The exact owner action is in section 7. No
session was restarted and no owner intent was approved or implied.

## 2. Installed version

- Repo-recorded: Muse Code 1.4.14 (see `packages/muse/HANDLERS.md`,
  `packages/muse/README.md`, ADR-009; recorded 2026-10-28).
- NOT re-verified in this session: the `muse` binary is not on PATH for this
  sandbox user and the owner install directory is not listable from here, so
  `muse --version` and `muse exec` could not be run. Owner re-confirmation:
  run `muse --version` in the owner's own terminal and compare against 1.4.14.

## 3. Documented configuration source

- Official docs `https://dev.meta.ai/docs/muse-code/extending` (fetched
  2026-10-30, HTTP 200): lists `UserPromptSubmit` among the lifecycle events
  and documents project hooks plus MCP/skill extension points. It does NOT
  publish the full inner `hooks.json` JSON schema.
- Repo evidence `packages/muse/HANDLERS.md`: shape A
  (`{"hooks":{"UserPromptSubmit":[{"command":...}]}}`) was rejected by the
  binary (`unknown matcher-group field 'command'`, reproduced 2x); shape B
  (Claude-compatible nested `matcher`/`hooks`/`type: command`, the current
  template) produced no observable effect under headless `muse exec`.
  Headless runs may simply never fire hooks; that is unconfirmed either way.
- Independent third-party reports corroborate the nested shape and that
  `UserPromptSubmit` carries the prompt text, but corroboration is not a live
  firing on this build. Consequence: no schema-required edit to
  `.muse/hooks.json` was found, so the file was left untouched.

## 4. Existing handler and fallback inspected (not rewritten blindly)

- `handlers/capture.js` (before): appended `{at, prompt (sliced 4000),
  rawBytes}` to `BB_HOOK_LOG_DIR` (default OS-tmp `bb-hook-probe`), exit 0,
  payload-defensive. Gap: no exact-text hash, no provenance, and a failed
  append could exit nonzero and disturb the user's prompt loop.
- `handlers/guard.js`: `PreToolUse` advisory guard (warn-only, always
  exit 0). No behavior issue found; unchanged.
- MCP fallback: `packages/mcp/src/tools.ts` `bb_capture` delegates to the
  tested CLI (`capture`); `bb_approve_intent` is the only approval path and
  requires an explicit actor. Skill fallback:
  `.agents/skills/build-brief/SKILL.md` (capture-first, never self-approve).
- CLI: `packages/cli/src/commands.ts` `cmdCapture` accepts `--source hook`
  (yielding `hook_exact`) plus `--agent`/`--session`, and always creates
  state-`draft` intents ("NOT approved").
- Dead-end noted: nothing pipes the hook log into `bb capture` yet; the
  bridge is currently an operator step (section 6, step 3).

## 5. Behavior changed (with maintained tests)

`packages/muse/handlers/capture.js` now records per event:

| Field | Meaning |
|:--|:--|
| `at` | ISO timestamp of receipt |
| `source` | Always `hook` |
| `event` | Probed envelope name, default `unknown` |
| `prompt` | Exact text truncated to 4000 chars |
| `promptLength` | Full exact length |
| `truncated` | True when truncation applied |
| `promptHash` | sha256 hex of the FULL exact text (pre-truncation) |
| `rawBytes` | Stdin string length |
| `sessionId` / `projectRoot` / `agent` | Only when the payload carries them |

Append failures are swallowed; the handler always exits 0 so a broken probe
log can never block a user prompt. Capture never approves: no approval,
state, or actor fields are written.

## 6. Commands actually run and test results

Bounded scope only: `packages/muse` tests plus the isolated demo. No full
root suite, no `tsc -b`, no eval, no model calls.

1. `node --test packages/muse/test/handlers.test.js`
   - Baseline: 4/4 pass (note: the sandbox TEMP is not writable by this
     user, so the run used a writable override
     `TEMP=<repo>/.demo-tmp/test-tmp`; two initial EPERM failures were
     environmental, not code failures; the directory was removed after).
   - New tests failed first against the old handler (missing `source`,
     nonzero exit on unwritable dir), then passed after the fix.
   - Final: 7/7 pass (4 pre-existing + hash/truncation, provenance/
     never-approves, unwritable-dir exit 0).
2. Synthetic hook pipe (isolated, no secrets):
   `...UserPromptSubmit JSON... | node packages/muse/handlers/capture.js`
   with `BB_HOOK_LOG_DIR` under `.demo-tmp/muse-capture-validation/hook-log`.
   Result: exit 0 and this record (line breaks added for readability):
   `{"at":"2026-10-30T18:28:37.631Z","source":"hook",`
   `"event":"UserPromptSubmit","prompt":"Add referral codes. ... Do not`
   `modify authentication.","promptLength":168,"truncated":false,`
   `"promptHash":"9377a9ad40a71a9181fcb100d716b98ac9baae2014fc43d91dc681f51`
   `da716ed","rawBytes":277,"sessionId":"demo-sess-001",`
   `"projectRoot":"synthetic-test-proj"}`
3. `node packages/cli/dist/src/main.js capture --project demo-muse
   --feature referral --source hook --agent muse-demo
   --session demo-sess-001 --prompt-file ../prompt.txt`
   (run with cwd `.demo-tmp/muse-capture-validation/ledger`, prompt
   extracted mechanically from the hook record):
   `captured bb_intent_5592434bddb62f80ed -- 4 draft criteria,
   1 constraints, 0 ambiguity flags (state: draft, NOT approved)`
4. `... main.js list --project demo-muse`:
   `bb_intent_5592434bddb62f80ed v1 [draft] feature=referral criteria=4`
5. Ledger inspection (`.demo-tmp/muse-capture-validation/ledger/
   .buildbrief/events.jsonl`): `prompt.captured` carries `source: hook`,
   `session_id: demo-sess-001`, and
   `source_hash: 9377a9ad...f51da716ed`, IDENTICAL to the handler
   `promptHash`. The `intent.extracted` intent has `state: draft`,
   `capture_completeness: hook_exact`, exact source text preserved, and the
   "Do not modify authentication." constraint at severity critical.

No credentials were used or written anywhere: all prompts synthetic, no
`BB_META_API_KEY` present, no network except the public docs fetch.

## 7. Exact owner action to verify live firing (no restart by me)

In the owner's OWN interactive terminal (not this session; nothing here
restarts or interrupts it):

1. `muse --version` and confirm the 1.4.14 recording above.
2. In a trusted checkout of this repo (project hooks require trust),
   confirm `.muse/hooks.json` contains the template, then start an
   interactive `muse` session in the repo root.
3. Send one unmistakable synthetic prompt, e.g.
   `hook firing probe <your initials> <time>`.
4. Inspect the hook log. IMPORTANT: hook commands run with a cleared
   environment, so `BB_HOOK_LOG_DIR` will NOT arrive and the record lands
   at the default location, e.g. `%TEMP%\bb-hook-probe\captured.jsonl`
   (PowerShell: `Get-Content $env:TEMP\bb-hook-probe\captured.jsonl`).
   Check that the probe text, its hash, and provenance are present.
5. Report the outcome (fired / not fired, Muse version, record excerpt
   with any secret-adjacent content withheld). Do NOT treat the captured
   text as approval of anything, and do not approve any intent from it.

## 8. Exact changed files

- `packages/muse/handlers/capture.js` (hash + provenance + always-exit-0)
- `packages/muse/test/handlers.test.js` (3 new maintained tests)
- `packages/muse/HANDLERS.md` (2026-10-30 re-validation notes, record
  schema, ingest gap)
- `packages/muse/README.md` (one-line handler description update)
- `docs/MUSE_CAPTURE_VALIDATION.md` (this file, new)
- `.demo-tmp/muse-capture-validation/` (ignored isolated artifacts:
  `hook-log/captured.jsonl`, `prompt.txt`, `ledger/.buildbrief/`,
  `test-proj/README.md`)

Unchanged as required: `.muse/hooks.json`, `guard.js`, `apps/web`, all
other packages, root manifests/lockfiles, environment files, shared
ledgers. No commit, push, deploy, permission change, or paid API call.

## 9. Short reproducible demo (for judges)

Prerequisites: Node 22+, repo checkout, no API key needed.

```
# 1. Handler unit proof (bounded)
node --test packages/muse/test/handlers.test.js   # expect 7/7 pass

# 2. Synthetic lifecycle payload (use the JSON from section 6 step 2)
$env:BB_HOOK_LOG_DIR='<repo>/.demo-tmp/muse-capture-validation/hook-log'
'<UserPromptSubmit JSON>' | node packages/muse/handlers/capture.js
Get-Content .demo-tmp/muse-capture-validation/hook-log/captured.jsonl

# 3. Operator bridge: hook record -> ledger draft (state draft, NOT approved)
node -e "const fs=require('fs');const r=JSON.parse(fs.readFileSync(
 '.demo-tmp/muse-capture-validation/hook-log/captured.jsonl','utf8'));
 fs.writeFileSync('.demo-tmp/muse-capture-validation/prompt.txt',r.prompt)"
cd .demo-tmp/muse-capture-validation/ledger
node <repo>/packages/cli/dist/src/main.js capture --project demo-muse \
 --feature referral --source hook --session demo-sess-001 \
 --prompt-file ../prompt.txt
node <repo>/packages/cli/dist/src/main.js list --project demo-muse
# expect: v1 [draft]; events.jsonl source_hash == handler promptHash
```

## 10. Muse Code vs BuildBrief's own API provider

Muse Code is the coding-agent host in this task: the surface under test is
its hook lifecycle (`UserPromptSubmit`), MCP server attachment, and project
skill. BuildBrief's own model provider is a separate concern: the
`MetaApiProvider` calling `muse-spark-1.3` over `https://api.llama.com/v1`
(ADR-014), used only for structured verdict/quiz/explain calls behind the
`ModelProvider` interface. This validation made ZERO model or API calls of
either kind: handler behavior is deterministic stdlib-only code, the demo
used the rules/CLI path, and the only network access was reading the public
hook documentation page.
