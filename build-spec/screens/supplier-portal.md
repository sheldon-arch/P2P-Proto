# Screens: Supplier Portal (Show-light)

The external supplier-facing slices of flows 04 (quote), 05 (acknowledge PO), 09 (submit invoice) and 11 (authorize return). Source: `documentation/04-sourcing.md` / `05-purchase-order.md` / `09-invoice-match.md` / `11-returns-rma.md`, data dictionary `Quotation.json` / `PurchaseOrder.json` / `Invoice.json` / `Return.json`, `model/role-permission-matrix.md` (supplier-facing permissions scoped to own records, accessed via authenticated external forms), state machines `poLifecycle` / `matchLifecycle` / `returnLifecycle`. Show-light: one simplified portal archetype proving the system is two-sided, with the representative external screens; not the full internal depth.

Supplier-facing permissions (per the matrix notes) are scoped to the supplier's own records and accessed via email + OTP: `po.acknowledge`, `quote.capture` (own quote), `suppliers.update` (own profile), `invoice.capture` (submit), return goods authorization, `scorecard.view` (own). No internal data is visible; the portal shows only the supplier's own RFQs, POs, invoices, returns and scorecard.

### SP.0 Email + OTP Entry (archetype: portal)
- **Route:** `/portal`, `/portal/verify`
- **Roles:** Supplier/Vendor (external, own records only).
- **Realizes:** the authentication gate that scopes every supplier action to its own records (the email + OTP unique-link rule shared across 04/05/09/11).
- **Purpose:** the supplier's front door - a passwordless email + OTP entry that resolves the authenticated supplier and scopes the portal to that supplier's own RFQs, POs, invoices and returns. No internal users, no other suppliers' data.
- **Data shown / captured:** email (the supplier contact on file), the one-time passcode (emailed); on verify, the resolved supplierId (read-only, from the auth link) that scopes everything downstream (`Quotation.supplierId` / `Invoice.supplierId` / `Return.supplierId` "from auth link").
- **Primary actions:** "Send code" (emails the OTP to the supplier contact); "Verify" (resolves the supplier session; scopes the portal to own records).
- **Secondary actions / navigation:** resend code; on verify -> the supplier home (SP.1).
- **States to design:** empty (enter email), code-sent, verify (enter OTP), error (unknown email / expired or wrong code), verified (redirect to SP.1).
- **Shadcn components:** Card (centered portal shell), Input (email, OTP), Button, Alert (error), Toast.
- **Acceptance criteria (believable done):** (1) a verified session resolves exactly one supplierId and every downstream screen is scoped to that supplier's own records (the sole-editor / own-records rule, enforced not just filtered); (2) an unknown email or an expired/wrong OTP is rejected without revealing whether the email exists; (3) no internal navigation, no other supplier's data, is reachable from the portal.
- **Tags:** [S1.8 | role-matrix supplier-facing scoping]

### SP.1 Supplier Home (archetype: portal / list)
- **Route:** `/portal/home`
- **Roles:** Supplier/Vendor (own records).
- **Realizes:** the supplier landing from storyboard section 6 (open RFQs to quote + POs to acknowledge + invoices to submit).
- **Purpose:** the supplier's work-in-one-place - open RFQs awaiting a quote, POs awaiting acknowledgement, invoices to submit, and returns to authorize, with its own scorecard. Answers "what does this buyer need from me" in the first 30 seconds.
- **Data shown:** open RFQs (`RFQ.reference`, deadline) awaiting a `Quotation`; issued POs (`PurchaseOrder.number`, status ISSUED) awaiting acknowledgement; matched/approved POs ready to invoice; returns (`Return.rmaNumber`, authorizationStatus = requested) awaiting authorization; the supplier's own scorecard summary (`SupplierScorecard` grade + AVL status, conditional `scorecard.view` own).
- **Primary actions:** open RFQ (-> SP.2); acknowledge PO (-> SP.3); submit invoice (-> SP.4); authorize return (-> SP.5).
- **Secondary actions / navigation:** sections for RFQs / POs / Invoices / Returns / My scorecard; the supplier sees only its own records.
- **States to design:** empty per section ("No open RFQs", etc.), loading, populated, error.
- **Shadcn components:** Card sections, DataTable per section, Badge (status, deadline), Button, Toast.
- **Acceptance criteria (believable done):** (1) every section is scoped to the authenticated supplier's own records; (2) an RFQ appears only if the supplier is in the RFQ's invited suppliers; (3) the own-scorecard summary shows the supplier's grade and AVL status only (conditional `scorecard.view`), no other supplier's figures.
- **Tags:** [S1.8/S2.2 | storyboard section 6 supplier landing]

