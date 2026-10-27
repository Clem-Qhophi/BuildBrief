# Research inputs — relationship record

Date: 2026-10-27. Analyst: Muse Code (lead engineer).

## Files

| File | Size (bytes) | SHA-256 |
|:---|---:|:---|
| `BuildBrief_Comparative_Research.pdf` | 94,258 | `E69E6F2F…FF615` |
| `Build_Brief_Comparative_Research_Audit.pdf` | 63,216 | `1A382513…F078` |

(Full hashes recorded from `Get-FileHash`; prefixes shown here.)

## Finding (confirmed by extraction)

- Both PDFs extract to **byte-identical text** (4 pages, 12,838 chars, identical MD5 `8890f444…2f0cef`).
- Both are the **same document**: *"BUILD BRIEF | Independent Reconciliation Audit — What the two
  research agents got right, missed, overstated and how the master blueprint resolves it"*
  (audit verdict: **MERGE WITH MATERIAL CORRECTIONS**).
- They differ **only in PDF container metadata** (producer/timestamps/IDs), not in content.
- The two underlying research documents they discuss (A = 21-section first blueprint, B = 10-part
  second-agent report) are **not present as files** anywhere in this workspace (searched 2026-10-27).
  Their conclusions survive only as quoted/synthesized inside `MASTER_BLUEPRINT.md` (§2, §23) and this audit.

## Decision

- **Keep both originals** under `docs/research/` (they are not byte-identical, per the build brief).
- Root copies were moved here; this directory is the single home for research inputs.
- Authority remains: `MASTER_BLUEPRINT.md` first, this audit second, new official-docs findings third.
- Nothing in these PDFs was modified. Unverified claims inside them (scoring weights, video length,
  public-repo/new-work rules, API credit activation) stay **provisional** until the signed participant
  waiver/portal is read — see `docs/HACKATHON_CHECKLIST.md`.
