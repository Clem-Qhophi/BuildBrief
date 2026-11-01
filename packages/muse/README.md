# Muse integration (M2)

Native touchpoints, all validated against the installed Muse Code 1.4.14 and
https://dev.meta.ai/docs/muse-code/extending (fetched 2026-10-28):

- `hooks.json` — candidate project-hook file for `<project-root>/.muse/hooks.json`.
  The exact file schema is NOT published on the docs page; the shape below is a
  hypothesis under empirical test (see `HANDLERS.md`). Do not ship it as confirmed.
- `handlers/capture.js` - `UserPromptSubmit` handler: appends raw prompt plus
  sha256 of the exact full text and probed provenance to a log, exits 0,
  never approves. Payload fields are probed defensively.
- `handlers/guard.js` — `PreToolUse` constraint guard (planned; same pattern).
- `mcp/` — stdio MCP server exposing `bb_*` tools (planned M2).
- `skill/` — project skill `SKILL.md` (planned M2).

Trust note (official): project hooks run only after the project folder is trusted,
and hook commands run outside the agent sandbox with a cleared environment.
Keep handlers fast (<1s), dependency-free, and observable (append-only logs).
