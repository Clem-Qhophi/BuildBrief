# BuildBrief — Master Upgrade Plan (reconciled)

Status: governing execution plan for the v2 upgrade, 31 Oct 2026.
Sources: `docs/research/source/` (three owner-provided PDFs; hashes in its
README). Authority: `AGENTS.md` > `MASTER_BLUEPRINT.md` > `docs/DECISIONS.md` >
this plan > source PDFs. Conflicts resolved here are recorded as ADRs in
`docs/DECISIONS.md`; historical ADRs are never rewritten.
Progress: `docs/IMPLEMENTATION_TRACKER.md` (updated after every task).

## 1. Locked decisions

- **Interaction: BOTH.** Alongside the user's existing coding agent first;
  inside BuildBrief later only via a stable SDK/App Server. Never build an
  IDE/editor/terminal or a home-grown coding agent.
- **Execution: HYBRID, local-first.** Repo access, source and deterministic
  checks stay local. Cloud is opt-in, per-project, field-visible, and behind
  a post-hackathon gate (the app is loopback-only and unauthenticated today
  and stays that way until auth + tenant isolation exist).
- **Market: BOTH.** Founders and developers, role-adapted views, one shared
  intent/evidence truth — presentation mappings, never conflicting copies.
- **Approach: evolve, never rewrite.** Preserve the ledger, approval model,
  verifier, correction packs, autopsy, understanding/quiz, MCP, CLI, Muse
  hooks and web app. Nothing is deleted until the baseline audit classifies
  it and the owner approves.
- **Model agent: Meta API** behind `ModelProvider` (rules = default and
  offline, mock in tests). Credentials only via environment
  (`BB_META_API_KEY`, fallback `MODEL_API_KEY`; optional `BB_META_MODEL`,
  `BB_META_BASE_URL`). Never in UI storage, forms that persist it, logs,
  ledger, prompts, commits or reports — report presence/absence, model id,
  latency, token usage and outcome only. No live paid call without the
  owner's explicit go-ahead in that session; then exactly one minimal
  validation call first.
- **No pricing/billing in the UI** for this release (hackathon). Pricing is
  a post-hackathon economics discussion only.
- **Quiz:** grounded only in the owner's stored reports. Per-feature, by
  category (locate / predict / explain_back), general-mixed. No invented
  questions, no guessed comprehension score.

## 2. Pre-made rulings (from the audited synthesis; re-open only on new evidence)

| Verdict | Items |
| --- | --- |
| KEEP | Owner-approved intent contract + immutable versioning (raw request, AI draft, owner edits, approvals as separate records); adaptive clarification (ranked, recommended, custom/defer/decide-for-me); acceptance-check compiler (deterministic first); MCP + hooks + localhost dashboard three-tier UX; portable contract in `.buildbrief/`; tiered monitoring; measured A/B evaluation. |
| ADAPT | Stop-gate blocks **only** on explicit owner-approved hard constraints or reproducible deterministic failures, max 3 loops, human override with recorded reason; model verdicts are advisory. Cross-agent support starts with **two** adapters, each with a per-installed-version capability manifest. Comprehension/quiz: grounded explanations only, no invented scores. |
| DEFER | Screenshot-to-visual-diff (advisory-only later); embedded in-BuildBrief agent; cloud sync/accounts/teams; pricing/billing. |
| REJECT | Fine-tuning a custom model; LLM judging every file edit; "catches everything" guarantees; replacing the JSONL ledger with SQLite (ADR-002 stands); building an IDE; native mobile app; 3D-first UX. |

Research statistics in the source PDFs (clarification benchmarks, competitor
claims, Muse Spark pricing) are **unverified input**: preprints and
third-party summaries. Verify against primary sources before quoting them
in any pitch, README or UI copy. The executing agent's capability claims
come only from its own probes (Section 5).

## 3. Deductions this plan is built on

1. Clarification helps only when questions are answerable → product facts
   first, technical choices last with repo-detected defaults; every question
   carries a recommendation, a one-line trade-off, custom answer, "not
   sure", "decide later", and "let BuildBrief decide" (reversible only).
2. Intent capture can be wrong → approval is a hard gate with a named human
   actor; amendments create new versions. No agent self-approval, ever.
3. Agents differ in hooks/elicitation/approvals → adapter capability
   manifests per installed version; three UX tiers (native form → numbered
   text → dashboard); unverified capabilities labelled unverified everywhere.
4. Hooks get lost; sessions crash → Git-diff reconciliation at session end;
   capture gaps displayed, never rendered as "nothing happened".
5. Models can fabricate citations → deterministic checks first; model only
   for unresolved semantics; every citation mechanically re-validated
   (path/line/hash); model output is assessment, not proof.
