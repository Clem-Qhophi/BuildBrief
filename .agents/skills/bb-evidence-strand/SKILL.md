---
name: bb-evidence-strand
description: Flagship intent-to-evidence strand for BuildBrief. Use when building or restyling the dashboard, run report, or evidence views in apps/web.
---

# BuildBrief evidence strand

## The one memorable thing

Every criterion is a thread: **Requested → Cited evidence → Verdict**.
The thread is drawn, coloured, and broken by the real verdict:

- `supported`: solid green thread, closed node, evidence tier shown (E1/E2).
- `partial`: solid amber thread, half node.
- `contradicted`: solid red thread, crossed node.
- `not_established`: dashed grey thread ending in an open node labelled
  "no citation yet" when evidence is empty. Never draw a thread to nowhere.

Spend boldness here. Everything around the strand stays quiet: bone text on
graphite, copper only for interactive elements, verdict colours never used
for decoration.

## Motion rules

- Runtime motion lives in one client island (`EvidenceStrand`, `motion/react`).
  It animates only state the user caused: filtering threads, expanding a
  thread to its rationale, and the first draw-in of threads on a run report.
- `useReducedMotion` (client) and `prefers-reduced-motion` (CSS) disable it.
- No scroll choreography, no loops, no particles, no decorative 3D.
- The server-rendered findings list below the strand is the accessible,
  no-JS equivalent. Never remove it to "clean up" the page.

## Honesty rules (inherited, non-negotiable)

- Threads connect only stored relationships: report results, their evidence
  pointers, and findings. No sample threads on real pages.
- Counts always carry denominators. Rules findings say rules-based.
- An empty strand is an empty state with the exact next action, not a demo.

## Upstream references (read live, not vendored)

- Motion (MIT): https://github.com/motiondivision/motion — `motion/react`,
  `AnimatePresence`, `useReducedMotion` only.
- Anthropic frontend-design skill:
  https://github.com/anthropics/skills/tree/main/skills/frontend-design
- Vercel agent skills (react-best-practices, web-design-guidelines, MIT):
  https://github.com/vercel-labs/agent-skills
- Rejected for this bundle, with reasons in `docs/DECISIONS.md` ADR-016:
  shadcn/ui + Tailwind, React Bits (MIT + Commons Clause), R3F/Drei/Three,
  Rive, Remotion (special company licence), UI UX Pro Max installer.
