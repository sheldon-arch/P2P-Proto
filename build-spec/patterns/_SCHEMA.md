# shadcn Component / Pattern Library Spec

Task #8 of the pre-prototype readiness set. The shared visual and interaction vocabulary every screen is built from. The 71 screens (`../screens/`) are instances of a small set of archetypes; this library specifies each archetype once, as shadcn primitives, so all screens look and behave consistently and a builder composes a screen instead of inventing one.

## Direction (locked, 2026-06-01) [[ui-direction-decisions]]

- **Raphe-inspired, cleaned up.** Raphe's interaction structure and screen patterns are the baseline ([[raphe-ui-ux-reference]], `UI-UX Reference/`); the visual skin is a fresh, neutral shadcn design-token set, ours, not Raphe's exact palette or branding. Restyle, do not replicate.
- **Model wins, Raphe adapts.** Where the unified model needs something Raphe never had (sourcing/landed-cost comparison, three-way-match workbench, returns/RMA, budget/finance control, supplier portal), build a new pattern on the same primitives. Never trim a model feature for lack of a Raphe precedent.

Raphe is already Radix-based, so its `@repo/ui` inventory maps 1:1 to shadcn. This library is that inventory transcribed to shadcn, neutralized of Raphe naming (Ramco -> ERP, mPhibr/aerospace -> generic, vertical -> our role model), plus the archetypes the model adds.

## Files in this layer

- **`_SCHEMA.md`** (this file): direction, the primitive inventory, the archetype list, and the conventions every pattern follows.
- **`01-design-tokens.md`**: the neutral design-token set (color, type, spacing, radius, elevation, density) and the status-color map that binds the enum color tokens from `../copy/01-enum-labels.md` to concrete classes.
- **`02-primitives.md`**: the shadcn primitive inventory, the Raphe-to-shadcn mapping, and the value-type-to-control map (the field engine's `ApprovalField` rendering, generalized).
- **`03-archetypes.md`**: the ~10 screen archetypes (list, queue, detail, form, wizard, dashboard, comparison, workbench, modal, portal), each specified once: composition, states, behavior, and which screens use it.
- **`04-shared-components.md`**: the reusable components built on the primitives (DataTable, StatusBadge, EmptyState, Loader, PageHeader, KpiCard, FieldRenderer, FilterBar, FormSection, LineItemEditor, FileUpload, RuleBanner, RoleSwitcher, etc.), each with props and the screens that consume it.

## Conventions every pattern follows

1. **State coverage.** Every data pattern handles five states explicitly: loading (skeleton or Loader), empty (EmptyState from `../copy/04-empty-states.md`), error (toast), populated, and permission-denied (control hidden or Unauthorized view). No pattern ships without all five designed.
2. **Permission-gated controls.** Every action button is wrapped by the RBAC resolver (`../ia/rbac.ts`, `useCan` / `canWithCondition`). A control the user cannot use is hidden, not disabled-with-no-explanation. Buttons for illegal state-machine transitions are also hidden (`../schema/state-machines.ts`).
3. **No inline strings.** Labels, enum values, messages, and empty copy come from the copy layer (`../copy/`), never hard-typed in a component. StatusBadge reads `enumLabels`; FieldRenderer reads `fieldLabel`; EmptyState reads `emptyState`.
4. **URL-held view state.** List/detail filter, tab, and pagination state live in URL search params (Raphe convention), so views are shareable and survive back/forward.
5. **Forms.** react-hook-form + Zod (schema generated from `../schema/`), shared client/server validation, submit label switches Create/Update and disables while pending. Create and Edit reuse one component (id presence switches mode) so they cannot drift.
6. **Density and layout.** Desktop-first. shadcn defaults impose sensible layout, so per-screen pixel specs are unnecessary except the hero screens (`../ux/`). Content priority order is set by the screen spec; this library sets the WHERE.
7. **Accessibility.** Inherited from shadcn/Radix (focus management, keyboard nav, ARIA). Status is never color-only: a StatusBadge carries text, not just a hue, so it reads without color.

## The archetype set (count of screens using each, from the inventory)

| Archetype | Screens | Raphe baseline | New for the model |
| --- | --- | --- | --- |
| list / queue | 22 | suppliers-list, items-list, master-data, task-center | model queues (match, inspections, returns) reuse it |
| form | 20 | ticket-create, supplier-create, item-create-edit | budget/finance forms reuse it |
| detail | 8 | ticket-detail (resizable two-panel) | PO, supplier, scorecard detail reuse it |
| dashboard | 7 | analytics-dashboard, task-center metric cards | budget commitment-vs-actual, scorecard |
| workbench | 3 | none (roadmap in Raphe) | match exception + CAPA + returns: build-new |
| modal | 3 | Dialog/AlertDialog/Sheet across Raphe | reused |
| portal | 3 | none (Raphe internal-only) | supplier portal: build-new on login + form patterns |
| comparison | 1 | none (Raphe used preferred-supplier) | landed-cost comparison: build-new, the marquee |
| wizard | 1 | bulk-import dialog steps | onboarding/import wizard |

These resolve to the ~7 reusable archetypes the readiness brief called for (list and queue share one base; modal is a primitive composition; layout is the shell from task #6). Build each once in `03-archetypes.md`; every screen composes from them.
