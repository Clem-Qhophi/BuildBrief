# Build Brief — submission

## Problem

AI coding agents write code faster than humans can verify it. The owner asked for
X; the agent implemented something adjacent; nothing records what was approved,
what the code actually establishes, or what is still open. Existing tools review
code in isolation — none of them keep the persistent, evidence-backed link
between human intent, implementation, correction, and understanding.

## Solution

Build Brief is an intent-to-implementation intelligence loop:
capture the owner's exact request, extract draft requirements, obtain explicit
human approval, verify the approved contract against revision-pinned code
evidence, flag possibly-unrequested changes, produce bounded correction briefs,
re-verify after the patch, and teach the team with grounded explanations and
quizzes. The defensible core is the verification engine: deterministic evidence
collection first, model interpretation second, every verdict citing its revision
and spans — uncertainty defaults to `not_established`, never to green.

## Meta technology (substantive, not decorative)

- `muse-spark-1.3` (Standard mode) proposes verdicts over allowlisted evidence
  excerpts via structured JSON output; a mechanical adjudicator re-validates
  every citation before any verdict stands. See `docs/MODEL_DISCLOSURE.md`.
  Rules-first by default; Meta runs only when explicitly selected with a key.
- Native Muse Code integration: project skill, stdio MCP server (`bb_*`
  tools), hook handlers for prompt capture and constraint guarding, plus
  `handlers/bb-hook.js` (normalize + controlled gate, advisory by default)
  and `bb init` (inspect-only wiring report for muse/codex/claude).

## Original work

Ledger schema and hash-chained event log, citation resolver, adjudicator with
tier gating (source ≠ test ≠ staging ≠ production), reverse-check with
human-disposed orphans, correction packs, quiz generation with mechanical
locate grading and auto-retire, role tours, Quiz Studio (`/quiz`), Agent
Activity (`/activity`, `bb init`), Release Readiness (`/readiness`),
adaptive intake engine + acceptance compiler (`packages/planning`), A/B
harness (`npm run test:ab`), workbench UI, and a 22-case seeded benchmark
with measured precision/recall. Full tree is new code except the research
PDFs under `docs/research/` (2 comparative + 3 strategy/audit sources).

## Original work

Ledger schema and hash-chained event log, citation resolver, adjudicator with
tier gating (source ≠ test ≠ staging ≠ production), reverse-check with
human-disposed orphans, correction packs, quiz generation with mechanical
locate grading and auto-retire, role tours, workbench UI, and a 22-case
seeded benchmark with measured precision/recall. Full tree is new code except
the two research PDFs under `docs/research/`.

## Run it (under 5 minutes)

```sh
npm install && npm run build
npm test            # 98 unit + 14 hook-handler checks
npm run test:eval   # 22 dev + 6 holdout + 2 documented gaps (JS/TS + Python)
npm run test:ab     # 3 assisted-vs-baseline tasks, honest table (turns unmeasured)
```

Live loop: [`samples/referral-demo/DEMO.md`](../samples/referral-demo/DEMO.md).
Web workbench: [`apps/web/README.md`](../apps/web/README.md).
Timed runbook: [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md).

## Links

- Canonical spec: [`MASTER_BLUEPRINT.md`](../MASTER_BLUEPRINT.md)
- Architecture / decisions / progress: [`ARCHITECTURE.md`](ARCHITECTURE.md),
  [`DECISIONS.md`](DECISIONS.md), [`PROGRESS.md`](PROGRESS.md)
- Limitations (read before judging): [`FAILURE_CASES.md`](FAILURE_CASES.md)
- Privacy: [`PRIVACY.md`](PRIVACY.md)
