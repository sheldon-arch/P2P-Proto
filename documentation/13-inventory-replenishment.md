# 13 Inventory-Driven Demand and Reorder Replenishment - Unified Procure-to-Pay

- **BPMN file:** 13-inventory-replenishment.bpmn

## Scope, trigger, outcome
- **Scope:** Inventory-driven demand: stock is tracked per item per warehouse (stockOnHand, allocated, available); when an item's available quantity falls at or below its reorderPoint it surfaces on the Inventory Manager's reorder worklist; the Inventory Manager reviews context (stock-on-hand, lead time, primary supplier, suggested quantity) and raises a replenishment requisition with one action; the requisition is submitted and joins the existing requisition-to-PO flow (Diagram 02 -> 03 -> 04 -> 05). A GRN (Diagram 08) posts a RECEIPT movement that increments stockOnHand, closing the replenishment cycle. This diagram covers SCOR P3 Plan Source operationalized as a reorder-point replenishment model with a mandatory human review step (axiom A21).
- **Trigger:** An item's available quantity (stockOnHand minus allocated) falls at or below Item.reorderPoint in any warehouse. The platform evaluates this condition on every StockMovement post and surfaces qualifying items on the reorder worklist automatically.
- **Outcome:** A replenishment requisition is raised, submitted, and approved through the standard approval chain, a PO is issued, goods are received, and stockOnHand is incremented by a RECEIPT movement. The item's available quantity returns above reorderPoint and the worklist entry clears.

## Actors (lanes)
- **Inventory Manager / Stores Planning** (`L_inv`): monitors the reorder worklist; reviews context per item; raises the replenishment requisition; reviews and submits it; posts manual ADJUSTMENT movements for stock corrections and TRANSFER movements for inter-warehouse moves.
- **Platform / System** (`L_sys`): evaluates the reorder trigger on every StockMovement post; surfaces qualifying items on the worklist; pre-fills the requisition (suggestedQty, item, warehouse, primary supplier, reorderPoint, safetyStock, maxStock); posts RECEIPT movements when a GRN is finalized (Diagram 08); updates Inventory.stockOnHand, allocated, available, and lastMovementAt on each movement.
- **Receiving / Warehouse** (`L_rcv`): raises the GRN (Diagram 08) on physical receipt; the GRN triggers the RECEIPT movement automatically (no separate Inventory Manager action needed).
- **Downstream (Diagrams 02-05):** the submitted requisition joins the standard flow; approval, sourcing, and PO issuance proceed without inventory-specific modification.

Full role definitions in `model/role-model.md`; permissions in `model/role-permission-matrix.md`.

## Step-by-step narrative
Tags: [SCOR code | ISO clause | source].

1. **Stock movement posts, reorder check runs** (System). Every RECEIPT, ISSUE, ADJUSTMENT, or TRANSFER movement that changes stockOnHand triggers the platform to recompute available = stockOnHand - allocated for the affected item-warehouse pair. [SCOR P3 | S2.6 | OE4 | build-new]

2. **Item at or below reorderPoint?** (System, exclusive). Compare available to Item.reorderPoint. If available <= reorderPoint and a replenishment requisition for this item is not already open (de-duplicate check), add the item to the reorder worklist. If above reorderPoint, no action. [SCOR P3 Plan Source | ISO 8.4 | build-new; axiom A21]

3. **Item surfaces on reorder worklist** (System). The worklist entry carries: item code and description, warehouseCode, current stockOnHand, current allocated, current available, reorderPoint, safetyStock, minStock, maxStock, suggestedQty (= maxStock - available; floored at 0), primary supplier (from Item.standardSupplierId), estimated lead time (from ItemSourcePriority or supplier master), last purchase price (from the most recent PO line for this item). [SCOR P3 | OE4 | build-new]

4. **Inventory Manager reviews worklist** (Inventory Manager). The Inventory Manager opens the reorder worklist, which is a prioritized list sorted by urgency: items where available < minStock first, then items where available <= safetyStock, then all other at-or-below-reorderPoint items. Per item the Manager reviews the context panel and decides: raise a requisition, defer (snooze with a reason and a reminder date), or flag for investigation (e.g. a suspected data entry error). [SCOR P3 | OE5 | build-new; axiom A21 human-in-the-loop]

