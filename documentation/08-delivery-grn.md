# 08 Delivery, Goods Receipt and Inspection - Unified Procure-to-Pay

- **BPMN file:** 08-delivery-grn.bpmn
- **Spec:** .build/specs/08-delivery-grn.json

## Scope, trigger, outcome

- **Scope:** Inbound logistics tracking from dispatch to arrival (transport mode, customs, ETA monitoring), then goods receipt and inspection: the materials path (Store to Quality to GRN with GR/IR accrual and quantity-tolerance PO amend) and the spares/services path (Engineering receives and closes the requisition with no GRN). Covers partial deliveries (one block and GRN per consignment) and the derived delivery status. This is the expansion of the overview step "Receive, inspect (GRN), QC gate" between PO acknowledgement (diagram 05) and invoice capture (diagram 09).
- **Trigger:** The PurchaseOrder is acknowledged (diagram 05) and the supplier is ready to dispatch. Contract / constant-supply lines marked Delivered at framework agreement time never enter inbound tracking; they go straight to receipt.
- **Outcome:** Materials are QC-passed and a GRN is raised with GR/IR accrued and commitment relieved to actual, or spares/services are received by Engineering with the requisition closed (no GRN). The requisition stage advances INITIATION/ORDERED to PARTIAL_DELIVERY to POST_DELIVERY. Control hands to diagram 09 for invoice capture and matching: GRN present forces a three-way match, no GRN forces a two-way match.

## Actors (lanes)

Canonical lane ids and names (SPEC-SCHEMA vocabulary):

- **Supplier / Vendor** (L_supplier): dispatches goods, shares shipment documents.
- **Procurement / Buyer** (L_buyer): records and updates manual inbound tracking, confirms arrival, amends PO quantity within tolerance, chases missing COA.
- **Tax / Compliance** (L_tax): customs clearance (Bayan / bill of entry), duty, regulatory permits, health certificate, DG declaration.
- **Receiving / Warehouse** (L_recv): records partial-delivery blocks, receives materials at the store, raises GRN.
- **Quality** (L_qc): inspects and tests samples, approves or rejects, raises NCR.
- **Engineering** (L_eng): receives spares/services directly, closes the requisition (no GRN).
- **Platform / System** (L_sys): ETA-approaching alarm, overdue detection, GR/IR accrual, commitment relief, derived delivery status, stage advance, audit and SSE.

Full role definitions in `model/role-model.md`; permissions in `model/role-permission-matrix.md`.

## Step-by-step narrative

Each step is tagged [SCOR code | ISO clause | source].

