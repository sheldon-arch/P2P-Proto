/**
 * Multi-supplier award split tests. Proves one requisition's lines awarded to
 * different suppliers produce one PO per supplier with the correct lines and
 * values — the capability one-supplier-per-RFQ could not express.
 */
import { describe, it, expect } from "vitest";
import { splitAwardIntoPos, distinctSupplierCount, type AwardLine } from "@/lib/services/award-split";

const awards: AwardLine[] = [
  { lineId: "L1", itemId: "ITM-A", quantity: 100, uom: "DRUM", supplierId: "SUP-1", unitPrice: 10, currency: "USD" },
  { lineId: "L2", itemId: "ITM-B", quantity: 50, uom: "CTN", supplierId: "SUP-2", unitPrice: 4, currency: "USD" },
  { lineId: "L3", itemId: "ITM-C", quantity: 20, uom: "EA", supplierId: "SUP-1", unitPrice: 25, currency: "USD" },
];

describe("splitAwardIntoPos", () => {
  it("groups lines by supplier into one PO each", () => {
    const pos = splitAwardIntoPos(awards);
    expect(pos.length).toBe(2); // SUP-1 and SUP-2
    const sup1 = pos.find((p) => p.supplierId === "SUP-1")!;
    const sup2 = pos.find((p) => p.supplierId === "SUP-2")!;
    expect(sup1.lines.map((l) => l.lineId).sort()).toEqual(["L1", "L3"]);
    expect(sup2.lines.map((l) => l.lineId)).toEqual(["L2"]);
  });

  it("PO value = sum of its line values", () => {
    const pos = splitAwardIntoPos(awards);
    const sup1 = pos.find((p) => p.supplierId === "SUP-1")!;
    expect(sup1.value).toBe(100 * 10 + 20 * 25); // 1000 + 500 = 1500
    const sup2 = pos.find((p) => p.supplierId === "SUP-2")!;
    expect(sup2.value).toBe(50 * 4); // 200
  });

  it("ignores un-awarded lines (no supplier)", () => {
    const partial: AwardLine[] = [...awards, { lineId: "L4", itemId: "ITM-D", quantity: 5, supplierId: "", unitPrice: 1 }];
    const pos = splitAwardIntoPos(partial);
    expect(pos.flatMap((p) => p.lines).find((l) => l.lineId === "L4")).toBeUndefined();
  });

  it("distinctSupplierCount reports the split width", () => {
    expect(distinctSupplierCount(awards)).toBe(2);
    expect(distinctSupplierCount([awards[0]])).toBe(1);
  });

  it("single-supplier award produces exactly one PO (backward compatible)", () => {
    const single: AwardLine[] = [
      { lineId: "L1", itemId: "ITM-A", quantity: 100, supplierId: "SUP-1", unitPrice: 10 },
      { lineId: "L2", itemId: "ITM-B", quantity: 50, supplierId: "SUP-1", unitPrice: 4 },
    ];
    expect(splitAwardIntoPos(single).length).toBe(1);
  });
});
