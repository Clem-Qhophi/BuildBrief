# Referral demo — scripted vertical slice (blueprint §7.1)

Seeded faults: v2 implements generation + 20% credit but **no 30-day expiry**, and
touches `src/auth.js` without authorization. v3 adds the expiry (the "agent patch").
Expiry flips `not_established` to `supported`; the auth orphan stays for human disposition.

Run from the repo root (`BB` = `node packages/cli/dist/src/main.js`). Use any
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