### SP.2 Submit / Revise Quote (archetype: form)
- **Route:** `/portal/rfq/:rfqId/quote`
- **Roles:** Supplier/Vendor (own quote, act: `quote.capture`).
- **Realizes:** flow 04 supplier response (submit a structured quote, re-open the same form for negotiation revisions).
- **Purpose:** the supplier's quote form - price, terms, incoterm and separable charges against an invited RFQ; the same form re-opens under the same quotationId for negotiation rounds, versioned by revisedAt.
- **Data shown / captured:** `Quotation.json` - quotationId (auto, immutable across revisions), rfqId (parent), supplierId (from auth link), price (> 0), currency, paymentTerms (Select, PaymentTerms enum), deliveryTerms, incoterm (Select, Incoterms 2020; validated against transportMode), transportMode (conditional item/import), dieCylinderCharges, documentationCharges, notes (max 2000), attachments (quote PDF, spec sheets, COA/MSDS for regulated items); per-line detail on QuotationLine. submittedAt set on first submit.
- **Primary actions:** "Submit quote" (`quote.capture`; status SUBMITTED; submittedAt set); "Revise" (re-opens the same quotationId, status REVISED, revisedAt versioned).
- **Secondary actions / navigation:** add/edit quote lines; attach documents; the buyer's landed-cost normalization happens internally (not shown to the supplier).
- **States to design:** empty (new quote), loading (revise fetch), validation-error (incoterm/transport-mode mismatch rejects submission, price > 0), submitted toast, revised toast, deadline-passed (late, flagged).
- **Shadcn components:** Form, Select (paymentTerms, incoterm, transportMode), Sheet (quote lines), file Input (attachments), Badge, Button, Toast.
- **Acceptance criteria (believable done):** (1) the supplier can see and edit only its own quote (one quotation per rfqId + supplierId, sole-editor rule); (2) incoterm is validated against transportMode at every submit/revise (FOB/CIF/CFR sea-only) and an invalid combination rejects the submission; (3) a negotiation revision re-opens the same quotationId (versioned by revisedAt), never a re-keyed quote; (4) the COA/MSDS attached for a regulated item is what the buyer's Quality hard gate reads before selection.
- **Tags:** [S1.8 | ISO 8.4 | Quotation sole-editor]

### SP.3 Acknowledge PO (archetype: detail / modal)
- **Route:** `/portal/po/:number/acknowledge`
- **Roles:** Supplier/Vendor (own PO, act: `po.acknowledge`).
- **Realizes:** flow 05 supplier acknowledgement (the storyboard beat 4: supplier confirms the order, advance payment per terms triggers).
- **Purpose:** the supplier confirms the issued order; acknowledgement triggers the advance payment per the payment schedule and moves the PO into the delivery cycle.
- **Data shown:** `PurchaseOrder.json` (read) - number, supplierId, type, lines, agreed price, payment terms, incoterm, committed delivery date, status ISSUED.
- **Primary actions:** "Acknowledge order" (`poLifecycle` acknowledge; ISSUED -> ACKNOWLEDGED; effect triggers advance payment per the schedule; `po.acknowledge`).
- **Secondary actions / navigation:** download the PO PDF; view the order lines and terms; after acknowledgement the order proceeds to dispatch/delivery (flow 08).
- **States to design:** loading, populated (ISSUED, acknowledge available), acknowledged (terminal for this action; advance triggered), error.
- **Shadcn components:** Card (PO header + lines), Dialog (acknowledge confirm), Badge (status), Button, Toast.
- **Acceptance criteria (believable done):** (1) acknowledge is available only on an ISSUED PO scoped to the supplier's own records; (2) acknowledgement transitions ISSUED -> ACKNOWLEDGED and triggers the advance payment per the schedule (the storyboard advance-on-acknowledge beat); (3) the supplier sees its own PO read-only and cannot edit the order.
- **Tags:** [S2.1/S2.2 | poLifecycle acknowledge]

