# Screen Archetypes

Each recurring screen shape, specified once. A screen in `../screens/` names its archetype; the builder composes it from the spec here rather than designing it fresh. Composition uses the primitives (`02-primitives.md`) and the tokens (`01-design-tokens.md`); copy comes from `../copy/`. Every archetype covers the five states (loading, empty, error, populated, permission-denied).

Baseline source noted per archetype: ADOPT (Raphe has it, restyle), or BUILD-NEW (model adds it, build on these primitives). Per [[ui-direction-decisions]]: Raphe structure, our skin, model wins on conflict.

---

## 1. List / Queue  (22 screens) : ADOPT (Raphe suppliers-list, items-list, master-data, task-center)

A list of one entity type. A queue is a list filtered to "what needs this role" with urgency ordering; same skeleton.

**Composition (top to bottom):**
- PageHeader: title + count, optional subtitle, right-aligned primary action (e.g. "Add supplier", gated by `*.create`).
- Optional KpiCard row (suppliers-list and queues show 3-5 metric cards: e.g. open count, overdue, this-period spend).
- FilterBar: debounced Searchbar (400ms server / immediate client) + faceted filters (status, category, supplier, date range) as Select/Combobox/MultiSelect; active filters show as removable chips; state held in URL.
- DataTable: sortable columns, StatusBadge cells, mono for identifiers/codes/money, per-row action menu (DropdownMenu) gated per action, optional row tint for danger/success/muted states, optional density toggle.
- Pagination footer: server (query `{page,limit,search,filters}`) for large/unbounded sets; client (`pageSize=10`) for bounded master data.

**Queue specifics:** sub-tabs by urgency (Overdue / Due soon / Upcoming) with count badges; default sort by urgency weight then need-by date; the row's primary action is the next legal transition ("Approve", "Run match", "Post GRN").

**States:** loading = table skeleton + KpiCard skeletons; empty = EmptyState (`../copy/04`, queue-empty is reassuring, list-empty invites create); error = toast; permission-denied = the list route is gated, Unauthorized view.

**Used by:** Requisitions, Suppliers, Items, POs, RFQs, Approvals, Deliveries, Inspections, Match exceptions, Invoices, Payments-to-release, Returns, NCRs, all master-data lists, Audit log, Users, Routing rules.

## 2. Detail  (8 screens) : ADOPT (Raphe ticket-detail, the resizable two-panel)

A single record with its lifecycle, related data, and actions.

**Composition:** a two-region layout (the ticket-detail baseline, restyled). For dense records (requisition/order) a Resizable two-panel: LEFT (~40%) = header (back, identifier mono, priority + status StatusBadges, primary lifecycle actions) + a summary Card (amount with base `≈`, supplier, requester, dates, project) + the approval accordion (archetype-embedded, see below). RIGHT (~60%) = Tabs (Details / Lines / Documents / Audit), the field-driven content (FieldRenderer grouped by stage), comments and attachments in Sheets with count badges, a "Save changes" bar when dirty. For simpler records (supplier, item, scorecard) a single column of Card sections + a sticky right rail (Attachments / Audit).

**Approval accordion (embedded, the Raphe TicketDetailsVerticals pattern):** one row per approval stage/vertical, each showing its CompletionStatus badge, the assignee avatar, and the stage actions (Request approval / Assign / Approve), gated by `useCan` + SoD (`canWithCondition`: never approve own). Auto-approved stages show the "Auto-approved" info badge instead of an approver. This is how the model's configurable multi-stage chain renders (adapted from Raphe's fixed verticals).

**States:** loading = Loader "Loading ...details"; per-panel loaders for comments/attachments/audit; field history popover loader. Error = toast. Permission-denied = route gated.

**Used by:** Requisition detail, PO detail, Supplier detail, Item detail, Scorecard detail, RFQ detail, NCR/CAPA detail, Invoice detail.

## 3. Form  (20 screens) : ADOPT (Raphe ticket-create, supplier-create, item-create-edit)

Create or edit a record. Create and Edit are one component (id presence switches mode), so they cannot drift.

**Composition:** Card sections grouped by concern (supplier: General / Addresses / Financial / Compliance; item: 8 sections; requisition: header + lines). react-hook-form + Zod (schema from `../schema/`). Within a section, FieldRenderer drives each control from the field config (`02-primitives.md` value-type map). Field arrays (LineItemEditor) for lines, addresses, payment schedules, source priorities. Submit bar: label switches Create / Update, disabled while pending; validation messages from `../copy/03`.

**Two layouts:** simple entities (currency, UoM, payment terms, project) in a modal Dialog; complex entities (supplier, item, requisition, RFQ) on a dedicated route with sections + a sticky right rail (Attachments on create; Attachments + Audit on edit).

**Model additions on the form:** the budget soft-check banner on the requisition (build-new, `banner.budget.over`); the ISO supplier-attribute sections (risk/security/continuity/ESG/anti-bribery); the lifecycle header buttons (Request approval / Approve / Suspend / Offboard) gated by status + permission.

**States:** loading (edit) = section skeletons while hydrating; submitting = disabled bar + spinner; error = field errors + toast; permission-denied = the action button is hidden / route gated.

**Used by:** Requisition create, Supplier create/edit, Item create/edit, RFQ create, all master-data create/edit dialogs, budget/tax-code forms.

## 4. Wizard  (1 screen + bulk import) : ADAPT (Raphe bulk-import dialog steps)

A multi-step guided flow for onboarding or import.

**Composition:** Stepper header + one Form per step + a review step. Bulk import: DownloadTemplateBanner -> SampleFormat preview -> FileUpload -> result step ("Import complete: N created, N updated", or accumulated row errors). All-or-nothing, upsert by natural key. Onboarding wizard (supplier/item) optionally wraps the sectioned form as steps for first-time creation.

