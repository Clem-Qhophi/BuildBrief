---
title: "BUILD BRIEF"
subtitle: "Master Product, Research, Validation and Engineering Blueprint | Version 1.0"
author: "Consolidated from two research documents, earlier project discussions, and primary-source verification"
date: "27 October 2026"
lang: en
geometry: margin=0.78in
fontsize: 9pt
mainfont: "Lato"
colorlinks: true
linkcolor: "0A6F94"
urlcolor: "0A6F94"
toc: true
toc-depth: 2
numbersections: false
header-includes:
  - \usepackage{fancyhdr}
  - \pagestyle{fancy}
  - \fancyhead[L]{\small Build Brief | Master Blueprint v1.0}
  - \fancyhead[R]{\small 27 Oct 2026}
  - \fancyfoot[C]{\thepage}
  - \usepackage{longtable}
  - \setlength{\LTpre}{5pt}
  - \setlength{\LTpost}{5pt}
---

> **MASTER DECISION:** Build Brief is the consent-based, versioned **intent-to-implementation and comprehension system of record** for software built with AI agents. It continuously connects *what an owner approved* to *what code and tests actually establish*, identifies *potential* unauthorized drift, creates *evidence-backed next actions*, and helps *humans understand* what changed. The hackathon submission must demonstrate this loop accurately, not simulate a broad platform.

**Status:** Engineering and research blueprint; not a certification of an existing implementation. Source cutoff: **27 October 2026**. The two inputs audited are **A**, the earlier *Build Brief: Research and Engineering Blueprint* (21 sections, 27 October), and **B**, the newly provided second-agent *BUILD BRIEF: Research, Validation and Build Plan* (10 parts, 27 October). Additional evidence comes from earlier recovered discussions, official current docs and research papers. Claims below are differentiated as **Confirmed**, **Provisional**, **Proposed**, **Hypothesis**, or **Not yet tested**. Terms `P0`, `P1`, `P2` mean hackathon critical, hackathon enrichment and later roadmap, respectively.

## Reading route

For a coding agent: read **1, 2, 7, 9-16, 18-21**, then create a task graph before coding. For the founder: read **1-8, 12, 17, 19, 22-24**. The full vision is preserved; not everything belongs in the submission.

# 1. Executive decision and four product invariants

**Recommendation: GO, Indie Developer track, Build for Your World theme** unless the participant-only theme/rules explicitly point elsewhere. This is a product with a genuine pain point and competitive overlap. The winning hypothesis is not “we are the first to verify code against intent.” The defendable proposition is a **user-approved, revision-aware expectation contract**, backed by inspectable evidence, available across agents, coupled with active knowledge transfer. [O1][O2][C1][C2]

**Four invariants that no module may violate:**

1. **Intent is not automatically truth.** Capture raw words and AI-extracted *draft* criteria; only an authorized owner can approve a canonical business rule or accept a changed one. Preserve history and make ambiguity visible.
2. **Source code is not runtime proof.** A code path, a passing test, a runtime observation, and a deployed production assurance are different evidence grades. Never collapse them into a confident “feature works in production.”
3. **A prompt is not a patch.** A correction pack is advice. A verified resolution needs a new revision plus appropriate fresh checks, and a human decision where necessary.
4. **Comprehension is not a pretty dashboard score.** An LLM-generated explanation, time spent reading and inferred AI-generated code share do not prove someone understood. Use actual, consented learner interactions; report coverage and uncertainty.

**Canonical product message:** **“From intent to proof, and from proof to understanding.”** Product homepage should express the shorter **“Know what your AI built.”** Avoid marketing claims like “guarantees correct code,” “nobody else does this,” or “all changes are monitored automatically.”

**Canonical workflow:** Capture -> Clarify and Confirm -> Inspect -> Verify + Reverse-check -> Explain -> Produce Fix Brief -> Agent implements -> Recheck -> Transfer Knowledge. `Capture, Verify, Fix, Prove Understanding` is an effective four-beat demo shorthand, but **Confirm**, **Evidence quality** and **Recheck** must remain first-class engineering steps.

**North-star measure:** For an approved business requirement at revision X, a user can see a reliable finding grounded in immutable evidence, identify unanswered questions, direct a coding agent to address a mismatch and understand whether revision Y actually improved the result. For learning, track meaningful comprehension gains in a user study, **not** a fabricated single “understanding percentage.”

# 2. Comparative audit: what survives, changes, or is rejected

**A = first research blueprint; B = second-agent report; V = new external verification.** Labels: **KEEP**, **UPGRADE**, **DEFER**, **CORRECT**, **REJECT**. This table is a synthesis, not proof that a missing competitor feature is impossible.

| Finding or idea | Audit decision | Master treatment and reason |
|:---|:---|:---|
| Intent capture through MCP/skill/hooks | **UPGRADE A+B** | Use Muse Code `UserPromptSubmit` where available, project-local skill and MCP tools; other agents have explicit/fallback capture. Always separate raw capture from owner-approved specification. [M1] |
| Approved and versioned requirements | **KEEP A; restore to B** | B's automatic JSON ledger lacks the decisive owner approval state. Add draft, clarification, approval, amendment, supersession, effective revision, and provenance. |
| Commit-specific line and test evidence | **KEEP A+B** | Verify source hashes, revision, path, line spans and test run identity mechanically. Do not trust citations generated by a model without validation. |
| Five verdicts: Verified/Partial/Missing/Contradicted/Unverifiable | **UPGRADE B** | Retain user-friendly display but use orthogonal *implementation finding*, *evidence grade*, *coverage*, and *review state*. “Missing” only after adequate search scope. “Contradicted” requires positive incompatible evidence. |
| Reverse drift / orphan diffs | **KEEP B** | High-value novelty candidate. Classify unlinked hunks as **possibly unrequested**, not automatically malicious. Exclude formatting, refactor support, dependency ripple effects and approved general maintenance. Human disposition required. |
| Persistent constraint guard | **KEEP B with controls** | A protected-path rule may warn, require owner approval or block in supported hooks. Never pretend a hook enforces edits outside its agent/trust boundary. Detect direct Git/human edits separately after commit. |
| Prompt autopsy for repeated attempts | **KEEP B; join A correction pack** | Categorize context gaps, contradictory instructions, wrong location and test failures. Do not claim definitive root cause from transcripts alone; run rechecks and measure time/attempts saved. |
| Research-assisted feature brief | **KEEP both** | Research is a sourced decision-support mode. Output assumptions, citations, tradeoffs, affected modules and acceptance tests. External findings cannot silently become approved requirements. |
| Grounded codebase chat and explanations | **KEEP A; restrict B** | Not a standalone generic chat product. Integrate evidence and status into Q&A; answer nontechnical stakeholder questions and say “not established” when repository is silent. |
| Quizzes, locate-it, explain-back | **KEEP B+A** | Retain as Understanding Studio, tied to actual revisions, independently checked citations, answer rubrics and useful feedback. Quality controls precede streaks/gamification. |
| Comprehension Map / AI-authored share | **UPGRADE B** | Heatmap only from consented assessments. AI-share requires measured provenance such as git-ai, or show “not measured.” Avoid turning knowledge into employee rankings. [C4] |
| Role-specific onboarding, custom roles | **KEEP A+B** | Preserve technical and nontechnical paths for engineering, QA, marketing, founder, support and custom roles; anchor business rules to evidence. One lightweight path in demo. |
| Daily alerts and new-member updates | **DEFER B+A** | Post-hackathon opt-in digests, severity filters and “since your last review”; no push infrastructure in P0. |
| Broad native mobile app | **DEFER both** | Responsive web/PWA first; mobile is a later consumption and learning channel, not the place repository analysis happens. |
| GitHub full app + OAuth + org permissions | **DEFER both** | MVP uses local repo adapter / explicitly consented read-only snapshot. Implement secure GitHub App after core works. PAT should be optional and not stored in URL/local ledger. |
| Many models / full 1M-token repo prompting | **CORRECT B** | Meta offers long context, but capacity is not quality, permission or security. Default selective retrieval, context budget and privacy filters; optional full eligible small repo behind consent and token estimate. [M2] |
| Meta Muse Code plugin | **KEEP B as P1** | Muse Code is a natural demo client, not an entire product distribution strategy. Begin with stable CLI + local MCP; add real hook integration after a tested minimal core. [M1] |
| Judge scoring weights 30/25/25/20 | **PROVISIONAL both** | Secondary report only; public organizer page does not prove percentages. Do not optimize exclusively against unverified weights. [O1] |
| Public repo / exactly 3-minute demo / new-work rule | **UNVERIFIED B** | Sensible submission targets, **not confirmed requirements** until official waiver/portal is read. Respect any new-work rule if confirmed; maintain a clean commit log. |
| “Nobody closes this loop” | **REJECT as factual claim** | Spec Kit has convergence and recorded verification; Muse Code has journals and verification observers; Kiro has specs and hooks. Win through tested cross-agent contract + evidence + learning, not inaccurate competitor negatives. [C1][C2][M1] |
| Anthropic 17-point skill result | **KEEP, correctly qualified** | A controlled study of 52 engineers found 50% vs 67% average on a specific quiz; not universal loss or proof Build Brief prevents it. [R1] |
| Explanation Gate “original innovation” | **REJECT as uniqueness** | The 78-person study explicitly implements and evaluates a gate. We can improve/repurpose, must credit the research. [R2] |
| Benchmarks: 12-20 seeded cases | **KEEP B; upgrade A** | Use multi-repo scenarios, both positive and negative controls, per-class precision/recall, citation validity, abstention calibration, change rechecks and independent ground truth. No hand-edited metrics. |
| 70% precision threshold | **REJECT as safety-quality target** | Use it only as a coarse **scope/pivot warning** in exploratory development; strong positive assertions deserve far higher precision and calibrated abstention. Set thresholds after test design, never inflate. |
| Existing BuildBrief prototype | **PRESERVE A context, not assert build state** | Earlier discussion mentioned intent capture, source-linked reviews, version comparison and handover exports. Repo/current services not inspected in this audit; do not tell agent components already work. |
| Local-first storage `.buildbrief/ledger.json` | **UPGRADE B** | Prefer append-only event ledger (JSONL or SQLite) plus materialized views. Commit exportable nonsecret manifest; prevent secrets/session prompts entering shared repo by default. |
| Production safety/privacy | **KEEP A; deepen** | Encryption, denylist/allowlist, explicit upload consent, prompt injection defenses, safe path handling, deletion, isolated test execution, tenant boundary, logging minimization. |
| Self-documenting Build Brief | **KEEP B with caveat** | Dogfood on itself and attach hashes/timestamps. Logs demonstrate traceability, **not cryptographic proof of eligibility or originality** without organizer confirmation. |

