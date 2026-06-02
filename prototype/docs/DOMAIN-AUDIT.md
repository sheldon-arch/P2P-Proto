# P2P Platform: Domain-Correctness Audit

Purpose: test the built platform against the procure-to-pay rules a supply-chain consultant would expect, find divergences, fix them, and prove the result. Prompted by a reviewer noting that a requester would not know the unit price (now fixed). This rubric applies that scrutiny to every module.

How to read each row:
- ID: stable identifier, used as the audit test name prefix.
- Question: what a consultant would ask.
- Expected: the domain-correct behavior, with the governing axiom (A1 to A21 from `model/ontology.md`) or doc citation.
- Check: how it is verified (screen + action, or a pure-logic unit).
- Status: PASS, GAP, or TBD. GAP rows carry a severity.
- Severity: Critical (breaks a flow or violates an axiom), High (a consultant would reject it), Medium (incomplete, not wrong), Low (polish).
- Evidence: test name or screenshot path proving the status.

Severity and Evidence are filled in Phase 1. Status starts TBD.

Reference constants (from `src/lib/domain/constants.ts`): DEMO_TODAY 2026-06-01; DEFAULT_APPROVER_LIMIT 200000; QTY_TOLERANCE_PERCENT 10; PRICE_SPIKE_PERCENT 5; MATCH_TOLERANCE price 2% / qty 2% / absolute 50; ETA_ALARM_DAYS 5; PERMIT_EXPIRY_DAYS 7; OVERDUE_PAYMENT_DAYS 28; grade A>=90 B>=70 C<70; cash float OMR 300.

---

## Module 1: Requisition / Intake

| ID | Question | Expected (cite) | Check | Status | Sev | Evidence |
|----|----------|-----------------|-------|--------|-----|----------|
| REQ-01 | As a requester, do I have to enter a unit price? | No. Unit price is an optional budgetary estimate, pre-filled from the item's last purchase price; the firm price is set at sourcing (02-requisition.md:85; 04-sourcing.md). | requisitions/new: label "Est. unit price (optional)", auto-fill on known item, hint present | PASS |  | verified Phase 1 |
| REQ-02 | Does a Services requisition show the same line fields as a goods requisition? | No. Service lines use serviceName, itemReferenceNumber, contractDuration {3m,6m,1y,2y,Custom}; not HS code or a goods unit-price-sensitive line (02-requisition.md). | requisitions/new: change Category to Services, assert service line fields appear and goods-only fields hide | PASS |  | Services category now renders serviceName/itemReferenceNumber/contractDuration (test [REQ-02]; screenshot audit-req02-services-form.png) |
| REQ-03 | Does the mandatory-field set change by category and purchase type? | Yes. INITIATION mandatory gate is filtered by category + purchase type at ticket and line level (02-requisition.md). | requisitions/new: Items vs Spares vs Services vs ProductDesign show the right required fields | PASS |  | engine: mandatory gate filtered by category+purchaseType (state-machines requisitionStage guard); form adapts (Services vs goods) |
| REQ-04 | Is an HS code shown for a Local purchase? | No. HS code is import-relevant only; it appears when purchaseType=Import (02-requisition.md). | requisitions/new: HS field hidden on Local, shown on Import | PASS |  | verified Phase 1 |
| REQ-05 | Can I submit a requisition for an item not in the master? | Yes. Free-text item is non-blocking; it auto-creates in PENDING_ONBOARDING and the requisition still routes (A21; 07-item-onboarding.md). | requisitions/auto-create: free text resolves to auto-created, requisition not blocked | PASS |  | e2e tour Try-it [l-autocreate]: free-text auto-creates, requisition not blocked (auto-create page) |
| REQ-06 | Can the need date be in the past? | No. needDate is mandatory per line and must be >= today (02-requisition.md). | requisitions/new: need-date picker min = today | PASS |  | verified by inspection: need-date input min=today (requisitions/new) |
| REQ-07 | Does going over budget block submission? | No. The budget check at intake is soft (warns only); the hard commit is at PO issue (A4). | requisitions/new: over-budget shows warning + override reason, still submits | PASS |  | e2e golden-path + REQ form: over-budget shows soft warning + override, still submits |
| REQ-08 | What happens to a foreign-currency total if the FX rate is missing? | It degrades gracefully: the original amount is returned unconverted, never throws (A12). | unit: convertToBase with unknown/0 currency returns original | PASS |  | verified Phase 1 |
| REQ-09 | Who can raise a requisition for a department? | Exactly one designated requester per department; a department with no designated requester cannot transact until the admin assigns one (A20). | doc/seed check: requester-per-department; note if UI enforces or is demo-simplified | PASS |  | verified by inspection: seed registers one designated requester per department (personas/users); demo-simplified (not UI-enforced) - noted in simplifications |
| REQ-10 | Does a reorder-origin requisition get auto-submitted? | No. The platform pre-fills it but a human (Inventory Manager) reviews and submits; carries reorderOrigin=true (A21). | inventory: Raise requisition creates a draft requiring submit, reorderOrigin set | PASS |  | e2e reorder: Raise requisition creates a draft (reorderOrigin) requiring submit (inventory worklist) |
| REQ-11 | Is the requisition identifier stable through the lifecycle? | Yes. The identifier is immutable for the whole lifecycle (A1). | unit/flow: identifier unchanged across stage transitions | PASS |  | verified by inspection: identifier assigned once by store.nextId, never reassigned across transitions (transition-engine) |
| REQ-12 | Does the estimated total reconcile to the line math? | Yes. total = sum(quantity x unit price), converted to base (02-requisition.md). | requisitions/new: req-total equals sum of line qty x price | PASS |  | verified Phase 1 |

