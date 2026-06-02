# Unified Data Model (first cut)

Core entities, key fields, state machines, and benchmark traceability for the unified model. Drawn from both companies (RA = Raphe, AB = Al Bahja, merged = combined). Finalized in Phase C; this is the Phase B first cut. Source: `best-of-decisions.md`, `raphe-masters-and-data-model`, `albahja-masters-and-fields`.

## Core transactional entities

**Requisition (PurchaseRequest)** [SCOR S1.1/O2; ISO 7.5] - identifier (configurable pattern, immutable across delays - AB), requesterId, departmentId, category (Items/Spares/Services/ProductDesign - AB), purchaseType (Direct/Indirect; Local/Import - merged), priority (Urgency - RA), currency, projectId, stage, status, totalAmount, totalAmountInBase (FX-normalized - generalized from RA INR), notes, createdAt. State: stage + status + per-stage completion (RA three-dimension model).
**RequisitionLine** - itemId (or free-text -> auto-create), quantity, unitOfMeasure, unitPrice, productUsedFor (AB), availableStock (AB), needDate, lineNote, finishedProductCategory (AB, for spend reporting), attachments, warehouseCode.

**ApprovalChain / ApprovalStage / VerticalCompletion** [SCOR OE2; ISO 8.4] - RA per-stage completion (NOT_STARTED -> IN_PROGRESS -> AWAITING_APPROVAL -> APPROVED; READY_FOR_APPROVAL). RoutingRuleEntry (department, stage/vertical, assigneeUserIds, approverUserIds), approvalLimit (default configurable, RA 200000), isAutoApproved, approvalRequestedToId, approvedAt. Stages configurable; AB FM+PurchaseHead = a configuration.

**RFQ** [SCOR S1.8] - reference, requisitionId, invitedSupplierIds (>=3 - AB), template, sentDate, internalTargetPrice (never sent - RA/AB), status. **Quotation** [S1.8/S1.9] - rfqId, supplierId, price, paymentTerms, deliveryTerms, incoterm, charges (die/cylinder/documentation - AB), notes, attachments, submittedAt, revisedAt (negotiation re-open - AB). **LandedCost** [S1.9] - quote + freight + insurance (the I in CIF) + duty - exemption + local POD + local POL + customs clearance + demurrage/storage + misc + documentation (AB formula, insurance/demurrage added after review); damage tracked separately; averaging fallback for missing values. Incoterms 2020: validate incoterm against transport mode (FOB/CIF are sea-only; air/multimodal use FCA/CPT/CIP/DAP). **Contract/Agreement** [S1.10; OE6] - terms, validity, renewal date (AB 15-day reminder).

**PurchaseOrder** [SCOR S2.1; ISO 8.4.3] - number (configurable pattern), requisitionId, quotationId, supplierId, supplierCode, lines, value, currency, exchangeRate (manual override - AB), incoterm, scopeOfWork, terms (editable - AB), deliveryPlace/date, contactPerson, isoDocRef (AB), acknowledged, status, type (item/service/maintenance/freight - AB), editable-until-receipt (AB). 8.4.3 fields a-f (ISO). **POLine** - itemId, quantity, agreedPrice, tolerance (+/-5-10% for labels/cartons - AB).

