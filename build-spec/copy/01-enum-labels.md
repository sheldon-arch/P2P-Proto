# Enum Display Labels

Every enum domain in the model, each raw value mapped to its user-facing label, an optional one-line helper (tooltip or Select description), and a status-color token. The raw values are the authority in `build-spec/schema/enums.ts`; this file is the only place a raw value becomes words. Render order in a Select/filter follows the order listed here (lifecycle enums are ordered by lifecycle progression, not alphabetically).

The color token is consumed by task #8's status-color map and the shadcn `Badge` variant. Tokens: `neutral` (grey), `info` (blue), `progress` (amber/yellow, in-flight), `success` (green), `warning` (orange, attention needed), `danger` (red, blocked/failed), `muted` (grey, terminal/inactive). The token is semantic; task #8 binds it to a Tailwind/shadcn class.

A value not in this file must never render. If the model adds an enum value, it is added here before it can appear on screen.

---

## RequisitionCategory  (field: Requisition.category)
The dynamic-field and receipt-routing driver. Shown as a Select on the requisition form and a filter chip on queues.

| Raw value | Label | Helper | Color |
| --- | --- | --- | --- |
| `Items` | Items | Production and stock materials; routed through QC on receipt. | info |
| `Spares` | Spares | Maintenance spares; routed to Engineering on receipt, no QC gate. | info |
| `Services` | Services | Service or contract work; completion by service report, no goods receipt. | info |
| `ProductDesign` | Product Design | New product development items; runs the sample and artwork approval loop. | info |

## PurchaseDirection  (field: Requisition.directOrIndirect)
| Raw value | Label | Helper | Color |
| --- | --- | --- | --- |
| `Direct` | Direct | Goes into the product (production materials). | neutral |
| `Indirect` | Indirect | MRO, office, and services; not part of the product. | neutral |

## PurchaseType  (field: Requisition.purchaseType)
| Raw value | Label | Helper | Color |
| --- | --- | --- | --- |
| `Local` | Local | Domestic purchase; no customs or import documents. | neutral |
| `Import` | Import | Cross-border; adds HS code, Incoterm, customs, and inbound tracking. | neutral |

## Priority  (field: Requisition.priority)
Urgency. Drives least-loaded approver weighting and the OTIF time-remaining calculation. Shown as a Badge on cards and a filter.

| Raw value | Label | Helper | Color |
| --- | --- | --- | --- |
| `ASAP` | ASAP | Highest urgency. | danger |
| `SameDay` | Same day | Needed today. | warning |
| `Within2Days` | Within 2 days | | progress |
| `Within1Week` | Within a week | Standard. | neutral |

## RequisitionStage  (field: Requisition.stage; also PurchaseOrder, etc.)
Lifecycle position. One of the three dimensions whose agreement defines a completed requirement. Shown as a stage indicator/stepper and a Badge.

| Raw value | Label | Helper | Color |
| --- | --- | --- | --- |
| `INITIATION` | Initiation | Being raised and approved before ordering. | info |
| `ORDERED` | Ordered | PO issued, awaiting delivery. | progress |
| `PARTIAL_DELIVERY` | Partial delivery | Some lines or quantities received, more outstanding. | progress |
| `POST_DELIVERY` | Post-delivery | Fully received; in matching, invoicing, and payment. | progress |

## RequisitionStatus  (field: Requisition.status)
The single status dimension. Shown as the primary Badge on every requisition card and row.

| Raw value | Label | Helper | Color |
| --- | --- | --- | --- |
| `IN_PROGRESS` | In progress | Active and moving through the cycle. | progress |
| `ON_HOLD` | On hold | Paused; an issue or a missing input is blocking it. | warning |
| `CANCELLED` | Cancelled | Stopped before completion. | muted |
| `COMPLETED` | Completed | Received, matched, and paid; the cycle is closed. | success |

## CompletionStatus  (field: ApprovalStageCompletion.status; per approval stage)
The per-stage approval state. Shown as a Badge against each vertical/stage in the approval accordion.

