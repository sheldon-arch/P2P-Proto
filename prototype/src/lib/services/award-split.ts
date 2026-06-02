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
  incoterm?: string; // awarded quote's incoterm; drives the freight-forwarder PO (A19)
};

export type SplitPo = {
  supplierId: string;
  currency: string;
  lines: { lineId: string; itemId: string; quantity: number; uom: string; agreedPrice: number; lineValue: number }[];
  value: number; // sum of line values
  incoterm?: string; // the supplier PO's incoterm (first awarded line's)
};

/** Buyer-arranged incoterms (EXW, FOB) require the buyer to arrange freight, so
 *  a parallel freight-forwarder PO is emitted; seller-arranged (CIF, CFR) do not
 *  (A19; Incoterms 2020). Case-insensitive; unknown/empty -> no FF-PO. */
export function needsFreightForwarder(incoterm: string | undefined | null): boolean {
  if (!incoterm) return false;
  return ["EXW", "FOB"].includes(incoterm.trim().toUpperCase());
}

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
      { supplierId: a.supplierId, currency: a.currency ?? "USD", lines: [], value: 0, incoterm: a.incoterm };
    if (po.incoterm == null && a.incoterm != null) po.incoterm = a.incoterm;
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