1. **PO acknowledged, goods ready to dispatch** (Supplier, start). Entry from diagram 05. Stage at entry is ORDERED. [SCOR S2.2 | source: AB delivery-tracking + RA stage model]
2. **Dispatch goods, share shipment documents** (Supplier). Documents always come after dispatch: commercial invoice, packing list, certificate of origin, and the transport document for the mode. The buyer/handler captures carrier or line name, container number (sea/road), AWB/BL reference, vessel-tracking URL, and the initial ETA. Documents are stored at two levels: per-shipment (AWB/BL/LR/tracking, Bayan, health cert, DG declaration) against the consignment, and permanent (COA batch, MSDS, certs) against the supplier master. [SCOR S2.3 | ISO 8.4.3(a) | source: AB delivery-tracking + factory-import]
3. **Transport mode?** (Buyer, exclusive). Field transportMode drives the document set and routing. Tracking is fully manual; there is no auto-fetch from carrier portals. [SCOR S2.3 | source: AB GW_mode]
4. **Track by air / sea / road / courier** (Buyer). Mode-specific tracking block with its mandatory document fields and an editable ETA (full field detail below). Air and sea route to customs; road routes through a border-Bayan gateway; courier proceeds direct to ETA monitoring. [SCOR S2.3 | source: AB mode branches]
5. **International road (border Bayan)?** (Buyer, exclusive). Cross-border road (from Saudi or UAE) clears a border Bayan at customs; domestic road skips customs. [SCOR S2.3/OE8 | source: AB road border rule]
6. **Customs clearance (Bayan / bill of entry)** (Tax/Compliance). Performed after arrival for imports (air, sea, cross-border road). Captures the bill-of-entry/Bayan number, authorizing clearing agent, Bayan date, duty, MOOWR flag; validates ministry permits for regulated chemicals, the legalized health certificate for food raw material, and the DG declaration where applicable. Flags reverse-charge / import VAT for the invoice. [SCOR S2.3 / OE8 | ISO 8.4.3 | source: AB customs + factory-import]
7. **ETA-approaching alarm** (System, timer). Fires a configurable lead (default 5 days) before recorded ETA to handler, requester and manager. ETA is editable throughout the voyage; each revision re-arms the alarm and is audited. Monitoring beat, not a gate. [SCOR S2.3 | source: AB ETA alarm]
8. **Committed delivery date passed without receipt?** (System, exclusive). If start-of-today is past the PO committed delivery date and nothing is received, send an overdue reminder and dock the supplier delivery score; otherwise confirm arrival. Null committed date is never overdue. [SCOR S2.3 / RL.2.6 | source: AB late-delivery reminder]
9. **Send overdue reminder, dock supplier score** (System). Reminder to supplier and procurement; records a delivery-delay event feeding OTD and two-factor OTIF. Non-blocking; loops back to await arrival. For services this is the completion-date late reminder. [SCOR RL.2.6 | ISO 8.4.1 | source: AB late reminder]
10. **Confirm arrival at site** (Buyer). For sea/air, only after the road-haulage leg from the discharge port; for domestic road/courier, on delivery. Goods plus documents (including COA for regulated items) are checked in and handed to receiving. [SCOR S2.4 | source: AB arrival]
11. **Full or partial consignment?** (Receiving, exclusive). A consignment that fulfils all open PO line quantities follows the full path; otherwise the partial path records one block now and the flow re-enters for the next batch. [SCOR S2.4 | source: RA blocks + AB partial GRNs]
12. **Record partial-delivery block** (Receiving). One TicketPartialDeliveryBlock per inbound consignment (full block field set below). Delivered quantity aggregates per ticketItemId across all blocks. [SCOR S2.4 | ISO 8.6 | source: RA partial-delivery block]
13. **Materials or spares/services?** (Receiving, exclusive). Materials (RM/PM, S2 direct) take the Store-QC-GRN path; spares/services (S3 / T2 / T3) take the Engineering path with no GRN. QC/QA always compares against the requisition; the PO stays procurement-only. [SCOR S2.4/S2.5 | source: AB GW_cat]
14. **Store receives, send COA + sample to QC** (Receiving). The receiving store receives against the requisition and sends the COA plus a physical sample to Quality. [SCOR S2.4 | ISO 8.6 | source: AB materials path]
15. **COA received?** (Receiving, exclusive, HARD BLOCK). If no COA is on file, no inspection and no GRN may proceed. [SCOR S2.5 | ISO 8.4.3(b) / 8.6 | source: AB + factory-import COA gate]
16. **Chase supplier for COA** (Buyer). Notification on the order thread; loops back to the COA gate. [SCOR S2.5 | ISO 8.6 | source: factory-import COA chase loop]
17. **QC inspect and test sample** (Quality). Inspects against the requisition and COA/MSDS. Most lots clear same/next day; some label or moisture issues surface 10-15 days later. Inspection level is risk-based per item criticality (ISO 8.4.2: skip-lot / sampling / 100% / source / CoC-only). [SCOR S2.5 | ISO 8.6 | source: AB QC]
18. **QC approved?** (Quality, exclusive). Approve routes to the quantity-tolerance check (QC retains conformity evidence and traceability to the authorizing person, ISO 8.6); reject/quarantine raises an NCR. [SCOR S2.5 | ISO 8.6 to 8.7 | source: AB QC]
19. **Raise NCR (to diagram 11)** (Quality). NCR field set below; resolution returns accepted quantity to the GRN step. NCRs can also be raised after GRN. [SCOR S2.5 / S4 | ISO 8.7 to 10.2 to 8.4.1 | source: AB NCR + build-new CAPA]
20. **Quantity variance to PO?** (Receiving, exclusive). Within tolerance with a non-zero delta and a tolerance-eligible item routes to PO amend; no variance or a no-tolerance item goes straight to GRN; variance beyond tolerance routes to NCR / buyer review. [SCOR S2.6 | source: AB tolerance rule]
21. **Amend PO quantity to actual (within tolerance)** (Buyer). For labels/cartons/printed packaging, adjust the PO line quantity to actual before the GRN so the three-way match reconciles; every edit is audited and visible to the purchaser. [SCOR S2.6 | ISO 8.4.3 | source: AB PO-qty adjustment]
22. **Raise GRN (links requisition + PO)** (Receiving). The GRN links the requisition and PO and feeds invoicing/payment; one PO can produce several GRNs for partial deliveries. [SCOR S2.6 | ISO 8.6 | source: AB GRN + RA erpGrNumber]
23. **Accrue GR/IR, relieve commitment to actual** (System). Posts a GrIrEntry (accrued liability) and relieves the commitment (committed to actual). GR/IR is cleared later at invoice match (diagram 09). [SCOR S2.6 to S2.7 | ISO 8.6 | source: build-new GR/IR + commitment]
24. **Engineering receives spares/services directly** (Engineering). No Stores, no QC, no GRN; checks against the requisition. Service contracts get the same completion green signal. [SCOR S2.4 / T3 / T2 | source: AB spares path]
25. **Received as per order?** (Engineering, exclusive). Conforming closes the requisition; non-conforming routes to handler for NCR resolution. [SCOR S2.5 | source: AB engineering check]
26. **Close requisition "received as per order" (no GRN)** (Engineering). Single boolean field closes the requisition; downstream match is two-way (PO + invoice), with milestone acceptance for service POs. [SCOR S2.6 | source: AB spares closure]
27. **Derive delivery status, advance stage** (System). Derives item and ticket delivery status (never stored, recomputed live), updates progress, and advances PARTIAL_DELIVERY to POST_DELIVERY when the mandatory block and schedule fields are filled. Advancing does not COMPLETE the ticket. [SCOR S2.4 | source: RA derived status + stage advance]
28. **More partial deliveries expected on this PO?** (Receiving, exclusive). Any PO line with pending quantity greater than zero and further consignments expected re-enters the receive step; otherwise proceeds to invoicing. [SCOR S2.4 | source: AB partial re-entry + RA aggregation]
29. **Received and inspected, to invoicing** (System, end). Hands off to diagram 09. [SCOR S2.6 to S2.7 | source: build-new]

