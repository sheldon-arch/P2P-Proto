# 04 Sourcing and RFQ to Award and Contract - Unified Procure-to-Pay

- **BPMN file:** 04-sourcing.bpmn
- **Spec:** .build/specs/04-sourcing.json

## Scope, trigger, outcome

- **Scope:** Strategic sourcing for an approved requisition, following the SCOR Strategic Source (S1) decomposition: define the business need, analyze the supply market and discover new suppliers, develop the sourcing strategy (repeat / preferred / framework bypass versus a competitive event), prequalify suppliers, invite to tender / float the RFQ to at least three suppliers, capture structured supplier quotations, negotiate, compute normalized landed cost, rank and score suppliers (colour-coded, abnormal-price-spike flag), apply the Quality COA/MSDS gate for regulated items, select a supplier (justifying any non-top pick), approve the award (with a re-compare loop), award and capture the contract terms (including the renewal date), and release a PO-ready package. The framework call-off branch bypasses the competitive event for repeat/preferred buys.
- **Trigger:** A requisition reaches FULLY_APPROVED in Diagram 03 and is released to sourcing; the Procurement Head assigns a Procurement Handler (buyer).
- **Outcome:** An awarded supplier, an awarded quotation, and a captured contract proceed to Diagram 05 (purchase order); or a framework call-off is released straight to PO-ready without re-sourcing.

## Actors (lanes)

- **Requester** - the approved requisition originates here; the requester is not told local versus import.
- **Procurement / Buyer** - the handler who runs sourcing: define need, market analysis, strategy, prequalify, float RFQ, negotiate, select, award, capture contract.
- **Supplier / Vendor** - invited suppliers submit and revise quotations on a unique authenticated form (sole editor of their own quote).
- **Approver** - the Procurement Head or award-stage approver who approves the selection or sends it back for re-comparison.
- **Quality** - approves COA / MSDS for regulated items before selection (a hard gate).
- **Platform / System** - automated: send invitations, validate incoterms, compute landed cost, rank and score, flag spikes, route the regulated gate, mark PO-ready.

Full role definitions in `model/role-model.md`; permissions in `model/role-permission-matrix.md`.

## Step-by-step narrative

Tags: [SCOR code | ISO clause | source].

1. **Approved requisition ready for sourcing** (Requester, start). Carries requisitionId (immutable), departmentId, category {Items|Spares|Services|ProductDesign}, purchaseType {Local|Import}, lines (itemId or free-text, quantity, UoM, needDate, productUsedFor, HS code, line note, attachments), currency, totalAmountInBase, projectId/costCenterId. The Procurement Head assigns a handler (auto-assignment by category/store may apply; Head can override; assignment date stamped for SLA). [SCOR S1.1 Define Business Need | source: AB requisition-to-handler + RA released-on-approval]

2. **S1.1 Define business need** (Buyer, user). Confirm and structure the need per line: needSpec (text, mandatory), targetQuantity (number > 0, mandatory), internalTargetPrice (number >= 0, optional, hidden from supplier - internal benchmark only), regulatedItem (boolean, default false; true for OTC/pharma-grade RM and PM and regulated chemicals), criticalityTier {Low|Medium|High|Critical} (default Medium). [SCOR S1.1 | ISO 8.4.1 | source: AB internal target price + RA structure]

3. **S1.2 Supply market analysis / new-supplier discovery** (Buyer, user). Scan the AVL, unsolicited inquiries on record, and external references (Go Forward, Global Source Products, Alibaba, IndiaMART) for price context; market-price watch. Capture candidateSupplierIds[], newSupplierLeads[] (name + contact), marketPriceContext (last-purchase price + reference quotes, used for the abnormal-price-spike flag and savings baseline). [SCOR S1.2 + S1.5 | source: AB market references + RA AVL]

4. **S1.3 Repeat / preferred / framework, or competitive event?** (Buyer, exclusive). See gateways below. [SCOR S1.3 + S1.7 | source: AB repeat/preferred + data-model framework]

5a. **Release call-off against framework / preferred supplier** (Buyer, user). CallOffRelease against an active FrameworkAgreement (no re-sourcing): frameworkAgreementId (mandatory), requisitionId, quantity (number > 0, cumulative draw-down <= ceiling), value (auto = quantity x agreedPrice), agreedPrice / paymentTerms / deliveryTerms / incoterm (read-only from framework). Draws down the remaining ceiling; skips RFQ, quote, negotiation, comparison; produces an award-equivalent record straight to PO-ready. Permission calloff.release; guard: framework ACTIVE, within validity, remaining ceiling >= this draw. [SCOR S1.3 / OE6 | source: data-model FrameworkAgreement + CallOffRelease]