**States:** per-step validation blocks Next; review step summarizes; success toast + redirect; import error step lists per-row failures.

**Used by:** Bulk import (all master data), supplier/item onboarding wizard variant.

## 5. Dashboard  (7 screens) : ADOPT (Raphe analytics-dashboard, task-center metric cards)

KPI tiles + charts for a role's outcomes.

**Composition:** a KpiCard row (the metric, the trend, a sparkline; e.g. OTIF, perfect-order, DPO, spend, savings, on-time) + a chart grid (Recharts: spend by category/supplier, OTIF trend, cycle-time distribution, budget commitment-vs-actual) + optional drill-down Tabs. KpiCards read precomputed seed values (`../seed/`), not a live engine (nice-to-have caveat).

**Model specifics:** OTIF (two-factor) and perfect-order (four-factor) shown as distinct tiles with perfect-order below OTIF; hard savings and cost avoidance shown separately (never summed); budget commitment-vs-actual as a dedicated chart (build-new).

**States:** loading = KpiCard skeletons + chart skeletons; no-data = "Not enough history yet to compute this" (`../copy/04`), never a broken zero.

**Used by:** Analytics dashboard, Payments analytics, Deliveries analytics, Supplier scorecard dashboard, Budget dashboard, per-role home landings (task #6), Management overview.

## 6. Comparison  (1 screen) : BUILD-NEW (the marquee; Raphe used preferred-supplier, no compare)

The landed-cost comparison: the screen that reorders the supplier ranking once freight and duty are included. The single most important demo screen.

**Composition:** a side-by-side Table, one column per quote (3+ suppliers), rows = unit price, then the landed-cost build-up (freight, duty, local charges at POL/POD, customs clearance), then the landed total (with base-currency `≈`), then lead time and terms. The lowest unit price and the lowest landed total are highlighted in different cells to show the flip. A `banner.landedFlip` (`../copy/03`) states it in words: cheapest per unit is not lowest landed. Award action per column, gated; selecting a non-lowest-landed quote requires a justification (`rfq.justification.required`). A price-spike chip on any quote >5% over last purchase price (`banner.priceSpike`).

**States:** loading = column skeletons; empty = "No quotes received yet" with "Record a quote"; populated = the highlighted flip; award disabled until justification when non-top.

**Used by:** Sourcing / RFQ comparison.

## 7. Workbench  (3 screens) : BUILD-NEW (Raphe had these on roadmap)

A focused resolve-this-exception surface: the three-way-match workbench, the CAPA workbench, the returns/RMA workbench. Multi-pane: the thing to resolve + the evidence + the resolution control.

**Match workbench composition:** LEFT = the invoice in exception with its StatusBadge (the MatchExceptionType: price-variance / qty-over / tax-mismatch / duplicate-invoice / missing-GR). CENTER = the three documents side by side (PO line, GRN line, invoice line) with the differing values highlighted and the tolerance shown. RIGHT = the resolution Select (accept variance / adjust PO / request credit note / raise debit note / reject) with a mandatory note where required; duplicate-invoice shows the `banner.duplicate.hold` and the suspected original. Resolving clears the exception (toast `toast.match.cleared`) and relieves GR/IR.

**CAPA workbench:** the NCR + disposition (return/rework/use-as-is/scrap) + the corrective action + effectiveness verification; the supplier's consecutive-below streak and `banner.capa.nearSuspend` when near the trigger.

**Returns workbench:** the RMA + reason + quantity + linked GRN/NCR + the credit-note posting to the creditor ledger.

**States:** loading = pane skeletons; empty = the relevant queue-empty (e.g. "No match exceptions"); resolution disabled until required note; error = toast.

**Used by:** Invoice three-way-match, NCR/CAPA, Returns/RMA.

## 8. Modal  (3 patterns, used everywhere) : ADOPT (Raphe Dialog/AlertDialog/Sheet)

- **Dialog:** create/edit of simple entities, confirms with a body (`../copy/03` confirmations).
- **AlertDialog:** destructive confirms (cancel, suspend, offboard, reject) with the consequence stated.
- **Sheet:** side editors and side panels (comments, attachments, a line add/edit, the routing-rule cell editor).

**Used by:** every screen, as needed.

## 9. Portal  (3 screens) : BUILD-NEW (Raphe internal-only; the model is two-sided)

The supplier-facing surface. A simplified, separate shell (task #6's supplier-portal shell), not the internal sidebar.

**Composition:** email + OTP login (the Raphe login pattern reused), then a minimal list of the supplier's own RFQs / POs / invoices, a quote-submission Form (the supplier is the sole editor of its quote; the buyer's internal target price is never shown), a PO-acknowledge action, and an invoice/document upload. Same primitives, a lighter chrome, the supplier's own data only.

**States:** as the internal patterns; scoped to the authenticated supplier.

**Used by:** Supplier portal (login, dashboard, quote/PO/invoice screens).

## 10. Shell / Layout  (1, from task #6) : ADOPT (Raphe navbar-chrome)

The app frame: sidebar (permission-derived nav, parent group hidden if all children hidden) + sticky topbar (global search, notifications placeholder, the demo RoleSwitcher, profile) + content. The supplier portal uses its own lighter shell. Specified in `../ia/` (task #6); listed here for completeness as the container every other archetype renders inside.

---

## Coverage check

Every archetype tag used across the 71 screens (`../screens/`) resolves to one of the above: list, queue -> #1; detail -> #2; form -> #3; wizard -> #4; dashboard, card -> #5; comparison -> #6; workbench -> #7; modal -> #8; portal -> #9; layout -> #10. No screen needs an archetype not specified here. Build each once; compose the rest.
