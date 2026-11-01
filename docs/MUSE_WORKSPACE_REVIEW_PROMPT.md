# Muse Code assignment: independent first-run and interface audit

This assignment is read-only for application code and can run alongside Codex's
implementation work without editing the same files.

```text
Work in C:\Projects\BuildBrief_Hackathon. Use Muse Code with the Muse Spark
coding model if it is available in this session. Your only write target is a
new report: docs/MUSE_FIRST_RUN_AUDIT.md. Do not change application code, tests,
configuration, ledgers, project connections, image assets, or any other file.

Read AGENTS.md, MASTER_BLUEPRINT.md, docs/DECISIONS.md, and
apps/web/AGENTS.md. Inspect the actual product flow and, if a local browser is
available, the rendered interface. Include the homepage first screen and full
scroll, idea capture and review, repository connection, saved project picker,
and example/demo labels. Trace routes and forms in code; do not infer behavior
from copy alone. Check narrow-screen and reduced-motion layouts if available,
without changing app code or persisted workspace data.

Audit these three real journeys:
1. A founder has only an idea and no repository.
2. A builder already has a local repository or public GitHub URL.
3. A founder starts with an idea, then connects the repository their coding
   agent created, and returns to the same project.
4. A visitor follows the evidence example and scrolls through the product
   story. Check whether each section explains the next action in plain language
   and whether the visitor can tell a saved fixture, test workspace, finding,
   and human decision apart.

Also inspect the project picker and workspace list for repeated or opaque
names (including `Test GitHub` / `Test Collection` style names), and wording
such as B2B, MVP, or referral credit that a new founder may not understand.
Determine from code and labels whether referral-looking entries are demo
copies, user balances, or something else. Do not delete, rename, or regenerate
projects to investigate.

In docs/MUSE_FIRST_RUN_AUDIT.md, report:
- The actual steps and state transitions found in code for each journey.
- Any dead ends, ambiguous labels, lost context, unsafe implication, or user
  decision that is missing. Back each finding with exact file and line numbers.
- At most five fixes, ordered by user impact, with a specific acceptance check
  for each. Separate confirmed bugs from design recommendations. Include
  language or scrolling issues only when tied to a real screen or source line.
- Whether the live Meta Model API was used. Do not make a separate paid Meta API
  request or ask for credentials; do not claim Muse Spark usage proves a Meta
  API call or hackathon integration.
- Files inspected and any command you actually ran. Do not claim a command or
  test passed unless you ran it.

Preserve all owner changes. Do not delete or rename workspace projects, infer
that test-like projects are disposable, commit, push, deploy, or run cleanup.
Do not create a second implementation. If Muse Spark is unavailable, state that
plainly and still produce the code-backed report without another model call.
```