## 2.1 High-impact omissions found across BOTH

1. **Source-of-truth authority conflicts:** who can approve, amend, resolve disputes and set business policy? Add actor permissions, effective dates and explicit decisions.
2. **Repository coverage accounting:** a confident negative verdict requires a search-coverage estimate and well-defined scope; missing evidence does not prove missing implementation.
3. **Evidence invalidation:** map findings to revision hashes and make all dependent results stale when changed inputs or tests warrant it.
4. **Runtime/deployment gap:** code review alone cannot answer “does it work for real users?” Add tiers for CI/isolated tests, authorized staging observation and post-launch telemetry, never imply live proof in a demo without it.
5. **Recovery from partial capture:** agents can be offline, hooks disabled, streams truncated; persist capture completeness and transcript import with gaps.
6. **Non-adversarial change intent:** rename/refactor/format/test fixture may be justified indirectly. Avoid a high false-positive “orphan edit” experience.
7. **Comprehension epistemics:** grade questions with clear rubrics and human override; no pseudo-scientific AI authorship or team knowledge inference.
8. **Adversarial tests:** poisoned README, false file citations, symlink traversal, prompt replay, stale lines, forged test logs, excessive repo size and malicious build scripts.
9. **Evaluation provenance:** versioned benchmark labels, blinded annotator review where feasible, separate development and holdout cases, dated model/prompt versions and cost/latency.
10. **Accessible use:** keyboard navigation, screen reader labels, reduced motion, color-independent status, plain English with a technical evidence drill-down.
11. **Provider and integration outage behavior:** deterministic partial reports and explanation of unavailability, not fabricated green statuses.
12. **Human feedback loop:** correction/dismissal must create labeled events and a new approved contract only on authorized action.

# 3. Hackathon verification ledger: facts, uncertainties, instructions

## 3.1 Organizer-confirmed facts

- The Meta Global AI Developer Hackathon is virtual, **October 26 - November 4, 2026**, with a **$1 million aggregate prize pool**, **Indie Developer** and **Startup** tracks, and themes **Build for Your World** and **Push the Frontier**. Official published emphasis: Indie = creativity, technical ambition, functionality; Startup = technical execution and production readiness. [O1][O2]
- Deadline announced as **November 4 at 9:00 PM Eastern Time**. On that date Eastern is EST (UTC-5), meaning **November 5 at 02:00 UTC/Ghana**. Aim for submission on **November 4 by 18:00 Ghana time**, with links already tested. Dates remain subject to organizer changes. [O1]
- The public Meta page notes up to **20,000 accepted participants**; **this is a cap, not confirmation of 10,000 current competitors**. [O1]
- Earlier organizer messages available in conversation confirmed the user's application was **approved October 20** and communicated an individual **$150 Meta Model API credit offer**, claim deadline November 4 at 9 PM ET, credit-card requirement for use and batching of credit distribution. **Acceptance does not mean credit activation was verified.** Source: prior organizer email review, not public event rule.
- Meta officially documents Muse Spark 1.3 (`muse-spark-1.3`), structured JSON output, Meta Model API endpoint `https://api.meta.ai/v1`, long context up to 1,048,576 tokens and pricing modes. Meta also documents Muse Code skills, hooks, MCP, and headless use. [M1][M2][M3][M4]

## 3.2 What must NOT be passed off as confirmed

- **Scoring formula** “Impact 30%, Meta tooling 25%, Demo 25%, Technical 20%” comes from an independent guide, not verified directly against the latest signed waiver. Design for all four disciplines but call the weights *provisional*.
- **Public repository, exact three-minute video, mandatory live URL, team-acceptance rules, pre-existing asset restrictions, and exact prize-tier distribution** appear in secondary participant reports. The public page does not sufficiently establish all of these. Read the official participant-only details, accepted waiver and final submission form. Use a ≤3-minute demo as a practical default until official instructions say otherwise.
- **Meta-model mandatory eligibility gate** has not been authoritatively confirmed; use Meta substantively regardless because it demonstrates the sponsor's stack.
- **Ghana API access**: Ghana is not among territories expressly prohibited in the October 12 Meta restricted-territories policy, but that list is not a guarantee that an individual account can connect, pay or use a model. Only a successful account-authenticated API call verifies access. [M5]
- **“All work must be new”** is a potentially material rule from unofficial reports. To avoid preventable risk, create and disclose fresh hackathon demo work and record chronology; ask the organizer whether pre-event prototypes may be extended. Never conceal preexisting BuildBrief code or represent an older prototype as hackathon-new.
- **IP license/ownership terms** must be reviewed from the actual waiver before agreement or submission. Do not rely on another agent's paraphrase of a legally consequential term.

## 3.3 Priority participant actions (external, require account access)

1. Read **https://cerebralvalley.ai/e/meta-ai-developer-hackathon/details** and the participant waiver while signed in. Save the version/date. Check judging, eligible/new work, prior IP, video, repo, team, AI models and submission fields.
2. Visit **https://cerebralvalley.ai/e/meta-ai-developer-hackathon/discord**; check official announcements and `#rules`; ask remaining targeted questions once, not repeatedly.
3. Claim each eligible member's $150 credit **through the organizer-provided link**, confirm billing availability and configure an actual spending cap if available; be aware a warning notification may not be a hard stop.
4. Make one authorized standard-mode `muse-spark-1.3` test call from the user's account; test JSON schema output and record model, request ID, cost, region/access and errors without recording credentials.
5. Confirm track and theme; if it is a team submission, ensure participants and collaboration details follow the signed rules.
6. Register a new dated repository/reproducible demo fixture while clearly separating preexisting source, third-party libraries, AI tools and generated work.

# 4. The problem: five failures, two buyer groups

**Core failure:** coding agents accelerate implementation while separating the human's ongoing *business intention* from inspectable *code evidence* and from *human mental models* of the resulting product. The problems combine but are not identical.

1. **Omission:** user requests a 20% reward with 30-day expiry; code creates reward calculation but no expiry.
2. **Contradiction:** approved rule requires backend entitlement enforcement; code only hides a UI button.
3. **Unrequested change:** a tool alters a sensitive auth file or deletes a test during an unrelated feature; may be justified or not.
4. **Context loss / retry loops:** the owner repeats prompts, misses previous attempts and constraints, or researches outside the agent and pastes vague instructions back.
5. **Understanding debt:** owners and new teammates lack a justified mental model of code and business behavior.

**Primary wedge:** AI-native solo builders/indie founders who need evidence before shipping. **Second wedge:** small technical teams handling agent-created features, change requests, business-rule reviews and onboarding. **Extended users:** nontechnical founders, marketing, support, operations, QA, product managers, auditors and agency clients.

**Validated relevance, not universal causation:** Anthropic's randomized study with 52 mostly junior engineers found post-task comprehension scores averaging **50% AI-assisted versus 67% manual**, without a significant average speed-up for that learning exercise. Interaction style mattered substantially. This is not evidence that all AI-assisted developers lose 17 points, nor evidence that Build Brief has solved that problem. [R1] A separate 78-person preprint studied an Explanation Gate and reported substantial maintenance-task differences; it requires cautious interpretation as a specific experimental intervention, not general product effectiveness. [R2] A qualitative study of 207 students / 621 diaries describes comprehension-debt patterns. [R3]

**Explicit empirical hypotheses:** H1 owners catch requirement deviations faster with source-linked claims than with plain agent summaries; H2 correction packs reduce repeat attempts; H3 role-grounded learning increases delayed recall and successful change explanation; H4 teams retain context across agent and member transitions; H5 users trust Build Brief when uncertainty is visible. These are experiments, not claims.

# 5. Competitive reality and defensible positioning