5. **Raise replenishment requisition (one-click)** (Inventory Manager). The Manager clicks "Raise Requisition" on a worklist item. The system creates a draft requisition pre-filled with: requester = the Inventory Manager's user record, department = the warehouse's owning department, category = Items, purchaseType = derived from the item's standard supplier (Import if foreign, Local if domestic), priority = Within2Days (configurable), currency = tenant base, projectOrCostCenter = the warehouse's default cost center, one line: itemId, description, quantity = suggestedQty (editable before submit), unitOfMeasure = Item.purchaseUom, needDate = today + lead time estimate (editable). [SCOR P3 -> O2 | S1.1 | ISO 8.4 | build-new; axiom A21]

6. **Review and adjust the draft requisition** (Inventory Manager). The Manager reviews the pre-filled draft, adjusts quantity if the suggested amount is wrong (e.g. in-transit stock exists that is not yet received), sets or confirms the need date, adds a line note if useful, and confirms the cost center. The identifier is auto-assigned and immutable from first save. [SCOR S1.1 | O2 | ISO 7.5 | build-new]

7. **Submit the requisition** (Inventory Manager). The Manager submits. The mandatory-field gate for INITIATION runs (same as Diagram 02); the soft budget check runs; the requisition enters the standard approval chain (Diagram 03). The reorder worklist entry is marked "requisition raised" and the de-duplicate guard activates so the same item does not generate a second worklist entry until this requisition is closed. [SCOR O2 | S1.1 | OE2 | ISO 8.4 | build-new]

8. **Standard approval, sourcing, and PO flow** (Downstream). The requisition proceeds through Diagrams 02-05 without modification: it is approved (Diagram 03), optionally sourced via RFQ (Diagram 04), and a PO is issued (Diagram 05). The Inventory Manager's requisition is indistinguishable from a department-raised requisition to the downstream flow; only the origin flag (reorderOrigin = true) is carried for analytics. [SCOR S1.1 -> S2.1 | OE2 | ISO 8.4 | build-new]

9. **Goods received, GRN raised** (Receiving). When the supplier delivers, Receiving raises the GRN (Diagram 08). On GRN finalization the system posts a RECEIPT movement: type = RECEIPT, itemId, warehouseCode, quantity = GRN quantity, reference = grnId, at = now(). [SCOR S2.4/S2.6 | ISO 8.6 | build-new; axiom A21]

10. **RECEIPT movement increments stockOnHand** (System). The platform updates Inventory.stockOnHand += RECEIPT.quantity; recomputes available = stockOnHand - allocated; sets lastMovementAt = now(). If available now exceeds reorderPoint, the worklist entry is cleared. [SCOR S2.6 | P3 | OE4 | build-new; axiom A21]

11. **Replenishment cycle complete** (System, end). The worklist entry is cleared (available > reorderPoint). The StockMovement ledger provides a full audit trail from demand trigger through receipt.

### Stock adjustment sub-flow
- **Inventory Manager raises an ADJUSTMENT** (Inventory Manager). On a physical-count variance, damage write-off, or system correction, the Manager posts an ADJUSTMENT movement: type = ADJUSTMENT, quantity (magnitude), direction (add/subtract), itemId, warehouseCode, note (mandatory), reference (e.g. count-sheet reference). The platform updates stockOnHand, recomputes available, and re-evaluates the reorder trigger. [SCOR P3 | OE4 | ISO 7.5 | build-new]

### Inter-warehouse transfer sub-flow
- **Inventory Manager raises a TRANSFER** (Inventory Manager). To move stock between warehouses, the Manager creates a TRANSFER order: source warehouse, destination warehouse, itemId, quantity. The platform posts two StockMovement records: a TRANSFER debit (decrement) on the source and a TRANSFER credit (increment) on the destination; both share a movementOrderId as the reference. In-transit quantity is tracked separately and the source available is reduced on debit. [SCOR S2.6 | P3 | OE4 | build-new]

## Gateways and branches (exact conditions)
- **Item at or below reorderPoint?**: `Inventory.available <= Item.reorderPoint AND NOT EXISTS (open requisition for this itemId, status NOT IN {COMPLETED, CANCELLED})` -> surface on worklist. `available > reorderPoint OR open requisition exists` -> no action.
- **Manager decision on worklist item**: `action = RAISE_REQUISITION` -> pre-fill and open draft requisition; `action = DEFER` -> snooze with mandatory reason and reminder date, item stays on list but moves to deferred section; `action = INVESTIGATE` -> flag the balance for review, suppress the trigger temporarily.
- **suggestedQty computation**: `maxStock - available`; if result <= 0 (available already above maxStock after allocation clears), suggestedQty = 0, Manager edits quantity before submitting.

## Fields (key fields managed by this flow)

