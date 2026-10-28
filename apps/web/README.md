# Build Brief workbench (web)

Thin read-only-ish reader over a real Build Brief ledger. No new verdict logic,
no new database: pages render `.buildbrief/events.jsonl`, materialized views,
and stored reports. Writes are limited to owner approval and orphan disposition,
which append the same ledger events the CLI writes.

## Start

```powershell
cd C:\Projects\BuildBrief_Hackathon
npm run build
$env:BB_WORKSPACE = '<your-project-with-a-ledger>'
npm run web
```

Then open http://localhost:3103 in your browser. The server binds loopback
only (mutation APIs have no auth — never expose it beyond your machine).

## Full loop in the browser (M4a)

`/new` captures a draft (project + local repo path + feature + prompt) →
approve on the intent page → Verify now → inspect spans on the run page →
Generate correction packs → patch the repo → Re-verify → before/after runs
with old findings stale. Same ledger and engine as the CLI; no new verdict
logic. Provider select defaults to deterministic `rules` (offline); `meta`
needs `BB_META_API_KEY` in the server environment and fails loudly without it.

## Understanding + evidence (M4b)

The run page carries an Understanding Studio section: grounded explanation,
role tours (engineer/founder/marketing/qa), and quiz generation with answers
(locate grades mechanically, open answers wait for a human grader). Every
evidence span links to `/evidence`, which shows the source at the cited
revision with a snippet-hash check (secret-adjacent files withheld by path).
`/settings` reports connection status read-only; the key is never displayed.

## Threat model (M4e)

Local-only by binding: dev/start listen on 127.0.0.1. There is no login —
anyone who can reach the port can read the workspace ledger and run
verification/commands against local paths. Never remove the loopback bind
without adding authentication. `repo` parameters accept any local directory
the server user can read (that is the operator's own trust boundary);
evidence paths are traversal-checked, secret-adjacent files are withheld by
path, and rendered excerpts are size-capped.

## Acceptance tests (M4c)

The verify and recheck forms accept an optional acceptance command (runs in
the repo on your explicit submit, 2-minute timeout) plus covers paths. The
run is recorded in the report: passing runs upgrade matching evidence to
E2_test; the run page shows the runs table and per-evidence test-backed
markers, and `/evidence` names the covering run. Without a command, grades
rest on source evidence alone — and the UI says so.

## One-minute demo ledger

```powershell
# in a scratch dir with a git repo that has base + feature commits:
bb capture --project demo --feature referral --prompt '...'
bb approve --project demo --intent <ID> --actor you
bb verify --project demo --intent <ID> --repo <REPO> --base <SHA>
$env:BB_WORKSPACE = '<that scratch dir>'; npm run web
```

## Verification status (2026-10-28)

- `npm run web:build`: passes (all routes type-check).
- Data layer probed against a real demo ledger: 1 intent, 2 findings, 1 orphan,
  1 report — all read correctly.
- Live HTTP render: VERIFIED by owner on 2026-10-28 (intent ledger + intent
  detail with stale/fresh findings render correctly from the reset-ledger).
  Sandbox serves remain unverifiable here (listening sockets denied with
  EACCES, even loopback) — future UI changes still need an owner eyeball.
  Report any render error back and it becomes a bug, not a claim.