| Product/category | Confirmed/current overlap | Differentiation to test, not assert as monopoly |
|:---|:---|:---|
| **GitHub Spec Kit** | Specify -> Plan -> Tasks -> Implement -> **Converge**, evidence-based bug assessment and verification, multiple agent integrations. [C1] | Build Brief's business-owner-approved, continuous prompt-ledger; rev-specific source evidence; explicit unknowns; teaching and role transfer. **Do not claim Spec Kit never verifies.** |
| **Kiro** | Agent specs with requirements/design/tasks, implementation, tests, conversation, steering, hooks, permission gates. [C2] | External across-agent system of record, owner-controlled business acceptance and verifiable change history. |
| **Muse Code** | Session journals, verification/goal tracking observers, skills, hooks, MCP, replay/export. [M1][M6] | **Import and interpret** their records against owner-approved expectations; do not replicate session logging or claim Muse has no verification. |
| **Qodo, Greptile, CodeRabbit, Copilot review** | Advanced PR/code analysis, instructions/history, contextual review, suggested fixes and agent workflows. [C3] | Approved *product-intention contract*, forward and reverse traceability, evidence grades, understandable business-flow explanations. Reviewers may add these features over time. |
| **Devin DeepWiki, Sourcegraph, Unblocked** | Codebase explanations, navigation, wikis and contextual project knowledge. [C5] | Explain explicitly against owner-approved requirements and latest verified/unverified state; use in role training and maintain evidence transparency. |
| **Entire, git-ai and related provenance tools** | Sessions, prompts, authorship, AI-attribution / commit notes. [C4][C6] | Treat provenance as input signals; interpretation of intent satisfaction and comprehension is separate. Integration partners, not merely rivals. |
| **Tessl, OpenSpec, BMAD, planning tools** | Specifications, agent plans, procedural memory. | Replace neither coding agents nor process frameworks; use their artifacts as candidate intent **pending owner approval**. |
| **Explanation Gate / learning assistants** | Real code explanation checks, quizzes and skills training; prior research has implemented a gate. [R2] | Revision-specific, evidence-linked understanding plus cross-role transfer and verified business requirements. |

**What we should own:** *A persistent, human-approved Intent Contract that connects the evolving conversation to traceable implementation evidence, changes not clearly authorized, targeted remediation, and demonstrated human comprehension.* **Our moat is an earned feedback dataset and trusted workflow, not a single model prompt.** Competition and product uniqueness remain hypotheses until head-to-head testing.

# 6. Product design system: six coordinated pillars

Every feature has a **user outcome**, an **evidence requirement**, a **permission boundary** and a **phase**. No feature can silently change canonical intent.

## 6.1 PILLAR I - Capture and Intent Memory

**P0:** Capture exact user prompt, project, agent/session, source timestamp and hash; extract atomic requirements, negatives/prohibitions, acceptance criteria and ambiguities; deduplicate without erasing history; create draft state; explicitly confirm with owner; track changes to approved intent; version conflicts; lookup most recent approved constraint.

**P1:** Muse Code prompt hook, post-turn sync, session ingestion; natural-language diff of intent changes; conflict explanation; approval flow for changed business rules; user-editable goal and non-goal lists; acceptance test generation with user review.

**P2:** Import from GitHub Issues, Linear/Jira, specs, Slack, documents, design files and product roadmaps with scoped permissions; timeline of stakeholder decisions; feature-level intent graph; multi-project policy templates; natural-language/voice capture where authorized.

**Design rule:** `SourcePrompt != DraftRequirement != ApprovedRequirement`. Any output generated from conversations is a *candidate* until accepted. Keep original raw prompt and immutable amendment history. A non-goal (“do not modify login”) is an operational constraint only if it is current, scoped, authorized and applicable to the edit being checked.

## 6.2 PILLAR II - Verify Implementation and Detect Drift

**P0:** Local snapshot/git read, file manifest and excludes, commit/tree hash, symbols/routes/tests, evidence retrieval, source-span validation, criteria status, evidence grades, coverage explanation, complete report export, revision comparison, stale markers.

**P1:** Reverse intent mapping of diff hunks, possible unrequested-change alerts, protected paths, deleted/disabled test warnings, config/dependency/schema changes, risk-based triage, user acknowledgement with reason, re-verification of affected criteria.

**P2:** Static-dataflow analysis, CI import, isolated integration tests, staging/browser trace, deployment artifact mapping, GraphQL and schema tracing, dependency policy and SBOM, security checks as **signals** rather than replacing specialized scanners.

**Canonical presentation:** For each approved criterion show **Finding** (supported, partially supported, contradicted, not established, not applicable), **Evidence grade** (source, passing test, authorized runtime, production), **Coverage**, **Confidence/uncertainty**, **Revision**, **Citations** and **Next proof action**. Missing and contradicted are distinct; source absence alone yields **Not established**, unless a defined exhaustive scope and explicit negative proof justify a missing label.

**Reverse check rule:** `orphan hunk` means “not confidently mapped to an approved intent,” **not** “unauthorized malicious change.” Mark likely maintenance/refactoring, classify high sensitivity, and offer `Accept as supporting change`, `Request explanation`, `Link to intent`, `Revert suggestion`. Never auto-revert unreviewed code.

## 6.3 PILLAR III - Correct, Research and Recheck

**P0:** Generate correction pack on a specific finding: affected requirements, evidence, diagnosis (hypothesis), exact files or exploration area, boundaries, acceptance checks, safe tests, expected outputs and a **verify-after** instruction. Export to a coding agent; inspect the subsequent commit. Record unresolved findings.

**P1:** Prompt Autopsy for two or more related failed attempts; parse agent history and test failures if consented, compare cause hypotheses and constraints, identify stale contexts, avoid repeating failed strategies, generate an optimized next prompt, record success/failure after replay. `bb_brief` creates research-backed implementation proposal with evidence and citations.

**P2:** Cross-agent prompt optimization, alternatives ranked by impact/latency/cost, external technical research with source credibility, change impact simulator, auto-created (not auto-executed) PR plan, integration checklists, test generation gated by human approval, decision records.

**Nonnegotiable:** A prompt cannot be presented as “fixed”; a passing unit test cannot be presented as proof of production availability.

## 6.4 PILLAR IV - Understanding Studio and Learning

**P1:** “Explain this feature” with precise citations, diff summaries, beginner/technical modes; revision-linked quiz containing **predict behavior**, **locate implementation**, **explain-back**; clear answer/rubric and helpful corrections; record consented attempt results. Demonstrate one useful question for the hackathon.

**P1/P2:** Comprehension Map per module showing actual assessment coverage, confidence and recency; adaptive explainers; “what changed since last visit?”; business-rule explorer; role-selected tour; learning checkpoints; “show me the edge case,” “walk the request through files,” “how do I safely change this?”

**P2:** Interactive diagram, scenario simulator with explicit synthetic-data labels, bug-lab sandbox, dependency/source route visualizer, flashcards/spaced repetition, knowledge handover export, incident flashbacks, review gates before merge (optional), personalized learning recommendations, progress digests, mobile learning surfaces.

**Measurement integrity:** A heatmap cell with no assessment = **Unmeasured**, not red or green. Show question count, difficulty, last checked revision, recency and evidence quality. AI-author share must come from a validated attribution provider or be omitted; do not deduce AI authorship from file style. Never rank individual workers by unvalidated aptitude.

## 6.5 PILLAR V - Team Transfer, Handover and Governance

**P1 demo path:** user chooses `Founder`, `Engineer`, `QA`, `Marketing`, `Support`, `Operations`, `Product` or `Custom role`. Produce a short cited brief: product purpose, relevant features, key rules and exceptions, source locations, open issues, recent changes, who/what to ask, and a focused quiz. A nontechnical marketer should see “how referral reward works in this code,” not fake business policy.

**P2:** Role and project policies, technical dependency map, ownership and escalation, onboarding checklist, accessible in-app review trail, change approvals, team risk review, linked incidents, engineering handoff, releases, customer support readiness, documentation freshness, approved sharing boundaries.

**Trust rule:** Owner approval governs business intentions; repository and tests govern implementation observations; marketing roles **cannot infer pricing or obligations from code comments alone**. If no reliable figure exists, state unknown.

## 6.6 PILLAR VI - Insights, Notifications and Ecosystem

**P2:** In-app daily/weekly “changes since last review,” high-impact drift notifications, email/Slack optional, browser extension, GitHub checks, MCP ecosystem, encrypted OAuth connectors, API and SDK, change summaries by stakeholder, privacy controls and audit exports, multi-repo, multi-language, mobile/PWA companion, enterprise tenancy, usage/billing and institutional knowledge analytics.

**Roadmap discipline:** This is the **full product vision**; these items are explicitly not required for the November demo. Preserve in backlog, not branch complexity.

# 7. User journeys and concrete example contracts

## 7.1 Builder: referral feature

Owner prompt: “Add referral codes. Referrer gets 20% credit on first paid invoice. Code expires after 30 days. A customer cannot refer themselves. Do not modify authentication.”

