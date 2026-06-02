/**
 * Inventory reorder-point replenishment (diagram 13). Pure functions over the
 * store collections so they are trivially unit-testable.
 *
 * An item-warehouse balance surfaces on the worklist when:
 *   available <= Item.reorderPoint  AND  no OPEN requisition already covers it
 * (dedupe: a requisition line for that itemId whose ticket is not
 * COMPLETED/CANCELLED). suggestedQty = max(0, maxStock - available). The list is
 * sorted by urgency: available < minStock (Critical) first, then <= safetyStock
 * (Low), then the rest (Reorder). Every figure comes from real data — the
 * demand signal that legitimately precedes a requisition.
 */

export type Item = Record<string, unknown>;
export type InventoryBalance = Record<string, unknown>;
export type Ticket = Record<string, unknown>;
export type ReqLine = Record<string, unknown>;
export type PoLike = Record<string, unknown>;

export type Urgency = "critical" | "low" | "reorder";

export type WorklistRow = {
  id: string; // `${itemId}@${warehouseCode}`
  itemId: string;
  itemCode: string;
  description: string;
  warehouseCode: string;
  stockOnHand: number;
  allocated: number;
  available: number;
  reorderPoint: number;
  safetyStock: number;
  minStock: number;
  maxStock: number;
  suggestedQty: number;
  leadTimeDays: number;
  primarySupplierId: string | null;
  lastPurchasePrice: number | null;
  purchaseUom: string | null;
  urgency: Urgency;
  openRequisitionId: string | null; // set if deduped out (for context)
};

function num(v: unknown, d = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : d;
}

/** itemIds that already have an OPEN requisition (dedupe guard). */
function openRequisitionItemIds(tickets: Ticket[], lines: ReqLine[]): Map<string, string> {
  const closed = new Set(["COMPLETED", "CANCELLED"]);
  const openTicketIds = new Set(
    tickets.filter((t) => !closed.has(String(t.status ?? ""))).map((t) => String(t.id ?? t.identifier)),
  );
  const map = new Map<string, string>(); // itemId -> ticketId
  for (const l of lines) {
    const tid = String(l.ticketId ?? "");
    if (openTicketIds.has(tid) && l.itemId) map.set(String(l.itemId), tid);
  }
  return map;
}

function urgencyOf(available: number, minStock: number, safetyStock: number): Urgency {
  if (minStock > 0 && available < minStock) return "critical";
  if (safetyStock > 0 && available <= safetyStock) return "low";
  return "reorder";
}

const URGENCY_RANK: Record<Urgency, number> = { critical: 0, low: 1, reorder: 2 };

/**
 * Compute the reorder worklist. `includeDeduped=false` (default) hides items that
 * already have an open requisition (the live worklist); pass true to show them
 * with their open-requisition reference for context.
 */
export function computeWorklist(params: {
  items: Item[];
  inventory: InventoryBalance[];
  tickets: Ticket[];
  requisitionLines: ReqLine[];
  includeDeduped?: boolean;
}): WorklistRow[] {
  const { items, inventory, tickets, requisitionLines, includeDeduped = false } = params;
  const byId = new Map(items.map((i) => [String(i.id), i]));
  const openByItem = openRequisitionItemIds(tickets, requisitionLines);

  const rows: WorklistRow[] = [];
  for (const bal of inventory) {
    const item = byId.get(String(bal.itemId));
    if (!item) continue;
    const reorderPoint = num(item.reorderPoint, -1);
    if (reorderPoint < 0) continue; // no reorderPoint set -> never surfaces (per doc)

    const available = num(bal.available, num(bal.stockOnHand) - num(bal.allocated));
    if (available > reorderPoint) continue; // above reorder point -> no action

    const openReqId = openByItem.get(String(bal.itemId)) ?? null;
    if (openReqId && !includeDeduped) continue; // dedupe: open requisition exists

    const maxStock = num(item.maxStock);
    const minStock = num(item.minStock);
    const safetyStock = num(item.safetyStock);
    rows.push({
      id: `${bal.itemId}@${bal.warehouseCode}`,
      itemId: String(bal.itemId),
      itemCode: String(item.code ?? bal.itemId),
      description: String(item.description ?? ""),
      warehouseCode: String(bal.warehouseCode ?? ""),
      stockOnHand: num(bal.stockOnHand),
      allocated: num(bal.allocated),
      available,
      reorderPoint,
      safetyStock,
      minStock,
      maxStock,
      suggestedQty: Math.max(0, maxStock - available),
      leadTimeDays: num(item.leadTimeDays),
      primarySupplierId: (item.standardSupplierId as string) ?? null,
      lastPurchasePrice: item.lastPurchasePrice != null ? num(item.lastPurchasePrice) : null,
      purchaseUom: (item.purchaseUom as string) ?? null,
      urgency: urgencyOf(available, minStock, safetyStock),
      openRequisitionId: openReqId,
    });
  }

  rows.sort((a, b) => {
    const u = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
    if (u !== 0) return u;
    // within urgency, most-below-reorder first, then stable by id
    const aGap = a.reorderPoint - a.available;
    const bGap = b.reorderPoint - b.available;
    if (bGap !== aGap) return bGap - aGap;
    return a.id.localeCompare(b.id);
  });
  return rows;
}

/**
 * Build the pre-filled replenishment requisition (+ its single line) for a
 * worklist row, per doc step 5. Returns { ticket, line } draft objects; the
 * caller persists them. purchaseType is derived from the supplier (Import if the
 * supplier is import-type, else Local) — resolved by the caller which has the
 * supplier record; here we accept it as a hint.
 */
export function buildReorderRequisition(params: {
  row: WorklistRow;
  requesterId: string;
  department: string;
  purchaseType: "Local" | "Import";
  demoToday: string;
  ticketId: string;
  lineId: string;
}): { ticket: Record<string, unknown>; line: Record<string, unknown> } {
  const { row, requesterId, department, purchaseType, demoToday, ticketId, lineId } = params;
  const value = (row.lastPurchasePrice ?? 0) * row.suggestedQty;
  // needDate = today + leadTimeDays
  const need = new Date(`${demoToday}T00:00:00Z`);
  need.setUTCDate(need.getUTCDate() + row.leadTimeDays);
  const needDate = need.toISOString().slice(0, 10);

  return {
    ticket: {
      id: ticketId,
      requesterId,
      departmentId: department,
      category: "Items",
      directOrIndirect: "Direct",
      purchaseType,
      priority: "Within2Days",
      currency: "USD",
      stage: "INITIATION",
      status: "IN_PROGRESS",
      supplierId: row.primarySupplierId,
      totalAmount: value,
      totalAmountInBase: value,
      reorderOrigin: true,
      narrative: `Replenishment for ${row.itemCode} (${row.warehouseCode}): available ${row.available} <= reorder point ${row.reorderPoint}.`,
    },
    line: {
      id: lineId,
      ticketId,
      itemId: row.itemId,
      quantity: row.suggestedQty,
      unitOfMeasure: row.purchaseUom ?? "EA",
      unitPrice: row.lastPurchasePrice ?? 0,
      needDate,
    },
  };
}
