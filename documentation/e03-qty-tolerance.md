# e03 Quantity Tolerance and Partial Deliveries

- **BPMN file:** e03-qty-tolerance.bpmn

## Scope, trigger, outcome
- **Scope:** The receiving-side rule set that governs two related situations on inbound goods: (1) printed or converted items (labels, cartons) arriving at a quantity that differs from the ordered quantity by a configured tolerance band, and (2) a single PO line satisfied by several partial shipments. It covers the count, the tolerance evaluation, the pre-GRN PO amend, the per-shipment GRN, and the loop until the line is fully received. It does not cover the invoice match itself (see e12 and 09) or the NCR loop for quality failure (see 11).
- **Trigger:** A physical shipment arrives at the warehouse against a PO whose status is acknowledged or partially-received and which is still editable-until-first-GR.
- **Outcome:** Each shipment produces exactly one GRN against the (amended) PO line, the GR/IR liability is accrued, the budget commitment is relieved for the received quantity, and the audit log records every amend before the GRN is raised. The line closes for matching when cumulative received quantity is at least the ordered quantity.

## Actors (lanes)
- **Receiving / Warehouse:** counts goods, records the delivery block, evaluates tolerance, raises the GRN.
- **Procurement / Buyer:** dispositions tolerance breaches and amends the PO line (po.amend).
- **Quality:** inspects materials that require a COA; hard-blocks the GRN on a missing COA or a failed inspection.
- **Platform / System:** writes the immutable amend audit, posts the commitment delta, emits SSE, derives delivery status, and holds the PO open between partial shipments.

## Step-by-step narrative
Each step is tagged [SCOR code | ISO clause | source].

1. **Shipment arrives against open PO** (Receiving, start). Receiving opens the inbound record and captures trackingNumber (MAWB/HAWB, text, optional), carrier (dropdown air/sea/road/courier), actualDeliveryDate (date, mandatory, default today), and for imports boeNumber and clearanceBy. [SCOR S2.4 | ISO 8.6 | source: AB inbound + RA block model].
2. **Count and record received quantity per line** (Receiving). receivedQuantity (number, >0, mandatory) is recorded into the delivery-block itemsDelivery JSON keyed by poLineId, with deliveryNoteNumber (mandatory), packing-list reference, and photos. No GRN is raised yet. [SCOR S2.4 | ISO 8.6 | source: AB + RA itemsDelivery].
3. **Line carries a quantity tolerance?** (Receiving, exclusive). If the line has a tolerance, evaluate the band; otherwise skip straight to the partial-vs-full check. [SCOR S2.4 | source: AB tolerance].
4. **Received within tolerance band?** (Receiving, exclusive). Within band, the receipt is accepted but the PO line must be amended to the actual count before the GRN. Outside band, route to the breach direction check. [SCOR S2.4 | source: AB tolerance].
5. **Over or under the band?** (Receiving, exclusive). Classifies the breach as over-tolerance or under-tolerance. [SCOR S2.4 | source: AB + build-new].
6. **Raise tolerance-breach exception to buyer** (Receiving, send). Holds the line, raises the exception, and notifies the buyer. The shipment is not auto-rejected; the decision is commercial. [SCOR S2.4 | ISO 8.7 | source: build-new].
7. **Buyer dispositions breach** (Buyer). Chooses accept-and-amend, accept-partial-reject-excess, or reject-return. [SCOR S2.4/S4 | source: build-new + AB editable-until-receipt].
8. **Amend PO line to actual received quantity** (Buyer). po.amend edits POLine.quantity, recomputes line value, tax, commitment delta, and base amount. Allowed only while the PO is editable-until-first-GR. [SCOR S2.1/OE11 | ISO 8.4.3 | source: AB amend + build-new commitment].
9. **Write immutable amend audit + commitment delta** (System). Append-only audit (old/new quantity and value, reason, delivery-block reference), commitment delta posted, SSE emitted. This audit precedes the GRN. [SCOR OE4 | ISO 7.5 | source: platform-services audit + RA].
10. **Shipment satisfies the full PO line?** (Receiving, exclusive). Sets the derived delivery status (delivered vs partial) and the ticket stage (PARTIAL_DELIVERY when partial). [SCOR S2.4 | source: RA derived status + AB partial blocks].
11. **Material requires QC and COA?** (Quality, exclusive). Materials with requiresCoa go to QC as a hard block; non-COA goods skip QC. Each partial block is inspected on its own sample. [SCOR S2.5 | ISO 8.6 | source: AB hard QC block].
12. **Raise GRN for this shipment against amended PO** (Receiving). One GRN per shipment; GR/IR accrues a liability for the received quantity including tax; commitment relieved. [SCOR S2.4 | ISO 8.6 | source: build-new GR/IR + RA grn].
13. **Cumulative received >= PO line quantity?** (Receiving, exclusive). If cumulative receipts meet the ordered quantity, the line is complete and ready for match; otherwise the line stays partial. [SCOR S2.4/S2.6 | source: RA stage machine + AB partial].
14. **Await next partial shipment** (Receiving, intermediate catch, message). The PO stays open; the next inbound shipment loops back to the start. Overdue derivation fires the overdue/ETA alarm to the buyer. [SCOR S2.4 | source: RA derived overdue + AB ETA alarm].
15. **Line fully received, ready for match** (System, end). Hands to e12 and 09. [SCOR S2.6 | source: build-new].

