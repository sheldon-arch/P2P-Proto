# Seed Dataset

Deterministic demo data for the Unified P2P prototype: one fictional company (Meridian Consumer Health, OTC manufacturer, USD base) populated so every queue is non-empty, every dashboard computes to a defensible number, and the golden-path + exception scenarios are pre-staged. Spec: `_SEED-SPEC.md`. Generator: `generate.py` (Python stdlib, seeded RNG 20260601, demo today 2026-06-01). Output: `data/*.json` (one array per entity) + `data/_index.json` (counts + params).

## Regenerate
`python3 build-spec/seed/generate.py` -> byte-identical output every run (verified deterministic).

## What's in `data/`
- Masters: currencies (8), uoms (25), payment_terms (7), tax_codes (10), warehouses (6), segments (27), projects (12), budgets (44 = project x quarter), verticals (4), designations (7), roles (2).
- People: users (22, real names across the 14 roles so SoD + least-loaded assignment demonstrate).
- Suppliers (52): Pareto distribution, grade spread 25 A / 18 B / 3 C (scorecards), status spread (46 ONBOARDED, 2 PENDING_APPROVAL, 2 PENDING_ONBOARDING, 1 SUSPENDED expired-cert, 1 OFFBOARDED), currency mix (USD/EUR/INR/AED/CHF), valid tax IDs by region (GSTIN+PAN India, VAT EU, TRN UAE, EIN US), full ISO attribute set (risk/security/continuity/ESG/anti-bribery), one near-expiry GMP cert (12 days) for the expiry-alert demo.
- Items (210): RM/PM-heavy, correct stock-vs-purchase UoM, plausible HS codes, lastPurchasePrice (savings/spike baseline), lead times, source priorities, primary-supplier links.
- History (12 months, closed): history_tickets (180), history_lines, history_grns, history_invoices, history_payments, ncrs (9). Engineered so KPIs reconcile.
- Scorecards (46): computed FROM the history so they reconcile (perfect-order always < OTIF by construction).
- Live in-flight: live_tickets (10), live_rfqs (1), live_quotes (3), live_invoices (4), live_installments (3), live_returns (1), live_capas (1), live_pos, live_grns, live_credit_notes, live_requisition_lines.

## Verified KPIs (compute from the seed, all in defensible bands)
- Portfolio OTIF (two-factor): ~93.9% (band 88-96). Perfect-order (four-factor): ~88.9%, strictly below OTIF (0 suppliers violate). Req-to-PO cycle: mean 7.8d (SLA 7-10, with some breaches). DPO: ~44.6d (band 35-60). Total spend ~$125M / 12mo. Grades 25A/18B/3C (not all A).

## Hero + exception scenarios (pre-staged for the demo)
- HERO requisition (TKT-HERO): regulated API line (import, manual Finance approval, over budget -> logged override) + carton line (auto-approved). Identifier immutable.
- HERO RFQ (RFQ-HERO): 3 quotes where the CHEAPEST unit price (Helvetia $127.69) is NOT the lowest landed cost (Synthex) - the landed-cost flip, the marquee screen. One quote (BioCore) carries a +7% price-spike flag. Internal target price never sent to supplier.
- Live exceptions, one per state: two requisitions at the auto-approval threshold (one under -> auto, one over -> manual); a PO partially delivered (2 of 3 GRNs); four invoice match exceptions (price-variance, qty-over, tax-mismatch, duplicate-invoice on hold); an open NCR -> CAPA with a supplier 2 periods below threshold (near SUSPENDED); an active RMA with a credit note posting to the creditor ledger; a partial-approval installment with a remainder; an overdue installment with the ~28-day reminder fired.

## Integrity (verified)
Deterministic (identical hash across rebuilds); zero FK issues (every supplier/item/project/user reference resolves); zero date-order violations (PO after requisition, GRN after PO, invoice after GRN, payment after invoice); scorecards reconcile with history; perfect-order < OTIF; hard vs soft savings kept separate; compliance is a gate not a weighted input.

Feeds task #9 (the mock data/contract layer loads these JSON arrays into the in-memory store).
