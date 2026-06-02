# Anchoring and Authoring

How the tour points at elements reliably across 13+ screens, and how the tour content is written and kept honest, without coupling to fragile DOM or touching app code.

## The `data-tour-id` convention (the key coupling decision)

The tour anchors by a dedicated `data-tour-id` attribute, never by CSS class, text, or nth-child, and not by `data-testid` (which can be stripped in production builds and couples the tour to the test suite). The `data-tour-id` is owned by the tour layer, intentionally retained in the demo build, and threaded once through the shared pattern-library components so it is stable across all 71 screens and survives a restyle.

Components that carry it (added at the shared-component level, `../patterns/04-shared-components.md`, so it is set once and inherited everywhere):
- `PageHeader` -> on its primary-action button (`tourId` prop).
- `DataTable` -> on the row and the row-action menu; addressable to a specific seeded record (REQ-HERO, RFQ-HERO, INV-HERO) via `tourId(row)` plus a `within` scope, so the tour targets that row, not "a row".
- `FieldRenderer` / `LineItemEditor` -> `data-tour-id={fieldKey}` so `autofill` can target a field, and `useTourField` can register its setter.
- `RuleBanner` -> `data-tour-id={banner.key}` (e.g. `landed-flip`, `duplicate-hold`, `budget-over`, `tolerance-amend`, `capa-near-suspend`). These banners are the marquee moments, so they must be anchorable.
- `StatusBadge`, `KpiCard`, `ApprovalAccordion` stage rows, and the comparison-table columns each carry an id.

### Naming scheme and the registry

`{screen}.{element}[.{record}]`, for example `sourcing.compare.column.synthex`, `invoice.match.run-button`, `analytics.kpi.otif`, `requisition.banner.budget-over`. Every id is enumerated as a typed constant in `lib/tour/anchors.ts`, so the script references symbols (autocompleted, refactor-safe), not stringly-typed selectors, and `tour-lint` can assert every anchor a step references exists in the registry.

### Resilience

`anchorReady` (the engine, `01-tour-engine.md`) waits for the node with a bounded timeout; scrolls a virtualized/off-screen hero row into view first; and if an anchor truly never resolves, degrades to a centered coach-mark rather than breaking the tour. Because the script references stable semantic ids and the components own where those ids sit, a restyle or a DOM refactor cannot break the tour as long as the id moves with its element.

## The authoring model (content without code)

The tour is data in two files, mirroring how the build-spec separates structure from copy:

- **`lib/tour/script.p2p.ts`** (the structure): the ordered chapters/steps, each referencing an anchor symbol (`anchors.ts`), a route symbol (`routes.ts`), a persona, an action, and an advance condition. An engineer edits this.
- **`lib/tour/narration.p2p.ts`** (the copy): the keyed narration strings per step, with interpolation tokens. An author edits this without reading orchestration.

TypeScript is preferred over JSON for the typed anchor/route symbols and editor autocomplete; a Zod-validated JSON variant is possible if a fully non-engineer workflow is ever needed (and could later be edited in a simple admin screen).

### Narration reuses the copy layer

Narration pulls terminology from `../copy/` (`enumLabels`, `fieldLabel`, `messages`) so the tour says "Awaiting approval", "landed cost", "non-conformance report", "three-way match" exactly as the app does. One terminology source, no drift. Numbers are interpolation tokens resolved from the live query result at render time (`{landed.synthex}`, `{kpi.otif}`, `{reqHero.overBudgetAmount}`), never literals. This is the honesty guardrail as a mechanism: if the seed changes, the narration changes with it, and a presenter cannot narrate a number the screen does not show.

### Authoring ergonomics

- A Zod schema validates the script at load (a malformed step fails loudly, not silently).
- A dev-only "tour author mode" highlights every `data-tour-id` on the current screen and lets the author click an element to copy its anchor symbol to the clipboard, so writing `anchor: { tourId: ... }` does not require reading component code.
- `scripts/tour-lint.ts` asserts, before a demo rather than during it: every step's `anchor` exists in the registry, every `route` exists in the route map (`../ia/01-information-architecture.md`), every `persona` exists in the seed, every `narration` key resolves, every interpolation token maps to a known live value, and no banned "AI"/"ML" substring appears in narration.

## Location rationale

The tour script and narration live under `lib/tour/` (peer to `lib/copy/`, `lib/rbac/`) because they are demo content, not screens. Keeping them out of `app/` and `components/` means content edits never touch routing or UI code, and the whole tour layer is additive and removable.