5b. **S1.6 Prequalify suppliers** (Buyer, user). Check candidates against the master: status == ONBOARDED (not PENDING/SUSPENDED/OFFBOARDED), valid certifications for the category (ISO 9001 plus sector certs; binary 100% gate), risk tier within tolerance (ISO 31000), security/ESG/continuity attributes where required (ISO 28000/20400/22301). A not-yet-onboarded lead routes to supplier onboarding (Diagram 06) and cannot be invited until ONBOARDED with qualification complete (OTC/pharma-grade RM and PM also need three-batch COAs plus samples). Output invitableSupplierIds[]. Permission supplier.qualify. [SCOR S1.6 | ISO 8.4.1 + 28000/31000/20400 | source: AB one-time qualification + RA lifecycle gate]

6. **S1.8 Invite to tender / float RFQ to >= 3 suppliers** (Buyer, user). Float to at least three prequalified suppliers (services excepted: 1-2 capable contractors is normal; a single-provider service requisition is allowed). One RFQ with an auto reference links all responses to the requisition. RFQ fields SENT: requisition reference (auto), line items (description, quantity, UoM, HS code, need date), payment-terms request, delivery-terms request, response deadline (date-time, mandatory), template variant {Import|Local|Service}. RFQ field NOT sent: internalTargetPrice. Channel: a unique-link form per supplier, mobile, email + OTP, with email plus manual-entry fallback. A regulated chemical item surfaces permit expiry / quantity alerts (about one week before expiry) to head and handler. Permission rfq.create, rfq.invite. [SCOR S1.8 | source: AB >=3 suppliers + unique-link email+OTP, internal target never sent]

7. **Send unique-link RFQ invitations (email + OTP)** (System, send). Each supplier gets a templated email with a unique authenticated link scoping it to its own quote; pre-validation on send and sign-in. Emits NOTIFY_RFQ_INVITE per supplier + audit; delivery failures logged not retried. [SCOR S1.8 | source: AB unique-link + RA email-OTP identity | platform-services 5/10]

8. **S1.8 Supplier submits quotation** (Supplier, user). Sole editor of its own quote. Item-RFQ quote fields: price (number > 0, mandatory); paymentTerms (dropdown, mandatory, exact set below); deliveryTerms (text, mandatory); incoterm (dropdown, mandatory, exact set below); die/cylinder charges (number >= 0, optional, default 0); documentation charges (number >= 0, optional, default 0); notes (text, optional); attachments (optional). Service-quote fields differ: contract period {yearly|quarterly|monthly} + start/duration/end, number of days, hours/labour, completion period, site, area (sq ft / m2), precise item description, no freight fields. Incoterm validated against transport mode at submit. Permission quote.capture (own quote). [SCOR S1.8/S1.9 | source: AB quote fields + payment-terms and incoterm value sets]

9. **Incoterm valid for transport mode?** (System, exclusive). See gateways below. [SCOR S1.8 | source: data-model Incoterms 2020 validate-vs-mode]

10. **Negotiate this quote?** (Buyer, exclusive). See gateways below. Response timing (submit/revise timestamps) tracked for the scorecard responsiveness dimension. [SCOR S1.10 | source: AB negotiation loop, supplier sole editor]

11. **Negotiation: supplier re-opens same form, resubmits price** (Supplier, user). If a revised price is agreed off-system (call / WhatsApp / meeting), the SUPPLIER re-opens the SAME form (same link, email + OTP) and submits the new price and any changed terms; the quote is versioned with revisedAt under the same quotationId (handler enters manually only as fallback, usual for services). Each revision re-runs the incoterm validation. Loops to the negotiate decision so multiple rounds are possible. Permission quote.capture (own quote). [SCOR S1.10 | source: AB negotiation re-open same form + revisedAt]

