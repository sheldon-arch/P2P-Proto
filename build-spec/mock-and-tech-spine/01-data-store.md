# In-Memory Data Store

The single source of truth at runtime: typed collections loaded from the seed (`../seed/data/`), mutated only through the service transitions (`03-transitions-and-effects.md`). Lives in client memory; reseeds deterministically.

## Collections

One collection per entity, keyed by id. The 33 seed files load into collections grouped as masters, people, suppliers/items, history, and live. The history collections back the KPIs; the live collections are the in-flight records a presenter sees mid-flow.

| Seed file | Collection | Count | Role in the demo |
| --- | --- | --- | --- |
| currencies.json | currencies | 8 | FX + money display |
| uoms.json | uoms | 25 | quantity units |
| payment_terms.json | paymentTerms | 7 | terms + DPO |
| tax_codes.json | taxCodes | 10 | invoice tax |
| warehouses.json | warehouses | 6 | receiving |
| segments.json | segments | 27 | item classification |
| projects.json | projects | 12 | budget charge target |
| budgets.json | budgets | 44 | project x quarter; commitment vs actual |
| verticals.json | verticals | 4 | org structure |
| designations.json | designations | 7 | approval rank |
| roles.json | roles | 2 | role records |
| users.json | users | 22 | the 14 roles, real names; role-switcher + SoD |
| suppliers.json | suppliers | 52 | AVL, grades, statuses, ISO attrs |
| supplier_scorecards.json | scorecards | 46 | computed from history; grades |
| items.json | items | 210 | item master |
| history_tickets.json | tickets (closed) | 180 | 12-mo history; spend, cycle time |
| history_lines.json | requisitionLines (closed) | 437 | line detail |
| history_grns.json | goodsReceipts (closed) | 180 | OTIF, perfect-order |
| history_invoices.json | invoices (closed) | 180 | match, DPO |
| history_payments.json | payments (closed) | 180 | DPO, ledger |
| ncrs.json | ncrs | 9 | quality history |
| live_tickets.json | tickets (live) | 10 | in-flight requisitions/orders |
| live_requisition_lines.json | requisitionLines (live) | 2 | hero lines |
| live_rfqs.json | rfqs | 1 | RFQ-HERO |
| live_quotes.json | quotations | 3 | the landed-cost flip |
| live_pos.json | purchaseOrders | 1 | issued PO |
| live_grns.json | goodsReceipts (live) | 2 | partial delivery |
| live_invoices.json | invoices (live) | 4 | the 4 match exceptions |
| live_installments.json | installments | 3 | partial-approval + overdue |
| live_returns.json | returns | 1 | active RMA |
| live_credit_notes.json | creditDebitNotes | 1 | credit note to ledger |
| live_capas.json | correctiveActions | 1 | CAPA near-suspend |
| _index.json | (meta) | - | counts + demo-today + seed, for the reset and verification |

History and live records of the same entity (tickets, lines, GRNs, invoices, payments) merge into one collection each, distinguished by their state, not by separate stores. A list query filters by state (closed history vs in-flight) where a screen needs one or the other; a dashboard query reads the whole collection.

The entities with no seed rows but a defined shape (CallOffRelease, FrameworkAgreement, AdvancePayment, Retention, CashFloat, CreditorLedger derived, MatchResult/MatchException computed at runtime, AuditLog accumulated at runtime, Commitment derived from budgets+POs) exist as empty or derived collections; the service can create into them during the demo (e.g. a match runs and produces a MatchResult).

## Loading

On first load, the store imports the seed JSON, validates each record against its Zod schema (`../schema/types.ts` derived), builds the id index per collection, and builds the reference indexes (foreign keys: supplierId, itemCode, projectOrCostCenterId, requisitionId, etc.) so a `get` with its relations is O(1). Records are frozen at the type level; mutation is only via the service producing a new version in the collection.

## Referential integrity (verified in the seed, preserved at runtime)

The seed is already integrity-checked (zero FK issues, zero date-order violations, deterministic hash, perfect-order < OTIF, scorecards reconcile with history). The store preserves this:
- A `create`/`transition` that references another record validates the reference exists and is in a legal state (e.g. a PO cannot be issued to a non-ONBOARDED supplier; the guard enforces it).
- Derived values (delivery status, commitment, match result, creditor-ledger balance) are computed on read from their source records, never stored stale (the model's "derived, never stored" rule for delivery status; the same for commitment vs actual).

## Reset and reseed (deterministic)

- A "Reset demo" action (admin/topbar, available in the prototype) reloads the store from the seed, restoring the exact initial state. Because the seed is pinned (RNG 20260601, demo today 2026-06-01), the reset is byte-identical every time; a presenter can re-run the same script.
- Optional localStorage persistence: the store can persist the current (mutated) state so a refresh mid-demo does not lose progress; Reset clears it back to seed.
- The demo "today" is a fixed constant (2026-06-01), read from `_index.json`, used everywhere a relative date or "overdue/expiring" computation is needed, so alerts sit sensibly and reproducibly. No `Date.now()` for demo logic.

## Why in-memory and seeded (intent)

The store is the difference between a clickable mockup and a system: every queue is populated, every dashboard computes, and an action changes the data the next screen reads. Because it is seeded from the verified dataset and mutated only through guarded transitions, the demo is both full and correct, and because it is deterministic, it is repeatable on stage.