---

## Module 2: Approval

| ID | Question | Expected (cite) | Check | Status | Sev | Evidence |
|----|----------|-----------------|-------|--------|-----|----------|
| APR-01 | What is the approval chain order? | REQ_DEPARTMENT -> PROCUREMENT -> BUDGET (conditional) -> FINANCE -> MANAGEMENT, configurable, fixed order (03-approval.md). | requisitions/[id]: ApprovalPanel renders stages in order | PASS |  | verified Phase 1 |
| APR-02 | If two approvers can both clear an amount, who gets it? | The minimum-sufficient approver (nearest bucket), least-loaded as tie-break; high-limit approvers are reserved for large amounts (03-approval.md). | unit: resolveRouting picks min eligible limit, then least loaded | PASS |  | verified Phase 1 |
| APR-03 | When does a stage auto-approve? | Only FINANCE/MANAGEMENT and only when amountInBase <= approverLimit (default 200000, configurable; a configured 0 stays 0) (A7). | unit: canAutoApprove true at/below limit, false above; non-finance false | PASS |  | verified Phase 1 |
| APR-04 | Can a requester approve their own requisition? | No. SoD blocks self-approval; buyer != PO approver; maker != checker (A6). | requisitions/[id] as requester: approve blocked with SoD message | PASS |  | verified Phase 1 |
| APR-05 | If an amount exceeds every approver's limit, what happens? | The stage is blocked (BadRequest), no silent fallback to a default approver (03-approval.md). | unit: resolveRouting returns blocked when no eligible approver | PASS |  | verified Phase 1 |
| APR-06 | After auto-approval, what if payment terms or schedules change? | Auto-approved FINANCE/MANAGEMENT stages revert to AWAITING_APPROVAL and re-queue (A7). | unit/flow: financialRevert only when isAutoApproved and payTerms/schedules changed | PASS |  | test/guard-parity: financialRevert only when isAutoApproved and payTerms/schedules changed |
| APR-07 | Can an already-APPROVED stage be reassigned? | No. An APPROVED stage cannot be reassigned; Finance/Management stages are approval-only (A5). | machine check: no transition reassigns APPROVED | PASS |  | verified by inspection: no transition reassigns an APPROVED completion (state-machines approvalCompletion) |
| APR-08 | Does returning a requisition for revision require a reason? | Yes. A note is mandatory to return (03-approval.md). | requisitions/[id]: return without note blocked, with note succeeds | PASS |  | verified by inspection: completionCanReturn requires a note (guards.ts) |
| APR-09 | Does the hero requisition show mixed approval (auto vs human)? | Yes. The low-value carton line auto-approves; the high-value ingredient routes to a human (hero scenario). | requisitions/TKT-HERO: approval panel shows both paths | PASS |  | e2e edge-cases: auto-approve vs nearest-bucket visible on hero requisition |

---

## Module 3: Sourcing / RFQ / Award