12. **S1.9 Compute normalized landed cost per quote** (System, service). landedCost = quote price + freight + insurance + duty - exemption + local POD + local POL + customs clearance + demurrage/storage + miscellaneous + documentation. Insurance is the I in CIF; insurance and demurrage were added after review. Damage is tracked SEPARATELY (never folded into the comparison number). Actual charges are entered at invoice time; any missing value falls back to the average of that charge from past orders (averaging fallback) so a comparison is never blocked. Always-present AB charges: port storage, Bayan, VAT and duty, courier, sample, bank; miscellaneous includes health/normal inspection, detention, CHA/agency, artwork, die/cylinder. Output landedCostInBase per quote (FX-normalized for cross-currency quotes). [SCOR S1.9 | source: AB landed-cost formula + averaging fallback | data-model LandedCost | platform-services 3]

13. **S1.9 Rank suppliers, scorecard-weighted, colour-code, flag spikes** (System, service). Rank three-or-more quotes best to worst. Inputs: normalized landedCostInBase plus delivery time, quality, price, responsiveness, weighted by the supplier scorecard composite (two-stage scoring: normalize each metric to 0-100 vs configurable bands, then weighted roll-up; default weights 40 delivery / 30 quality / 20 cost / 10 service, pharma raises quality; compliance is a GATE not weighted; grade A >= 90 / B 70-89 / C < 70). Colour-code green / amber / red against the bands. Abnormal-price-spike flag: raise when a quote price > 105% of last purchase price (threshold > 5% vs marketPriceContext). Savings are REPORTED not gated: worst-best spread across quotes plus negotiation savings vs baseline (baseline = last purchase price); negative if an extra expense. Surfaces a preferred-supplier recommendation. [SCOR S1.9 | source: AB ranking + colour-code + >5% spike + savings reported | procurement-metrics-kpis | platform-services 9]

14. **Regulated item requiring COA / MSDS review?** (System, exclusive). See gateways below. [SCOR S1.9 | ISO 8.4.1 / 8.6 | source: AB QC gate]

15. **Quality reviews COA / MSDS (regulated gate)** (Quality, user). Review the Certificate of Analysis and Material Safety Data Sheet for the regulated item before selection. Actions: Approve COA/MSDS (clears the gate, proceed to selection; records qcApprovedBy + qcApprovedAt) or Reject (disqualifies the supplier/quote for this regulated item; mandatory rejectReason; buyer sources an alternative or obtains compliant documentation, looping back to float RFQ). Hard gate: no selection of a regulated item without QC approval of COA/MSDS. Permission qc.approve / qc.reject. [SCOR S1.9 | ISO 8.6 + 8.4.1 | source: AB QC gate for regulated chemicals]

16. **S1.9 Select supplier (justify non-top pick)** (Buyer, user). Select one supplier/quote from the ranked, colour-coded comparison: selectedQuotationId (mandatory), selectionRationale (text, optional), justificationForNonTopPick (text, MANDATORY when the selected quote is not rank-1). The selection is a recommendation; it does not bind until the award is approved. Permission supplier.select, quote.compare. [SCOR S1.9 | source: AB select + justify non-top pick]

17. **Award selection approved?** (Approver, exclusive). See gateways below. SoD: the award approver is not the buyer who selected. Routed through the configurable approval engine (Diagram 03) when configured as an award stage. [SCOR S1.10 | source: AB head-approves-selection + Diagram 03 engine]

18. **S1.10 Award and capture contract terms (+ renewal date)** (Buyer, user). Award the business and capture the contract/agreement: contractId (auto), supplierId, requisitionId, awardedQuotationId, terms (text, agreed payment/delivery/incoterm/scope), validityStart / validityEnd (dates), renewalDate (date, drives a 15-day-before renewal reminder), priceList / agreedPrices, scopeOfWork. For repeat/indirect categories the award may create or extend a FrameworkAgreement. Locks the supplier/quote as the source of truth for the PO; emits NOTIFY_AWARD + audit; schedules the renewal reminder. Permission contract.manage. [SCOR S1.10 + OE6 | source: AB contract capture + 15-day renewal reminder | data-model Contract/Agreement]

19. **Ready for PO (award released to ordering)** (System, service). Link awardedQuotationId, supplierId, contractId, and requisition lines into a PO-ready package (agreed price, payment terms, delivery terms, incoterm, contract reference). Emits SSE {requisitionId} + audit 'READY_FOR_PO'. Handover to Diagram 05; budget is HARD-committed at PO issue, not here. [SCOR S1.10 -> S2.1 | source: build-new handover]

20. **Sourcing complete, ready for purchase order** (System, end). The awarded supplier, quote, and contract proceed to Diagram 05. [SCOR S1.10 | source: build-new]

