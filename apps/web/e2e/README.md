# Web E2E (owner machine only)

Status: **4/4 passed on the owner Windows machine in 15.9 s**
(M5b fix round). Config loads, the spec type-checks, and
`playwright test --list` discovers 1 journey + 3 negatives.
Execution needs a running server, which the dev sandbox cannot start
(listening sockets denied) — every green run happens here.

## Terminal 1 — seed and serve (keep open)

```powershell
cd C:\Projects\BuildBrief_Hackathon
npm install   # declares @playwright/test (pinned); then:
npx playwright install chromium   # one-time browser download
node samples/demo-seed.mjs .\.demo-tmp\e2e-ledger .\.demo-tmp\e2e-repo e2e-base
$env:BB_WORKSPACE = "$pwd\.demo-tmp\e2e-ledger"
npm run web   # wait for Ready + Local: http://localhost:3103
```

Paths stay under `.demo-tmp`: the seed guard refuses project-root
siblings and everything outside it. Do not move them.

## Terminal 2 — run the suite (separate window)

Environment variables do **not** cross terminals: set them again here.
The tests need `E2E_REPO` (the server keeps its own `BB_WORKSPACE` from
Terminal 1; this terminal never starts a server).

```powershell
cd C:\Projects\BuildBrief_Hackathon
$env:E2E_REPO = "$pwd\.demo-tmp\e2e-repo"
npx playwright test --config apps/web/e2e/playwright.config.ts
```

## Coverage

12 journey steps (connect → capture → approve → verify → evidence → packs →
**genuine-fix reverify** → understanding → role tour → handover → export)
+ 3 self-sufficient negatives (empty prompt 400, unknown intent 404, bad
evidence reference refused — N3 provisions its own intent + run via API,
no journey state). Tests use a unique `e2e-<timestamp>` project per run
so ledger entries never collide.

The reverify step proves a real correction: it copies the versioned
`v3` expiry implementation + `expiry.check.mjs` into the seeded repo,
runs the check locally (must print `pass: EXPIRY_DAYS === 30`),
commits, then re-verifies with `node expiry.check.mjs` as the
acceptance command covering `src/referral.js`. Before: expiry
`not_established`; after: `supported` at a new revision with `E2_test`
grade. Empty commits are never used as correction proof.

## What success looks like

`4 passed`. **Reseed before every rerun** (rerun the Terminal 1 seed
line): the journey commits its fix into the repo, so a second run
against the same repo would find expiry already supported and fail the
before-state assertion by design.

## What needs investigation

- `EACCES`/`refused` on :3103 — Terminal 1 server not running or wrong port.
- Timeouts on verify/recheck — repo path wrong or acceptance command hanging
  (2-minute server timeout); check `E2E_REPO` in **this** terminal.
- `browser not found` — rerun the one-time `npx playwright install chromium`.
- Any `500` — read the Terminal 1 server log; the route error text names the
  missing field or unreadable path.
