/**
 * Multi-supplier award split (diagram 04/05). When an RFQ covers multiple lines
 * and the buyer awards different lines to different suppliers, the award must
 * produce ONE purchase order per distinct awarded supplier, each carrying only
 * that supplier's lines. Pure function so it is unit-testable; the MSW route
 * persists the resulting POs.
 *
 * This is the real capability that one-supplier-per-RFQ could not express.
 */

export type AwardLine = {
  lineId: string;
  itemId: string;
  quantity: number;
  uom?: string;
  supplierId: string; // the winning supplier for this line
  unitPrice: number; // landed (or agreed) per unit, for the PO line + value
  currency?: string;
};

export type SplitPo = {
  supplierId: string;
  currency: string;
  lines: { lineId: string; itemId: string; quantity: number; uom: string; agreedPrice: number; lineValue: number }[];
  value: number; // sum of line values
};

/**
 * Group awarded lines by supplier into one PO each. Lines with no supplier are
 * ignored (not yet awarded). PO value = sum of quantity * unitPrice per line.
 */
export function splitAwardIntoPos(awards: AwardLine[]): SplitPo[] {
  const bySupplier = new Map<string, SplitPo>();
  for (const a of awards) {
    if (!a.supplierId) continue;
    const po =
      bySupplier.get(a.supplierId) ??
      { supplierId: a.supplierId, currency: a.currency ?? "USD", lines: [], value: 0 };
    const lineValue = Math.round(a.quantity * a.unitPrice * 100) / 100;
    po.lines.push({
      lineId: a.lineId,
      itemId: a.itemId,
      quantity: a.quantity,
      uom: a.uom ?? "EA",
      agreedPrice: a.unitPrice,
      lineValue,
    });
    po.value = Math.round((po.value + lineValue) * 100) / 100;
    bySupplier.set(a.supplierId, po);
  }
  // deterministic order by supplierId
  return [...bySupplier.values()].sort((x, y) => x.supplierId.localeCompare(y.supplierId));
}

/** How many distinct suppliers an award set spans (1 = single-supplier). */
export function distinctSupplierCount(awards: AwardLine[]): number {
  return new Set(awards.filter((a) => a.supplierId).map((a) => a.supplierId)).size;
}
