# Service Contract

The typed interface the UI calls. Per-entity CRUD-plus-transition, and the cross-entity services. The `transition` method is the only path to a state change; `create`/`update` handle non-state fields only. Types come from `../schema/types.ts`; the legal transitions come from `../schema/state-machines.ts`.

## Per-entity service shape

Every transactional entity exposes the same shape (generic `EntityService<T>`), so the UI and the hooks are uniform:

```
interface EntityService<T> {
  list(params?: ListParams): Promise<Page<T>>;        // filter, sort, paginate, search
  get(id: string): Promise<T & Relations>;            // with resolved references
  create(input: CreateInput<T>, ctx: Ctx): Promise<T>;// non-state fields; assigns id + identifier
  update(id: string, patch: UpdateInput<T>, ctx: Ctx): Promise<T>; // non-state fields only
  transition(id: string, action: string, payload: TransitionPayload, ctx: Ctx): Promise<T>;
}
```

- `ListParams`: `{ page, limit, search, filters: Record<field, value|value[]>, sort }`. Server-pagination shape (Raphe's `{page, limit, search}` plus faceted filters). Bounded master data may ignore paging and return all.
- `Page<T>`: `{ data: T[], total, page, limit }`.
- `Ctx`: `{ currentUser }` (the role-switcher's CurrentUser). The service trusts it; RBAC is enforced in the UI (`../ia/rbac.ts`). The service still checks the transition guard's role/SoD conditions because some guards (no self-approval, maker != checker) are data rules, not just UI gating.
- `Relations`: the resolved foreign keys (supplier name for supplierId, project name for projectOrCostCenterId, etc.) so the screen shows display fields, never ids.
- `create` assigns the id and the immutable business identifier (the configured pattern, axiom A1) and sets the initial state from the state machine; it never lets the caller set the state.
- `update` rejects any attempt to change a state-dimension field; those go through `transition`.
- `transition` is detailed in `03-transitions-and-effects.md`.

## Entities with a service

Transactional (full shape incl. transition): Requisition, RequisitionLine, ApprovalStageCompletion, PurchaseOrder, POLine, RFQ, Quotation, GoodsReceipt, Inspection, Invoice, MatchResult, MatchException, Installment, PaymentSchedule, Return, NCR, CorrectiveAction, CreditDebitNote, Supplier, Item.

Master/config (list/get/create/update, no lifecycle transition, or a simple active/inactive toggle): Currency, UoM, PaymentTerms, TaxCode, Warehouse, Category/Segment, Project, Budget, User, Role, Designation, BusinessUnit/Vertical, RoutingRule, FieldConfig, AssetProposal, SupplierGroup.

Read-mostly/derived: SupplierScorecard (computed from history; recomputed when an NCR/GRN affects a supplier), AuditLog (append-only, created by every transition), CreditorLedger (derived from invoices/payments/credit-debit notes), Commitment (derived from budgets + open POs).

## Cross-entity services

These back the model's distinctive behavior; they are called by transition effects and by read screens.

### fxService
- `toBase(amount, currency)` -> base amount using the static rate table (seed currencies carry rates). A degradation toggle simulates an FX failure: returns `{ ok: false }`, and money display drops the base line and shows "rate unavailable" (`../copy/03` `err.fx.unavailable`). Axiom A12.

### budgetService
- `availableFor(projectId, period)` -> budget minus committed minus actual (derived). Used by the requisition soft-check.
- `commit(poId)` / `relieve(requisitionId)` -> called by the issue-PO and complete transitions; moves commitment to actual. Over-commit requires a logged override (axiom A4); records the budgetOverride.

### matchService
- `run(invoiceId)` -> resolves to TWO_WAY or THREE_WAY (THREE_WAY iff a GRN exists for the line, axiom A8), reconciles amounts including tax against tolerance, and produces a MatchResult; if outside tolerance or duplicate or tax-mismatch or missing-GR, produces a MatchException of the right type (`../copy/01` MatchExceptionType). The duplicate check is supplier + invoiceNo + amount.
- `resolve(exceptionId, resolution, note)` -> applies accept/adjust/credit-note/debit-note/reject; on accept/adjust within tolerance, clears the exception and relieves GR/IR; raises a credit/debit note where chosen.

### scorecardService
- `recompute(supplierId, period)` -> recomputes OTIF (two-factor), perfect-order (four-factor, always < OTIF by construction), the four sub-scores, the composite, the grade, and the compliance gate (a gate, not a weighted input). Called when a GRN or NCR affects a supplier. Drives the AVL standing and the path toward SUSPENDED.

### auditService
- `append(entry)` -> immutable, timestamped, with actor + before/after; called by every transition. Read by the audit panels.

### eventBus
- `emit(event)` / `subscribe(pattern, cb)` -> the SSE mimic (platform service #6). Every mutation emits an event (`ticket.approved`, `po.issued`, `match.cleared`, `installment.processed`); hooks subscribe and re-query the affected query keys (`04-query-hooks.md`).

### analyticsService
- read-only selectors over the store computing the dashboard numbers (spend by category/supplier, OTIF trend, cycle-time, DPO, savings hard vs avoidance separated, budget commitment vs actual). Most values precomputed in the seed; the few action-driven ones (queue counts, budget committed, OTIF after an approval) recompute on read so the dashboard reflects demo actions.

## Error contract

The service throws typed errors that map to the rewritten user messages (`../copy/03-messages.md`): guard failure -> the matching message (no eligible approver, self-approve, over limit, supplier not onboarded, budget exceeded, duplicate invoice, schedule locked, illegal transition). The UI catches and toasts the user string; the raw error never surfaces.

## Why a uniform contract (intent)

One service shape means the hooks (`04`), the MSW handlers, and the screens are generated once and reused for 50-plus entities. The transition-only mutation rule means the state machines are enforced in exactly one place. Adding an entity is adding a collection + its service registration, not new plumbing.
