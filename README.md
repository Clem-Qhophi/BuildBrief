# Build Brief — know what your AI built

Intent-to-implementation intelligence: capture what the owner approved, verify it
against revision-pinned code evidence, flag possibly-unrequested changes, produce
evidence-backed fix briefs, and reverify after the patch. Full vision and authority:
[`MASTER_BLUEPRINT.md`](MASTER_BLUEPRINT.md).

> Status (2026-10-27): working P0 vertical slice via CLI + deterministic benchmark.
> Meta `muse-spark-1.3` provider is implemented against validated official docs;
> live calls need `BB_META_API_KEY` (see `.env.example`). No fake metrics anywhere:
> numbers below are measured by `npm run test:eval`.

## Quick start (Windows / macOS / Linux, Node ≥ 22)

```sh
npm install
npm run build
npm test            # 42 unit tests (incl. MCP protocol + hook handlers)
npm run test:eval   # 22 seeded cases: 16 dev + 4 holdout + 2 documented gaps
```

## The loop (5 minutes)

```sh
BB="node packages/cli/dist/src/main.js"
$BB capture --project demo --feature referral --prompt "Add referral codes. Codes expire after 30 days. Do not modify authentication."
$BB approve --project demo --intent <ID> --actor you
$BB verify --project demo --intent <ID> --repo <REPO> [--base <SHA>] [--provider rules|mock|meta]
$BB fix --project demo --run <RUN_ID>     # bounded correction pack, never a patch
# ... agent implements, commits ...
$BB recheck --project demo --intent <ID> --repo <REPO>   # fresh verdicts, old findings go stale
```

Scripted demo with seeded faults: [`samples/referral-demo/DEMO.md`](samples/referral-demo/DEMO.md).

## Layout

- `packages/domain` — vocabularies, intent lifecycle, citation resolver, adjudicator
- `packages/store` — append-only JSONL ledger + materialized views (upgrade path: SQLite)
- `packages/repo` — git adapter, manifest/ignore/secret handling, snapshots, test-run records
- `packages/model-meta` — typed provider; `MetaApiProvider` (Standard, structured JSON) + `MockProvider` + `RuleAssessor` fallback
- `packages/verifier` — retrieval, assessment, reverse-check, correction packs, reports
- `packages/cli` — `bb` command surface
- `packages/mcp` — stdio MCP server (`bb_*` tools delegate to the tested CLI)
- `packages/muse` — hook handlers, skill source, hooks research notes
- `packages/eval` — seeded fixtures, labels, runner, metrics (no hand-edited scores)
- `samples/referral-demo` — faulty demo app (v1 base, v2 fault, v3 fix)
- `docs/` — plan, architecture, decisions, progress, risks, hackathon checklist, roadmap

## Guarantees and limits

- Verdicts: `supported | partial | contradicted | not_established | not_applicable`.
  `missing` is a UI-only label for exhaustive-scope absence. Uncertainty defaults to
  `not_established`, never to green.
- Orphan hunks are **possibly unrequested** (human disposes), never "malicious".
- A correction pack is advice; only a new revision + fresh verify closes a finding.
- E1 source ≠ E2 test ≠ E3 staging ≠ E4 production. Source comments never prove runtime.
- Ledger (`.buildbrief/`) is git-ignored; secrets never enter evidence sent to a model.

## Docs

[`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) ·
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) ·
[`docs/DECISIONS.md`](docs/DECISIONS.md) ·
[`docs/PROGRESS.md`](docs/PROGRESS.md) ·
[`docs/KNOWN_ISSUES.md`](docs/KNOWN_ISSUES.md) ·
[`docs/HACKATHON_CHECKLIST.md`](docs/HACKATHON_CHECKLIST.md) ·
[`docs/roadmap.md`](docs/roadmap.md)
