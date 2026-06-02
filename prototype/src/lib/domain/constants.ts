/**
 * Deterministic constants for the prototype. No Date.now() / Math.random()
 * anywhere in demo logic — these pinned values make every run reproducible.
 * Sourced from the BPMN documentation and build-spec/data-contracts.md.
 */

/** Pinned "today" so dates, alerts, and aging are stable across runs. */
export const DEMO_TODAY = "2026-06-01";

/** Default approver limit when a stage has none configured (e01). */
export const DEFAULT_APPROVER_LIMIT = 200000;

/** Urgency weights for least-loaded tie-break (02-requisition doc). */
export const URGENCY_WEIGHT: Record<string, number> = {
  ASAP: 4,
  SameDay: 2,
  Within2Days: 1,
  Within1Week: 0,
};

/** Invoice-match tolerance bands (data-contracts). All inclusive of tax. */
export const MATCH_TOLERANCE = {
  pricePercent: 2,
  qtyPercent: 2,
  absolute: 50,
};

/** Qty over/under tolerance for materials (e03), e.g. cartons +/- 10%. */
export const QTY_TOLERANCE_PERCENT = 10;

/** Abnormal price-spike threshold vs last-purchase price (>5%). */
export const PRICE_SPIKE_PERCENT = 5;

/** Static FX table to base (USD). No live feed; the seed uses the same table. */
export const BASE_CURRENCY = "USD";
export const FX_TO_BASE: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  CHF: 1.12,
  INR: 0.012,
  OMR: 2.6,
  AED: 0.27,
  CNY: 0.14,
};

/** Alert lead times (days). */
export const ETA_ALARM_DAYS = 5;
export const CONTRACT_RENEWAL_DAYS = 15;
export const PERMIT_EXPIRY_DAYS = 7;
export const OVERDUE_PAYMENT_DAYS = 28;

/** Supplier scorecard default weights (sum 100) + grade thresholds. */
export const SCORECARD_WEIGHTS = {
  delivery: 40,
  quality: 30,
  cost: 20,
  service: 10,
};
export const GRADE_THRESHOLDS = { A: 90, B: 70 }; // C below B