### Reorder worklist entry (System-computed, not stored as an entity)
| Field | Type | Source |
| --- | --- | --- |
| itemId / code / description | from Item | Item master |
| warehouseCode | from Inventory | Inventory balance |
| stockOnHand | decimal | Inventory.stockOnHand |
| allocated | decimal | Inventory.allocated |
| available | decimal | Inventory.available (computed) |
| reorderPoint | decimal | Item.reorderPoint |
| safetyStock | decimal | Item.safetyStock |
| minStock / maxStock | decimal | Item.minStock / Item.maxStock |
| suggestedQty | decimal | maxStock - available (computed) |
| primarySupplier | reference | Item.standardSupplierId |
| leadTimeDays | integer | ItemSourcePriority or Supplier master |
| lastPurchasePrice | money | most recent POLine.agreedPrice for this item |

### Item reorder parameters (maintained by Inventory Manager via items.update scoped to reorder params)
| Field | Type | Mandatory | Validation |
| --- | --- | --- | --- |
| reorderPoint | decimal | no | >= 0; in stockUom |
| safetyStock | decimal | no | >= 0; in stockUom |
| minStock | decimal | no | >= 0; in stockUom |
| maxStock | decimal | no | > 0; > reorderPoint when both set; in stockUom |

## Edge cases and error handling
- **suggestedQty is zero or negative**: available already meets or exceeds maxStock (e.g. because in-transit not yet received was not allocated). The worklist still surfaces the item because available <= reorderPoint, but the Manager must set quantity manually.
- **No reorderPoint set on item**: the item never surfaces on the worklist regardless of stock level. The Inventory Manager sets reorderPoint as part of item master maintenance.
- **maxStock not set**: suggestedQty cannot be computed; the worklist shows a warning and the Manager enters quantity manually.
- **Duplicate requisition**: if an open requisition already exists for the item (status not COMPLETED/CANCELLED), the reorder trigger is suppressed to prevent double-ordering. The worklist shows the open-requisition reference.
- **GRN for a different warehouse**: the RECEIPT movement is posted to the receiving warehouse only; the balance in other warehouses is unchanged.
- **Concurrent movement posts**: StockMovement posts are transactional; stockOnHand is updated atomically to prevent race conditions on concurrent GRN or ISSUE events.
- **Reorder trigger after ADJUSTMENT**: a downward ADJUSTMENT can trigger the reorder check; this is intentional (a stock write-down may create an immediate replenishment need).

## Business rules and invariants
- The reorder trigger is evaluated on every StockMovement post (RECEIPT, ISSUE, ADJUSTMENT, TRANSFER) for the affected item-warehouse pair (axiom A21).
- A GRN always posts a RECEIPT movement; the RECEIPT is posted by the platform automatically on GRN finalization, not by a manual Inventory Manager action (axiom A21).
- The Inventory Manager reviews and submits every replenishment requisition; the platform pre-fills but never auto-submits without a human review step (axiom A21 human-in-the-loop).
- StockMovement records are immutable (no edits or deletes); corrections post a new offsetting ADJUSTMENT entry.
- ADJUSTMENT movements require a non-blank note explaining the reason.
- The reorder de-duplicate guard prevents multiple open requisitions for the same item-warehouse pair.
- suggestedQty = maxStock - available, floored at 0; the Manager may edit the quantity before submitting.
- The inventory flow does not bypass the standard approval, sourcing, or PO flows; the replenishment requisition is a standard requisition and must be approved and fulfilled through the same channels as any other purchase.
- Every StockMovement is audited (A13) and broadcast via SSE.

## Cross-references
- **Diagram 02** (requisition): the replenishment requisition raised here joins Diagram 02 at the submit step.
- **Diagram 08** (delivery/GRN): GRN finalization posts the RECEIPT movement that increments stockOnHand and may clear the worklist entry.
- **Diagram 05** (purchase order): the PO issued from the replenishment requisition draws down budget and is fulfilled here.
- **e02** (budget/commitment): the replenishment requisition is subject to the same soft budget check and hard commitment at PO issue.
- **Benchmarks:** SCOR P3 Plan Source (demand signal from inventory position -> order trigger), O2 Order B2B (the requisition-to-order execution), S2.4-S2.6 (receive, inspect, transfer to stock); ISO 8.4 (control of externally provided processes), ISO 7.5 (documented information for stock records). Sources: `model/data-model.md` (Inventory, StockMovement), `build-spec/data-dictionary/Inventory.json`, `build-spec/data-dictionary/StockMovement.json`, `model/ontology.md` (axiom A21), `model/role-model.md` (Inventory Manager role 15).
