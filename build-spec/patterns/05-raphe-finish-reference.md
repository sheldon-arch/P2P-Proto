# Raphe Finish Reference

The specific visual-finish details observed in the real Raphe mPhibr UI (41 screenshots, `User Flows/Raphe UI Screenshots/`), to bring our prototype to the same polish level. Our structure already matches Raphe; this captures the FINISH details that make it feel like a real product. Decisions: full finish pass; KEEP our left sidebar (do not adopt Raphe's top-bar nav). Use our existing design tokens (`01-design-tokens.md`); this is finish, not a reskin.

## The Raphe look (overall)

Clean, light, professional B2B SaaS. White cards on a near-white background, rounded corners (our `rounded`/8px), soft shadows on hero cards, 1px borders on plain cards, generous whitespace, one dark primary button. A warm, encouraging tone in places. Status conveyed by colored dots + pills.

## Component-level finish details to implement

### KpiCard — two variants
1. **Plain metric tile** (the 5-tile analytics row): big number + label + a small lucide icon top-right in a muted/tinted circle; optional trend; optional helper tooltip. Tighter than ours: number is large (text-display), label is caption/muted.
2. **NEW gradient hero variant** (`variant="hero"`): the Execution Streak / OTIF cards. A soft gradient background (warm amber->cream for streak; green->mint for OTIF), a large rounded icon chip on the left (flame, target ring, etc.), the big metric + a small encouraging sub-line ("Top 73% in your vertical", "Personal best is 2 days!"). Used on the dashboard/Task Center landing. Props: add `variant?: 'plain'|'hero'`, `icon?` (lucide component or name), `accent?` (which gradient), `subline?`.

### DetailSummaryCard (NEW shared component)
The left-panel summary card on Raphe's ticket detail: a vertical list of fields, each row = a small muted lucide icon + a label + the value (right-aligned or below). Fields like Status, Amount, Project, Supplier, Requester, Department, Creator, Created, Last Updated. Icon-prefixed, compact, clean. Build it generic: `<DetailSummaryCard fields={[{icon, label, value}]} />`. This is the biggest single "feels like Raphe" win on detail screens.

### Verticals / ApprovalAccordion finish
The per-vertical approval block (Req Department / Procurement / Finance / Management): each is a collapsible row with the vertical name + a green "Approved" pill (or amber "Awaiting"/grey "Not started") + the approver's avatar (initials) on the right; expanded shows "Approved by {name}", "Assigned to {name}", "Last updated {timestamp}", each icon-prefixed. (If we have an ApprovalAccordion, finish it; else add the per-vertical card styling.)

### StatusBadge — dot + pill refinement
Raphe pills are small, rounded-full, soft-tinted background + saturated text, often with a leading colored dot. Refine our StatusBadge: rounded-full, `px-2 py-0.5 text-caption`, a leading 6px dot in the status color, tinted bg. Keep the 7 color tokens. The dot+pill combo is the signature.

### Ticket card (list/queue) finish
The 4-vertical chain: 4 equal columns (Req Department / Procurement / Finance / Management), each a bordered cell with the vertical name (caption, muted, centered) + a status dot + state text + a small assignee avatar/name. Plus: identifier (semibold), priority pill + stage pill, an overdue badge (red, "3 days overdue"), and a primary action button ("Needs Approval ->"). Build/finish a `TicketChainCard` for the queue screens.

### PageHeader finish
Title (text-display semibold) + count in muted parens + subtitle line; right-aligned action button(s). Add support for an optional secondary "Import"/"Export" outline button group (master-data screens show Import/Export/Add).

### FieldRenderer (read mode) — history affordance
Raphe shows a small clock icon next to each field (per-field change history). In read mode, render a subtle clock icon button (lucide `History`/`Clock`) after the label; clicking is a no-op stub for the prototype (or opens a tiny popover "No changes recorded"). Just the affordance, so detail screens look like Raphe's.

### Gradient Focus Queue banner
The Task Center's blue-gradient banner ("Focus Queue — High priority tasks requiring your attention" + a right-side "Today's Progress 0/3" + "Value Processed"). A reusable banner with a gradient background, a lightning icon, a title+subtitle, and optional right-side mini-stats.

### Microcopy (warm tone)
On landings, add Raphe's encouraging voice where appropriate: a subtitle like "Keep up the momentum" on the Task Center, "Top X% in your vertical" sub-lines on hero KPIs. Keep it professional, not cheesy; no emojis (per global style). NO "AI"/"ML".

## What NOT to change
- The left sidebar (keep it; do not switch to top-bar nav).
- The design tokens / neutral palette (this is finish on top of them; the gradients use tints of the existing status/brand tokens).
- Any data, state machine, route, or test. Pure presentational finish.
- The hero screens' core logic (landed-cost flip, match panes, KPI numbers) — only their visual finish.

## Color/gradient notes (use token tints)
- Hero streak card: amber/cream gradient from `--progress`/`--warning` tints.
- Hero OTIF card: green/mint from `--success` tints.
- Focus Queue banner: brand blue gradient from `--primary` + a lighter tint.
- Status dots/pills: the 7 semantic tokens (success/progress/info/warning/danger/neutral/muted).
- Avatars: initials on a tinted circle (we already have Avatar via Radix).
