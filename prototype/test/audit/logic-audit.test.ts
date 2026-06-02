/**
 * DOMAIN-AUDIT logic checks. Each test name carries the rubric ID from
 * docs/DOMAIN-AUDIT.md so a failure points straight at the rule it proves.
 * These cover the pure-logic rules (routing buckets, landed cost, award split,
 * reorder math, FX). Flow/UI rules live in e2e/audit.
 */
import { describe, it, expect } from "vitest";
import { canAutoApprove, resolveRouting, type Approver } from "@/lib/services/routing-service";
import { rankQuotes, rankingFlipped, type Quote } from "@/lib/services/landed-cost";
import { splitAwardIntoPos, distinctSupplierCount, type AwardLine } from "@/lib/services/award-split";
import { computeWorklist } from "@/lib/services/reorder-service";
import { FX_TO_BASE, DEFAULT_APPROVER_LIMIT } from "@/lib/domain/constants";

describe("Approval routing (APR-02, APR-03, APR-05)", () => {
  it("[APR-03] auto-approves FINANCE at/below limit, not above, not for non-finance", () => {
    expect(canAutoApprove({ vertical: "FINANCE", amountInBase: DEFAULT_APPROVER_LIMIT })).toBe(true); // inclusive
    expect(canAutoApprove({ vertical: "FINANCE", amountInBase: DEFAULT_APPROVER_LIMIT + 1 })).toBe(false);
    expect(canAutoApprove({ vertical: "MANAGEMENT", amountInBase: 100 })).toBe(true);
    expect(canAutoApprove({ vertical: "PROCUREMENT", amountInBase: 1 })).toBe(false);
    // a configured 0 limit stays 0 (never falls back to default)
    expect(canAutoApprove({ vertical: "FINANCE", amountInBase: 1, approverLimit: 0 })).toBe(false);
  });

  it("[APR-02] routes to the minimum-sufficient approver (nearest bucket), least-loaded tie-break", () => {
    const candidates: Approver[] = [
      { id: "A-BIG", vertical: "PROCUREMENT", approvalLimit: 1_000_000, currentLoad: 0 },
      { id: "A-MID1", vertical: "PROCUREMENT", approvalLimit: 300_000, currentLoad: 5 },
      { id: "A-MID2", vertical: "PROCUREMENT", approvalLimit: 300_000, currentLoad: 2 },
    ];
    const d = resolveRouting({ amountInBase: 250_000, vertical: "PROCUREMENT", candidates });
    expect(d.kind).toBe("route");
    // nearest bucket is 300k (not the 1M approver), least loaded within it is A-MID2
    if (d.kind === "route") expect(d.approverId).toBe("A-MID2");
  });

  it("[APR-05] blocks (no silent fallback) when no approver can clear the amount", () => {
    const candidates: Approver[] = [{ id: "A1", vertical: "PROCUREMENT", approvalLimit: 100_000 }];
    const d = resolveRouting({ amountInBase: 500_000, vertical: "PROCUREMENT", candidates });
    expect(d.kind).toBe("blocked");
  });

  it("[APR-02] excludes inactive approvers from the eligible pool", () => {
    const candidates: Approver[] = [
      { id: "A-OFF", vertical: "PROCUREMENT", approvalLimit: 300_000, active: false, currentLoad: 0 },
      { id: "A-ON", vertical: "PROCUREMENT", approvalLimit: 300_000, active: true, currentLoad: 9 },
    ];
    const d = resolveRouting({ amountInBase: 250_000, vertical: "PROCUREMENT", candidates });
    expect(d.kind === "route" && d.approverId).toBe("A-ON");
  });
});