## Gateways and branches (exact conditions)

- **S1.3 Repeat / preferred / framework, or competitive event?** Expression: `isFrameworkCallOff == true || (hasPreferredSupplier == true && withinFrameworkCeiling)`. TRUE -> framework call-off (bypass). FALSE -> competitive event (prequalify). `isFrameworkCallOff` is true when an active FrameworkAgreement covers the item and quantity is within its remaining ceiling. `hasPreferredSupplier` is true when a supplier holds sustained Grade A (preferred) status for the category and the buy is repeat. Services with a sole capable provider take the bypass branch.
- **Incoterm valid for transport mode?** Expression (Incoterms 2020): `!(transportMode != 'SEA' && incoterm IN {FOB, CIF, CFR})`. FOB / CIF / CFR are sea / inland-waterway only; air / road / courier / multimodal use FCA / CPT / CIP / DAP; EXW is mode-agnostic. TRUE (valid) -> negotiate decision. FALSE (invalid) -> reject submission with a validation message, return the supplier to the form to correct the incoterm.
- **Negotiate this quote?** Expression: `buyerWantsNegotiation == true`. TRUE -> negotiation (supplier re-opens the same form). FALSE -> the quote is final and joins the comparison set.
- **Regulated item requiring COA / MSDS review?** Expression: `regulatedItem == true`. TRUE -> Quality COA/MSDS gate. FALSE -> select supplier directly.
- **Award selection approved?** Expression: `awardDecision == 'APPROVE'`. TRUE -> award and capture contract. FALSE (`awardDecision == 'RECOMPARE'`, mandatory recompareNote) -> loop back to rank/score for re-comparison (re-rank, re-negotiate, or re-select). SoD: award approver != selecting buyer.

## Fields and dropdowns (full detail)

Quote fields (item RFQ):

| Field | Type | Mandatory | Default | Validation | Owning role |
| --- | --- | --- | --- | --- | --- |
| price | number | yes | n/a | > 0; quote currency | Supplier |
| paymentTerms | dropdown | yes | n/a | one of the exact set below | Supplier |
| deliveryTerms | text | yes | n/a | non-empty | Supplier |
| incoterm | dropdown | yes | n/a | one of the exact set below; validated vs transport mode | Supplier |
| die/cylinder charges | number | no | 0 | >= 0 | Supplier |
| documentation charges | number | no | 0 | >= 0 | Supplier |
| notes | text | no | empty | - | Supplier |
| attachments | files | no | none | - | Supplier |

Service-quote fields (replace the item fields for service requisitions): contract period {yearly | quarterly | monthly} + start / duration / end, number of days, hours/labour, completion period, site, area (sq ft / m2), precise item description, no freight fields.

RFQ fields (sent to supplier): requisition reference (auto), line items (description, quantity, UoM, HS code, need date), payment-terms request, delivery-terms request, response deadline (date-time, mandatory), template variant {Import | Local | Service}. Never sent: internalTargetPrice.

Selection / award fields: selectedQuotationId (reference, mandatory), justificationForNonTopPick (text, mandatory when not rank-1), contractId (auto), validityStart / validityEnd (dates), renewalDate (date, 15-day reminder), agreedPrices, scopeOfWork.

Dropdowns (exact value sets):

- **paymentTerms:** `100% advance | part-advance + against documents | part-advance + against shipment | 30/70 | net 30 | net 60 | net 90`
- **incoterm:** `EXW | FOB | CIF | CFR | FCA | CPT | CIP | DAP`
- **category:** `Items | Spares | Services | ProductDesign`
- **template variant:** `Import | Local | Service`
- **criticalityTier:** `Low | Medium | High | Critical`
- **awardDecision:** `APPROVE | RECOMPARE`

## Edge cases and error handling

