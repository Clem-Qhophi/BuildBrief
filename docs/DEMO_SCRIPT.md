# Live demo script (~10 minutes, fully reproducible)

Setup (once): `npm install && npm run build`. Scratch dirs keep the repo clean.
All commands below were executed live during development; expected outputs are
quoted from real runs. Seeded faults are labeled as such — see Provenance.
Pre-show option: build a second scratch pair (`$demo2`/`$ledger2`/`$base2`)
with the same v1/v2 steps for the MCP variant (it captures its own intent).

## 0:00–1:30 — The problem (talk, no typing)

"Agents write code faster than we can verify it. Show of hands: who has merged
AI-written code they couldn't fully vouch for? Build Brief closes that gap:
approved intent, revision-pinned evidence, grounded verdicts, correction, and
re-verification — then it teaches the team what changed."

## 1:30–4:30 — CLI loop (the core)

```powershell
# setup: scratch repo (v1 base, v2 faulty: no expiry + auth tweak) + scratch ledger
$root = '<repo-root>'; $demo = Join-Path $env:TEMP 'bb-demo-repo'; $ledger = Join-Path $env:TEMP 'bb-demo-ledger'
Remove-Item -Recurse -Force $demo, $ledger -ErrorAction SilentlyContinue
New-Item -ItemType Directory $demo, $ledger | Out-Null
Copy-Item $root/samples/referral-demo/v1/* $demo -Recurse
git -C $demo init -q; git -C $demo config user.email demo@bb; git -C $demo config user.name bbdemo
git -C $demo add -A; git -C $demo commit -qm base
$base = git -C $demo rev-parse HEAD
Copy-Item $root/samples/referral-demo/v2/* $demo -Recurse -Force
git -C $demo add -A; git -C $demo commit -qm feature
$BB = Join-Path $root 'packages/cli/dist/src/main.js'
Set-Location $ledger   # the CLI keeps its ledger in the working directory
node $BB capture --project demo --feature referral --prompt 'Add referral codes with 20 percent credit on first invoice. Codes expire after 30 days. Do not modify authentication.'
# expect: captured bb_intent_* — 2 draft criteria, 1 constraint (state: draft, NOT approved)
node $BB approve --project demo --intent <ID> --actor <you>
node $BB verify --project demo --intent <ID> --repo $demo --base $base
# expect: [partial] credit, [not_established] expiry, orphan [critical] src/auth.js
```

Say: "Partial, not green. Missing proof is listed, not hidden. The auth edit is
flagged as *possibly unrequested* — a question for a human, never an accusation."

## 4:30–6:00 — Correction and re-verification

```powershell
node $BB fix --project demo --run <RUN>   # bounded pack: scope, do-not-touch, verify-after
# apply the v3 patch (adds expiry), commit:
Copy-Item $root/samples/referral-demo/v3/* $demo -Recurse -Force; git -C $demo add -A; git -C $demo commit -qm 'add expiry'
node $BB recheck --project demo --intent <ID> --repo $demo --base $base
# expect: expiry flips to [supported]; 2 old findings invalidated; auth orphan persists
node $BB autopsy --project demo --intent <ID>
# expect: credit dissected over 2 partials (Observed / Plausible causes / Unknowns + next prompt); expiry refused (1 failure → bb fix)
```

Say: "The finding changed only because fresh evidence at a new revision
established it. History is immutable — the old verdict is still there, marked stale."

## 6:00–7:30 — Integration: MCP + Understanding Studio

```powershell
Set-Location $root
node samples/referral-demo/mcp-loop.mjs <ledger2> <repo2> <base2>  # same loop over JSON-RPC
Set-Location $ledger
node $BB explain --project demo --intent <ID> --run <RUN>
node $BB quiz --project demo --intent <ID> --run <RUN> --repo $demo
node $BB answer --project demo --quiz <Q> --actor you --text "src/referral.js lines 1 to 6"
# expect: graded pass by bb-locate-v1 (mechanical); predict answers stay pending for humans
node $BB tour --project demo --intent <ID> --run <RUN> --role marketing
node $BB map --project demo --intent <ID>
# expect: demonstrated cells for answered criteria; pending where a human grade is outstanding
```

Say: "Locate questions grade themselves against evidence spans. Open questions
wait for a human — no model grades, no pseudo-scores. Marketing gets unknowns,
not invented pricing."

## 7:30–9:00 — Workbench + benchmark

```powershell
Set-Location $root
$env:BB_WORKSPACE = $ledger; npm run web   # open http://localhost:3103 (stop with Ctrl+C)
npm run test:eval
# expect: dev 22/22, holdout 6/6, verdicts P/R 1.00, orphans P/R 1.00, 2 gaps documented
```

Say: "The dashboard reads the same ledger — no separate backend to drift. The
benchmark is seeded and small; we report it as a controlled check, never as
real-world accuracy. Two known gaps are documented, not hidden."

## 9:00–10:00 — Close

"What you saw is real: every verdict cited its revision and line spans. What is
planned — GitHub checks, CI gates, multi-tenant cloud — is in the roadmap, not
in the demo. The vision is a developer platform; today you saw its working core."

## Fallbacks

- No network: everything except Meta live calls runs fully offline
  (deterministic `rules` provider). Say so; it is a feature.
- Web port busy: `$env:PORT = '<free-port>'; npm run web`.
- If any live command fails: `eval-results/` holds the last full benchmark JSON;
  `samples/referral-demo/DEMO.md` replays the loop step by step.
