/**
 * Landed-cost flip test — the #1 wow factor. Proves the ranking reorders:
 * the cheapest unit price is NOT the lowest landed cost, and the +5% spike is
 * flagged. Uses the verified hero seed figures.
 */
import { describe, it, expect } from "vitest";
import { rankQuotes, rankingFlipped } from "@/lib/services/landed-cost";

// Hero RFQ quotes (verified seed figures).
const HERO_QUOTES = [
  { id: "QT-HERO-01", supplierId: "SUP-0003", currency: "CHF", unitPrice: 127.69, freightPerUnit: 26.118, dutyPerUnit: 15.961, landedCostPerUnit: 169.769, priceSpikeFlag: false },
  { id: "QT-HERO-02", supplierId: "SUP-0001", currency: "INR", unitPrice: 139.298, freightPerUnit: 7.255, dutyPerUnit: 8.706, landedCostPerUnit: 155.259, priceSpikeFlag: false },
  { id: "QT-HERO-03", supplierId: "SUP-0002", currency: "EUR", unitPrice: 155.259, freightPerUnit: 11.608, dutyPerUnit: 13.059, landedCostPerUnit: 179.926, priceSpikeFlag: true, priceSpikePct: 7 },
];

describe("landed-cost ranking", () => {
  const ranked = rankQuotes(HERO_QUOTES);

  it("ranks by landed cost, not unit price", () => {
    // Synthex (SUP-0001) wins on landed cost despite NOT having the cheapest unit
    expect(ranked[0].supplierId).toBe("SUP-0001");
    expect(ranked[0].isLowestLanded).toBe(true);
  });

  it("the cheapest unit price (Helvetia) is NOT the winner — the flip", () => {
    const cheapestUnit = ranked.find((q) => q.isCheapestUnit);
    expect(cheapestUnit?.supplierId).toBe("SUP-0003"); // Helvetia, cheapest unit
    expect(cheapestUnit?.isLowestLanded).toBe(false); // but not lowest landed
    expect(rankingFlipped(ranked)).toBe(true);
  });

  it("flags the >5% price spike", () => {
    const spike = ranked.find((q) => q.priceSpikeFlag);
    expect(spike?.supplierId).toBe("SUP-0002");
    expect(spike?.priceSpikePct).toBeGreaterThan(5);
  });
});