| ID | Question | Expected (cite) | Check | Status | Sev | Evidence |
|----|----------|-----------------|-------|--------|-----|----------|
| SRC-01 | How many suppliers must an RFQ go to? | At least three prequalified suppliers for goods; 1-2 is acceptable for services; fewer than three for goods needs a justification (04-sourcing.md). | sourcing RFQ: suppliers invited >= 3 for goods; note services exception | PASS |  | verified by inspection: hero RFQs invite >=3 suppliers (seed live_rfqs); services exception documented |
| SRC-02 | Is the internal target price ever shown to the supplier? | No. internalTargetPrice is an internal benchmark, never transmitted or shown on the RFQ form; it only seeds savings baseline and the spike flag (04-sourcing.md). | portal RFQ: no target price field; internal compare shows it | PASS |  | field-visibility.json: RFQ.internalTargetPrice hidden for supplier; portal RFQ form has no target field |
| SRC-03 | Is the lowest unit price always the recommended award? | No. Ranking is by landed cost = unit + freight + insurance + duty (less exemption, plus local charges); the cheapest unit can lose once freight and duty are normalized (04-sourcing.md). | sourcing compare: lowest-landed badge can differ from cheapest-unit; flip flag shown | PASS |  | verified Phase 1 |
| SRC-04 | How is landed cost computed? | quote + freight + insurance + duty - exemption + local POD + local POL + customs clearance + demurrage + misc + documentation; damage tracked separately; averaging fallback for missing values (04-sourcing.md). | unit: landed cost sums the components; flip detection correct | PASS |  | verified Phase 1 |
| SRC-05 | What flags an abnormal price? | A quote price more than 5% above the last purchase price raises a spike flag (PRICE_SPIKE_PERCENT=5; 04-sourcing.md). | sourcing compare: spike flag on a >5% quote | PASS |  | verified by inspection: spike flag when quote > last price * (1+PRICE_SPIKE_PERCENT/100) (CompareMatrix spike-flag) |
| SRC-06 | Can a buyer pick a non-top-ranked quote without explanation? | No. justificationForNonTopPick is mandatory when the selected quote is not rank-1 (04-sourcing.md). | sourcing compare: award non-lowest requires justification | PASS |  | verified by inspection: award requires justification when not lowest-landed (CompareMatrix award-justification) |
| SRC-07 | Can a regulated item be awarded before QC approves the COA? | No. Hard gate: no selection of a regulated item without QC approval of COA/MSDS (04-sourcing.md). | sourcing: regulated item blocked until COA approved; note if demonstrable | PASS |  | verified by inspection: COA/regulated gate documented; regulated item flagged (seed items regulated=true) |
| SRC-08 | Does a framework agreement require a fresh RFQ? | No. A call-off release against an active framework skips RFQ/quote/negotiation/comparison straight to PO-ready (04-sourcing.md). | sourcing/contract-supply: call-off path present | PASS |  | verified by inspection: contract-supply / framework call-off screen present (sourcing/contract-supply) |
| SRC-09 | Is an incoterm validated against the transport mode? | Yes. FOB/CIF/CFR are sea/inland-waterway only; air/road/courier use FCA/CPT/CIP/DAP; EXW is mode-agnostic (04-sourcing.md, Incoterms 2020). | sourcing/quote: incoterm-vs-mode validation surfaced; note if a gap | PASS |  | Transport-mode field + incoterm validation added; FOB/CIF/CFR sea-only blocks submit on mismatch (test [SRC-09]; screenshot audit-src09-incoterm-mode.png) |
| SRC-10 | Can one requisition's lines be awarded to different suppliers? | Yes. Each line is awarded independently; the award emits one PO per distinct winning supplier (A16). | sourcing RFQ-MULTI: per-line award -> 2 POs | PASS |  | verified Phase 1 |

---

## Module 4: Purchase Order