**Supplier** [SCOR S1.6; ISO 8.4.1 + family] - code (S/##### configurable - RA), name, status (lifecycle below), currency, classification, group, addresses + tax (GST/PAN - RA), qualification (vendorRegistration, 3-batch COA, certs/AVL with scopeOfApproval + grade - AB + ISO), scorecard, riskTier+score (ISO 31000), security attrs + trade-program (ISO 28000), continuity attrs/MTPD-RTO/backup (ISO 22301), sustainability/ESG + ISO14001 (ISO 20400/14001), infoSec certs + DPA (ISO 27001), anti-bribery DD + screening (ISO 37001), each with last-assessed/next-due/evidence+expiry/CAPA-log; isErpSynced (generalized from isRamcoSynced). **SupplierGroup**, **SupplierAddress**, **SupplierAddressTaxDetail**.

**Item** [OE4] - code (DEP/SG/SSG/run configurable - RA; RM/PM Excel codes - AB), description (auto-populated - RA), status (lifecycle), stockUom, purchaseUom, segment/subSegment, standardSupplierId, sourcePriority (MANUFACTURED/PURCHASED/SUBCONTRACTED/STOCK_TRANSFER - RA), HS code (AB), category. 

**GoodsReceipt / PartialDeliveryBlock** [SCOR S2.4; ISO 8.6] - RA block model (trackingNumber_MAWB_HAWB, boeNumber, clearanceBy, actualDeliveryDate, erpGrNumber, carrier, courierCargo, itemsDelivery JSON [{ticketItemId, quantity}]); + AB inbound-logistics layer (transport mode air/sea/road/courier, AWB/BL, customs/Bayan, ETA + alarm). Derived delivery status (RA: delivered/partial/overdue/upcoming). **Inspection/NCR** [S2.5; ISO 8.6/8.7] - COA/MSDS review, QC approve/reject (hard block - AB), NCR (item, deliveryNote#, date, description, %nonconformance, image - AB), disposition.

**Invoice** [SCOR S2.7; ISO 8.6] - supplierId, poId, lines, amount, documents (invoice/packingList/CoO/AWB-BL/Bayan/healthCert/DG - AB), approvedBy. **MatchResult** [ISO 8.6] - poId, grnId, invoiceId, matchStatus (matched/exception), exceptionReason (BUILD NEW). 

**Payment / PaymentSchedule / Installment** [SCOR S2.7; ISO 8.4] - schedule {amount, event-or-date, description, term}; InstallmentStatus (APPROVED/PARTIAL_APPROVAL/PROCESSED/RESCHEDULED; null=pending - RA); approvedAmount, remainder (partial - RA e04), receiptFile, originalDate (reschedule - RA), locked rule (RA e03). Terms (100% advance / part-advance+against-docs / part-advance+against-shipment / 30/70 / net 30/60/90 - AB). Maker/checker. CashFloat (AB: balance, reimbursement when low) + cash GRN (no PO ref). CreditorLedger per supplier (AB). overduePaymentReminder ~28d (AB). totalAmountPaid/upcoming/overdue (RA).

**Return / RMA** [SCOR S4; ISO 8.7/10.2 - BUILD NEW] - returnId, sourceOrderId, reason/condition (S4.3), authorization (S4.2), shipment (S4.4), closure/adjustment (S4.5), linkedNcrId. **CorrectiveAction/CAPA** [ISO 10.2 - BUILD NEW] - ncrId, supplierId, rootCause, action, effectivenessReview, feeds supplier re-evaluation (8.4.1).

## Finance-control entities (added after senior-practitioner review - these are load-bearing in real P2P)

**Budget / Commitment (encumbrance accounting)** [SCOR OE11 Enterprise Business Planning; finance control - BUILD NEW, neither company had it]. Approval limits are NOT budget control; a real operation checks funds and encumbers them.
- **Budget** - costCenterId/projectId, period, amount, availableAmount, committedAmount, actualAmount. Budget check fires at requisition (soft) and at PO issue (hard commit).
- **Commitment** - created at PO issue (encumbers budget = reduces available, increases committed); relieved at GR/invoice (moves committed -> actual). Enables commitment-vs-actual reporting and over-commitment prevention. budgetId, poId, amount, status (committed/relieved).

**GR/IR clearing (goods-received / invoice-received)** [SCOR S2.4->S2.7; ISO 8.6; accounting backbone of 3-way match - BUILD NEW]. Decouples receiving from invoicing. At GR, accrue a liability to a GR/IR clearing account; clear it when the invoice is matched. Enables received-not-invoiced (GNI) and invoiced-not-received reconciliation (month-end control).
- **GrIrEntry** - poLineId, grnId, invoiceId (null until matched), accruedAmount, clearedAmount, status (accrued/cleared/partially-cleared).

**Tax / Withholding** [multi-country: India GST/TDS, Oman 5% VAT/WHT, import reverse-charge, customs duty - BUILD NEW; both companies only had GST/PAN as registration data]. Tax must be a first-class LINE attribute so 3-way match reconciles invoice amounts INCLUDING tax.
- **TaxCode** master - code, type (GST/VAT/duty/reverse-charge), rate, jurisdiction, recoverable (input-credit eligible y/n).
- On POLine / InvoiceLine: taxCodeId, taxAmount, taxableAmount. On Payment: withholdingTaxCodeId, withholdingAmount (TDS/WHT on cross-border services). Reverse-charge flag for imports. Input-VAT/GST credit tracked on recoverable tax.

**Credit / Debit Note** [resolves returns + match exceptions against the payable - BUILD NEW; both companies absent]. A return acceptance or price/qty exception adjusts the payable via a note, not a re-issued invoice.
- **CreditNote** (supplier-issued, reduces payable) / **DebitNote** (buyer-raised) - linkedInvoiceId, linkedReturnId, linkedMatchExceptionId, amount, taxAmount, reason; posts against the creditor ledger.

**Advance / Down-payment & Retention / Holdback** [implied by AB payment terms but not modeled - ADD]. 
- **AdvancePayment** - poId, amount (prepayment asset), status (requested/paid/recouped), recoupedAgainstInvoiceIds (recovered against later invoices).
- **Retention** - poId/invoiceId, withheldPercent, withheldAmount, status (withheld/released), releaseCondition (acceptance/warranty period).

**Payment Milestone** [services/contract POs use milestone acceptance instead of GRN - ADD]. milestoneId, poId, description, dueEvent, acceptanceStatus, paymentReleaseOnAcceptance. Two-way match + milestone acceptance replaces three-way match for service POs.

**Blanket / Framework Order + Call-off Release** [standard mechanism for repeat/indirect buys; the repeat-vs-competitive bypass needs it - ADD]. 
- **FrameworkAgreement** - supplierId, validity, agreed prices/terms, totalValue/quantity ceiling. Requisitions RELEASE against it without re-sourcing.
- **CallOffRelease** - frameworkAgreementId, requisitionId, quantity, value (draws down the ceiling). (Light consignment/VMI hook for BP.036 noted but optional.)

## Match logic (corrected after review - two-way vs three-way)

**MatchResult** must distinguish match type and carry tolerance + exception structure (the prior single "three-way" was incomplete):
- **matchType**: THREE_WAY (PO + GRN + Invoice) for goods-receipt categories (materials); TWO_WAY (PO + Invoice) for services/freight/no-GRN categories (consistent with spares/services received by Engineering with no GRN). Rule: three-way iff a GRN exists for the category; else two-way (+ milestone acceptance for services).
- **MatchTolerance** config - pricePercent, qtyPercent, absolute; within tolerance -> auto-clear, outside -> exception.
- **MatchException** - type (price-variance / qty-over / qty-under / missing-GR / DUPLICATE-INVOICE / tax-mismatch), routedTo (buyer for price, receiving for qty, finance for tax), resolution (accept / adjust / credit-note / debit-note / reject). Duplicate-invoice detection is a standard AP control (supplier + invoice number + amount).

## Master data
[OE4] Item, UoM, Currency (multi-currency + configurable base; FX rate carries date + source; realized FX gain/loss computed between PO and payment), Warehouse, PaymentTerms, Project/CostCenter (+ Budget), Category/Segment, AssetProposal, TaxCode. Each maintainable individually + bulk import (all-or-nothing, natural-key upsert - RA).

## Platform entities
User (approvalLimit, status ACTIVE/INACTIVE, department, designation, businessUnit/vertical, role), Role, Permission (namespaced, union of role/userRole/designation/vertical + super-admin `all` - RA), Designation (rank), BusinessUnit/Vertical, AuditLog (immutable, category - both), FieldConfig (by stage/scope/purchaseType, mandatory, isAuto - RA field engine), Notification, SseEvent, SupplierScorecard, ForecastEntry (AB: month/quarter x quantity, procurement-only, variance flag).

**OTIF / perfect-order definition (clarified after review):** the scorecard must state which definition it uses. Two-factor OTIF = on-time AND in-full (RA e07 streak). Four-factor "perfect order" = on-time AND in-full AND damage-free AND documentation-accurate (SCOR RL.1.2 Perfect Supplier Order Fulfillment). The unified model computes BOTH and labels them distinctly; the supplier re-qualification gate uses the four-factor perfect-order metric, the operational dashboard streak uses two-factor OTIF. Do not conflate.

## State machines (merged)

- **Requisition/ticket:** stage INITIATION -> ORDERED -> PARTIAL_DELIVERY -> POST_DELIVERY (linear, one step; RA). status IN_PROGRESS/ON_HOLD/CANCELLED/COMPLETED (RA). Per-stage completion (RA). COMPLETED guard = POST_DELIVERY + all stages APPROVED. Financial-revert: edit payTerms/paymentSchedules reverts auto-approved completions (RA e02).
- **Supplier/Item lifecycle:** PENDING_ONBOARDING -> PENDING_APPROVAL -> ONBOARDED -> OFFBOARDED; edit reverts ONBOARDED/PENDING_APPROVAL -> PENDING_APPROVAL; ERP-sync flag reset on update (RA). Plus a SUSPENDED/HOLD state (added after review): ONBOARDED -> SUSPENDED on failed audit / quality stop / expired ISO cert / sanctions hit / active CAPA; SUSPENDED blocks new POs without offboarding; SUSPENDED -> ONBOARDED on resolution. The CAPA-to-re-evaluation loop drives this.
- **Installment:** null(pending) -> APPROVED | PARTIAL_APPROVAL(+remainder) -> PROCESSED; or RESCHEDULED. Locked if any in APPROVED/PARTIAL_APPROVAL/PROCESSED (RA e03/e04).
- **Delivery status (derived, not stored):** delivered > partial > overdue > upcoming per item; roll up to ticket (RA).
- **PO:** draft -> issued -> acknowledged -> (editable until receipt) -> closed (AB/RA).
- **NCR/Return:** raised -> dispositioned (return/rework/concession) -> CAPA -> closed -> feeds re-eval (ISO loop, BUILD NEW).

## State machines - finalized (states, transitions, guards)

Each lifecycle below lists states, allowed transitions, and the guard on each. Generalized from both companies + the review additions.

**Requisition (ticket) - three independent dimensions (RA model):**
- STAGE (single, linear, one step forward): INITIATION -> ORDERED -> PARTIAL_DELIVERY -> POST_DELIVERY. Guard on each advance: all mandatory fields for the CURRENT stage filled (field engine, by stage/scope/purchaseType); new stage index = current + 1 exactly (no skip). PARTIAL_DELIVERY validates per delivery block.
- STATUS (single): IN_PROGRESS (initial) -> ON_HOLD | CANCELLED | COMPLETED. Guard: COMPLETED only when STAGE = POST_DELIVERY AND all approval completions = APPROVED AND (new) all 3-way/2-way matches cleared AND no open NCR/CAPA block. ON_HOLD/CANCELLED carry remarks, no other guard.
- COMPLETION (per approval stage): NOT_STARTED -> IN_PROGRESS (on first assignment) -> AWAITING_APPROVAL (on request-approval) -> APPROVED (on approve). Guards: assignment requires assignable stage + not-yet-APPROVED + assigner designation >= ; approval requires requested-approver-or-qualified-assignee + permission + SoD (not own req/PO). Auto-approval: within threshold -> APPROVED (isAutoApproved). Revert: edit payTerms/paymentSchedules -> auto-approved finance/mgmt completion reverts to AWAITING_APPROVAL.

**Budget/Commitment (BUILD NEW):** Budget available -> (requisition soft-check, warns if over) -> (PO issue HARD commit: available -= amount, committed += amount; guard: available >= amount or override-with-approval) -> Commitment committed -> (GR/invoice: committed -= amount, actual += amount) -> relieved.

**Supplier / Item lifecycle:** PENDING_ONBOARDING -> (request-approval; guard: status = PENDING_ONBOARDING) -> PENDING_APPROVAL -> (approve; guard: status = PENDING_APPROVAL + qualification complete: certs/COA/AVL for supplier) -> ONBOARDED -> (offboard; guard: status = ONBOARDED) -> OFFBOARDED. Edit on ONBOARDED/PENDING_APPROVAL -> reverts to PENDING_APPROVAL; ERP-sync flag reset. (New) ONBOARDED -> SUSPENDED (failed audit / expired cert / sanctions / active CAPA; blocks new POs) -> ONBOARDED (on resolution). OFFBOARDED terminal.

**Purchase Order:** draft -> issued (guard: budget committed, supplier ONBOARDED) -> acknowledged (supplier) -> (editable until first GR, for qty tolerance amend) -> closed (guard: all lines received + matched + paid, or cancelled). Amend allowed pre-receipt; audited.

**Installment (RA e03/e04):** null(pending) -> APPROVED (amount = agreed) | PARTIAL_APPROVAL (amount < agreed; creates ONE remainder installment, null status) -> PROCESSED (guard: status in {APPROVED, PARTIAL_APPROVAL}; receipt optional; terminal, no un-process). pending/processed -> RESCHEDULED (first reschedule captures originalDate). Schedule LOCKED (no delete/edit) if any installment in {APPROVED, PARTIAL_APPROVAL, PROCESSED}.

**Match (BUILD NEW):** unmatched -> (run match) -> matched (guard: within tolerance: price% + qty% + amount incl. tax; GRN exists for 3-way else 2-way) | exception (type: price/qty-over/qty-under/missing-GR/duplicate-invoice/tax-mismatch) -> (resolve: accept / adjust / credit-note / debit-note / reject) -> matched | rejected. Cleared match relieves GR/IR.

**NCR / Return / CAPA (BUILD NEW, the ISO loop):** NCR raised (at receiving inspection 8.6, or post-GRN) -> dispositioned (8.7: return / rework / use-as-is-concession / scrap) -> [if return] RMA: initiate (S4.1) -> authorize (S4.2) -> identify condition (S4.3) -> schedule shipment (S4.4) -> close/adjust + credit/debit note (S4.5) -> [systemic] CAPA (10.2: root cause -> action -> effectiveness review) -> feeds supplier re-evaluation (8.4.1) -> may trigger supplier SUSPENDED. NCR closed when disposition done + (if CAPA) effectiveness verified.

## Entity-to-benchmark traceability check
Every entity above carries a SCOR code and, where it is a record requirement, an ISO clause (Inspection/NCR -> 8.6/8.7; CAPA -> 10.2; Supplier qualification/AVL -> 8.4.1; PO information to supplier -> 8.4.3; audit/documents -> 7.5; payment maker/checker -> financial control SOX/COSO + ISO 37001, NOT ISO 9001 8.4). No entity without a benchmark tag.

Parent: [[scor-procurement-map]]. Finalized in Phase C. Sources: [[raphe-masters-and-data-model]], [[albahja-masters-and-fields]], [[iso-supply-chain-standards]], [[procurement-metrics-kpis]].