6. Four days + a working system → additive scope only, binding cut lines
   (Section 10), feature freeze Nov 3 12:00, submit Nov 4 18:00 GMT.
7. The same evidence serves both audiences → plain language first,
   technical detail behind "View evidence"; controlled verdict vocabulary
   (`supported|partial|contradicted|not_established|not_applicable`) stays
   exact in technical views.

## 4. Phase 0 — Baseline audit and freeze (blocks everything)

The executing agent's first deliverable contains **no code**:

1. Exact Git state. The owner commits/tags the current restored+fixed tree
   from their own shell (rollback point). Agent never commits, never
   `git add -A`, never resets/checkouts/cleans.
2. Capability matrix — every current capability classified
   working / partial / broken / untested with proving test/screen. Minimum
   rows: capture (`/start`, `/new`, MCP, Muse capture hook), approval &
   versioning, verify (rules/mock/meta paths), acceptance commands &
   recorded test runs, orphan triage & disposition, correction packs,
   prompt autopsy, recheck, evidence viewer, handover/role tours,
   explanation + quiz + comprehension map, **exact current MCP tool
   inventory** (names as implemented — never assumed), CLI surface, GitHub
   import, ledger export, settings/provider status.
   Verified baseline at plan time (re-verify before relying on it):
   Oct 30 landing ("Keep your idea in the picture.", TraceAtlas evidence
   map); gates green — `npm run build`, `npm test`, `npm run test:eval`
   (22/22 dev + 6/6 holdout + 2 documented gaps), `npm run web:build`,
   web+HTTP 24 pass / 1 skipped, Playwright 13 + responsive 2
   (`--workers=1`, fresh-seeded fixtures).
3. Reconciliation of M4e/M5/M5c reports and ADRs against today's code;
   discrepancies listed, none silently fixed.
4. Gate: full battery green (Section 11 protocol) or pre-existing failures
   explicitly logged in the tracker.

## 5. Phase 1–2 — Domain contracts, then capability verification

**Contracts (additive; old ledgers/reports must still load — compatibility
tests with existing fixtures mandatory).** Extend `packages/domain` /
`packages/store`; do not create a parallel contract store:

- `ClarificationQuestion { id, layer: product|boundary|quality|technical,
  text, why_it_matters, options[{label, tradeoff, recommended}],
  allow_custom, allow_defer, allow_decide_for_me, source, status }`
- Decision records as ledger events (question, choice/custom text,
  `source: user|default|custom`, actor, timestamp).
- `AcceptanceCheck { id, intent_version_id, criterion_id,
  type: test|build|lint|path|http|model, command?, expect?,
  protected_path?, status: pending|pass|fail|skipped|unverifiable,
  revision, evidence_ids, last_run_at }`, each labelled deterministic or
  model-judged.
- `CapabilityManifest { provider, provider_version, transport,
  events{...: synchronous|asynchronous|unavailable},
  elicitation: native|text|none,
  enforcement: advisory|blocking|unsupported,
  approvals: supported|unsupported, probed_at }`
- `AgentSession` / `AgentEvent` (normalised: session_started,
  prompt_submitted, tool_proposed, permission_decided, tool_completed,
  file_changed, command_run, test_completed, turn_ended, session_ended;
  each with `captured_via: hook|git-reconcile|manual`).
- `GateRecord { loops (cap 3), disposition:
  advisory|blocked_deterministic|override, override_reason?, actor }`.
- Finding model unchanged in spirit: verdict kept separate from evidence
  grade (E0–E5), coverage, freshness, severity, owner disposition.

**Capability verification (before any adapter code).** For each agent
actually installed (Muse Code first — Meta tooling weight — then Codex
and/or Claude Code as present): register throwaway logging hooks, record
actual payloads under `.demo-tmp/hook-probes/`; confirm empirically which
events fire, whether a stop hook can block and return a reason, whether
MCP elicitation renders, and what environment hooks inherit (secrets
strategy depends on it). Mock-first Meta path; the single live smoke call
only per Section 1 rules. Publish the real matrix as a new ADR.
**Cut line:** no native questionnaire anywhere by end of Oct 31 → text +
dashboard tiers ship; elicitation debugging stops.

## 6. Phase 3–4 — Adaptive intake and the acceptance compiler

- One clarification engine shared by web, MCP and CLI (suggested
  `packages/planning`, pure/deterministic, project references wired).
  Candidates come from the raw idea + repo facts; the repo already answers
  stack/tests — never ask those. Ranking: impact × ambiguity ×
  answerability × (1/reversibility), dependencies and irreversible choices
  first. First pass targets 3–6 questions; exceeding it must be explained
  in the UI.