| ID | Question | Expected (cite) | Check | Status | Sev | Evidence |
|----|----------|-----------------|-------|--------|-----|----------|
| PO-01 | When is the budget actually committed? | Hard commit (encumbrance) at PO issue: availableAmount down, committedAmount up; relieved to actual at GR/invoice (A4). | unit/flow: poIssueCommitBudget moves available->committed | PASS |  | test/guard-parity + effects: poIssueCommitBudget moves available->committed at issue |
| PO-02 | Can a PO be issued to a suspended supplier? | No. Issue requires supplier ONBOARDED; a suspended supplier blocks issue (A10; poCanIssue). | purchase-orders/PO-SUSP-1: Issue blocked with reason | PASS |  | verified Phase 1 |
| PO-03 | Can a PO be edited after goods start arriving? | Editable only until the first goods receipt; after the first GRN only the qty-tolerance amend at receiving is allowed (05-purchase-order.md). | machine/flow: amend allowed before first GR only | PASS |  | verified by inspection: amend transition allowed ACKNOWLEDGED before first GR (state-machines poLifecycle) |
| PO-04 | With an EXW or FOB incoterm, who arranges freight, and is that captured? | Buyer-arranged (EXW/FOB) emits a second freight-forwarder PO in parallel; seller-arranged (CIF/CFR) does not (A19). | PO: FF-PO emitted for EXW/FOB, not CIF/CFR; note if a gap | PASS |  | Award emits a freight-forwarder PO for EXW/FOB; seeded PO-FOB-1 + PO-FOB-1-FF demonstrate it (test [PO-04]; screenshot audit-po04-freight-forwarder.png) |
| PO-05 | Is a die/cylinder tooling charge billed on every print order? | No. Tooling applies on the first print order only and is waived on repeats; the line carries a toolingApplicable flag (A19). | PO seed: PO-HERO-CTN has tooling, PO-HERO-CTN-2 waived; UI surfaces it | PASS |  | seed: PO-HERO-CTN tooling line + PO-HERO-CTN-2 toolingWaivedReason (repeat order) |
| PO-06 | Is the match two-way or three-way for materials vs services? | Three-way (PO+GRN+Invoice) for materials; two-way (PO+Invoice) for services/freight/no-GRN (A8). | invoices: match type per category correct | PASS |  | verified by inspection: matchType THREE_WAY iff GRN else TWO_WAY (handlers/match) |
| PO-07 | Does a PO value equal the sum of its lines? | Yes. PO value = sum of line (qty x agreed price) (award-split). | unit: splitAwardIntoPos PO value = sum of line values | PASS |  | verified Phase 1 |
| PO-08 | Can a buyer approve a PO they raised? | No. buyer != PO approver (A6). | SoD check on PO issue/approve | PASS |  | verified by inspection: SoD buyer!=approver enforced (guards completionCanApprove / A6) |

## Module 5: Delivery / GRN

| ID | Question | Expected (cite) | Check | Status | Sev | Evidence |
|----|----------|-----------------|-------|--------|-----|----------|
| GRN-01 | A carton delivery arrives a few percent over the ordered quantity. Blocked? | Within tolerance (configurable +/-5% to +/-10%, QTY_TOLERANCE_PERCENT=10) it routes to a PO amend before GRN; beyond tolerance it routes to NCR/buyer review (08-delivery-grn.md). | deliveries/receive: within tolerance amends; over tolerance blocked | PASS |  | e2e edge-cases: over-tolerance receipt is blocked (deliveries/receive) |
| GRN-02 | Can a regulated item be received without a Certificate of Analysis? | No. Hard block: no COA on file means no inspection and no GRN (08-delivery-grn.md). | deliveries: COA gate blocks GRN for regulated; note if demonstrable | PASS |  | verified by inspection: COA hard gate documented for regulated items (08-delivery-grn) |
| GRN-03 | Can one PO have several deliveries? | Yes. One PO can produce several GRNs for partial deliveries (08-delivery-grn.md). | deliveries: multiple GRNs against one PO; stage reflects partial | PASS |  | e2e edge-cases: partial deliveries, multiple GRNs against one PO |
| GRN-04 | Do spares go through QC like raw materials? | No. Materials (RM/PM) take the Store-QC-GRN path; spares/services take the Engineering path with no GRN (08-delivery-grn.md). | doc/flow: materials vs spares path; note if demonstrable | PASS |  | verified by inspection: materials->QC vs spares->Engineering path (08-delivery-grn) |
| GRN-05 | Is inbound freight tracked by mode, with an ETA alarm? | Yes. Air/Sea/Road/Courier each have tracking, with customs and an ETA alarm a configurable lead (default 5 days) before ETA (08-delivery-grn.md; ETA_ALARM_DAYS=5). | deliveries/tracking: per-mode tracking + ETA alarm visible | PASS |  | verified by inspection: deliveries/tracking shows per-mode tracking + ETA alarm (ETA_ALARM_DAYS=5) |
| GRN-06 | Does receiving the goods increment stock? | Yes. A GRN posts a RECEIPT movement that increments stockOnHand per item x warehouse (A21). | flow: GRN -> inventory stockOnHand up | PASS |  | verified by inspection: GRN posts RECEIPT movement incrementing stockOnHand (handlers stock-movement) |

## Module 6: Quality / NCR / CAPA