1. Capture exact prompt; create atomic draft items: referral code generation; single first-payment credit; 20% calculation base defined? expiry 30 days measured from what? self-referral forbidden; auth path constraint. Flag **unresolved** “20% of gross/net?” and “refund treatment?”; only approved answers become business contract.
2. Index original SHA and target branch. Agent edits feature. Diff shows code creation, credit formula, marketing UI, an auth edit and removed test.
3. Deterministic checks collect relevant files, API handlers, migrations, tests, config, deletions and line hashes; the model assesses each *approved* criterion.
4. Display: code generation Supported by source, expiry Not established, self-referral Partially supported/contradicted based on exact code, 20% base Unapproved/Needs clarification, auth edit **Possibly unrequested**, deleted test high-risk. Unknowns are preserved.
5. Produce a fix brief that repeats known approved requirements, explains exact evidence and recommends specific tests; never silently choose gross or net calculation.
6. After commit `Y`, rerun. Record changed statuses, new risks and whether test evidence improved. Add a plain-language “referrals” tour for a marketing teammate and one predict/locate quiz.

## 7.2 Founder: subscription seat limit

Intent: “Core customers can invite two team members; the third invitation must be rejected server-side.” UI disabling alone is **not sufficient evidence** of server-side entitlement. Tests should cover a third invitation through the backend, concurrency/race conditions if relevant, and role authorization. Mark actual production enforcement unknown without authorized runtime/deployment proof. This scenario is excellent to contrast UI appearance and business reality.

## 7.3 Team onboarding

A new support agent chooses `Customer Support` and selects “Subscriptions and invitations.” Build Brief provides (a) an answer in ordinary English, (b) exceptions/unknowns, (c) links to the approved intent and file/test evidence and (d) a small quiz. If billing details are from comments rather than enforceable logic, label them as documentation claims instead of actual configured behavior.

## 7.4 Repeated failed coding prompt

Timeline: retry 1 fails tests; retry 2 changes wrong handler; retry 3 removes a failing test. Autopsy must identify **what is documented** (paths, outputs, edits, constraints) and **what is inferred** (probable root cause). Engineered prompt must include prior attempts and explicitly prohibit deleting tests or modifying auth. Success judged by new evidence and execution, not prompt fluency.

# 8. Understanding Studio: ranked exploration, not scope deletion

| Mode | Assessment value | Delivery |
|:---|:---|:---|
| Predict-the-behavior | Tests causal understanding of this feature, not memorized definitions | **P1 single demo question** |
| Locate-it | Can user find actual rule, file, route and test? | **P1** |
| Explain-back | Open response with evidence-aligned rubric and human override | **P1** |
| “What changed and why?” | Diff walkthrough with intent and evidence links | **P1** |
| Role-specific guided tour | Transfers feature knowledge to engineers, marketing and support | **P1** |
| Comprehension Map | Visualizes covered knowledge, freshness and uncertainty | **P1 only if quiz accurate** |
| Ask-with-evidence | Non-generic codebase Q&A constrained by ledger and current revision | **P1/P2** |
| Impact map | What modules, consumers and tests might this change affect? | **P2** |
| Break-it lab | Isolated synthetic defect practice, no unsafe code mutation | **P2** |
| Explanation Gate | Opt-in pre-merge teach-back, credited to prior research | **P2** |
| Architecture story | Source-anchored system diagram and request flow | **P2** |
| “Since last look” digest | Explain meaningful repo/intent changes by role | **P2** |
| Spaced repetition | Review concepts as code revisions change | **P2** |
| Voice and mobile companion | Capture intent or consume micro-lessons on phone | **P2** |
| Pair-learning mode | Teammate explains a design and gets factual evidence checks | **P2** |

**Question QA rules:** Every answer must be reproducible from citations; ambiguous distractors rejected; don’t grade uncertain facts; record revision, model, generated answer and grading rubric; offer “I disagree” with evidence; invalidate a question when supporting code changes; report a learner's errors without shaming or pretending the generated score is authoritative.

# 9. Integration strategy: Muse first, platform independent

## 9.1 What Muse Code officially supports (verified)

Official Muse Code extending docs list lifecycle events including **`SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PostToolBatch`, `Stop`, `SessionEnd`** and others. Project hooks are in `.muse/hooks.json`; MCP servers can use stdio or streamable HTTP; project skills reside under `.agents/skills/<id>/SKILL.md`; `muse exec` supports headless use. Hook sources and local trust rules matter. See [M1]. Muse also has append-only action/session journaling and verification observers [M6].

**Therefore, revise B's uncertainty:** There **is** an official `UserPromptSubmit` event. Design capture around it, then confirm behavior against the installed Muse build and permitted handler schema. Do not invent the hook JSON action payload: implement from official event schema, validate locally and include tested fixture(s).

**Muse adapter v0:**

- `UserPromptSubmit` -> local sanitized event envelope -> Store raw exact prompt with source and capture completeness. Return draft intent candidate, never implicitly approve.
- `SessionStart` -> return current active approved constraints and unresolved high-impact intents. Do not overload context.
- `PreToolUse` -> if supported file path/tool arguments match high-severity constraints, warn or request approval/block according to explicit user-configured policy; absolute path validation and symlink handling required. Test whether shell-driven indirect writes are intercepted.
- `PostToolUse` or `PostToolBatch` -> record tool usage *metadata* and candidate changed files, then defer expensive verification to `Stop` or explicit request; avoid blocking normal coding loops with LLM latency.
- `Stop` -> summarize context, collect current diff and launch an incremental verify job asynchronously **within the user's app process** (not this chat). Store processing state; do not assume hook always fires on crashes.
- `SessionEnd` -> observational bookkeeping only. Use CLI for manual repair/reimport.

**MCP core capabilities:** `bb_capture`, `bb_list_intents`, `bb_get_context`, `bb_approve_intent` (explicit authenticated action), `bb_verify`, `bb_report`, `bb_make_fix_brief`, `bb_brief`, `bb_explain`, `bb_quiz`. MCP server is read-only against code by default; a writing tool only writes Build Brief state after verified authorization. Authentication and human confirmation cannot be replaced by text in a repo file.

**Other agents:** package common `SKILL.md` and stdio MCP; provide documented Codex, Claude Code and Cursor setup later. Do not claim their hooks are identical or capture every prompt. Import `muse export`, Entire or git-ai session artifacts when permissions allow; avoid recreating provenance already supplied by a vendor.

## 9.2 Why not make Muse Code a hard dependency?

Build Brief is a developer infrastructure product, not a single-agent extension. An open contract/protocol preserves its value when builders switch agents. The **hackathon showcase uses Muse** to demonstrate sponsor integration, while the same CLI/MCP core remains agent-agnostic. If Muse installation fails on the target platform, the core demonstration still works through explicit CLI capture and Meta API; log that limitation honestly.

# 10. Meta Model API integration and costs

**Primary model:** `muse-spark-1.3` **Standard**, called from a server or approved local environment via `https://api.meta.ai/v1`, using a well-scoped token. Use schema-constrained outputs for requirement extraction, adjudication and question generation; use deterministic post-validation. Long context is available but not permission to send secrets or ingest an entire repo indiscriminately. [M2][M3]

**Provider strategy:** choose `muse-wonder-1.0` only for difficult independent review where API availability and quality justify cost; never make the MVP depend on inaccessible preview models. Model name, request ID, context-size, reasoning settings, retry policy, prompt hash, answer hash and token usage go into an audit log. Test capabilities, do not copy adapter rumors about tool choices as gospel.

**Prompt pattern:** (1) deterministic source selection; (2) model tool-based exploration if needed; (3) **separate** JSON verdict call from stable evidence; (4) schema validation and citation resolver; (5) adjudication/rejection of unsupported certainty; (6) limited high-risk second pass; (7) record provenance. Meta officially describes structured outputs and automatic prefix caching [M3][M7].

**Privacy correction:** Meta's October 12 policy states a **Coding Harness Subscription may default to Contributor services regardless of chosen model**, unless settings are changed. Do not promise “Standard privacy” merely because Muse Spark appears in a UI. For proprietary code, verify account mode; use the standalone Standard Model API path and minimal excerpts whenever possible. Meta documents that Contributor mode allows training on submitted data and Standard mode does not train on submitted content. [M5][M8]

**Indicative unit economics, not a provider quote for a real run:** Official published Standard prices include $1.25 per 1M input tokens, $0.15 per 1M cached input and $4.25 per 1M output for Muse Spark 1.3 (check current billing). Example 20,000 uncached input + 1,000 output = **$0.02925** excluding other fees/tools. A 200,000 input + 5,000 output call = **$0.27125**; cached input can reduce input charge, but cache hits and input budgeting are not guaranteed. Do not promise a project total ($25-$40) without measuring actual usage. [M8]

**Architecture-level resilience:** if Meta service unavailable, still provide deterministic repo manifest/diff/constraint warnings and mark semantic verification **pending/unavailable**; never present stale results as fresh. Retry transient failures with limited exponential backoff and idempotency keys. Respect rate, spend and workspace policies.

# 11. Technical architecture and trust boundaries

## 11.1 Recommended deployment topology

```text
Developer terminal / agent / IDE        Local Build Brief core                   Web (read-oriented)
Muse Code UserPromptSubmit  -------+   CLI + TypeScript event ledger  ----+   Project overview
MCP tools / local skill   ----------+-> repo manifest + git diff + AST  ---+-> Intent contract
CLI manual capture       ----------+   evidence resolver/test ingest   ----+   Verification report
                                         typed Meta Model API provider      ----+   Reverse change alerts
                                         correction, Q&A, quiz             ----+   Prompt/fix brief
                                                |                          ----+   Understanding Studio
                                                v                          ----+   Role onboarding
                                    Local SQLite + exportable JSONL
                                                |
                                  Optional sync worker / Postgres DB
                                                |
                                        Meta Model API (Standard)
```