## Gateways and branches (exact conditions)
- **Line carries a quantity tolerance?** True: `POLine.tolerance != null AND POLine.tolerance.qtyPercent > 0`. False: no-tolerance item, skip to partial-vs-full.
- **Received within tolerance band?** True: `abs(receivedQuantity - POLine.quantity) <= POLine.quantity * (POLine.tolerance.qtyPercent / 100)`. False: route to breach direction.
- **Over or under the band?** Over: `receivedQuantity > POLine.quantity * (1 + qtyPercent/100)`. Under: `receivedQuantity < POLine.quantity * (1 - qtyPercent/100)`.
- **Shipment satisfies the full PO line?** True: `sum(receivedQuantity across all delivery blocks for the line) >= POLine.quantity` (after amend). False: partial, status PARTIAL_DELIVERY.
- **Material requires QC and COA?** True: `item.category in {Items} AND item.requiresCoa = true`. False: skip QC.
- **Cumulative received >= PO line quantity?** True: `sum(GRN.receivedQuantity for poLineId) >= POLine.quantity`. False: loop to await next shipment.

## Fields and dropdowns (full detail)

| Field | Type | Mandatory | Default | Validation | Owner |
| --- | --- | --- | --- | --- | --- |
| trackingNumber (MAWB/HAWB) | text | optional | none | free text | Receiving |
| carrier | dropdown {air, sea, road, courier} | optional | none | one of set | Receiving |
| actualDeliveryDate | date | mandatory | today | valid date, not future beyond today | Receiving |
| boeNumber | text | optional (import only) | none | free text | Receiving |
| clearanceBy | text | optional | none | free text | Receiving |
| receivedQuantity (per line) | number | mandatory | none | > 0 | Receiving |
| deliveryNoteNumber | text | mandatory | none | free text | Receiving |
| photos / packing list | attachments | optional | none | file refs | Receiving |
| POLine.tolerance.qtyPercent | number (config) | per line | labels 10, cartons 5 | 0..100 | Buyer / Admin |
| disposition | dropdown {accept-and-amend, accept-partial-reject-excess, reject-return} | mandatory on breach | none | one of set | Buyer |
| qcStatus on GRN | dropdown {passed, n/a} | mandatory | n/a if no COA | set by QC pass | Receiving / Quality |
| erpGrNumber | auto | system | generated | unique | System |

## Tolerance values and thresholds
- Tolerance band: +/-5% to +/-10%, configurable per PO line. Defaults: labels 10%, cartons 5%. Fixed-count items (finished bottles as discrete units, electronics, spares) carry no tolerance.
- Worked example: ordered 100000 labels at 10% gives a band of 90000 to 110000; a count of 104000 is within band and the PO line is amended to 104000 before the GRN.
- Full-contract example: a PO line for 100000 bottles received in 20000-unit lots produces five partial shipments, one GRN each, against the same PO line, with the line closing for match when cumulative receipts reach 100000.

## Edge cases and error handling
- **Over-tolerance excess.** Buyer may accept-and-amend up to the received quantity or accept up to the band and return the excess via RMA (S4). No GRN until the buyer dispositions.
- **Under-tolerance short.** Buyer amends to the received quantity and keeps the balance open as a partial line, or treats the shortfall as a short delivery feeding the supplier scorecard.
- **PO already past first GR.** po.amend is blocked once the first GRN exists; a later breach is handled as a match exception in e12 (qty-over / qty-under) rather than a PO amend.
- **Missing COA on a material that requires one.** QC hard-blocks the GRN; the shipment is held until the COA is supplied or the line is dispositioned as an NCR (see 11).
- **Overdue partial.** If the gap between actualDeliveryDate and need-date exceeds the threshold, derived status flips to overdue and an alarm fires to the buyer.

## Business rules and invariants
- The PO line is amended to the physical count BEFORE the GRN so the three-way match reconciles against actuals, not the original order.
- Exactly one GRN per physical shipment (per partial block); the GR/IR accrual and commitment relief are per receipt.
- Receiving cannot self-clear a tolerance breach; a breach always routes to the buyer for disposition (segregation of receiving from commercial decisions).
- Every amend writes an immutable, field-level audit entry and posts the commitment delta before the GRN.
- A passed QC inspection on one partial block does not waive inspection of the next block.

## Cross-references
- e12 two-way vs three-way match (consumes the amended PO and the GRNs); 09 invoice and match; 08 delivery and GRN (full receiving flow); 11 returns and RMA (excess-return and NCR disposition); 05 purchase order (editable-until-receipt and commitment). Benchmarks: SCOR S2.4/S2.5/S2.6, ISO 9001 8.6.
