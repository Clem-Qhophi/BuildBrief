# Isolated Muse Code assignment

Copy this prompt into Muse Code. This task stays separate from the product UI work.

```text
You are working in C:\Projects\BuildBrief_Hackathon for the Meta Global AI
Developer Hackathon / Cerebral Valley. Another agent is implementing and testing
the web product. Your assignment is the native Muse prompt-capture integration.

Read AGENTS.md, MASTER_BLUEPRINT.md, docs/DECISIONS.md, and
packages/muse/HANDLERS.md first. Inspect the installed Muse Code version and
supported hook documentation. Preserve all existing uncommitted work.

Your write scope is ONLY:
- packages/muse/
- .muse/hooks.json, if the installed official schema requires it
- docs/MUSE_CAPTURE_VALIDATION.md
- ignored .demo-tmp/muse-capture-validation/ for isolated test artifacts

Do not edit apps/web, other packages, root manifests/lockfiles, environment
files, shared ledgers, or the other agent's reports. Do not commit, push,
deploy, change permissions, use YOLO, or make separate paid model API calls.

Validate whether a real interactive UserPromptSubmit lifecycle event fires on
this installed build. First inspect the existing handler and MCP/skill fallback;
do not rewrite working integration blindly. Use a unique scratch ledger and a
synthetic test project. Preserve exact prompt text/hash and useful provenance.
Capture must always create drafts: never approve actual owner intent or imply
that captured text grants consent. Keep credentials out of every artifact.

Add maintained handler tests for any behavior you change. Run only your bounded
tests; coordinate before running the full root test suite. Do not call a direct
handler test or MCP harness proof of a real Muse lifecycle hook. If restarting
the interactive Muse session is needed, explain the exact owner action rather
than fabricating success or interrupting the other terminal.

Deliver docs/MUSE_CAPTURE_VALIDATION.md with installed version, documented
configuration source, commands actually run, test results, exact changed files,
observed provenance, and a clear verdict: real lifecycle verified, handler/MCP
only, or blocked with a concrete next action. Include a short reproducible demo
for judges and distinguish Muse Code usage from BuildBrief's own API provider.
```