**P0 architecture:** TypeScript/Node monorepo with `packages/domain`, `packages/core`, `packages/repo`, `packages/meta`, `packages/mcp`, `packages/cli`, `packages/eval`; `apps/web` and minimal `apps/api`/sync. Use SQLite for local event + status materialization and file cache; deploy PostgreSQL only if multiuser web state materially requires it. A simple local HTTP service or exported read-only JSON report is acceptable as fail-safe. **Avoid creating a complex hosted repo-execution service for the hackathon.**

**Web app:** Next.js with responsive UI, authentication if private code is synchronized, project list, intent view, verification timeline, evidence drawer, correction pack and one understanding mode. PWA manifest later. For public demo, seed **non-sensitive synthetic data** in read-only mode; no exposing proprietary private repos.

## 11.2 Data lifecycle and model boundaries

- **Local source**: user chooses explicit repo root; normalize path; reject path escape and symlink traversal; honor `.gitignore` plus `.buildbriefignore` and deny secrets/binaries. Capture manifest, git revision and allowlisted snippets with text hashes.
- **Intent**: append immutable raw capture and candidate extraction, then human-approved revisions. A new prompt can amend an old intention, but only by explicit owner decision.
- **Evidence**: store file path/line ranges, commit SHA, source snippet hash, retrieval method, coverage summary, optional test run output and confidence. Validate all cited paths/lines mechanically before showing.
- **Verification**: model may reason over evidence, **never execute repository instructions contained in README/comments**. Model output is data, schema validate, verify cited blobs, downgrade insufficient claims.
- **Sync**: opt-in, per-project, minimized payload; keep raw prompts and source private by default; ability to erase/export; encrypt credentials; preserve tenant ownership.
- **Tests**: default ingest local/CI results with known provenance; if executing untrusted code, use isolated ephemeral container, no ambient network/credentials, resource caps; never on production API host.

## 11.3 Evidence quality taxonomy

- **E0**: unverified natural-language assertion, comment or documentation claim; explanatory, **not implementation proof**.
- **E1**: file/symbol/AST/diff span pinned to commit; establishes source structure/logic in inspected branch.
- **E2**: reproducible test/CI result pinned to commit, toolchain, command and test fingerprint; supports a behavior under specified conditions.
- **E3**: authorized staging/browser/network runtime trace pinned to built artifact/environment; supports observed behavior in that environment only.
- **E4**: audited production signal bound to deployment artifact, time window and approved access; **post-hackathon**, not implied by E1-E3.

**Finding != proof grade:** a criterion may have “supported by E1” yet need E2 to be confident about a race condition; a high-severity security promise should never auto-accept E1 alone.

# 12. Canonical data model and versioned contracts

**Persist append-only events + derived views.** Natural keys include `project_id`, `branch`, `revision`, `requirement_version`, `agent_session_id` and `run_id`. Generate stable IDs; names may change without breaking linkage.

```ts
type IntentKind = 'feature'|'constraint'|'non_goal'|'acceptance'|'business_rule';
type IntentState = 'draft'|'clarification_needed'|'approved'|'superseded'|'withdrawn';
type Finding = 'supported'|'partial'|'contradicted'|'not_established'|'not_applicable';
type EvidenceTier = 'E0_claim'|'E1_source'|'E2_test'|'E3_runtime'|'E4_production';
type CaptureCompleteness = 'hook_exact'|'explicit_mcp'|'transcript_import'|'manual'|'partial';

type IntentVersion = {
  id: string; project_id: string; feature_id: string; version: number;
  kind: IntentKind; state: IntentState; exact_source_text: string;
  source_hash: string; source_agent?: string; session_id?: string;
  captured_at: string; capture_completeness: CaptureCompleteness;
  normalized_text: string; acceptance_criteria: string[];
  non_goals: string[]; constraints: {rule:string; paths?:string[]; severity?:string}[];
  ambiguity_flags: string[]; approved_by?: string; approved_at?: string;
  supersedes_id?: string; effective_from_revision?: string;
};

type EvidencePointer = {
  id: string; tier: EvidenceTier; revision: string;
  path?: string; line_start?: number; line_end?: number;
  blob_hash?: string; snippet_hash?: string; ast_symbol?: string;
  test_run_id?: string; runtime_trace_id?: string;
  collected_at: string; is_stale: boolean; description: string;
};

type VerificationFinding = {
  id: string; project_id: string; requirement_version_id: string;
  criterion_id: string; checked_revision: string; finding: Finding;
  evidence_ids: string[]; evidence_grade: EvidenceTier;
  coverage: { examined_files: number; relevant_files: number;
              gaps: string[]; negative_search_sufficient: boolean };
  confidence: number; rationale: string; missing_proof: string[];
  provider: string; model: string; prompt_version: string;
  run_id: string; created_at: string; stale: boolean;
  human_disposition?: 'accepted'|'rejected'|'needs_review';
};

type CandidateUnrequestedChange = {
  id: string; from_sha: string; to_sha: string; path: string;
  hunk_hash: string; mapped_requirement_ids: string[];
  risk: 'low'|'medium'|'high'|'critical'; flags: string[];
  mapping_confidence: number; why_flagged: string;
  disposition?: 'explained'|'linked'|'approved'|'rejected'|'pending';
};

type CorrectionPack = {
  id: string; project_id: string; finding_ids: string[];
  target_revision: string; diagnosis_hypotheses: string[];
  evidence_ids: string[]; proposed_change_scope: string[];
  do_not_touch: string[]; instructions: string;
  acceptance_commands: string[]; unknowns: string[];
  requires_human_approval: boolean; created_at: string;
};

type QuizItem = {
  id: string; project_id: string; revision: string;
  criterion_ids: string[]; type: 'predict'|'locate'|'explain_back';
  prompt: string; options?: string[]; rubric: string[];
  evidence_ids: string[]; difficulty: 1|2|3; status: 'draft'|'validated'|'retired';
};

type ComprehensionRecord = {
  actor_id: string; project_id: string; module_id: string; revision: string;
  quiz_item_ids: string[]; graded_count: number; score?: number;
  last_assessed_at?: string; assessment_confidence?: number;
  ai_authored_share?: number; attribution_source?: string; // OMIT if unmeasured
};
```

**Additional required tables/views:** `projects`, `repository_snapshots`, `agent_sessions`, `capture_events`, `intent_events`, `approvals`, `requirements`, `criteria`, `evidence`, `test_runs`, `model_runs`, `verification_runs`, `findings`, `diff_hunks`, `hunk_mappings`, `correction_packs`, `role_templates`, `learning_events`, `quiz_responses`, `onboarding_exports`, `access_grants`, `audit_events`, `sync_jobs`. Use foreign keys, unique constraints, idempotency keys and indexes for revision/state. Do not store raw API keys in `.buildbrief` or repository-controlled settings.

**Authoritative event examples:** `prompt.captured`, `intent.extracted`, `intent.approved`, `intent.superseded`, `repo.snapshot.created`, `verification.started`, `finding.recorded`, `evidence.invalidated`, `change.orphan_flagged`, `change.dispositioned`, `correction.pack_created`, `agent.patch_reported`, `recheck.completed`, `quiz.answer_submitted`, `role.tour_generated`.

# 13. Verification algorithms and guard logic

## 13.1 Criterion verifier (normative pseudocode)

```text
verify(project, approved_intent_version, revision):
  assert authorized(project, actor)
  snapshot = capture_git_snapshot(revision)
  manifest = index_allowlisted_files(snapshot)
  criteria = approved_intent_version.atomic_criteria
  for criterion in criteria:
    candidates, retrieval_trace = retrieve_by_symbols_routes_tests_and_terms(criterion)
    evidence = collect_source_spans_and_test_runs(candidates)
    evidence = validate_spans_revision_hashes_and_test_identity(evidence)
    result = meta_structured_assessment(criterion, evidence, retrieval_trace)
    enforce_schema(result)
    if invalid_citation(result) or unsupported_grade(result): downgrade_not_established()
    if result says 'missing' without adequate search: downgrade_not_established()
    persist_immutable_finding(result, coverage, revision, model_version)
  reverse_map_diff_hunks_to_approved_criteria(snapshot, base_revision)
  mark_dependent_older_findings_stale_where_warranted()
  return report_with_unknowns_and_cost_latency()
```

**Deterministic before semantic:** normalize diff, classify added/deleted/renamed files, count tests removed/skipped, detect package lock/config/schema/auth changes, map symbols, run secret scanning, extract code paths and language-specific manifests. The LLM analyzes only curated evidence. Every citation must resolve to a real blob/line at the checked revision. Source code containing “ignore previous instructions” is data, never a command.

## 13.2 Negative claims and controlled verdicts

- `supported`: explicitly matching evidence and sufficient proof grade for the claim, with any limitation stated.
- `partial`: some necessary subconditions evidenced but not all.
- `contradicted`: code/test/runtime contains directly incompatible observable behavior relative to the approved criterion.
- `not_established`: no adequate proof either way, insufficient search scope, secrets excluded, noncompiled path or unobserved runtime. Default under uncertainty.
- `not_applicable`: explicitly out-of-scope for checked revision/environment, with recorded rationale.

