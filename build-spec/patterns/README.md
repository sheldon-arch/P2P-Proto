# shadcn Pattern Library

Task #8 of the pre-prototype readiness set. The shared visual and interaction vocabulary every screen is built from: the design tokens (our neutral skin), the primitive inventory (Raphe `@repo/ui` -> shadcn, 1:1), the ~10 screen archetypes (built once, composed everywhere), and the shared components (the concrete pieces a builder imports). Agreeing this before parallel screen work is what keeps the 71 screens (`../screens/`) consistent.

Direction (locked, [[ui-direction-decisions]]): **Raphe-inspired, cleaned up** (Raphe's structure and interaction patterns, our fresh shadcn skin, not a clone) and **model wins, Raphe adapts** (build-new patterns where the model is richer than Raphe). Baseline: [[raphe-ui-ux-reference]] + [[ui-ux-to-unified-mapping]].

## Files

| File | Content |
| --- | --- |
| `_SCHEMA.md` | direction, primitive inventory summary, the archetype list, the 7 conventions every pattern follows |
| `01-design-tokens.md` | the neutral design-token set (color, type, spacing, radius, density) + the status-color map binding the enum color tokens from `../copy/01` to Badge variants |
| `02-primitives.md` | Raphe `@repo/ui` -> shadcn 1:1 map + the value-type-to-control map (the field engine generalized) |
| `03-archetypes.md` | the ~10 archetypes (list/queue, detail, form, wizard, dashboard, comparison, workbench, modal, portal, shell), each: composition, states, behavior, baseline (ADOPT/BUILD-NEW), screens that use it |
| `04-shared-components.md` | the reusable components (DataTable, StatusBadge, KpiCard, FieldRenderer, LineItemEditor, RuleBanner, RoleSwitcher, RbacGate, ApprovalAccordion, etc.) with props + consumers + build order |

## How it fits the other layers

- Reads from **copy** (`../copy/`): StatusBadge reads `enumLabels`, FieldRenderer reads `fieldLabel`, EmptyState reads `emptyState`, RuleBanner and ConfirmDialog and Toast read `messages`. No component inlines a string.
- Reads from **schema** (`../schema/`): forms use Zod schemas; RbacGate and row actions hide controls for illegal state-machine transitions.
- Reads from **IA** (`../ia/`, task #6): AppShell, navForRole, useCan/canWithCondition, RoleSwitcher.
- Feeds **screens** (`../screens/`): each screen names an archetype and composes shared components.
- Feeds **task #9**: the mock layer's hook shape mirrors Raphe's TanStack Query hooks; the FieldRenderer and state-machine effects are the only mutators path.

## Coverage (verified)

- Every archetype tag used across the 71 screens resolves to one specified archetype (list, queue, detail, form, wizard, dashboard, card, comparison, workbench, modal, portal, layout): no screen needs an unspecified pattern.
- Every status-color token in `../copy/01-enum-labels.md` (success, progress, info, warning, danger, neutral, muted) binds to a Badge variant and palette token in `01-design-tokens.md`.
- The Raphe `@repo/ui` inventory maps 1:1 to shadcn; the net-new primitives (stepper, chart, command, calendar) are standard shadcn.
- The ~40% build-new surfaces (comparison, three-way-match workbench, returns workbench, supplier portal, budget/finance UI) are specified on the same primitives as the ~60% adopted from Raphe.

## The credibility point

A consistent component set is half of what makes the prototype read as a real product rather than a set of demo screens. The other half is the copy layer (task #7) and the seeded data (task #3). Together: real data, in consistent patterns, with exact words.