- **Fewer than three suppliers.** Allowed for services where only 1-2 capable contractors exist; a single-provider service requisition is normal. For goods, fewer than three requires a justification on the comparison.
- **Invalid incoterm for transport mode.** FOB / CIF / CFR submitted for a non-sea mode is rejected at submit; the supplier corrects the incoterm and resubmits.
- **Missing landed-cost inputs.** Any missing charge falls back to the average of that charge from past orders; a comparison is never blocked. Damage is tracked separately and not folded into the comparison number.
- **Abnormal price spike.** A quote price more than 5% above last purchase price is flagged on the comparison (not blocked); savings are reported, not gated.
- **Non-top pick.** The buyer must supply justificationForNonTopPick before the selection submits.
- **Regulated item without approved COA/MSDS.** Hard block: Quality must approve before selection; a rejection sends the buyer back to source an alternative or obtain compliant documentation.
- **Award sent back.** RECOMPARE returns to ranking with a mandatory recompareNote; the buyer may re-rank, re-negotiate, or re-select; multiple rounds are possible.
- **New supplier lead not onboarded.** Cannot be invited until ONBOARDED with qualification complete (and three-batch COAs plus samples for OTC/pharma-grade RM and PM); routed to Diagram 06.
- **Internal target price exposure.** internalTargetPrice is never transmitted to a supplier or shown on the RFQ form; it only seeds the savings baseline and informs the spike flag.
- **Framework ceiling exceeded.** A call-off whose cumulative draw-down would exceed the framework ceiling is blocked; the buyer runs a competitive event instead.

## Business rules and invariants

- internalTargetPrice is an internal benchmark only and is never sent to any supplier.
- RFQ floats to at least three suppliers, except services where 1-2 capable contractors (or a single provider) is normal.
- The supplier is the sole editor of its own quote; negotiation re-opens the SAME form under the same quotationId, versioned with revisedAt; the handler enters manually only as a fallback.
- Incoterm is validated against transport mode (FOB / CIF / CFR sea-only; air / road / courier / multimodal use FCA / CPT / CIP / DAP).
- Landed cost = quote + freight + insurance + duty - exemption + local POD + local POL + customs clearance + demurrage/storage + misc + documentation; damage is separate; missing values fall back to past-order averages.
- Ranking is scorecard-weighted (default 40 delivery / 30 quality / 20 cost / 10 service; compliance is a pass/fail gate, not weighted), colour-coded, with an abnormal-price-spike flag at > 5% above last purchase price; savings are reported, not gated.
- Any non-top selection requires a justification.
- Regulated items require Quality COA/MSDS approval before selection (hard gate).
- The award captures contract terms including a renewal date with a 15-day-before reminder; repeat/indirect awards may create or extend a framework.
- Award approval reuses the configurable approval engine (Diagram 03) with SoD (award approver != selecting buyer).
- Budget is hard-committed at PO issue (Diagram 05), not during sourcing.
- **Per-line award (axiom A16):** each RFQ line is awarded independently; the award event groups the winning supplier's lines and emits one PurchaseOrder per distinct winning supplier. A single RFQ covering four lines can result in two or three POs if different suppliers win different lines. The award screen shows a line-by-line supplier assignment table before committing. The QuotationLine.awardedLineId links each line to the winning PO line.
- **B2B discovery (G4, prototype stub):** the supply market analysis step surfaces a candidate-supplier list derived from the item's HS code and keyword description. In the prototype this is a MOCKED list (a pre-loaded candidate table, no live integration with any external directory or marketplace). The list includes supplier name, contact, country, and a match-reason tag. The buyer uses it as a reference to identify new supplier leads; actual invitation still requires the supplier to be ONBOARDED through Diagram 06 before being added to the RFQ. The mock stub is replaced with a live B2B platform integration in production.

## Cross-references

- Diagram 00 system overview (step 7 Source). Diagram 03 approval (releases the approved requisition into sourcing; award approval reuses the engine). Diagram 06 supplier onboarding (a not-yet-onboarded lead is qualified before invitation). Diagram 05 purchase order (the awarded supplier, quote, and contract are issued as a PO; budget hard-committed there). Diagram 12 analytics (the supplier scorecard that weights ranking, and the savings/spend reporting).
- Benchmarks: SCOR Strategic Source S1.1-S1.10 (verbatim step names from the supplied SCOR dataset), OE6 Contracts and Agreements; ISO 9001:2015 clause 8.4.1 (supplier qualification/evaluation) and 8.6 (release verification for the COA/MSDS gate), plus ISO 28000/31000/20400 supplier attributes at prequalification; Incoterms 2020. Sources: `albahja-sourcing-rfq-compare`, `albahja-requisition-approval`, `model/data-model.md` (RFQ, Quotation, LandedCost, Contract/Agreement, FrameworkAgreement/CallOffRelease), `model/platform-services.md` (services 3 FX, 5 notifications, 9 analytics, 10 identity), `analysis/scor-procurement-map.md`, `procurement-metrics-kpis`.