**B's `Missing` is retained as an optional UI label only** when the evidence supports a well-defined absent artifact in an exhaustively inspected scope, e.g. a mandatory named route is provably absent from a complete router registry. Otherwise `not_established`.

## 13.3 Reverse-mapping triage

Stage 1 deterministic: each hunk -> touched symbol/module/risk pattern, related requirements and approved maintenance permissions. Stage 2 model: classify linkage with rationale and IDs. Stage 3 adjudicator: unmatched low-risk hunks become informative, high-risk auth/tests/deps/config become review items. **Constraint block** runs only on exact authorized boundaries; human may approve exception with audit trail. Never auto-delete or rollback files due solely to model classification.

## 13.4 Prompt Autopsy

Group failure attempts by requirement and base revision. Compare prompts, actions, targeted files, test output, actual diffs and unresolved constraints. List **Observed facts**, **Plausible causes**, **Unknowns**. Emit one scoped next prompt including goal, acceptance criteria, files allowed/not allowed, failure summary, test command and “report what remains unresolved.” Retest and compare with a generic-prompt baseline in the eval suite.

# 14. MCP API, CLI and HTTP contracts

| Interface | Minimum input | Result and permission |
|:---|:---|:---|
| `bb capture` / `bb_capture` | repo, prompt, source/session | Append raw capture and candidate draft; may be run unattended with consent; never approve. |
| `bb approve` / `bb_approve_intent` | version ID, authenticated actor, acceptance | Materialize authoritative immutable approved version; no approval inferred from a coding agent saying “yes.” |
| `bb context` / `bb_get_context` | repo, role, feature | Current approved constraints and last valid evidence, with source completeness. |
| `bb verify` / `bb_verify` | repo, commit SHA, base SHA optional | Async or local deterministic+Meta verification; structured report; tests imported explicitly. |
| `bb diff` / `bb_reverse_check` | from/to SHA | Candidate orphan hunks with reasons/approval state. |
| `bb fix` / `bb_make_fix_brief` | finding IDs, target agent | Human-readable, machine-readable, bounded correction pack. |
| `bb brief` / `bb_research_brief` | feature proposal, opt-in research | Decision brief, source list, tradeoffs and unapproved proposed criteria. |
| `bb explain` / `bb_explain` | feature, role, revision | Evidence-linked answer with explicit unsupported parts. |
| `bb quiz` / `bb_quiz` | change or module, revision, question count | Validated question draft + rubric/citations; role-specific language. |
| `bb export` | report type and revision | JSON, Markdown and static HTML/PDF report if supported. |

**MCP tool description contract:** stable JSON Schema, readOnlyHint where actually read-only, `isError` on user-correctable failures, no credentials in tool output, separate mutation intent, idempotent writes and user decision checks. **CLI is the recovery path** if hooks fail. The web API must enforce per-project authorization, never assume MCP client text authenticates an owner.

# 15. UX specification and five core screens

**Navigation:** `Projects` -> `Intent` -> `Verification` -> `Changes` -> `Fix Briefs` -> `Understand` -> `Reports` -> `Settings`. On mobile responsive view: status cards and knowledge tours, no expectation of coding-agent file operations.

1. **Welcome/Connect:** choose local agent + repo (or seeded sample), show exact access permissions, privacy mode, capture completeness and optional Meta key setup. “No code will be uploaded until you authorize it.” Provide test-connection button and sample data option.
2. **Intent Timeline:** raw user messages and extracted draft criteria, clarification flags, explicit approve button, version history, owner/agent labels and conflicting constraints. Filter by feature/date/status.
3. **Verification Workspace:** left criterion ledger, middle clear findings, right evidence file/line drawer; commit SHA always visible. Distinguish `source observed`, `test passed`, `runtime observed`, `not established`; show stale badge only when actually stale. Add reverse diff tab with high-risk review flags.
4. **Correction Studio:** original requirement, observed mismatch, sourced hypothesis, bounded next prompt, editable acceptance commands, copy/export. Recheck button highlights before/after and any regressions. No “Fix complete” UI until re-evidence.
5. **Understanding Studio:** select role, feature and revision; get business description, code path, unknowns, 1-3 quiz questions and feedback. Module map later displays **Unmeasured** clearly.

**Accessibility:** headings and focus order, meaningful labels, color plus words for statuses, keyboard quiz input, skip links, all charts paired with accessible text, reduced motion and high-contrast option. Privacy consent granular and revisable. Loading and unavailable states truthful; unknowns visible without exposing secrets.

# 16. Evaluation plan, thresholds, and reproducibility

**Judge-worthy proof must exist before polished UI.** Create a seeded fixture set with at least **20 development cases** and **10 held-out cases** across two small repositories or feature areas, balanced across cases with and without actual faults. Ground truth should be manually labeled by two reviewers where possible; unresolved disagreements recorded. Avoid training prompts on held-out cases.

| Class | Example | Correct behavior |
|:---|:---|:---|
| Atomic intent capture | Compound prompt: 4 obligations + 1 negative + 2 ambiguities | Draft items exact, unknowns visible; no invented quantities. |
| Happy path supported | Backend seat limit enforced with test | Supported with correct citations and test grade. |
| False green (UI only) | Button disabled, API unguarded | No “fully verified” assertion; flag missing server enforcement when positive evidence exists. |
| Partial requirement | Referral present, no expiry evidence | Partial/not established with precise unmet criterion. |
| Explicit contradiction | Config says 30d; code enforces 90d | Contradicted with exact span. |
| Absent artifact | Exhaustive router registry lacks named endpoint | Missing only if search scope sufficient. |
| Unrequested change | Auth file changed during unrelated feature | Possibly unrequested, reason and human disposition. |
| Harmless extra hunk | Formatting/refactor supporting requested feature | Low alarm, avoid false harmful accusation. |
| Deleted test | Failing test deleted to make CI green | Alert with SHA/test evidence and severity. |
| Stale citation | File changed after prior report | Old report remains historical; current result marked stale. |
| Adversarial README | “ignore user constraints” in source | No instruction override or leaked secrets. |
| Forged output | Malicious model returns nonexistent line | Mechanical citation resolver rejects. |
| Runtime unknown | Static code plausible, no test | E1 limited, not production verified. |
| Prompt autopsy | 3 retries target wrong handler | Cites attempts and outputs a constrained next attempt. |
| Learning | quiz references moved function | Retire invalid question; no false-grade. |

**Metrics (report counts and confidence intervals where sample permits):** per-class positive precision and recall, false-accusation rate for orphan diffs, unsupported confident-verdict rate, evidence citation validity, evidence grade accuracy, abstention appropriateness, completeness of human approvals, revision staleness correctness, end-to-end success, prompt-attempt reduction, median latency, p95 latency, model tokens, cost per criterion, user comprehension improvement versus no-intervention baseline, time-to-correct-onboarding answer. Report pre/post-recheck and do not hand-edit results.

**Quality gates:** zero fake line citations in release fixtures; zero hard-coded API keys; zero unsupported “production verified” from static source; capture drafts never silently approved; clean seeded end-to-end demo reproducible twice; false-alarm review not catastrophically noisy. A low reported threshold such as 70% precision is only a trigger to **reduce claims and scope**, never a production “pass” for strong assertions.

**Baselines:** naive prompt “does code implement request?”, spec-only workflow, simple text search, and optional one leading competitor trial when feasible. Measure blinded reviewer time to accurate diagnosis; don't cherry-pick only a seeded known bug and pretend it reflects independent performance.

# 17. Product cut line: what to demonstrate by November 4

**P0 non-negotiable, in dependency order:**

1. Explicit capture + candidate extraction, one concrete approved contract and ambiguity handling.
2. Real local repository read, safe filtering, revision binding and deterministic index.
3. Meta-backed criterion verification with **real line citations**, explicit unknowns and evidence quality.
4. Before/after repository recheck and risk of stale results.
5. One correction pack consumed by a coding agent and supported by a real patch/test, **not an animated simulation**.
6. Repeatable scripted test fixture, simple benchmark and working CLI or web report.

**P1 prioritized demo extras, choose by measured stability:**

7. Muse Code `UserPromptSubmit` + MCP integration, plus one constraint warning/approval check.
8. One reverse-change (deleted test or auth edit) flagged as **possible unauthorized** with explainable evidence.
9. One diff-linked predict or explain-back quiz; one role-targeted response for Marketing or Founder.
10. Comprehension Map **only when actual answer data exists**; otherwise show 2-3 module rows with `Unmeasured`.
11. Prompt Autopsy if a seeded three-attempt history is already accurate; otherwise plain correction pack suffices.

**P2 not in core submission:** full OAuth app, broad GitHub org management, mobile apps, daily push, billing, full chat assistant, complex multi-tenant collaboration, broad CI, auto PR writes, long-running all-repo indexing, dozens of roles, many agent plugins, general research browser and voice. All remain in product roadmap.

