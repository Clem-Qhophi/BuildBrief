# Muse Code assignment: independent first-run and workspace audit

Copy the prompt below into Muse Code. It is read-only for product code, so it
can run alongside the current UI implementation without touching the same files.

```text
Work in C:\Projects\BuildBrief_Hackathon. Use Muse Code with Muse Spark if it
is available in this session. Another coding agent is actively implementing
the web UI; your only write target is docs/MUSE_CODE_PRODUCT_AUDIT.md.

Read AGENTS.md, MASTER_BLUEPRINT.md, docs/DECISIONS.md, and apps/web/AGENTS.md.
Inspect the implemented routes, forms, labels, workspace selection, project
presentation helper, and the actual local preview at http://127.0.0.1:3104 if
it is reachable. Trace behavior in code rather than assuming copy is accurate.

Review these user questions:
1. A founder has only an idea and no repository. How does BuildBrief capture
   intent, expose uncertainty, get the owner's approval, create a useful
   coding-agent handoff, and preserve that same brief when code is connected?
2. A builder already has a repository. Can they connect it and understand what
   BuildBrief will inspect, what it will not run, and where to go next?
3. Can a nontechnical founder distinguish the product outcome from source,
   test, and rules-based evidence? Does scrolling clarify the relationship?
4. Are example/test workspaces, repeated-looking projects, referral-credit
   examples, B2B/MVP terminology, or other seeded records mistaken for real
   customer projects, account credits, or product capabilities?
5. Does any visible UI or repository copy falsely claim “built with ChatGPT,”
   “built with Muse,” or a live Meta API integration? Keep truthful tool-use
   disclosures and seeded-example / generated-image disclosures where needed.

Write docs/MUSE_CODE_PRODUCT_AUDIT.md with:
- A short verdict about whether each journey is understandable and complete.
- A concise, ordered list of the highest-impact confusion points, separating
  confirmed code/UI behavior from design suggestions.
- Exact file paths and line numbers for every confirmed finding.
- A reproducible browser/code observation or acceptance check for each fix.
- Any unavailable route/tool/model stated plainly. Say whether Muse Spark was
  actually available and used. Muse usage does not prove that BuildBrief made a
  live Meta Model API request.

Do not edit application code, tests, CSS, configuration, ledgers, project
connections, assets, manifests, environment files, or existing docs. Do not
delete, rename, create, or “clean up” project records. Preserve all owner work.
Do not make a paid Meta API request, ask for credentials, commit, push, deploy,
or run destructive commands. Do not create another implementation. If the
preview is unavailable, continue with source inspection and note that limit.
```