| Raw value | Label | Helper | Color |
| --- | --- | --- | --- |
| `NOT_STARTED` | Not started | This stage has not been reached yet. | neutral |
| `IN_PROGRESS` | In progress | Being worked; fields still being filled. | progress |
| `READY_FOR_APPROVAL` | Ready for approval | Mandatory fields complete; can be submitted to the approver. | info |
| `AWAITING_APPROVAL` | Awaiting approval | Submitted; sitting in an approver's queue. | progress |
| `APPROVED` | Approved | This stage is signed off. | success |

## SupplierStatus  (field: Supplier.status)
The supplier lifecycle. Shown as the primary Badge on supplier rows and the supplier header. AVL = Approved Vendor List.

| Raw value | Label | Helper | Color |
| --- | --- | --- | --- |
| `PENDING_ONBOARDING` | Pending onboarding | Created; onboarding details and documents still being collected. | progress |
| `PENDING_APPROVAL` | Pending approval | Submitted for approval onto the Approved Vendor List. | progress |
| `ONBOARDED` | Onboarded | On the Approved Vendor List; can be awarded business. | success |
| `SUSPENDED` | Suspended | Temporarily blocked from new awards (expired certificate or repeated scorecard failure); existing commitments stand. | danger |
| `OFFBOARDED` | Offboarded | Permanently deactivated; not selectable. | muted |

## ItemStatus  (field: Item.status)
The item lifecycle. Same shape as supplier; shown as a Badge on item rows.

| Raw value | Label | Helper | Color |
| --- | --- | --- | --- |
| `PENDING_ONBOARDING` | Pending onboarding | Created; master details still being completed. | progress |
| `PENDING_APPROVAL` | Pending approval | Submitted for approval into the item master. | progress |
| `ONBOARDED` | Active | Approved and available to requisition and purchase. | success |
| `SUSPENDED` | Suspended | Temporarily not purchasable. | danger |
| `OFFBOARDED` | Discontinued | Permanently deactivated; not selectable. | muted |

## InstallmentStatus  (field: Installment.status)
Payment installment state on the payment schedule. Shown as a Badge on each installment card; gates which actions appear.

| Raw value | Label | Helper | Color |
| --- | --- | --- | --- |
| `PENDING` | Pending | Scheduled; awaiting maker preparation and checker release. | progress |
| `APPROVED` | Approved | Released by the checker; ready to process. | info |
| `PARTIAL_APPROVAL` | Partially approved | Part of the amount approved; a remainder installment was created for the rest. | warning |
| `PROCESSED` | Paid | Payment executed; recorded against the creditor ledger. | success |
| `RESCHEDULED` | Rescheduled | Moved to a new due date. | neutral |

## PaymentTerms  (field: Supplier.paymentTerms, PurchaseOrder.paymentTerms)
Payment terms. Shown as a Select on supplier/PO and as text on the payment schedule. Net terms drive the DPO and due-date calculation.

| Raw value | Label | Helper | Color |
| --- | --- | --- | --- |
| `ADVANCE_100` | 100% advance | Full payment before dispatch. | neutral |
| `PART_ADVANCE_AGAINST_DOCS` | Part advance, balance against documents | Advance now, balance on shipping documents. | neutral |
| `PART_ADVANCE_AGAINST_SHIPMENT` | Part advance, balance against shipment | Advance now, balance on proof of shipment. | neutral |
| `SPLIT_30_70` | 30 / 70 | 30% advance, 70% on delivery. | neutral |
| `NET_30` | Net 30 | Due 30 days from invoice. | neutral |
| `NET_60` | Net 60 | Due 60 days from invoice. | neutral |
| `NET_90` | Net 90 | Due 90 days from invoice. | neutral |

Note: the data dictionary's inline list used shorthand (`Net30`, `100%Advance`, `30/70`, `Custom`). The canonical raw values are the `enums.ts` set above. A "Custom" terms option, if configured, displays as "Custom" and shows the free-text terms; it is a configuration value, not a fixed enum member.