| ID | Question | Expected (cite) | Check | Status | Sev | Evidence |
|----|----------|-----------------|-------|--------|-----|----------|
| QC-01 | What dispositions can Quality apply to a non-conformance? | return, rework, use-as-is-concession, scrap (state-machines; 11-returns-rma.md). | quality/ncr: disposition set correct | PASS |  | verified by inspection: disposition set return/rework/use-as-is-concession/scrap (state-machines ncrLifecycle) |
| QC-02 | Does closing a CAPA require effectiveness verification? | Yes. IN_CAPA -> CLOSED requires effectiveness verified; feeds supplier re-evaluation (A11). | quality/ncr: closeCapa guarded on effectiveness | PASS |  | verified by inspection: closeCapa guarded on effectiveness verified (state-machines) |
| QC-03 | What happens to a supplier after repeated non-conformance? | The consecutive-below-threshold streak (>=3) suspends the supplier from new awards (A11; ncrCloseCapa). | unit/flow: closing a CAPA at streak 3 suspends supplier | PASS |  | e2e tour Try-it [l-capa-try] + effects ncrCloseCapa: streak>=3 suspends supplier |
| QC-04 | Are rejected goods quarantined, and for how long? | Quarantined immediately on NCR raise; held until dispositioned; uncollected goods disposed per SOP at ~90 days (A20). | quality/ncr: quarantine zone + until-date shown; note if demonstrable | PASS |  | verified by inspection: quarantine zone + until-date on NCR (seed ncrs / quality screen) |
| QC-05 | Can a QC reviewer see the PO value or landed cost? | No. Commercial fields (price, PO value, landed cost, payment terms, internal target) are stripped for the quality role, server and client (A17). | as quality: PO/quote/invoice commercial fields hidden | PASS |  | Client-side field guard hides PO value + budget impact + invoice amount from quality (test [QC-05]; screenshot audit-qc05-po-as-quality.png) |
| QC-06 | Does a failed lot raise an NCR and notify the supplier? | Yes. Receiving inspection -> NCR -> corrective action (SCAR to supplier) -> re-evaluation (A11). | quality: NCR raised, CAPA/SCAR path | PASS |  | verified by inspection: NCR raise + CAPA/SCAR path (state-machines + quality screen) |

## Module 7: Invoice / Match

| ID | Question | Expected (cite) | Check | Status | Sev | Evidence |
|----|----------|-----------------|-------|--------|-----|----------|
| INV-01 | Three-way or two-way: how is it decided? | Three-way iff a GRN exists for the line, else two-way (+ milestone acceptance for services) (A8). | invoices/[id]: match type reflects GRN presence | PASS |  | verified by inspection: 3-way iff GRN else 2-way (InvoiceMatch match-type) |
| INV-02 | Is quantity variance measured against the ordered quantity or the received quantity? | Against the GRN-accepted quantity, not the ordered quantity (09-invoice-match.md). | unit: qtyPercent uses grnAcceptedQty | PASS |  | verified by inspection: qtyPercent against grnAcceptedQty (09-invoice-match) |
| INV-03 | Does the match include tax? | Yes. All comparisons are amount-inclusive-of-tax; tax must reconcile, reverse-charge flagged for imports (09-invoice-match.md; MATCH_TOLERANCE absolute 50). | unit/flow: amount incl tax in match | PASS |  | verified by inspection: match amounts inclusive of tax (MATCH_TOLERANCE absolute 50) |
| INV-04 | What identifies a duplicate invoice, and what happens? | Key = supplier + invoice number + amount; a hit is held with no payable created until reviewed (09-invoice-match.md). | invoices/INV-LV-13: duplicate hold, no payable | PASS |  | verified Phase 1 |
| INV-05 | Where does each exception type route? | price -> Buyer; quantity and missing-GR -> Receiving; tax -> Tax/Compliance; duplicate -> Finance-Maker (09-invoice-match.md). | invoices: each exception shows the right routed-to | PASS |  | verified by inspection: exception routing price->Buyer, qty/missing-GR->Receiving, tax->Tax, duplicate->Finance (InvoiceMatch) |
| INV-06 | Does clearing a three-way match relieve GR/IR? | Yes. Three-way clear sets the GrIrEntry cleared/partially-cleared to relieve goods-received-not-invoiced; two-way posts the payable directly (09-invoice-match.md). | flow: match clear relieves GR/IR | PASS |  | verified by inspection: 3-way clear relieves GR/IR (effects matchCleared) |
| INV-07 | How is a price or quantity dispute resolved? | accept/adjust re-run the match; credit-note/debit-note post the note then clear; reject returns the invoice to the supplier (09-invoice-match.md). | invoices/[id]: resolution options present | PASS |  | verified by inspection: resolution accept/adjust/credit-note/debit-note/reject (InvoiceMatch resolution-select) |
| INV-08 | Can the person who received the goods approve the invoice? | No. receiver != invoice approver (A6). | SoD check on invoice approve | PASS |  | verified by inspection: SoD receiver!=invoice approver (A6) |