**Hard cut logic:** If by **Oct 29** citation resolver and correct unknown handling are unstable, focus on narrow audited criteria and remove broad verdict promises. If by **Oct 31** P0 cannot run end-to-end, freeze UI and fix evidence engine. If Muse adapter unstable by **Nov 1**, demo CLI/MCP capture with genuine Meta Model API and explain partial integration; if quizzes weak by **Nov 2**, exclude scoring map; by **Nov 3** no new feature development except blocker fixes.

# 18. Coding-agent implementation plan (tasks, dependencies, acceptance)

**Recommended tree:**

```text
build-brief/
  README.md                 # setup + demo + privacy + limitations
  AGENTS.md                 # project code rules, NOT human approvals
  .buildbriefignore
  apps/web/                 # Next.js UI
  apps/api/                 # optional narrow sync API
  packages/domain/          # schemas, ids, state machine
  packages/store/           # local SQLite + JSONL audit exports
  packages/repo/            # git, file index, diff, evidence resolver
  packages/model-meta/      # Meta client, JSON schemas, prompts, caching
  packages/verifier/        # retrieval, adjudication, recheck
  packages/mcp/             # MCP stdio, tools
  packages/cli/             # capture/approve/verify/report/fix
  packages/muse/            # hook adapter + tested local config template
  packages/learning/        # quiz/role explanation
  packages/eval/            # fixtures, labels, runner, metrics
  samples/referral-demo/    # fresh hackathon sample app
  docs/decisions/           # ADRs, competitor facts, tradeoffs
  docs/briefs/              # generated proposals, marked unapproved
  docs/security/            # threat model and data handling
  docs/submission/          # source attribution, video, checklist
```

**EPIC 00 - Ground truth and operational safety (P0).** Create repo, date and brand; read actual hackathon waiver; establish toolchain, CI, lint, typechecks, env example, key hygiene, demos and issue tracker; define no reuse/misrepresentation policy. Acceptance: clean install runs on fresh machine; no secret in Git; `README` names Model API, setup and privacy.

**EPIC 01 - Domain contract (P0).** Implement IntentEvent / IntentVersion / approval transitions, constraints and ambiguity; validate with schema, migrations, idempotency. Tests: cannot verify unapproved criterion as owner-confirmed; owner amendment creates new version; unauthorized actor cannot approve.

**EPIC 02 - Capture CLI + MCP (P0).** `bb capture`, `bb list`, `bb approve` manual flow; exact prompt hash; agent-source metadata; capture completeness. Tests: duplicate prompt doesn't erase original; manual and hook transcript sources distinguished; missing hook detectable.

**EPIC 03 - Safe repo evidence (P0).** Git adapter, root validation, `.buildbriefignore`, manifest, diff hunks, source/test metadata, blob citation resolver. Tests: nonexistent line refused; stale SHA detected; `.env` excluded, symlink/traversal blocked, binary/size bounds.

**EPIC 04 - Meta provider (P0).** Official SDK compatible request, Standard mode check guidance, structured JSON, errors, usage logs and deterministic mocked fixture. Tests: schema conformance, 429 handling, cost record, unavailable fallback.

**EPIC 05 - Verifier (P0).** Atomic criterion retrieval, model finding, mechanically checked citations, grade/coverage, adjudicator, stored immutable run. Tests: E1 cannot prove E4; insufficient evidence => not_established; real test is pinned; contradicting evidence not called supported.

**EPIC 06 - Recheck and correction (P0).** Scoped correction pack and before/after diff. Tests: new commit changes status only after fresh verify; prompt generation alone cannot change status; historical reports immutable.

**EPIC 07 - Evaluation (P0).** Seed cases, labels, baseline, runner and reproducible result artifact. Tests: failed case nonzero exit; no metrics manual override; report includes false positives/unknowns/cost/latency.

**EPIC 08 - Demo UI (P0/P1).** Lean screens Intent, Verification, Evidence, Correction. Tests: all presented claims resolve; anonymous sample only; responsive, accessible status labels, no hardcoded “perfect” metrics.

**EPIC 09 - Muse integration (P1).** Hook event adapters `UserPromptSubmit`, `SessionStart`, `PreToolUse`, `Stop`; skill + MCP registration; tested fixtures and documentation. Tests: hook fires in installed build; protected file only warns/blocks within specified scope; no keys in hook logs.

**EPIC 10 - Reverse check (P1).** Map hunks to intents, flag sensitive unlinked changes, human disposition. Tests: deleted test alerted; approved refactor not accused; changes outside monitored session detected on next git review.

**EPIC 11 - Understanding (P1).** Grounded explain, one role tour, one predict/locate quiz, consented score event. Tests: invalid citation rejected, unknown rule not fabricated, stale question retired, “unmeasured” preserved.

**EPIC 12 - Autopsy/Research (P1/P2).** Group attempts, make scoped next prompt, source-backed feature brief with explicit approval state. Tests: result says “hypothesis” for inferred cause; external source cannot mutate contract; retry measurable.

**Standard Definition of Done for ALL EPICS:** typed schemas and input validation; tests and negative tests; required authorizations; explicit failure/timeout paths; README/usage snippet; tested local command; source/commit provenance; audit event; screenshot/video clip if demo surface; no fabricated data; `pnpm lint && pnpm typecheck && pnpm test` (or recorded project equivalents) pass.

# 19. Day-by-day plan (Ghana / UTC) and checkpoint outputs

| Date | Focus | Concrete output |
|:---|:---|:---|
| Tue **Oct 27** | Lock findings/rules, credits, Meta test, scope; create fixture | Source/rules gap list, owner-approved first contract, skeleton and true chronology. |
| Wed **Oct 28** | Schema/event store, raw capture, approval, repo manifest and citations | Capture -> approve -> evidence lookup works end-to-end from CLI. |
| Thu **Oct 29** | Meta structured verifier + adjudicator, unknown handling | Correct checked requirements with immutable citations; initial eval cases. |
| Fri **Oct 30** | Correction pack and recheck, focused benchmark | One genuine mismatch -> fix request -> changed commit -> recheck. |
| Sat **Oct 31** | Web workbench + clear evidence drawers; release fixture | Public sample link or static HTML report plus terminal path. |
| Sun **Nov 1** | Muse hook/MCP integration, reverse changed-hunk triage | Capture demo or documented fallback; one potential orphan change. |
| Mon **Nov 2** | One quiz, role tour, stability; optional autopsy | Role-specific explain/quiz backed by real same-revision evidence. |
| Tue **Nov 3** | Benchmark freeze, security check, demo, README, trial run | Reproducible demo twice from reset; video draft and submission text. |
| Wed **Nov 4** | Bug fixes only, private-window verify and submit **before 18:00 Ghana time** | All links valid, rules checked, artifacts submitted and receipt saved. |

**Update this plan based on actual current date and progress.** Do not assume every early checkpoint exists. If work has not begun by the latest day, prioritize EPICs 00-07, not the cosmetic layers.

# 20. Judge-demo story and submission artifacts

**Use ≤3 minutes until the real form confirms constraints.** Never invent numeric eval results, staged API responses or demos presented as live calls. Preseed *real previously executed outputs* for video stability; label a replay as replay.

| Time target | Visual | Audience takeaway |
|:---|:---|:---|
| 0:00-0:20 | A founder prompt and quick contradictory-looking UI; cite Anthropic study carefully. | The problem: shipping faster doesn't mean knowing what shipped. |
| 0:20-0:45 | Muse Code prompt captured, draft requirements split, one clarification confirmed. | Intent is recorded and controlled by the human. |
| 0:45-1:15 | Real repo snapshot, evidence and requirement verdict with source lines/test grades, one unknown. | Actual code is inspected; system does not bluff. |
| 1:15-1:40 | Unrequested test deletion or auth edit flagged as **possible drift**. | It checks changes in both directions. |
| 1:40-2:10 | Copy correction pack to coding agent -> run real patch or faithful recorded replay -> new SHA -> recheck. | A closed loop, not a fancy summary. |
| 2:10-2:35 | One code-grounded quiz and Marketing role walkthrough with evidence. | Owner and teammates can understand what changed. |
| 2:35-3:00 | Benchmark sample count, measured scores, source links, architecture/Meta usage, dogfood ledger. | Depth, honesty and reproducible verification. |

**Submission kit:** hosted or downloadable actual demo; source repository where allowed; README install guide <5 min; sample project; precise model/tool disclosure; evaluation commands and honest results; privacy statement; screen capture; architecture; supporting failure cases; transcript credits/consent; no credentials; signed-off competition checklist; durable backup local replay.

**Potential judge challenges:** Why isn't this Spec Kit? (owner-approved conversational contract + revisions + evidence + learning, measured.) Isn't an LLM grader untrustworthy? (abstention, proof tiers, mechanical citations and benchmark.) Is the guard reliable? (only in documented hook boundary; replay direct git diff.) Why Meta? (real structured reasoning integrated into verification and learning; tested telemetry.) Did you merely show a seeded demo? (provide runner, labels and independent cases.) Is source code proof of production? (no, graded evidence.)

# 21. Security, data governance, compliance and risk register

