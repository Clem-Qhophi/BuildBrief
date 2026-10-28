# Failure cases and limits (read before judging)

What Build Brief demonstrably gets wrong or cannot do yet. Each item is
reproducible in this repo; none is hidden behind a passing headline metric.

## Documented engine gaps (in the benchmark)

- `gap-comment-mirage`: a TODO comment containing all operative words yields
  false `supported` confidence. The lexical assessor trusts comments.
  Recorded as a known-gap probe, excluded from release metrics.
- `gap-vocabulary-miss`: behavior implemented with wholly different vocabulary
  (TTL constant + `alive()` instead of "expiry days") is missed entirely.
  Recorded the same way.
- Intended fix for both: real-model adjudication over the same evidence
  (P1); the provider path exists, the measurement does not yet.

## Unverified integrations (built, not proven live)

- `.muse/hooks.json` firing: no candidate shape fired under `muse exec`
  (empirical log: `packages/muse/HANDLERS.md`). Template ships UNVERIFIED.
- Workbench browser render: `next build` green and data layer probed, but no
  live HTTP check was possible in this sandbox. First open is the smoke test.
- Meta live calls: zero made (no key). `--provider meta` fails loudly without
  one, by design.

## Scope limits (by design, v1)

- Single-language lexical retrieval; no semantic search, no dataflow analysis.
- CLI extraction is coarse: no negative criteria, `forbidden_terms`, or
  `requires_tier` from raw prompts (eval constructs them directly).
- Quiz auto-grading covers `locate` only; open answers need humans.
- Comprehension Map deferred until real quiz data accumulates (shows
  `Unmeasured`, never invented colors).
- Benchmark: 30 seeded cases (JS/TS + Python), one repo shape each — a controlled check, not a
  real-world accuracy claim. Precision/recall 1.00 describe this fixture set.

## What would change our claims

A live Meta run, an interactive hook-firing test, a browser render pass, and a
second-language eval set. Until then, the claim is: a working core with honest
boundaries, not a finished platform.