## Gateways and branches (exact conditions)

| Gateway | Branch | Exact condition |
| --- | --- | --- |
| Transport mode? | Air | transportMode == 'Air' |
| | Sea | transportMode == 'Sea' |
| | Road | transportMode == 'Road' |
| | Courier | transportMode == 'Courier' |
| International road (border Bayan)? | cross-border | roadOrigin in {Saudi, UAE, other cross-border} (clears border Bayan at customs) |
| | domestic | roadOrigin == domestic (skip customs) |
| Committed delivery date passed without receipt? | overdue | start-of-today > PO committed deliveryDate AND no goods received against the consignment (null committed date never overdue) |
| | arrived | else (confirm arrival) |
| Full or partial consignment? | full receipt | consignment fulfils all open PO line quantities |
| | partial | else (record one block, may re-enter for next batch) |
| Materials or spares/services? | materials | requisition.category resolves to RM/PM materials (S2 direct): Store-QC-GRN path |
| | spares/services | category in {Spares, Services, ProductDesign-maintenance} (S3 / T2 / T3): Engineering, no GRN |
| COA received? | COA on file | coaAttached == true (proceed to QC) |
| | no COA | coaAttached == false (HARD BLOCK: chase supplier, loop) |
| QC approved? | approved | qcDecision == 'approve' |
| | rejected | qcDecision == 'reject' (reject / quarantine, raise NCR) |
| Quantity variance to PO? | amend PO | abs(actualReceivedQty - poLineQty)/poLineQty <= lineTolerancePercent AND delta != 0 AND item tolerance-eligible |
| | GRN directly | delta == 0 OR lineTolerancePercent == 0 (no-tolerance item) |
| | NCR / review | variance beyond lineTolerancePercent (not silently accepted) |
| Received as per order? (Engineering) | as per order | conformsToOrder == true (close requisition) |
| | not as per order | conformsToOrder == false (route to handler / NCR) |
| More partial deliveries expected? | re-enter | any PO line pending = max(ordered - aggregatedDelivered, 0) > 0 AND further consignments expected |
| | all received | else (proceed to invoicing) |