- Delivery tiers, one engine: MCP elicitation (only where Phase 2 proved
  it) → numbered text via the agent (extend MCP additively — existing tool
  names keep working) → web questionnaire evolving `/start` (existing
  labels/flows that tests assert are preserved; tests change only where
  behaviour genuinely improves).
- The intent page becomes the contract card: goals, criteria,
  constraints/protected paths, non-goals, assumptions (with source),
  unresolved questions, compiled checks. Approve / Edit / Add with a named
  human approver.
- **Compiler:** on approval, map criteria to checks in order — recorded
  acceptance command → `test`; detected build/lint/typecheck conventions →
  `build`/`lint`; negative/protected criteria → `path` rules (reusing
  existing sensitive-path logic). `http`/`model` checks are stretch; build +
  test + path is a sufficient exit (cut line). Checks persist as
  AcceptanceCheck records, shown on the contract as "How this will be
  checked", revision-pinned and reproducible (extend recorded-test-run
  storage, don't duplicate it).
- Acceptance: 5 greenfield + 5 existing-repo scenarios yield useful,
  non-redundant questions; approving the seeded referral intent compiles
  ≥1 test check + ≥1 path check with identical results across two runs at
  one revision; existing Playwright journey still passes.

## 7. Phase 5 — Adapters, monitoring, controlled gate, activity

- Extend `packages/muse` as adapter #1 (capture/guard handlers and tests
  exist); add a shared normaliser + capability types only where reuse
  demands it. One `bb-hook` CLI: provider hook JSON in → AgentEvents +
  decision JSON out (allow / block-with-reason / add-context). Second
  adapter (whichever of Codex/Claude Code verified) must carry the **same
  contract** across agents — the portability proof.
- Tiers: PreToolUse → protected-path guard (blocking only for
  owner-approved protected paths and only where blocking was proven;
  otherwise advisory and labelled advisory). PostToolUse → relevant
  deterministic checks. Turn end → acceptance checks + one bounded,
  schema-validated semantic verdict (citations re-checked mechanically) +
  orphan scan.
- Gate: pass → open; deterministic critical failure / protected-path
  violation → block with autopsy fix prompt (goal, failing check, evidence,
  prior attempts, constraints), loop counter increments, **hard cap 3**,
  then human: override (GateRecord with reason) / edit contract (new
  version) / abort. Model-only uncertainty → advisory, never a hard block.
- Activity view in the workspace nav on the same event store (server-first;
  SSE only if zero-new-dependency and fully degraded without JS), showing
  capture gaps and reconciliation labels. `bb init`: detects agents,
  registers MCP + hooks, prints exactly what was wired and what could not
  be; idempotent; writes no secrets.
- Acceptance: live protected-path block in the primary agent (or honest
  advisory where unsupported); stop-gate blocks a failing 'done', injects
  the fix, agent passes on recheck; loop cap + override exercised in
  tests; killed session still yields a Git-reconciled timeline with gaps.

## 8. Phase 6 — Project Room, landing, language

Evolve existing routes; no URL renames without redirects:

| Vision | On current routes |
| --- | --- |
| Home / attention queue | `/workspace` + pending decisions, stale verifications, gate state, next action (all ledger-derived) |
| Project Room | `/workspace`, `/run/[id]` + agent connection status from capability manifest |
| Intent / contract | `/intent/[id]`, `/map` |
| Live Build / Activity | new workspace-nav view (Phase 5 events) |
| Assurance | `/runs`, `/run/[id]` + coverage block on every report: criteria inspected/total, files inspected, checks run/skipped, stale evidence, unsupported surfaces, provider+model, revision |
| Changes / Fixes | `/changes`, correction packs, gate loop count, recheck |
| Understand | `/map` + `/quiz` (Section 9) |
| Connections & Settings | `/connect`, `/settings` + verified capability matrix, **BYOK section**: provider status, key presence only, setup instructions (set `BB_META_API_KEY`, restart server), cost/context disclosure. No key is ever accepted into persisted storage. |

**Language pass** on touched primary copy: `not_established` → "We haven't
confirmed this works yet"; `partial` → "Partly implemented"; orphans →
"changed, but not linked to an approved requirement". Verdict words remain
exact in technical views.

**Landing — Gate L (owner approval required, blocks hero changes).** Keep
structure, TraceAtlas visual, labelled seeded example. Agent prepares two
hero screenshot variants: (a) "Keep your idea in the picture." + cross-agent
control-plane subheading; (b) the strategy doc's accountability headline.
Owner picks; no silent swap (this exact failure caused the Oct 31 restore
incident). Sections: problem → how it works (Clarify → Approve → Build →
Observe → Verify → Correct) → real labelled example → works alongside your
agent (verified matrix only) → founder/developer on one truth → trust &
coverage → use cases → FAQ (including what BuildBrief cannot observe) →
CTA. **No pricing section.**

