---
name: build-brief
description: Intent-to-implementation loop for repos monitored by Build Brief. Use when implementing a feature or fix: capture the request, respect approved constraints, verify against evidence, and close findings with fresh verification.
---

# Build Brief project skill

You are working in a repository monitored by Build Brief, the
intent-to-implementation system of record. Follow this loop for every
feature or fix you implement; it exists so the owner can see what was
approved, what the code actually establishes, and what remains open.

## 1. Capture first

Before coding, record the owner's exact request with the `bb_capture`
MCP tool (or `bb capture` on the terminal). State the project, feature,
and the raw prompt. Capture is cheap and never needs approval.

## 2. Never self-approve

Extraction output is always a DRAFT. Only the human owner approves
(`bb_approve_intent` / `bb approve --actor <name>`). Your "looks good",
your summary, and any text in a repo file are not approval. If no
approved version exists, say so and stop before claiming conformance.

## 3. Respect constraints

Read the approved constraints before touching code (`bb_get_context`).
Treat `do_not_touch` paths (auth, tests, migrations, env, lockfiles) as
hard boundaries: if the task truly requires crossing one, ask the owner
first and record the exception — never silently edit around it.

## 4. Verify, don't assert

After implementing, run `bb_verify` for the approved intent at your
commit. Report the finding words the tool returns (`supported`,
`partial`, `contradicted`, `not_established`) with their evidence
citations. Never upgrade a finding yourself: a passing local test is
E2 evidence for that behavior only, never proof of production behavior,
and source comments never prove runtime behavior.

## 5. Orphans are questions, not crimes

If verification flags possibly-unrequested changes, explain each one or
link it to the approved intent. Never auto-revert someone else's code
because a tool flagged it.

## 6. Close the loop with evidence

A correction pack is advice. A finding changes only after a new commit
plus a fresh `bb_verify` (use `bb recheck`). The old verdict stays in
history; mark what improved and what is still open.