describe("Landed cost (SRC-03, SRC-04)", () => {
  const quotes: Quote[] = [
    { id: "Q1", supplierId: "S1", currency: "USD", unitPrice: 100, freightPerUnit: 2, dutyPerUnit: 1 }, // landed 103
    { id: "Q2", supplierId: "S2", currency: "USD", unitPrice: 98, freightPerUnit: 10, dutyPerUnit: 5 }, // landed 113, cheapest unit
  ];
  it("[SRC-04] ranks by landed = unit + freight + duty", () => {
    const ranked = rankQuotes(quotes);
    const q1 = ranked.find((q) => q.id === "Q1")!;
    const q2 = ranked.find((q) => q.id === "Q2")!;
    expect(q1.landed).toBe(103);
    expect(q2.landed).toBe(113);
    expect(q1.isLowestLanded).toBe(true);
    expect(q2.isCheapestUnit).toBe(true);
    expect(q1.rank).toBe(1);
  });
  it("[SRC-03] detects the flip: cheapest unit is NOT lowest landed", () => {
    expect(rankingFlipped(rankQuotes(quotes))).toBe(true);
  });
  it("[SRC-03] no flip when cheapest unit is also lowest landed", () => {
    const noFlip: Quote[] = [
      { id: "A", supplierId: "S1", currency: "USD", unitPrice: 100, freightPerUnit: 1, dutyPerUnit: 0 },
      { id: "B", supplierId: "S2", currency: "USD", unitPrice: 120, freightPerUnit: 1, dutyPerUnit: 0 },
    ];
    expect(rankingFlipped(rankQuotes(noFlip))).toBe(false);
  });
});

describe("Award split (PO-07, A16)", () => {
  const awards: AwardLine[] = [
    { lineId: "L1", itemId: "ITM-A", quantity: 10, unitPrice: 5, supplierId: "S1" }, // 50
    { lineId: "L2", itemId: "ITM-B", quantity: 4, unitPrice: 25, supplierId: "S2" }, // 100
    { lineId: "L3", itemId: "ITM-C", quantity: 2, unitPrice: 5, supplierId: "S1" }, // 10 -> S1 total 60
  ];
  it("[PO-07] one PO per distinct supplier, value = sum of its line values", () => {
    const pos = splitAwardIntoPos(awards);
    expect(pos).toHaveLength(2);
    const s1 = pos.find((p) => p.supplierId === "S1")!;
    const s2 = pos.find((p) => p.supplierId === "S2")!;
    expect(s1.value).toBe(60);
    expect(s1.lines).toHaveLength(2);
    expect(s2.value).toBe(100);
    expect(distinctSupplierCount(awards)).toBe(2);
  });
  it("[PO-07] same supplier on every line yields ONE PO", () => {
    const same = awards.map((a) => ({ ...a, supplierId: "S1" }));
    expect(splitAwardIntoPos(same)).toHaveLength(1);
  });
});

describe("Reorder math (INVTRY-01, INVTRY-02, INVTRY-03)", () => {
  const items = [
    { id: "ITM-1", code: "C1", reorderPoint: 200, minStock: 100, safetyStock: 50, maxStock: 800, leadTimeDays: 30 },
    { id: "ITM-2", code: "C2", reorderPoint: 200, minStock: 100, safetyStock: 50, maxStock: 500, leadTimeDays: 10 },
  ];
  it("[INVTRY-03] suggestedQty = maxStock - available; [INVTRY-01] available = onHand - allocated", () => {
    const inv = [{ itemId: "ITM-1", warehouseCode: "WH1", stockOnHand: 150, allocated: 50 }]; // available 100 <= 200
    const rows = computeWorklist({ items, inventory: inv, tickets: [], requisitionLines: [] });
    expect(rows).toHaveLength(1);
    expect(rows[0].available).toBe(100);
    expect(rows[0].suggestedQty).toBe(700); // 800 - 100
    expect(rows[0].urgency).toBe("reorder"); // 100 > minStock 100? no: available==minStock -> not critical; > safety
  });
  it("[INVTRY-02] does NOT surface items above reorder point", () => {
    const inv = [{ itemId: "ITM-1", warehouseCode: "WH1", stockOnHand: 900, allocated: 0 }]; // 900 > 200
    expect(computeWorklist({ items, inventory: inv, tickets: [], requisitionLines: [] })).toHaveLength(0);
  });
  it("[INVTRY-02] dedupes items that already have an open requisition", () => {
    const inv = [{ itemId: "ITM-2", warehouseCode: "WH1", stockOnHand: 40, allocated: 0 }]; // 40 <= 200
    const tickets = [{ id: "TKT-X", status: "IN_PROGRESS" }];
    const reqLines = [{ ticketId: "TKT-X", itemId: "ITM-2" }];
    expect(computeWorklist({ items, inventory: inv, tickets, requisitionLines: reqLines })).toHaveLength(0);
  });
  it("[INVTRY-04] flags critical when available < minStock", () => {
    const inv = [{ itemId: "ITM-2", warehouseCode: "WH1", stockOnHand: 40, allocated: 0 }]; // 40 < minStock 100
    const rows = computeWorklist({ items, inventory: inv, tickets: [], requisitionLines: [] });
    expect(rows[0].urgency).toBe("critical");
  });
});