## Fields and dropdowns (full detail)

### Dispatch and tracking common fields (captured by buyer/handler)

| Field | Type | Mandatory | Default | Validation | Owning role |
| --- | --- | --- | --- | --- | --- |
| carrier / line name | text | yes | none | non-empty | Buyer |
| containerNumber | text | no (sea/road) | none | format per carrier | Buyer |
| awbBlReference | text | yes | none | non-empty | Buyer |
| vesselTrackingUrl | URL | no | none | valid URL (e.g. vesseltracking.com) | Buyer |
| initialEta | date | yes | none | valid date | Buyer |
| transportMode | dropdown | yes | none | one of {Air, Sea, Road, Courier} | Buyer |

### Air block

| Field | Type | Mandatory | Validation |
| --- | --- | --- | --- |
| mawbNumber / hawbNumber | text | yes | Master / House Air Waybill |
| airline | text | yes | non-empty |
| flightNumber | text | yes | non-empty |
| originAirport | text (IATA) | yes | valid IATA |
| destinationAirport | text (IATA) | yes | valid IATA |
| freightForwarder | ref Supplier / text | no | set when incoterm is Ex-Works/FOB |
| etd | date | no | editable |
| eta | date | yes | editable; re-arms alarm |

### Sea block

| Field | Type | Mandatory | Validation |
| --- | --- | --- | --- |
| blNumber | text | yes | Bill of Lading |
| vessel | text | yes | non-empty |
| pol | text | yes | Port of Loading |
| pod | text | yes | Port of Discharge |
| etd | date | no | editable |
| eta | date | yes | editable; re-arms alarm |
| containerNumber | text | no | per carrier |

Rule: a sea consignment is always followed by a road-haulage leg from the discharge port to site after customs; arrival is confirmed only after that leg.

### Road block

| Field | Type | Mandatory | Validation |
| --- | --- | --- | --- |
| lrNumber | text | yes | consignment note / Lorry Receipt |
| roadTransporter | text | yes | non-empty |
| eta | date | yes | editable; re-arms alarm |
| roadOrigin | dropdown | yes | {domestic, Saudi, UAE, other cross-border} drives border-Bayan gateway |

### Courier block

| Field | Type | Mandatory | Validation |
| --- | --- | --- | --- |
| courierTrackingNumber | text | yes | non-empty |
| courierCompany | text | yes | non-empty |
| eta | date | yes | editable; re-arms alarm |

No customs node for courier (de minimis / courier-cleared).

### Customs block (Tax/Compliance)

| Field | Type | Mandatory | Validation |
| --- | --- | --- | --- |
| boeNumber | text | yes | Bill of Entry / Bayan number |
| clearanceBy | ref User / agent | yes | records authorizing clearing agent |
| bayanDate | date | yes | valid date |
| dutyAmount | number >= 0 | no | feeds landed cost |
| homeMOOWR | boolean | no | bonded / MOOWR scheme flag |
| ministryPermit | doc + expiry + quantity | conditional | mandatory for regulated chemicals; alert on selection and ~1 week before expiry |
| healthCertificate | doc | conditional | mandatory (HARD) if category is food RM; legalized |
| dgDeclaration | text (UN no. + class) | conditional | mandatory if dangerous-goods flag |

### Partial-delivery block (Receiving, RA model)

