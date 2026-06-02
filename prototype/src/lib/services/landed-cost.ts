/**
 * Landed-cost comparison (04-sourcing). Ranks quotes by LANDED cost per unit
 * (unit price + freight + duty + other charges), not by unit price. The marquee
 * demonstration: the cheapest unit price is NOT the lowest landed cost once
 * freight and duty are included — the ranking reorders ("the flip").
 *
 * The seed's landedCostPerUnit is the verified comparison basis (all quotes are
 * CIF and quoted to be directly comparable); we rank on it directly so the
 * wow-factor figures stay exact. unit price is compared on its own scale to
 * detect the flip and to show "cheapest unit" vs "lowest landed".
 */
import { PRICE_SPIKE_PERCENT } from "@/lib/domain/constants";

export type Quote = {
  id: string;
  supplierId: string;
  currency: string;
  unitPrice: number;
  freightPerUnit?: number;
  dutyPerUnit?: number;
  landedCostPerUnit?: number;
  incoterm?: string;
  paymentTerms?: string;
  priceSpikeFlag?: boolean;
  priceSpikePct?: number | null;
};

export type RankedQuote = Quote & {
  landed: number;
  isLowestLanded: boolean;
  isCheapestUnit: boolean;
  rank: number;
};

export function rankQuotes(quotes: Quote[]): RankedQuote[] {
  const enriched = quotes.map((q) => ({
    ...q,
    landed: q.landedCostPerUnit ?? q.unitPrice + (q.freightPerUnit ?? 0) + (q.dutyPerUnit ?? 0),
  }));

  const minLanded = Math.min(...enriched.map((q) => q.landed));
  const minUnit = Math.min(...enriched.map((q) => q.unitPrice));

  return enriched
    .map((q) => ({
      ...q,
      isLowestLanded: q.landed === minLanded,
      isCheapestUnit: q.unitPrice === minUnit,
      rank: 0,
    }))
    .sort((a, b) => a.landed - b.landed)
    .map((q, i) => ({ ...q, rank: i + 1 }));
}

/** Did the landed-cost ranking reorder vs the unit-price ranking? (the "flip") */
export function rankingFlipped(ranked: RankedQuote[]): boolean {
  const cheapestUnit = ranked.find((q) => q.isCheapestUnit);
  return cheapestUnit ? !cheapestUnit.isLowestLanded : false;
}

export { PRICE_SPIKE_PERCENT };