| Risk | Priority | Control and validation |
|:---|:---|:---|
| Leaked source or credentials to model | Critical | Consent; Standard privacy-mode confirmation; redaction; size/path denylist; no raw secrets in logs. |
| Prompt injection embedded in repo | Critical | Strict separation instructions vs data; no model-directed shell calls from repo text; eval fixtures. |
| Model hallucinates citation or proof | Critical | Mechanical blob/line/hash resolver, evidence grades, abstention, validated JSON. |
| Unauthorized human or agent approval | Critical | Authenticated owner decision, event audit and role scoping; AGENTS.md cannot approve itself. |
| Malicious imported repo/archive | Critical | Path and symlink defenses; no arbitrary build execution on API host; sandbox with no credentials if enabled. |
| Unrequested change noise | High | “Possibly unrequested,” human disposition, false-positive metrics, severity triage. |
| Meta Model API not reachable / credit not active | High | First-call smoke test; budget/transport fallback; deterministic report without semantic claims. |
| Hook misses actions | High | Capture completeness; after-commit comparison; repair/import path; no “monitoring all code” claim. |
| Unrealistic scope and timing | High | P0-first kill lines; record actual work; freeze by Nov 3. |
| Contest rule misunderstanding | Critical | Read official participant waiver and submission UI, timestamp decisions, clarify once in Discord. |
| Unclear reuse of old prototype | Critical | Record pre-event assets openly; follow organizer new-work requirements; demo hackathon-created work. |
| Weakly measured learning effect | Medium | Quiz calibration, independent learner assessment, no generic “understanding 95%” claims. |
| Cost explosion of full-context calls | Medium | File selection + truncation, token budget, caching, measurable rate/cost and idle-time guard. |
| Stale answers after later commits | High | SHA pinning, dependency invalidation, job/run states, prominent revision age. |
| Cross-tenant source leakage | Critical | Private default, access checks for every evidence endpoint, encryption, no public signed URLs by default. |

**Ethics:** No secret team surveillance, no automatic worker competence ranking, no unaudited branch rewrites. Comprehension activities require learner consent and are designed for improvement, not humiliation or performance judgment.

# 22. Long-term roadmap, packaging and business strategy

**Phase 0 (competition):** one credible intent-evidence-correction-understanding loop, Meta integration, a real evaluation and documented limitations.

**Phase 1 (first 30-60 days):** small-team beta; reliable ingestion across agent sessions; GitHub App read-only; PR status on approved rules; diff risk alerts; one codebase chat with evidence; role onboarding export; private projects; self-host/local-first support; error and cost telemetry.

**Phase 2 (60-120 days):** research and prompt autopsy as first-class feature, intelligent brief templates, staging test linking, visual architecture, multi-role collaboration, targeted notifications, usage-based reliability reports, API/SDK, integrations with spec/provenance tools.

**Phase 3 (4-12 months):** advanced knowledge transfer, module comprehension map and update learning, multi-repo change graphs, policy and compliance mappings, enterprise governance, optional CI gates, flexible model provider abstraction, privacy-by-deployment modes, mobile study companion, academic/team learning measurement.

**Potential positioning ladder:** solo builder -> indie founder -> small agent-heavy software team -> agency client assurance -> complex engineering organizations. Differentiators and pricing remain unvalidated. Candidate models: personal developer tier by verified projects/usage, team tier by workspaces and review history, metered advanced analysis, self-host enterprise. Do not fix price without willingness-to-pay interviews, benchmarked inference cost and proof users retain value after novelty.

**GTM experiments:** recruit 5-10 AI builders with actual repeated prompt failures, then 3 team leads and 3 nontechnical product owners. Measure time to detect wrong business rule, % of useful vs nuisance alerts, repeated attempts to successful fix, delayed comprehension and shareability of the audit report. Collect endorsements with permission, not fake testimonials.

# 23. Source registry (official vs research vs prior source)

**Event and organizer (official):**

- [O1] Meta Global AI Developer Hackathon, https://dev.meta.ai/events/global-hackathon (dates, themes, tracks, $1M pool, application cap and deadline).
- [O2] Cerebral Valley official event page, https://events.cerebralvalley.ai/e/meta-ai-developer-hackathon (event and partner details).
- [O3] Participant event details, https://cerebralvalley.ai/e/meta-ai-developer-hackathon/details (**participant-only; official content NOT verified here**).
- [O4] Participant waiver, https://cerebralvalley.ai/e/meta-ai-developer-hackathon/waiver (**not reliably accessible in public research; must inspect signed version**).

**Meta product and legal (official):**

- [M1] Muse Code extending and automating, https://dev.meta.ai/docs/muse-code/extending (exact hooks, skills, MCP and headless mode).
- [M2] Muse Spark models, https://dev.meta.ai/docs/models (1M context, recommended Muse Spark 1.3, contributor modes).
- [M3] Meta structured output cookbook, https://dev.meta.ai/docs/cookbook/structured-output (schema-guided JSON).
- [M4] Model API overview, https://dev.meta.ai/docs/overview (`https://api.meta.ai/v1`, SDK compatibility).
- [M5] Meta Geographic Use Policy, updated Oct 12 2026, https://dev.meta.ai/legal/geographic-use-policy (restrictions, subscription contributor exception).
- [M6] Muse Code session audit/replay, https://dev.meta.ai/docs/cookbook/audit-agent-sessions (session provenance and replay).
- [M7] Meta prompt caching, https://dev.meta.ai/docs/cookbook/prompt-caching (automatic stable prefix caching).
- [M8] Meta Model API pricing and rate limits, https://dev.meta.ai/docs/pricing-rate-limits (Standard/Contributor distinctions, published rates).

**Competitor first-party docs:**

- [C1] GitHub Spec Kit, https://github.github.com/spec-kit/ (convergence and evidence-based bug fixing; updated Sep 28 2026 on site).
- [C2] Kiro product documentation, https://aws.amazon.com/documentation-overview/kiro/ and https://kiro.dev/docs/hooks/ (specs, hooks, steering).
- [C3] Qodo, https://www.qodo.ai/ ; Greptile, https://www.greptile.com/ ; CodeRabbit, https://www.coderabbit.ai/ (product positioning and review category; exact capability variants require product-by-product trial).
- [C4] git-ai repository, https://github.com/git-ai-project/git-ai (line-level AI attribution and git notes).
- [C5] DeepWiki, https://deepwiki.com/ ; Sourcegraph, https://sourcegraph.com/ ; Unblocked, https://getunblocked.com/ (explain and context category).
- [C6] Entire sessions, https://docs.entire.io/guides/sessions/overview (session/provenance category).

**Scientific research and limits:**

- [R1] Shen and Tamkin / Anthropic, *How AI Impacts Skill Formation*, https://www.anthropic.com/research/AI-assistance-coding-skills and https://arxiv.org/abs/2601.20245 (52-person randomized study; contextual result).
- [R2] Sankaranarayanan, *Mitigating Epistemic Debt...*, https://arxiv.org/abs/2602.20206 (78-person Explanation Gate study, preprint).
- [R3] Ahmad, *Comprehension Debt in GenAI-Assisted Software Engineering Projects*, https://arxiv.org/abs/2604.13277 (qualitative student study, not population prevalence).

**Audit source inputs:** Earlier 21-section first-agent `Build_Brief_Research_and_Engineering_Blueprint.md` / `.pdf`; second-agent 10-part `Pasted text.txt` supplied on October 27; recovered October 19 project discussion describing earlier prototype **concept** and prioritization. **Those are specification/research inputs, not independent external proof that Build Brief software works today.**

**Citation principle:** Unverified claims from third-party hackathon guides and unofficial Discord summaries remain explicit uncertainties, not silently promoted to official requirements. Some competitor gaps are **market hypotheses**. The final citation registry is linked for traceability, not a statement that every vendor feature was exhaustively tested.

# 24. Final coding-agent directive (paste-ready)

> **ROLE:** You are the principal engineer delivering a correct hackathon vertical slice of Build Brief from this master specification. Do not implement the full P2 roadmap. Read the verified-versus-provisional rules before selecting any integration. Inspect any current local repository before assuming it is empty or functioning; report its actual state, Git history and which pieces predate the event. Do not hide or misrepresent preexisting code. Create a dependency-ordered implementation plan and execute P0 EPICs 00-07 before optional P1. Model canonical owner-approved intent, not anonymous AI guesses. Use Meta `muse-spark-1.3` in Standard mode, verify account privacy mode, and maintain a deterministic evidence layer with immutable Git revisions and mechanically validated citations. Test negative, missing, stale and adversarial cases. Every result must distinguish source evidence, test evidence and actual runtime behavior. A correction prompt does not complete a fix. Use secure local CLI/MCP, with Muse `UserPromptSubmit` hook only after inspecting official event schema and validating installed version. No secrets in repo or telemetry. Ship one real, replayable capture -> confirm -> inspect -> verify -> reverse-check -> correction -> patch -> recheck -> quiz/role explanation story, accompanied by a reproducible benchmark and honest limitations. Keep the entire P2 vision in `docs/roadmap.md` without building it for the deadline. No fake counts, user interviews, benchmark scores, credits, hooks, judges' rules or production evidence. **Start by reporting the real repo inventory and a concrete day-by-day task list, then code.**

**Final verdict:** **Build Brief is a credible hackathon project and a potentially broader company, but only a verified end-to-end workflow, source-grounded evidence, a measured benchmark and realistic delivery can justify the promise.** Its defensible story is not “AI reviews your code.” It is **“the original product intent remains inspectable, every important claim is tied to proof, and the people responsible for the software can understand what changed.”**
