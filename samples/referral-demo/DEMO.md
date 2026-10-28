# Referral demo — scripted vertical slice (blueprint §7.1)

Seeded faults: v2 implements generation + 20% credit but **no 30-day expiry**, and
touches `src/auth.js` without authorization. v3 adds the expiry (the "agent patch").
Expiry flips `not_established` to `supported`; the auth orphan stays for human disposition.

Run from the repo root (`$BB` = `packages/cli/dist/src/main.js`). Use any
empty ledger directory so the demo never pollutes this repo.

```powershell
$demo = Join-Path $env:TEMP 'bb-demo-repo'
$ledger = Join-Path $env:TEMP 'bb-demo-ledger'
Remove-Item -Recurse -Force $demo, $ledger -ErrorAction SilentlyContinue
New-Item -ItemType Directory "$demo", $ledger | Out-Null

# base commit (v1) + faulty feature commit (v2)
Copy-Item samples/referral-demo/v1/* $demo -Recurse
git -C $demo init -q; git -C $demo config user.email demo@bb; git -C $demo config user.name bbdemo
git -C $demo add -A; git -C $demo commit -qm base
$base = git -C $demo rev-parse HEAD
Copy-Item samples/referral-demo/v2/* $demo -Recurse -Force
git -C $demo add -A; git -C $demo commit -qm feature

# capture -> approve -> verify -> fix brief
Set-Location $ledger
node $BB capture --project demo --feature referral --prompt 'Add referral codes with 20 percent credit on first invoice. Codes expire after 30 days. Do not modify authentication.'
node $BB list --project demo
# note the intent id, then:
node $BB approve --project demo --intent <ID> --actor owner1
node $BB verify --project demo --intent <ID> --repo $demo --base $base --format md --out report1.md
# expect: partial (credit) + not_established (expiry) + orphan [critical] src/auth.js
node $BB fix --project demo --run <RUN_ID>

# agent patch (v3) -> recheck: expiry must flip to supported, old findings go stale
Copy-Item samples/referral-demo/v3/* $demo -Recurse -Force
git -C $demo add -A; git -C $demo commit -qm 'add expiry'
node $BB recheck --project demo --intent <ID> --repo $demo --base $base --format md --out report2.md
```

Verified 2026-10-27: expiry `not_established` -> `supported` across revisions;
2 old findings invalidated; auth orphan persists for human disposition.

## MCP-driven variant (M2, verified 2026-10-28)

`mcp-loop.mjs` drives the real stdio MCP server through the same loop
(capture -> list -> approve -> verify -> fix); finish with `bb recheck`:

```powershell
node samples/referral-demo/mcp-loop.mjs <ledger-dir> <repo-dir> <base-sha>
# apply v3, commit, then the printed `node packages/cli/... recheck ...` command
```

## Understanding Studio slice (verified 2026-10-28)

On the v2 (faulty) revision, after verify:

```powershell
$BB = 'packages/cli/dist/src/main.js'   # repo root; run from the repo root
node $BB explain --project demo --intent <ID> --run <RUN>
node $BB quiz --project demo --intent <ID> --run <RUN> [--repo <dir>]
node $BB answer --project demo --quiz <QID> --actor learner1 --text "src/referral.js lines 1 to 3"
node $BB grade --project demo --response <RID> --grade pass --by owner1   # predict/explain only
node $BB tour --project demo --intent <ID> --run <RUN> --role marketing
```

Locate answers grade mechanically; open answers stay pending for a human.
`quiz --repo` retires stored questions whose evidence moved (shown live:
2 retired after the v3 patch).

## Provenance labels (read the demo honestly)

- Findings marked `[rules/rules-v1]` are DETERMINISTIC (lexical assessor +
  mechanical adjudicator, $0). Findings marked `[meta/muse-spark-1.3]` would be
  LIVE AI findings (model proposes, adjudicator still gates every citation).
- v1/v2/v3 file sets are SEEDED test conditions, not organic agent output.
- The auth bypass edit is a SEEDED fault standing in for unrequested drift.