| Field | Type | Mandatory | Validation |
| --- | --- | --- | --- |
| trackingNumber_MAWB_HAWB | text | no | free text |
| boeNumber | text | no | from customs |
| clearanceBy | ref / text | no | from customs |
| homeMOOWR | boolean | no | RA block field |
| actualDeliveryDate | date | yes | valid date |
| erpGrNumber | text | no | GR number from ERP |
| erpCcNumber | text | no | free text |
| carrier | text | no | free text |
| courierCargo | text | no | free text |
| itemsDelivery | JSON array of {ticketItemId (string), quantity (finite number)} | no | may list a subset; invalid entries (non-string id or non-finite qty) skipped silently; null/empty becomes empty |

Delivered quantity aggregates per ticketItemId across all blocks (summed, no de-dup, order-dependent). Field history is written with entityType PARTIAL_DELIVERY_BLOCK, referenceId = block id; SSE ticket.updated plus audit.

### Materials receipt and QC fields

| Field | Type | Mandatory | Owning role |
| --- | --- | --- | --- |
| receivedQuantity (per line) | number >= 0 | yes | Receiving |
| receivingStore | dropdown of warehouses | yes | Receiving |
| coaAttached | boolean | yes (gates) | Receiving |
| sampleSentToQc | boolean | yes | Receiving |
| inspectionResult | computed from sub-checks | n/a | Quality |
| defectQuantity | number >= 0 | no | Quality |
| inspectionNotes | text | no | Quality |
| testAttachments | files | no | Quality |
| qcDecision | dropdown {approve, reject} | yes (gates) | Quality |

### NCR fields (AB)

| Field | Type | Mandatory | Validation |
| --- | --- | --- | --- |
| itemName | ref | yes | resolves to item |
| deliveryNoteNumber | text | yes | non-empty |
| deliveryDate | date | yes | valid date |
| descriptionOfNonCompliance | text | yes | non-empty |
| percentNonConformance | number 0-100 | yes | range 0-100 |
| image | file | no | image |

Raisable by QC, factory manager, or requester. Full disposition (return/rework/concession/scrap) and the RMA/CAPA loop are in diagram 11.

### GRN fields

| Field | Type | Mandatory | Default | Owning role |
| --- | --- | --- | --- | --- |
| grnNumber | auto | yes | system pattern | Receiving |
| poReference | ref | yes | none | Receiving |
| requisitionReference | ref | yes | none | Receiving |
| receivedLines | array of {poLineId, acceptedQty, rejectedQty} | yes | none | Receiving |
| grnDate | date | yes | today | Receiving |

### Engineering closure fields (spares/services, no GRN)

| Field | Type | Mandatory | Owning role |
| --- | --- | --- | --- |
| receivedAgainstRequisition | boolean | yes | Engineering |
| conformsToOrder | boolean | yes (gates) | Engineering |
| receivedAsPerOrder | boolean | yes (true to close) | Engineering |
| completionDate | date | no | Engineering |

### Thresholds and configurable values

| Value | Default | Fixed or configurable |
| --- | --- | --- |
| ETA-approaching alarm lead | 5 days before ETA | configurable |
| Quantity tolerance band (labels/cartons/printed packaging) | +/-5% to +/-10% | configurable per item (lineTolerancePercent) |
| No-tolerance items (fixed-pack RM, contract glass bottles) | lineTolerancePercent = 0 | configurable |
| Overdue boundary (delivery) | start-of-today vs committed deliveryDate | fixed rule |
| Permit expiry alert | on selection and ~1 week before expiry | configurable |

## Derived delivery status (precise rules)

Status is derived on demand, never stored, and recomputed live each request.

- **Item status precedence:** delivered (ordered > 0 AND aggregated delivered >= ordered; over-delivery counts) > partial (delivered > 0 AND delivered < ordered) > overdue (delivered = 0 AND needDate < start-of-today; null needDate never overdue) > upcoming (delivered = 0, not overdue).
- **Item progress** = min(round(delivered / ordered * 100), 100), 0 if ordered = 0; pending = max(ordered - delivered, 0).
- **Ticket status precedence:** all delivered > any delivered-or-partial (= partial) > any overdue > upcoming.
- **Ticket progress** = round(fullyDeliveredItems / totalItems * 100). Zero-item tickets are excluded everywhere.