## Incoterm  (field: PurchaseOrder.incoterm, LandedCost, RFQ)
Incoterms 2020. Never shown bare; always with the named place (see `05-terminology-audit.md`): "FOB Nhava Sheva", "DAP Plant-2". The code is the label; the place comes from the adjacent field.

| Raw value | Label | Helper | Color |
| --- | --- | --- | --- |
| `EXW` | EXW | Ex Works: buyer takes over at the seller's premises. | neutral |
| `FCA` | FCA | Free Carrier. | neutral |
| `FOB` | FOB | Free On Board (sea/inland waterway). | neutral |
| `CIF` | CIF | Cost, Insurance and Freight (sea). | neutral |
| `CFR` | CFR | Cost and Freight (sea). | neutral |
| `CPT` | CPT | Carriage Paid To. | neutral |
| `CIP` | CIP | Carriage and Insurance Paid To. | neutral |
| `DAP` | DAP | Delivered At Place. | neutral |
| `DDP` | DDP | Delivered Duty Paid. | neutral |

## TransportMode  (field: PurchaseOrder / inbound tracking)
| Raw value | Label | Helper | Color |
| --- | --- | --- | --- |
| `Air` | Air | | info |
| `Sea` | Sea | Adds Bill of Lading and the customs/Bayan step. | info |
| `Road` | Road | | info |
| `Courier` | Courier | | info |

## DeliveryStatus  (derived; not stored. Shown on the deliveries queue and PO line)
Derived from goods-receipt blocks against ordered quantity and the need-by date. Shown as a Badge.

| Raw value | Label | Helper | Color |
| --- | --- | --- | --- |
| `delivered` | Delivered | Full ordered quantity received. | success |
| `partial` | Partially delivered | Some quantity received, balance outstanding. | progress |
| `overdue` | Overdue | Past the need-by date with quantity still outstanding. | danger |
| `upcoming` | Upcoming | Due within the window, nothing received yet. | info |

## MatchType  (field: MatchResult.matchType)
Two-way (PO + invoice, for services and non-goods) vs three-way (PO + Goods Receipt + invoice). Shown as a label on the match workbench.

| Raw value | Label | Helper | Color |
| --- | --- | --- | --- |
| `TWO_WAY` | Two-way match | PO against invoice (services and items with no goods receipt). | neutral |
| `THREE_WAY` | Three-way match | PO against Goods Receipt against invoice. | neutral |

## MatchExceptionType  (field: MatchException.type)
Why an invoice did not auto-match. Shown as a Badge on the exception and the queue filter. Each is a distinct, named condition (see `05-terminology-audit.md`).

| Raw value | Label | Helper | Color |
| --- | --- | --- | --- |
| `price-variance` | Price variance | Invoiced price differs from the PO price beyond tolerance. | warning |
| `qty-over` | Quantity over | Invoiced quantity exceeds the received quantity. | warning |
| `qty-under` | Quantity under | Invoiced quantity is below the received quantity. | info |
| `missing-GR` | Missing goods receipt | No Goods Receipt exists to match a three-way invoice against. | warning |
| `duplicate-invoice` | Duplicate invoice | Same supplier, invoice number, and amount already on file; held. | danger |
| `tax-mismatch` | Tax mismatch | Invoiced tax does not reconcile with the expected tax code. | warning |

## MatchResolution  (field: MatchException.resolution)
How a buyer or finance resolves a match exception. Shown as the Select on the exception workbench.

| Raw value | Label | Helper | Color |
| --- | --- | --- | --- |
| `accept` | Accept variance | Approve the difference and let the invoice pass. | neutral |
| `adjust` | Adjust PO | Amend the PO (within tolerance) so it reconciles. | neutral |
| `credit-note` | Request credit note | Supplier owes a credit; raise a credit note. | neutral |
| `debit-note` | Raise debit note | Charge the supplier back; raise a debit note. | neutral |
| `reject` | Reject invoice | Send the invoice back to the supplier. | neutral |

## ItemSourceType  (field: ItemSourcePriority.sourceType)
How an item is sourced; each priority is unique per item. Shown on the item's source-priority section.

