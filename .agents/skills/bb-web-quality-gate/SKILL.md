---
name: bb-web-quality-gate
description: Pre-commit quality checklist for apps/web changes. Run through it before reporting any frontend work done: accessibility, forms, honesty, performance.
---

# BuildBrief web quality gate

Check every touched page against this list. Fail the work if any item fails.

## Accessibility

- Every input has a `<label>` or `aria-label`; icon-only buttons have
  `aria-label`. Skip link present. Headings hierarchical, one `h1`.
- `:focus-visible` outlines everywhere; never remove outlines without a
  replacement. `prefers-reduced-motion` disables animation.

## Honesty (product-specific, non-negotiable)

- No invented percentages, scores, trends, or counts. Every number traces
  to `apps/web/lib/ledger.ts` output rendered on that page.
- Rules-based findings say rules-based. The word "Meta" appears only when
  the report's provider is actually `meta`.
- Auth, billing, cloud sync, invitations: never presented as implemented.
- Empty states explain what is missing and the exact next action.

## Forms and feedback

- Server-form POSTs keep native behavior (browser loading is the loading
  state — do not fake spinners that cannot track the request).
- Errors render inline on the resulting page with the missing field named.
- Placeholders show example patterns, end with `…` where truncated.

## Performance

- Zero client JS is the budget. No new runtime dependency without a
  written reason; `<details>` + query-param navigation before islands.
- Tables scroll horizontally on narrow screens; grids collapse to one column.

## Upstream references (read live, not vendored)

- Vercel Web Interface Guidelines:
  https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
- Vercel React Best Practices (server-first, anti-waterfall, bundle rules):
  https://github.com/vercel-labs/agent-skills (react-best-practices, MIT)