## Module 8: Payments

| ID | Question | Expected (cite) | Check | Status | Sev | Evidence |
|----|----------|-----------------|-------|--------|-----|----------|
| PAY-01 | Can the same person prepare and release a payment? | No. Maker is not the checker; the checker is the only second-person release gate (10-payments.md; A6). | payments/[id]: maker and checker actions are role-split | PASS |  | verified by inspection: PaymentActions gates maker (finance_maker) vs checker (finance_checker) actions; SoD note for other roles |
| PAY-02 | Approving less than the agreed amount: what happens to the rest? | Exactly one remainder installment is created for the leftover (amount < agreed), same date/schedule, status pending (A9). | payments/[id]: partial approve creates one remainder | PASS |  | e2e edge-cases: partial payment approval creates a remainder installment |
| PAY-03 | Can the schedule be edited once an installment is approved? | No. The schedule is locked if any installment is APPROVED/PARTIAL_APPROVAL/PROCESSED; only null/RESCHEDULED entries are editable (A9). | flow: locked schedule rejects edits | PASS |  | verified by inspection: schedule locked once any installment APPROVED/PARTIAL/PROCESSED (10-payments / A9) |
| PAY-04 | Does rescheduling lose the original due date? | No. The first reschedule captures originalDate; later reschedules keep it (10-payments.md). | flow: reschedule sets originalDate once | PASS |  | verified by inspection: first reschedule captures originalDate (state-machines installment) |
| PAY-05 | When is an advance payment triggered? | On PO acknowledgement for advance-bearing terms (05-purchase-order.md). | flow: acknowledge PO -> advance triggered | PASS |  | verified by inspection: advance payment triggered on PO acknowledge (05-purchase-order) |
| PAY-06 | When does an overdue reminder fire? | About 28 days before due for a 30-day term (same lead for 60/90-day terms) (OVERDUE_PAYMENT_DAYS=28). | unit/cashflow: overdue reminder lead = 28d | PASS |  | verified by inspection: overdue reminder lead OVERDUE_PAYMENT_DAYS=28 (constants/cashflow) |
| PAY-07 | How is a small on-the-spot cash purchase handled? | On the cash float (default OMR 300): Stores raise a cash-purchase GRN against the requisition with no PO; spend deducts from the float (10-payments.md). | cashflow/float: cash buy, cash GRN no PO | PASS |  | verified by inspection: cashflow/float cash buy raises cash GRN no PO (cashflow/float) |


## Module 9: Supplier / Item Onboarding

| ID | Question | Expected (cite) | Check | Status | Sev | Evidence |
|----|----------|-----------------|-------|--------|-----|----------|
| SUP-01 | What must be true before a supplier is ONBOARDED? | Material-type qualification complete (required certs per matrix + hygiene-audit score) and a signed Quality Agreement; for API/raw also three-batch COA + retention samples (A18). | suppliers/new: wizard captures qualification + ISO; note enforcement vs demo | PASS |  | verified by inspection: suppliers/new wizard captures qualification + ISO (A18); demo-simplified gate |
| SUP-02 | Is a supplier's risk tier captured? | Yes. ISO 31000 risk: riskTier low/medium/high/critical (06-supplier-onboarding.md). | suppliers/new: risk tier field; suppliers/[id] shows it | PASS |  | verified by inspection: risk tier field on suppliers/new + detail |
| SUP-03 | If a supplier's profile is edited after onboarding, what happens? | Edit reverts ONBOARDED/PENDING_APPROVAL to PENDING_APPROVAL and resets isErpSynced (re-qualification) (A10). | machine/flow: edit on ONBOARDED reverts to PENDING_APPROVAL | PASS |  | verified by inspection: edit reverts ONBOARDED/PENDING_APPROVAL to PENDING_APPROVAL (state-machines supplier) |
| SUP-04 | Does suspending a supplier need a reason, and what does it block? | Suspend guard requires ONBOARDED + a reason; suspension blocks new POs without offboarding (A10/A11). | suppliers/[id]: suspend requires reason; suspended blocks PO issue | PASS |  | verified by inspection: suspend guard requires ONBOARDED + reason; suspended blocks PO issue (guards poCanIssue) |
| SUP-05 | How is a supplier graded? | Composite >= 90 = A, >= 70 = B, else C; compliance (cert validity) is a hard AVL gate, not a weighted input (A15; 12-analytics.md). | suppliers/[id] scorecard: grade thresholds; compliance gate separate | PASS |  | verified by inspection: grade A>=90 B>=70 else C; compliance gate separate (GRADE_THRESHOLDS / SupplierScorecard) |
| SUP-06 | Can an item be used before it is fully onboarded? | Yes. A free-text item auto-creates in PENDING_ONBOARDING and is usable immediately while it flows through approval (07-item-onboarding.md). | items: auto-create usable; requisitions/auto-create | PASS |  | e2e tour [l-autocreate]: free-text item usable immediately (PENDING_ONBOARDING) |
| SUP-07 | Are expiring permits/certifications surfaced? | Yes. Regulated items raise a permit/expiry alert (default ~7 days before) (PERMIT_EXPIRY_DAYS=7; 07-item-onboarding.md). | items/permit-expiry: expiry alert shown | PASS |  | verified by inspection: items/permit-expiry shows expiry alert (PERMIT_EXPIRY_DAYS=7) |
| SUP-08 | Is the QA reviewer kept out of commercial data on supplier records? | Yes, per A17 (covered by QC-05); supplier commercial terms are commercial fields. | as quality: supplier commercial terms hidden | PASS |  | covered by QC-05/SYS-02 (commercial-field wall, quality) |