| Raw value | Label | Helper | Color |
| --- | --- | --- | --- |
| `MANUFACTURED` | Manufactured | Made in-house. | neutral |
| `PURCHASED` | Purchased | Bought from a supplier. | neutral |
| `SUBCONTRACTED` | Subcontracted | Made by a third party from supplied inputs. | neutral |
| `STOCK_TRANSFER` | Stock transfer | Moved from another plant or warehouse. | neutral |

## ReturnReason  (field: Return.reason)
Why goods are being returned (RMA). Shown as a Select on the return and a Badge on the RMA.

| Raw value | Label | Helper | Color |
| --- | --- | --- | --- |
| `defective` | Defective | Failed function or specification. | warning |
| `damaged` | Damaged | Physical damage in transit or handling. | warning |
| `wrong-item` | Wrong item | Not what was ordered. | warning |
| `over-delivery` | Over-delivery | More than the ordered quantity. | info |
| `expired` | Expired | Past shelf life on arrival or in storage. | warning |
| `quality-fail` | Quality failure | Failed QC inspection; linked to an NCR. | danger |

## SupplierClassification  (field: Supplier.classification)
| Raw value | Label | Helper | Color |
| --- | --- | --- | --- |
| `Internal` | Internal | A group or related company. | neutral |
| `External` | External | A third-party supplier. | neutral |

## RiskTier  (field: Supplier risk attribute)
Supplier risk tier (ISO 31000 informed). Shown as a Badge on the supplier scorecard and risk panel.

| Raw value | Label | Helper | Color |
| --- | --- | --- | --- |
| `low` | Low | | success |
| `medium` | Medium | | progress |
| `high` | High | | warning |
| `critical` | Critical | Single-source or business-critical; close monitoring. | danger |

## TradeProgram  (field: Supplier trade-security attribute)
Trusted-trader / supply-chain-security program membership. Shown on the supplier compliance panel.

| Raw value | Label | Helper | Color |
| --- | --- | --- | --- |
| `none` | None | | muted |
| `C-TPAT` | C-TPAT | US Customs Trade Partnership Against Terrorism. | info |
| `AEO` | AEO | Authorized Economic Operator. | info |
| `TAPA` | TAPA | Transported Asset Protection Association. | info |

## ScorecardGrade  (field: SupplierScorecard.grade)
The supplier scorecard grade. Shown as a prominent Badge on the scorecard and supplier header. Drives the AVL standing and the path toward suspension.

| Raw value | Label | Helper | Color |
| --- | --- | --- | --- |
| `A` | Grade A | Preferred; meets or exceeds targets. | success |
| `B` | Grade B | Acceptable; monitor. | progress |
| `C` | Grade C | Below target; on a corrective-action footing, at risk of suspension. | danger |

## TaxType  (field: TaxCode.type)
The kind of tax a tax code represents. Shown on the tax-code master and the invoice tax line.

| Raw value | Label | Helper | Color |
| --- | --- | --- | --- |
| `GST` | GST | Goods and Services Tax. | neutral |
| `VAT` | VAT | Value Added Tax. | neutral |
| `duty` | Customs duty | Import duty. | neutral |
| `reverse-charge` | Reverse charge | Buyer accounts for the tax. | neutral |
| `withholding` | Withholding tax | Tax withheld at source from the supplier payment. | neutral |

## AuditCategory  (field: AuditLog.category)
The subject area of an audit entry. Shown as a filter on the audit log.

| Raw value | Label | Helper | Color |
| --- | --- | --- | --- |
| `TICKET` | Requisition | Requisition and order activity. | neutral |
| `SUPPLIER` | Supplier | Supplier master and lifecycle changes. | neutral |
| `ITEM` | Item | Item master changes. | neutral |
| `ADMIN` | Administration | Configuration, users, roles, routing. | neutral |
| `PAYMENT` | Payment | Payment and installment activity. | neutral |

Note: the model's internal subject key for a requisition/order record is `TICKET` (Raphe lineage). On screen it is always "Requisition" (or "Order" once a PO exists). "Ticket" never appears in user-facing copy (see `05-terminology-audit.md`).