Stage advance PARTIAL_DELIVERY to POST_DELIVERY validates the Partial Delivery mandatory fields (ticket plus per block, with the block index in any error, plus payment schedules); a block missing a field returns remainingStageFields. Advancing the stage does not COMPLETE the ticket; COMPLETED still needs POST_DELIVERY plus all approval verticals APPROVED plus matches cleared plus no open NCR/CAPA block.

## Edge cases and error handling

- **No COA (hard block):** the COA gate blocks inspection and GRN entirely until the COA is on file; the handler chases the supplier in a loop. For regulated / OTC / pharma items this is mandatory.
- **Late COA / late NCR:** QC findings can surface 10-15 days later (label or moisture issues), and NCRs can be raised after the GRN; the NCR path is reachable post-GRN.
- **Quantity over-delivery:** over-delivery counts toward delivered (item status can be delivered with delivered > ordered); for tolerance-eligible items the PO is amended to actual before GRN.
- **No-tolerance items:** fixed-pack RM and contract glass bottles have lineTolerancePercent = 0 and never amend; each glass-bottle truckload is a full receipt.
- **Domestic vs cross-border road:** only cross-border road clears a border Bayan; domestic road skips customs.
- **Courier:** no customs node; proceeds direct to ETA monitoring.
- **Sea road-haulage leg:** arrival for a sea consignment is confirmed only after the post-customs road leg.
- **Overdue not received:** the overdue reminder is non-blocking; the consignment can still be received late, and the delay feeds the supplier delivery score.
- **Invalid block entries:** itemsDelivery entries with a non-string id or non-finite quantity are skipped silently; null/empty becomes empty.
- **Multiple GRNs:** one PO produces several GRNs for partial deliveries; delivered quantity aggregates per ticketItemId across all blocks.
- **Spares/services no GRN:** the requisition closes with a single boolean; this forces a two-way match downstream and there is no GR/IR accrual on this path.

## Business rules and invariants

- Tracking is fully manual; no auto-fetch from carrier portals. Requester, manager and procurement see the same read view.
- Shipment documents always arrive after dispatch. Documents are stored at two levels: per-shipment against the consignment, permanent against the supplier master.
- QC/QA always compares against the requisition; the PO stays procurement-only and QC/QA do not see the PO.
- Match type is decided downstream by GRN existence: a GRN forces a three-way match; no GRN forces a two-way match. The materials path always raises a GRN; the spares/services path never does.
- GR/IR accrual at GRN decouples receiving from invoicing and is cleared at invoice match. Commitment is relieved to actual at GR.
- PO quantity amendment is allowed only within the editable-until-first-receipt window and only for tolerance-eligible items; every edit is audited.
- Every committed change emits an audit entry and an SSE ticket.updated event.

## Cross-references

- Upstream: 05 purchase order (acknowledgement, advance trigger), 06 supplier onboarding (qualification, COA on supplier master), 04 sourcing (incoterm, landed cost).
- Downstream: 09 invoice capture and matching (three-way if GRN exists, else two-way), 10 payments and installments, 11 returns / RMA / CAPA (NCR disposition and supplier re-evaluation), 12 analytics (OTD, two-factor OTIF, four-factor perfect-order).
- Benchmarks: SCOR S2.2 to S2.6 (`analysis/scor-procurement-map.md`), ISO 9001 clauses 8.4.2 / 8.4.3 / 8.6 / 8.7 and the 8.6 to 8.7 to 10.2 to 8.4.1 loop (`iso-supply-chain-standards`), delivery and quality KPIs (`procurement-metrics-kpis`).
- Platform services: notifications (ETA alarm, overdue, permit expiry), document storage (two-level, expiry/quantity tracking), budget/commitment (relieve to actual), tax (reverse-charge / import VAT flag), audit, SSE, field engine (stage mandatory fields), FX (`model/platform-services.md`).
