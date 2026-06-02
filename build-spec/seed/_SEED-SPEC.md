# Seed Dataset Specification

The demo dataset for the Unified P2P prototype. Built so the prototype feels real from the first role: every queue populated, every dashboard computes to a defensible number, and the golden-path exception scenarios pre-staged. Generated deterministically (seeded RNG, pinned demo date) by `generate.py` into `build-spec/seed/data/*.json`, referentially consistent with the data dictionary (`../data-dictionary/`) and the state machines (`../schema/state-machines.ts`). Hero records (the golden path) are hand-curated; the bulk is generated to fill tables and back the KPI history.

## Fixed parameters

- **Company:** Meridian Consumer Health (OTC / personal-care manufacturer). Base/reporting currency USD. Two plants: PLANT-1 (domestic, USD), PLANT-2 (import-heavy, duty regime). Departments: Production, R&D/NPD, Maintenance/Engineering, QA/QC, Marketing, Procurement, Finance.
- **Demo "today":** 2026-06-01 (pinned). All relative dates (need dates, overdue reminders, cert expiry, ETA alarms, 12-month history) computed from this so the demo is reproducible and the alerts sit sensibly.
- **RNG seed:** 20260601 (fixed) so every regeneration is identical.
- **History window:** 12 months back from demo today (2025-06 .. 2026-05) of completed transactions so OTIF / DPO / savings / spend / cycle-time compute against real history.

## Volumes (the realistic distribution, not round numbers)

- Users: ~22 across the 14 roles (multiple per heavy role so least-loaded assignment + SoD demonstrate with real names).
- Suppliers: 52 (Pareto: ~8 strategic/critical carrying most spend, long tail of small). Grade spread A/B/C (not all A). Statuses: most ONBOARDED, 4 PENDING_APPROVAL, 2 PENDING_ONBOARDING, 1 SUSPENDED (expired-cert), 1 OFFBOARDED. Currency mix USD/EUR/INR/AED/CHF. Valid tax IDs by region (GST/PAN India, VAT EU, TRN UAE).
- Items: 220 (RM actives + excipients, PM cartons/labels/bottles/closures, MRO/spares, services). Correct stock-vs-purchase UoM, plausible HS codes on importables, lastPurchasePrice (seeds savings/spike), lead times (domestic PM 2-3wk, imported API 8-12wk), source priority, primary-supplier link.
- Masters: ~8 currencies, ~25 UoM, ~30 categories/segments, 7 payment terms, ~10 tax codes, 6 warehouses, ~12 projects/cost-centers with budgets, ~15 asset proposals.
- Historical tickets (closed, 12mo): ~180 across plants/categories so spend cube + scorecards + cycle-time have a base.
- Live in-flight tickets: ~24 parked across every interesting state (see hero + exception scenarios).

## Defensible KPI targets (the seed must compute to these bands; never the fakeness tells)

- OTIF (two-factor, order-line): portfolio 88-96%; best suppliers 97-99%, worst suppliers low-70s. NEVER 100% or a flat 95% for everyone.
- Perfect order (four-factor): 5-15 pts BELOW OTIF (documentation + damage drag it down). Never >= OTIF.
- Defect rate: actuals 0.2-2%; PPM food/bev <=1000 target, a poor supplier 1500-3000. Never 0.
- DPO: 35-60 days typical (terms-consistent). Never 365 or single digits.
- Req-to-PO cycle: 7-10 day SLA; best ~2-3 days, some breaches with logged reasons.
- Spend under management: 60-85%. Maverick/off-contract 10-25%. Never 100%/0%.
- Three-way match exception rate: 10-25% first pass; first-time-match 75-90%.
- Hard savings: 2-8% of addressable spend. Cost avoidance reported SEPARATELY (never summed with hard savings).
- Total annual spend: ~ tens of millions USD (mid-market). RM largest, then PM, then MRO/services. Pareto by supplier; top supplier 15-25% of its category.

## Hero records (the golden-path scenario, hand-curated)

The storyboard's one requirement followed end-to-end (see `../mvp-and-storyboard.md`):
- REQ-HERO: a requisition with a regulated API line (PLANT-2, import) + a printed-carton line (PLANT-1), over the quarter's available budget (triggers the soft-budget warning + logged override). Identifier immutable.
- The API line's finance stage routes to a manual approver (over auto-approval limit); the carton line auto-approves (nearest-bucket, under limit).
- RFQ-HERO: 3 supplier quotes on the API where the CHEAPEST unit price is NOT the lowest landed cost (high freight+duty flips the ranking); one quote carries a >5% price-spike flag; non-top pick requires justification.
- PO-HERO: issued, budget hard-committed, supplier acknowledges (advance payment triggers per terms).
- GRN-HERO: carton arrives at +7% (tolerance amends PO before GRN); API lot FAILS QC -> NCR-HERO raised -> CAPA-HERO opens -> the API supplier's consecutive-below streak ticks, AVL grade drops, trips toward SUSPENDED.
- INV-HERO: a price-variance exception routed to the buyer; a separate DUPLICATE-INVOICE caught and held.
- PAY-HERO: maker prepares, checker (Chief Accountant) releases; an installment partial-approved with a remainder.

## Exception scenarios (pre-staged live records, one per interesting state)

So a presenter opens any role and sees real work mid-flight (not empty forms):
- A requisition awaiting approval; one just under and one just over the auto-approval threshold.
- A live RFQ with 3+ quotes ready to compare.
- A PO acknowledged + partially delivered (2 of 3 GRNs in).
- Invoices: one price-variance, one qty-over, one tax-mismatch, one duplicate-invoice on hold.
- An open NCR->CAPA with a supplier near the SUSPENDED trigger.
- An active return/RMA mid-flow with a credit note posting to the creditor ledger.
- Installments: one PARTIAL_APPROVAL with remainder, one overdue (drives the ~28-day reminder).
- A supplier cert expiring within the alert window (drives the permit/cert-expiry alert).
- A budget over-committed with a logged override.

## Output
`build-spec/seed/data/<entity>.json` (one array per entity, ids referentially consistent). `build-spec/seed/data/_index.json` (counts + the demo-today + seed for verification). Re-runnable: `python3 build-spec/seed/generate.py` reproduces byte-identical output.

## Integrity rules (the generator must enforce)
- Every FK resolves (supplier/item/project/currency/etc. exist before referenced).
- Every record's state is reachable per the state machine (no installment in an impossible state; a 3-way match only where a GRN exists).
- Dates respect process order + lead times (PO date after requisition approval; GRN after PO ack + lead time; invoice after GRN; payment after invoice per terms). No payment dated before its invoice.
- KPI-bearing history is consistent (a supplier's scorecard reconciles with its seeded delivery/quality/NCR history).
- Hard vs soft savings kept separate; perfect-order < OTIF; compliance is a gate not a weighted input.