### SP.4 Submit Invoice (archetype: form)
- **Route:** `/portal/po/:number/invoice`
- **Roles:** Supplier/Vendor (own invoice, act: `invoice.capture` submit).
- **Realizes:** flow 09 invoice submission (the supplier submits the invoice + supporting documents against the PO; the same capture form internal Finance uses, scoped to the supplier).
- **Purpose:** the supplier submits its invoice against the order; the System then screens for duplicates and matches internally (the supplier sees only its own submission and its status).
- **Data shown / captured:** `Invoice.json` - invoiceNumber (the supplier's own reference; part of the duplicate key), poId (resolves to the open PO), invoiceDate, currency (default PO currency), lines (array of {poLineId, description, quantity > 0, unitPrice >= 0, taxCodeId, taxableAmount, taxAmount}), invoiceTotalInclTax (> 0; reconciles to lines), documents (invoice mandatory; packingList/certificateOfOrigin/awbBl/bayan/healthCert/dgDeclaration conditional per goods/import/food/DG).
- **Primary actions:** "Submit invoice" (`invoice.capture`; status captured; the System runs the duplicate check and routes to match internally).
- **Secondary actions / navigation:** add lines; attach documents; on a rejected invoice the supplier may resubmit a corrected invoice (re-enters at submit); view the submission status (captured / on-hold / matched / exception / approved / released / rejected).
- **States to design:** empty (new invoice), loading, validation-error (lines reconcile to total, quantity > 0), submitted toast, duplicate-held (the supplier sees an on-hold status, the buyer resolves internally), rejected (resubmit available).
- **Shadcn components:** Form, Sheet (invoice lines), file Input (documents), Badge (submission status), Button, Toast.
- **Acceptance criteria (believable done):** (1) the supplier submits only its own invoice against its own PO; (2) the duplicate check on supplier + invoiceNumber + amount runs on submit, and a coincident invoice is held (no payable while held) - the supplier sees an on-hold status, the buyer resolves it internally; (3) the invoice document is mandatory and conditional documents are required per goods/import/food RM/DG; (4) a rejected invoice can be resubmitted as a corrected invoice (re-enters at submit).
- **Tags:** [S2.7 | ISO 7.5 | Invoice supplier submission + duplicate key]

### SP.5 Authorize Return (archetype: form / modal)
- **Route:** `/portal/return/:rmaNumber/authorize`
- **Roles:** Supplier/Vendor (own return, act: return authorization).
- **Realizes:** flow 11 supplier authorization (S4.2 request/authorize; the supplier issues the RMA reference) and the supplier receipt confirmation (S4.4/S4.5).
- **Purpose:** the supplier authorizes the buyer's return request by issuing an RMA reference, then later confirms receipt of the returned goods and the credit note; no goods ship before the supplier's RMA number exists.
- **Data shown / captured:** `Return.json` (scoped to the supplier) - rmaNumber, reason (read), quantityToReturn, productCondition; the authorization fields - authorizationStatus (Select {authorized, declined}), supplierRmaNumber (the supplier-issued reference), supplierReturnAddress, restockingFeePercent; on decline a declineReason. Later: supplierReceiptDate, supplierReceiptCondition, creditNoteIssued, creditNoteRef.
- **Primary actions:** "Authorize return" (`returnLifecycle` authorize; sets authorizationStatus = authorized + the supplier RMA reference; gates the buyer's shipment step); "Decline" (authorizationStatus = declined + declineReason; routes the buyer back to re-disposition); "Confirm receipt" (records the supplier receipt and any credit note issued).
- **Secondary actions / navigation:** view the return condition and images the buyer recorded; issue the credit note reference for the buyer to close against.
- **States to design:** loading, populated (requested, authorize/decline available), authorized (RMA issued), declined (declineReason captured), receipt-confirmed, error.
- **Shadcn components:** Card (return detail), Form, Select (authorizationStatus), Input (supplierRmaNumber, creditNoteRef), Dialog (decline with reason), Badge, Button, Toast.
- **Acceptance criteria (believable done):** (1) the supplier authorizes only its own return; (2) authorization sets authorizationStatus = authorized and the supplier RMA reference, which the buyer's S4.4 shipment step is gated on (no goods ship before an authorized supplier RMA number exists); (3) a decline sets authorizationStatus = declined with a reason and routes the buyer back to re-disposition (the underlying NCR is not closed by a declined return); (4) the supplier can confirm receipt and issue a credit note reference for the buyer to close the return against.
- **Tags:** [S4.2/S4.5 | ISO 8.7 | returnLifecycle authorize + RA OTP form]

### Inline edge behaviours shown on these screens (not separate screens)
- **Own-records scoping:** shown across SP.1-SP.5 - every screen is scoped by the authenticated supplierId from the email + OTP link; no internal or cross-supplier data is reachable.
- **Incoterm / transport-mode validation:** shown inline on SP.2 - an invalid incoterm/transport-mode combination rejects the quote submission.
- **Advance-on-acknowledge:** shown inline on SP.3 - acknowledging the PO triggers the advance payment per the schedule.
- **Duplicate hold (e12):** shown inline on SP.4 - the duplicate check runs on submit; the supplier sees an on-hold status while the buyer resolves it internally.
- **No-RMA gate (S4.2):** shown inline on SP.5 - the buyer's shipment step is gated on the supplier-issued RMA reference.

### Per-role landing covered
SP.1 is the Supplier (portal) landing (storyboard section 6): open RFQs to quote + POs to acknowledge + invoices to submit.