describe("FX table (REQ-08, A12)", () => {
  it("[REQ-08] base currency converts 1:1 and known currencies have positive rates", () => {
    expect(FX_TO_BASE.USD).toBe(1);
    for (const [, rate] of Object.entries(FX_TO_BASE)) expect(rate).toBeGreaterThan(0);
  });
});

describe("Freight-forwarder PO rule (PO-04, A19)", () => {
  it("[PO-04] buyer-arranged incoterms (EXW/FOB) need a freight-forwarder PO; seller-arranged (CIF/CFR) do not", async () => {
    const { needsFreightForwarder } = await import("@/lib/services/award-split");
    expect(needsFreightForwarder("FOB")).toBe(true);
    expect(needsFreightForwarder("EXW")).toBe(true);
    expect(needsFreightForwarder("fob")).toBe(true); // case-insensitive
    expect(needsFreightForwarder("CIF")).toBe(false);
    expect(needsFreightForwarder("CFR")).toBe(false);
    expect(needsFreightForwarder(undefined)).toBe(false);
    expect(needsFreightForwarder("")).toBe(false);
  });
  it("[PO-04] split carries the awarded incoterm onto the PO", async () => {
    const { splitAwardIntoPos } = await import("@/lib/services/award-split");
    const pos = splitAwardIntoPos([
      { lineId: "L1", itemId: "I1", quantity: 1, unitPrice: 10, supplierId: "S1", incoterm: "FOB" },
    ]);
    expect(pos[0].incoterm).toBe("FOB");
  });
});

describe("Seed: freight-forwarder PO exists for the FOB scenario (PO-04)", () => {
  it("[PO-04] a FOB supplier PO has a linked freight-forwarder PO in the seed", async () => {
    const { buildSeedSnapshot } = await import("@/lib/seed");
    const snap = buildSeedSnapshot();
    const pos = snap.purchaseOrders as Record<string, unknown>[];
    const fob = pos.find((p) => p.id === "PO-FOB-1");
    const ff = pos.find((p) => p.poType === "freight-forwarder" && p.linkedPoId === "PO-FOB-1");
    expect(fob, "FOB supplier PO present").toBeTruthy();
    expect(ff, "linked freight-forwarder PO present").toBeTruthy();
  });
});

describe("Incoterm vs transport mode (SRC-09)", () => {
  it("[SRC-09] FOB/CIF/CFR are sea-only; valid for sea, invalid for air/road/courier", async () => {
    const { incotermValidForMode } = await import("@/lib/domain/incoterm");
    expect(incotermValidForMode("FOB", "Sea")).toBe(true);
    expect(incotermValidForMode("CIF", "Sea")).toBe(true);
    expect(incotermValidForMode("FOB", "Air")).toBe(false);
    expect(incotermValidForMode("CIF", "Road")).toBe(false);
    expect(incotermValidForMode("CFR", "Courier")).toBe(false);
    // mode-agnostic / non-sea-only incoterms are fine on any mode
    expect(incotermValidForMode("FCA", "Air")).toBe(true);
    expect(incotermValidForMode("EXW", "Road")).toBe(true);
    expect(incotermValidForMode("CPT", "Courier")).toBe(true);
    // missing values never block
    expect(incotermValidForMode(undefined, "Air")).toBe(true);
    expect(incotermValidForMode("FOB", undefined)).toBe(true);
  });
});
