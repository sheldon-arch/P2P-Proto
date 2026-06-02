# Shared Components

The reusable components built once on top of the primitives (`02-primitives.md`) and consumed across screens. Each is the single implementation of its behavior, so a change lands everywhere. Props are the contract; the names match what the screens (`../screens/`) and the mock layer (task #9) expect. These generalize Raphe's shared `general` components into our neutral system.

## Data and status

### DataTable
The list/queue table. TanStack Table + shadcn table.
- Props: `columns` (with cell renderers), `data` or `query` (server mode), `pagination` ('server' | 'client'), `pageSize`, `filters`, `rowActions(row) -> action[]` (each gated), `onRowClick`, `rowTint(row) -> token?`, `density`.
- Behavior: sort, faceted filter, URL-held state, per-row DropdownMenu (only permitted + legal-transition actions shown), optional row tint (danger/success/muted), density toggle. Identifiers/codes/money render mono.
- Used by: every list/queue screen (#1 archetype).

### StatusBadge
The one place an enum becomes a colored label.
- Props: `domain` (enum domain), `value` (raw enum value).
- Behavior: looks up `{label, color}` in `../copy/01-enum-labels.md`, renders the Badge variant from the status-color map (`01-design-tokens.md`). Text + color, never color alone. An unknown value renders neutral with the raw value visible only in dev (a leak signal).
- Used by: everywhere a status, grade, priority, category, match-type, exception-type, or lifecycle value shows.

### KpiCard
A dashboard / queue-header metric tile.
- Props: `label`, `value` (preformatted via `../copy/02`), `trend?` ({direction, delta}), `sparkline?`, `tone?` (status token), `helper?`, `noData?`.
- Behavior: shows the metric + trend; `noData` renders "Not enough history yet to compute this" (`../copy/04`), never a broken zero. Reads precomputed seed values.
- Used by: dashboards (#5), list/queue headers (#1), per-role homes (task #6).

### Loader / EmptyState
- Loader: spinner + message ("Loading suppliers...", from the screen). The reference DataLoader.
- EmptyState: props `key` (the empty-state key), renders `{icon, line, cta?}` from `../copy/04-empty-states.md`; the CTA is gated by its permission and dropped if the user lacks it. The reference EmptyMessage.

### MoneyValue
Renders a money field per `../copy/02` rules.
- Props: `amount`, `currency`, `baseAmount?`, `baseCurrency?`, `fxUnavailable?`.
- Behavior: primary in transaction currency, secondary muted `≈ base`; `fxUnavailable` drops the base line and shows "rate unavailable"; negatives (credit/debit) colored and parenthesized. Rate + as-of on hover.
- Used by: tables, detail summaries, comparison, invoices, payments.

## Forms and fields

### FieldRenderer
The field engine made visual: renders one field from the field config.
- Props: `fieldKey`, `record`, `mode` ('edit' | 'read'), `currentUser`.
- Behavior: selects the control from the dataType (`02-primitives.md` map), populates enum/reference options + labels from `../copy/01`, applies mandatory/validation, makes the field read-only to non-owners and for `isAuto`/computed fields, renders booleans as Switch (edit) or StatusBadge (read), shows the base `≈` line for money on read. Surfaces missing mandatory fields for the stage gate.
- Used by: every form (#3) and the detail field area (#2).

### FormSection
A titled Card section wrapping a group of FieldRenderers; the unit forms are built from.

### LineItemEditor
The field-array editor for lines/addresses/installments/source-priorities.
- Props: `name` (array path), `fieldKeys` (per-row fields), `min`, `addLabel`, `rowActions`.
- Behavior: add/remove rows, per-row validation, running totals where applicable (line amount, schedule total), unique-priority enforcement (source priorities). Empty state "No lines added yet" + "Add line".
- Used by: requisition lines, supplier addresses, payment schedule, item source priorities, GRN received-lines grid (the TableInput delivery grid baseline).

### FileUpload / ImportDialog
- FileUpload: file picker + upload button; filename stub in the demo (real storage is nice-to-have). Max 10MB, .csv/.xlsx/.xls for import.
- ImportDialog: DownloadTemplateBanner + SampleFormat preview + FileUpload + result; all-or-nothing; "Import complete: N created, N updated" (`../copy/03`).

## Layout and navigation (from task #6, listed for completeness)

### AppShell
Sidebar (permission-derived nav via `navForRole`, parent group hidden if all children hidden) + sticky Topbar + content. Supplier portal uses PortalShell (lighter).

### PageHeader
Title + count + subtitle + right-aligned primary action (gated). On every list/detail/form.

### RoleSwitcher
The demo device: a Command/Select in the topbar listing the 13 internal personas + the supplier portal. Selecting one swaps `CurrentUser` (mock, task #9), which re-derives the sidebar (`navForRole`), re-gates controls (`useCan`), and re-points the home redirect. Real named users per role from the seed so SoD demonstrates with distinct people.

### RbacGate
Wraps a control or a route. `useCan(user, group)` to show/enable; `canWithCondition(user, group, ctx)` for SoD (never approve own, receiver != invoice approver, maker != checker). Hides the control or renders Unauthorized (route). Also hides controls for illegal state-machine transitions. (`../ia/rbac.ts`.)

## Rules and feedback

### RuleBanner
The inline Alert that makes a model rule visible.
- Props: `key` (one of the 9 banner keys), `ctx` (the values to interpolate).
- Behavior: renders the banner copy from `../copy/03-messages.md` with the palette tone from `01-design-tokens.md` (duplicate-hold/budget-over/CAPA-near-suspend = danger; tolerance-amend/price-spike/cert-expiring/overdue/finance-revert = warning; landed-flip = info).
- Used by: requisition (budget), sourcing (flip, spike), GRN (tolerance), invoice match (duplicate), supplier (cert expiry, CAPA), payments (overdue, finance-revert). These are acceptance criteria on their screens.

### ConfirmDialog
AlertDialog wrapper reading title/body/confirm-label from `../copy/03` confirmations; used before every consequential or destructive action.

### Toast
Sonner wrapper; success/error messages from `../copy/03`. Mutations toast on settle.

### ApprovalAccordion
The per-stage approval UI (embedded in detail #2): one row per stage with CompletionStatus StatusBadge, assignee avatar, and gated stage actions (Request approval / Assign / Approve), auto-approved badge where applicable. The model's configurable chain (adapted from Raphe's fixed verticals).

### CommentsPanel / AttachmentsPanel / AuditPanel
Sheets with count badges; empties from `../copy/04` ("No comments yet. Be the first to comment.", "No attachments.", "No history recorded yet."). Audit shows the immutable timestamped trail.

---

## Build order (for the prototype)

1. Tokens + the four state components (Loader, EmptyState, StatusBadge, Toast) and DataTable + FieldRenderer: the spine everything else uses.
2. PageHeader, KpiCard, MoneyValue, FormSection, LineItemEditor, RbacGate, ConfirmDialog, RuleBanner.
3. The archetype compositions (`03-archetypes.md`), then the screens.
Agreeing this set before parallel screen work is what keeps the 71 screens from diverging (the readiness-brief rationale for catalog-before-build).
