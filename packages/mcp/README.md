# Build Brief MCP server (stdio)

Exposes the tested `bb` CLI as MCP tools: `bb_capture`, `bb_list_intents`,
`bb_approve_intent`, `bb_get_context`, `bb_verify`, `bb_report`,
`bb_make_fix_brief`. Each call spawns the built CLI in a child process, so the
MCP surface cannot drift from CLI behavior. Stdout carries JSON-RPC frames only;
all diagnostics go to stderr.

Run: `node packages/mcp/dist/src/serve.js` (after `npm run build`).
Env: `BB_WORKSPACE` (ledger directory, default: cwd), `BB_CLI` (override bb path).

## Register with Muse Code (your action, one edit)

Add to the `mcp_servers` block of your settings file:

```json
{
  "mcp_servers": {
    "build-brief": {
      "transport": "stdio",
      "command": "node",
      "args": ["C:/Projects/BuildBrief_Hackathon/packages/mcp/dist/src/serve.js"],
      "env": { "BB_WORKSPACE": "C:/Projects/BuildBrief_Hackathon" }
    }
  }
}
```

(Adjust the Windows paths to your checkout. `${VAR}` interpolation is also
supported per https://dev.meta.ai/docs/muse-code/extending#mcp.)
Then start a new session in a trusted workspace; the `bb_*` tools appear as
`mcp__build-brief__*`. Registration itself is untested here (it edits your
user settings); the server protocol is covered by `packages/mcp/test/mcp.test.js`.