**Founder/Developer modes:** query-param view toggle on workspace/report
pages (existing server-rendered pattern), same data, different density.

Acceptance: scripted first-time-user path reaches an approved brief and can
state what is proven, what is not, and the next action; desktop + 390px +
320px screenshots of every touched page; responsive spec extended to new
routes; quality-gate checklist passes (labels, one h1, focus-visible,
empty states with next action, traced numbers, honest provider naming).

## 9. Phase 7 — Quiz studio, release readiness, A/B evidence

- `/quiz` (AppShell nav "Test yourself"): project summary (features with
  checks, live questions, answered pass/fail/pending — all from
  comprehensionMap / listQuizzes / listResponses, nothing invented);
  **By feature** cards (latest run, status counts, POST generate to
  `/api/quiz`, links to map + run); **By category** (locate auto-graded;
  predict and explain_back wait for human grading — ADR-010); **General
  mixed** (pending questions across features, max 10, linking to each
  run's `#understand`). Pure aggregation helpers in `apps/web/lib/study.ts`
  with maintained tests in `apps/web/test/study.test.mjs`. Intents without
  a run say "Verify this brief first" and link to the intent.
  Features page's Understanding Studio entry links to `/quiz`.
- Release-readiness view per project: checks green/stale/never-run,
  unresolved findings, open gate loops, known limitations, exportable
  evidence report (existing ledger export).
- **A/B harness:** 3 tasks first (invoice app, referral expiry, CSV export
  or rate limiter); 5 only if measured per-run cost allows. Same
  agent/model/config; baseline vs BuildBrief-assisted; record
  turns-to-acceptance, constraint violations, unrequested changes,
  clarification time, tokens/cost. Publish the table whatever it shows.
  A seeded demo is never accuracy evidence.

## 10. Schedule, cut lines, post-hackathon

| When | Must land | Cut line (pre-agreed, apply without debate) |
| --- | --- | --- |
| Oct 31 | Phase 0 audit + owner commit; Phase 2 probes | No native form → text + dashboard tiers |
| Nov 1 | Contracts; intake; compiler (test/build/path) | Compiler emits build+test only — sufficient |
| Nov 2 | Primary adapter + gate; second adapter; coverage; activity | Gate unstable → advisory gate; never fake blocking |
| Nov 3 AM | Landing/room polish; quiz; A/B first results; demo rehearsed twice | **Freeze 12:00.** Drop: map extras → quiz UI (keep API/CLI) → visual extras |
| Nov 4 | Fixes only; private-window link checks; submit 18:00 GMT | Nothing new |

Parallel work packages (no shared files): WP-A domain/store/planning + MCP;
WP-B adapters/hooks/CLI gate; WP-C web; WP-D eval/A/B/demo/docs. Each opens
with a short written plan + assumptions-to-verify.
Post-hackathon (each behind an owner gate): embedded SDK/App Server agent;
cloud sync/accounts/teams after a threat model; advisory screenshot
visual-intent; research-grounded briefs (only if the Meta API's search
offering is verified); pricing/billing after 10–20 repeat users and
measured unit costs.

## 11. Testing protocol (exact)

- Separate real exit codes from pipeline display (redirect to a file, then
  inspect). Full battery: `npm run build`, `npm test`,
  `npm run test:eval`, `npm run web:build` at every phase milestone.
- Web/HTTP tests only against a **disposable** workspace copy on a spare
  port (`BB_WEB_TEST_URL`, `E2E_REPO` set); never the root workspace (they
  mutate the ledger). Playwright from repo root, `--workers=1`, freshly
  seeded `E2E_REPO` (`node samples/demo-seed.mjs`) — a used repo fails by
  design.
- After any `web:build`, **restart** the `next start` server before testing
  (it serves its in-memory build). Kill servers by verified node PID whose
  CommandLine contains `next start`; never by port wildcard.
- PowerShell: `-LiteralPath` for `[id]` paths (brackets are wildcards);
  node for scripts (`python3` is a Store stub; `py` is Python 3.14);
  touch recopied files or `npx tsc -b --force` (stale mtimes skip builds).
- Negative/adversarial coverage is required: fake citation, misleading
  comment, deleted/weakened test, stale evidence, protected-path edit,
  secret introduction, insufficient search (correct verdict:
  `not_established`), missed hook, interrupted session.
- Dead-code rule: `ScrollStory.tsx`, `HomeEvidenceNetwork.tsx`,
  `lib/story.ts` (+ its test) are quarantined, not deleted, until the
  Phase 6 IA decision; the retirement (or re-adoption) is recorded as an
  ADR with owner approval.
