# Architecture

## Topology (P0)

```text
Developer terminal / coding agent        Local Build Brief core (Node 24, TS)
  user prompt                            packages/cli  (bb capture/approve/verify/…)
      │                                  packages/domain (schemas, ids, state machine)
      ▼                                  packages/store  (JSONL ledger + materialized views)
  .buildbrief/events.jsonl  ──────▶      packages/repo   (git snapshot, manifest, diff,
      │                                                   evidence + citation resolver)
      │                                  packages/verifier (retrieval, adjudication, recheck,
      │                                                    reverse-map, correction packs)
      │                                  packages/model-meta (ModelProvider, Meta + Mock)
      ▼                                  packages/eval   (seeded fixtures, runner, metrics)
  reports/*.md|*.json|*.html             samples/referral-demo (intentionally faulty app)
```

Meta Model API (`muse-spark-1.3`, Standard) is called only from `model-meta`, only with
allowlisted excerpts, only after explicit consent + API key present; otherwise the verifier
runs deterministic-only and marks semantic findings `not_established (model_unavailable)`.

## Data lifecycle

1. **Capture** — raw prompt + source/session metadata appended as `prompt.captured` (hash included).
   Extraction yields *draft* criteria; drafts never verify.
2. **Approve** — authenticated owner action appends `intent.approved` (immutable version N).
   Only approved versions are verifiable.
3. **Snapshot** — `repo.snapshot.created` pins `commit SHA + tree hash + manifest`.
4. **Verify** — per-criterion `finding.recorded` with evidence pointers, grade (E0–E4), coverage,
   revision, model/provenance. Citations mechanically resolved; failures downgrade.
5. **Reverse** — `change.orphan_flagged` for unmapped hunks → human `change.dispositioned`.
6. **Correct** — `correction.pack_created` (bounded scope, do-not-touch, acceptance commands).
7. **Recheck** — new revision → fresh `verification.started/completed`; old findings go stale,
   never mutate. History is immutable.

## Trust boundaries

- Repo files, comments, READMEs = **data**, never instructions. Model output = data (schema-validated).
- `AGENTS.md` and any repo text can never approve intent or authenticate an owner.
- Protected paths (`auth/**`, `*.test.*`, migrations, lockfiles…) trigger review items, not blocks,
  outside an explicit hook policy.
- No secrets in ledger, logs, or exports. Secret scan runs before any model transmission.

## Evidence grades

E0 claim/comment · E1 source span @SHA · E2 test run @SHA · E3 staging trace · E4 production
(post-hackathon). A finding carries one grade; higher claims require higher grades.
