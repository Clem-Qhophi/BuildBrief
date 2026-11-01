---
name: bb-frontend-direction
description: Art direction for the BuildBrief web app. Use when creating or restyling any human-viewed page in apps/web: subject-grounded choices, workflow-as-sequence, motion that answers actions.
---

# BuildBrief frontend direction

## Subject (ground every choice here)

BuildBrief answers one question: **did the AI build what was asked?** The
visual language is an *evidence workspace*, not a generic SaaS dashboard.
Materials of the subject: requirements, source code, test runs, revisions,
verdicts. Let those shape the design — verdict badges, evidence tiers
(E1 source / E2 test), revision hashes, before/after runs.

## Rules

- The workflow Connect → Describe → Approve → Verify → Fix → Recheck is a
  real sequence: steppers and numbered markers are allowed **only** for it.
- No generic hero, no three-counter stat cards, no gradient headline text.
- One type scale; headings use `text-wrap: balance`. Ellipsis `…`, never `...`.
- Motion answers a user action (expand evidence, switch finding, confirm
  approval). No scroll-triggered entrance choreography, no decorative loops.
- Dark-first surfaces; verdict colors are semantic and fixed:
  supported green, partial amber, contradicted/critical red,
  informative blue. Never repurpose them for decoration.
- Raw ledger internals (event ids, store paths) stay in drill-downs, never
  as primary labels. Feature names, file paths, revisions lead.
- Every button does a real thing or says why it cannot. Zero-JS constraint:
  this app is server-rendered forms — reach for `<details>`, query-param
  tabs, and CSS before any client component.

## Upstream guidance (read, not vendored)

- Anthropic frontend-design skill (distinctive direction, anti-template):
  https://github.com/anthropics/skills/tree/main/skills/frontend-design
  (upstream LICENSE.txt applies; no upstream text copied here)
