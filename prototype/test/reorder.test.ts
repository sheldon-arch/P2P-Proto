/**
 * Reorder service tests — the demand-signal logic (diagram 13). Verifies the
 * worklist surfaces the right items, suggestedQty math, the open-requisition
 * dedupe, urgency ordering, and the pre-filled requisition build.
 */
import { describe, it, expect } from "vitest";
import { computeWorklist, buildReorderRequisition } from "@/lib/services/reorder-service";

const items = [
  { id: "ITM-A", code: "A", description: "Item A", reorderPoint: 200, safetyStock: 80, minStock: 50, maxStock: 800, leadTimeDays: 30, standardSupplierId: "SUP-1", purchaseUom: "KG", lastPurchasePrice: 10 },
  { id: "ITM-B", code: "B", description: "Item B", reorderPoint: 100, safetyStock: 40, minStock: 60, maxStock: 500, leadTimeDays: 14, standardSupplierId: "SUP-2", purchaseUom: "EA", lastPurchasePrice: 5 },
  { id: "ITM-C", code: "C", description: "Item C (no reorderPoint)", maxStock: 300, leadTimeDays: 10 }, // no reorderPoint -> never surfaces
  { id: "ITM-D", code: "D", description: "Item D (well stocked)", reorderPoint: 50, maxStock: 400, leadTimeDays: 7 },
];
const inventory = [
  { id: "I1", itemId: "ITM-A", warehouseCode: "WH1", stockOnHand: 120, allocated: 20, available: 100 }, // 100 <= 200, available(100) >= safety(80) -> reorder
  { id: "I2", itemId: "ITM-B", warehouseCode: "WH1", stockOnHand: 30, allocated: 0, available: 30 }, // 30 <= 100, 30 < minStock(60) -> critical
  { id: "I3", itemId: "ITM-C", warehouseCode: "WH1", stockOnHand: 5, allocated: 0, available: 5 }, // no reorderPoint -> excluded
  { id: "I4", itemId: "ITM-D", warehouseCode: "WH1", stockOnHand: 380, allocated: 0, available: 380 }, // 380 > 50 -> excluded
];

describe("computeWorklist", () => {
  it("surfaces only items at/below reorderPoint that have a reorderPoint set", () => {
    const rows = computeWorklist({ items, inventory, tickets: [], requisitionLines: [] });
    const ids = rows.map((r) => r.itemId);
    expect(ids).toContain("ITM-A");
    expect(ids).toContain("ITM-B");
    expect(ids).not.toContain("ITM-C"); // no reorderPoint
    expect(ids).not.toContain("ITM-D"); // above reorderPoint
  });

  it("computes suggestedQty = max(0, maxStock - available)", () => {
    const rows = computeWorklist({ items, inventory, tickets: [], requisitionLines: [] });
    const a = rows.find((r) => r.itemId === "ITM-A")!;
    expect(a.suggestedQty).toBe(700); // 800 - 100
    const b = rows.find((r) => r.itemId === "ITM-B")!;
    expect(b.suggestedQty).toBe(470); // 500 - 30
  });

  it("orders by urgency: critical (< minStock) before reorder", () => {
    const rows = computeWorklist({ items, inventory, tickets: [], requisitionLines: [] });
    expect(rows[0].itemId).toBe("ITM-B"); // critical
    expect(rows[0].urgency).toBe("critical");
    expect(rows.find((r) => r.itemId === "ITM-A")!.urgency).toBe("reorder");
  });

  it("dedupes items that already have an OPEN requisition", () => {
    const tickets = [{ id: "TKT-1", status: "IN_PROGRESS" }];
    const requisitionLines = [{ id: "L1", ticketId: "TKT-1", itemId: "ITM-A" }];
    const rows = computeWorklist({ items, inventory, tickets, requisitionLines });
    expect(rows.map((r) => r.itemId)).not.toContain("ITM-A"); // deduped out
    expect(rows.map((r) => r.itemId)).toContain("ITM-B");
  });

  it("a COMPLETED/CANCELLED requisition does NOT dedupe (item resurfaces)", () => {
    const tickets = [{ id: "TKT-1", status: "COMPLETED" }];
    const requisitionLines = [{ id: "L1", ticketId: "TKT-1", itemId: "ITM-A" }];
    const rows = computeWorklist({ items, inventory, tickets, requisitionLines });
    expect(rows.map((r) => r.itemId)).toContain("ITM-A");
  });
});

describe("buildReorderRequisition", () => {
  it("pre-fills the requisition + line per the worklist row", () => {
    const rows = computeWorklist({ items, inventory, tickets: [], requisitionLines: [] });
    const a = rows.find((r) => r.itemId === "ITM-A")!;
    const { ticket, line } = buildReorderRequisition({
      row: a, requesterId: "U-INV1", department: "Stores", purchaseType: "Local",
      demoToday: "2026-06-01", ticketId: "TKT-NEW", lineId: "L-NEW",
    });
    expect(ticket.reorderOrigin).toBe(true);
    expect(ticket.stage).toBe("INITIATION");
    expect(ticket.supplierId).toBe("SUP-1");
    expect(line.itemId).toBe("ITM-A");
    expect(line.quantity).toBe(700); // suggestedQty
    expect(line.needDate).toBe("2026-07-01"); // 2026-06-01 + 30 lead days
    expect(ticket.totalAmountInBase).toBe(7000); // 700 * 10
  });
});