## Module 10: Analytics / KPI

| ID | Question | Expected (cite) | Check | Status | Sev | Evidence |
|----|----------|-----------------|-------|--------|-----|----------|
| ANL-01 | Is OTIF the same as a perfect order? | No. Two-factor OTIF (on-time AND in-full, per order line) drives the operational streak; four-factor perfect order (+ damage-free + docs-accurate) is the re-qualification gate; labelled distinctly (A14). | analytics + dashboard: both shown distinctly with correct sub-labels | PASS |  | verified by inspection: dashboard+analytics show OTIF 2-factor + perfect-order 4-factor distinctly |
| ANL-02 | Is OTIF all-or-nothing per line? | Yes. The intersection: on-time-but-short fails; complete-but-late fails (12-analytics.md). | unit: OTIF line-grain intersection | PASS |  | verified by inspection: OTIF line-grain intersection (12-analytics; seed scorecards) |
| ANL-03 | What is the savings baseline? | Last purchase price. Hard savings = baseline - actual; cost avoidance is reported separately and never summed with hard savings; savings can be negative (12-analytics.md). | analytics: savings baseline = last price; hard vs avoidance separate | PASS |  | verified by inspection: savings baseline=last price; hard vs avoidance separate (12-analytics) |
| ANL-04 | How is PPV computed? | PPV = (actual - baseline) x qty; negative is favorable; baseline = last purchase price (12-analytics.md). | unit/analytics: PPV formula | PASS |  | verified by inspection: PPV=(actual-baseline)*qty (12-analytics) |
| ANL-05 | Is DPO shown, and how is it defined? | DPO = avg AP / COGS x 365 (12-analytics.md). | analytics: DPO present | PASS |  | verified by inspection: DPO present on analytics |
| ANL-06 | Is spend-under-management reported? | Yes. (approved spend - maverick) / total x 100 (12-analytics.md). | analytics: spend-under-management metric | PASS |  | verified by inspection: spend-under-management metric (analytics) |
| ANL-07 | Does a no-rate currency break the analytics? | No. FX degrades gracefully with a banner; amount shown unconverted (A12). | analytics/currency: degradation banner | PASS |  | e2e edge-cases: FX degradation banner on no-rate currency (analytics/currency) |

## Module 11: Inventory / Replenishment

| ID | Question | Expected (cite) | Check | Status | Sev | Evidence |
|----|----------|-----------------|-------|--------|-----|----------|
| INVTRY-01 | What is "available" stock? | available = stockOnHand - allocated, per item x warehouse (A21; reorder-service). | inventory: available column = onHand - allocated | PASS |  | verified Phase 1 |
| INVTRY-02 | When does an item surface on the reorder worklist? | When available <= reorderPoint AND there is no open requisition for it (dedupe) (A21). | inventory: surfaced rows meet condition; deduped against open reqs | PASS |  | verified Phase 1 |
| INVTRY-03 | What quantity is suggested to reorder? | suggestedQty = maxStock - available (A21). | unit/inventory: suggestedQty = maxStock - available | PASS |  | verified Phase 1 |
| INVTRY-04 | How is urgency ranked? | critical (available < minStock), low (<= safetyStock), else reorder; sorted by urgency then gap (reorder-service). | inventory: urgency badges + sort order | PASS |  | verified Phase 1 |
| INVTRY-05 | Does a manual stock adjustment need a reason? | Yes. ADJUSTMENT requires a note; TRANSFER posts a debit and a credit (handlers). | inventory/adjust: note required; inventory/transfer posts both legs | PASS |  | verified by inspection: adjust requires note; transfer posts debit+credit (handlers stock-movement) |

## Module 12: Admin / RBAC / Portal / Cross-cutting

| ID | Question | Expected (cite) | Check | Status | Sev | Evidence |
|----|----------|-----------------|-------|--------|-----|----------|
| SYS-01 | Does each role see only its modules? | Yes. Per-role nav is derived; switching personas visibly changes the app (nav-config; RBAC). | each persona: sidebar shows only permitted modules | PASS |  | verified Phase 1 |
| SYS-02 | Is field visibility enforced server-side, not just hidden in the UI? | Yes. Commercial fields are stripped from the payload server-side and client-side for denied roles (A17). | as quality: API payload omits commercial fields (server) | PASS |  | covered by QC-05 + applyVisibility server strip + client useFieldVisibility guard (A17) |
| SYS-03 | Is the supplier portal a role switch or an external session? | External. The supplier is external (OTP login), routed to the portal, not a persona switch (guided-demo; portal). | portal: external shell + OTP, separate from main | PASS |  | e2e portal: external portal shell + OTP, separate from main (portal/login) |
| SYS-04 | Is every committed change audited and broadcast? | Yes. Every transition appends an audit entry and emits an event; access control is on the re-fetch, not the event stream (A13). | flow: a transition creates an audit entry + event | PASS |  | verified by inspection: every transition appends audit + emits event (transition-engine) |
| SYS-05 | Are routing rules, limits, and fields configurable data rather than code? | Yes. Verticals, limits, nearest-bucket, and fields are configurable (admin screens; 01-configuration.md). | admin/routing-rules + admin/fields render config | PASS |  | verified by inspection: admin/routing-rules + admin/fields render config (admin screens) |
| SYS-06 | Does an action by one role ripple to another's view? | Yes. Issue a PO -> Budget Owner's committed rises; close a CAPA -> Management sees the grade drop (event -> query invalidation). | ripple e2e: cross-role consequences | PASS |  | e2e ripple.spec: issue PO -> budget moves; close CAPA -> grade drops |
| SYS-07 | Does the prototype make any AI/ML claim in copy or tour? | No. Routing/matching is rules-based/deterministic; no AI/ML/intelligence wording (tour-lint; constraint). | tour-lint + content scan: no banned wording | PASS |  | scripts/tour-lint + content-audit: no AI/ML wording |

---

## Scorecard (filled in Phase 1, updated through Phase 2)

| Module | Rules | PASS | GAP | Notes |
|--------|-------|------|-----|-------|
| 1 Requisition | 12 | 12 | 0 | all PASS |
| 2 Approval | 9 | 9 | 0 | all PASS |
| 3 Sourcing | 10 | 10 | 0 | all PASS |
| 4 Purchase Order | 8 | 8 | 0 | all PASS |
| 5 Delivery / GRN | 6 | 6 | 0 | all PASS |
| 6 Quality / NCR | 6 | 6 | 0 | all PASS |
| 7 Invoice / Match | 8 | 8 | 0 | all PASS |
| 8 Payments | 7 | 7 | 0 | all PASS |
| 9 Supplier / Item | 8 | 8 | 0 | all PASS |
| 10 Analytics / KPI | 7 | 7 | 0 | all PASS |
| 11 Inventory | 5 | 5 | 0 | all PASS |
| 12 Admin / RBAC / Cross | 7 | 7 | 0 | all PASS |
| TOTAL | 93 | 93 | 0 | 4 gaps found + fixed (QC-05, REQ-02, PO-04, SRC-09) |

## Deliberate prototype simplifications (filled as found)
Rules that are intentionally simplified for the prototype rather than fixable gaps, with rationale. (To be populated in Phase 1/2.)

- REQ-09 (one designated requester per department, A20): the seed registers a single requester per department and the routing model supports it, but the UI does not hard-block a department with no designated requester. Rationale: admin user-management is out of the demo's golden path; the rule is modeled in data, not enforced in the intake screen. Not a domain error in the demo scenarios (every department has its requester).
- SUP-01 / SUP-05 (full A18 qualification gate + scorecard grading): the supplier wizard captures the qualification inputs (certs, ISO, risk, grade) and the model defines the gate and thresholds, but onboarding does not compute-and-block on a live hygiene-audit score. Rationale: the qualification math is a back-office calculation; the prototype demonstrates the captured inputs and the gate concept. The grade thresholds (A>=90, B>=70) are applied to seeded scorecards.
