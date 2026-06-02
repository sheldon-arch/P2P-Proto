/**
 * The guided tour script — the end-to-end golden path across roles, the
 * investor walkthrough. Each step navigates to a real route, switches persona
 * where the work hands off, and anchors a coach-mark to a real element. No AI/ML
 * claims (tour-lint enforces). 8 chapters: demand -> approve -> source -> PO ->
 * receive/quality -> NCR/CAPA -> invoice/pay -> analytics.
 */
import type { TourStep } from "./types";

export const TOUR_STEPS: TourStep[] = [
  // Ch 1 — Requisition (Requester)
  {
    id: "intro", chapter: "Welcome", persona: "buyer", route: "/dashboard",
    anchor: "dashboard.kpis",
    title: "Harvest Foods — Procure-to-Pay",
    body: "A walk through one purchase, end to end, across every role. Click Next to begin. Each step switches to the person doing the work.",
    placement: "bottom",
  },
  {
    id: "req", chapter: "1 · Requisition", persona: "requester", route: "/requisitions/TKT-HERO",
    anchor: "req.budget-banner",
    title: "Requester raises a requisition",
    body: "An imported food ingredient plus printed cartons. It exceeds the quarter's budget, so a soft-budget warning shows with the logged override. The hard commit happens later at PO issue.",
    placement: "bottom",
  },
  {
    id: "req-lines", chapter: "1 · Requisition", persona: "requester", route: "/requisitions/TKT-HERO",
    anchor: "req.lines",
    title: "Category-adaptive lines",
    body: "The import line surfaces an HS code automatically — the form adapts to the purchase type and category.",
    placement: "top",
  },
  // Ch 2 — Approval (Approver)
  {
    id: "approve", chapter: "2 · Approval", persona: "approver", route: "/requisitions/TKT-HERO",
    anchor: "req.approval-panel",
    title: "Approval routes by rules",
    body: "The low-value carton line auto-approves within the finance limit; the high-value ingredient routes to a human. The requester cannot approve their own request (segregation of duties).",
    placement: "top",
  },
  // Ch 3 — Sourcing (Buyer) — the marquee
  {
    id: "compare", chapter: "3 · Sourcing", persona: "buyer", route: "/sourcing/rfq/RFQ-HERO",
    anchor: "sourcing.compare",
    title: "Landed-cost reorders the recommendation",
    body: "Three suppliers quote. The cheapest unit price is not the lowest landed cost — once freight and duty are normalized, the recommended award changes. One quote is flagged for a price spike.",
    placement: "bottom",
  },
  // Ch 4 — PO (Buyer)
  {
    id: "po", chapter: "4 · Purchase Order", persona: "buyer", route: "/purchase-orders/PO-HERO",
    anchor: "po.budget-impact",
    title: "PO issue commits the budget",
    body: "Issuing the PO is a hard budget commit. This order exceeds the available budget, so it is blocked unless an override is approved — a real financial control.",
    placement: "top",
  },
  // Ch 5 — Receive + Quality
  {
    id: "receive", chapter: "5 · Receiving", persona: "receiving", route: "/deliveries/PO-LV-3/receive",
    anchor: "receive.qty",
    title: "Receiving with tolerance & COA gate",
    body: "A carton delivery arrives a few percent over — within tolerance, so the PO quantity is amended before receipt. Quality-sensitive imports are blocked until the Certificate of Analysis is on file.",
    placement: "bottom",
  },
  // Ch 6 — NCR -> CAPA (Quality)
  {
    id: "capa", chapter: "6 · Quality loop", persona: "quality", route: "/quality/ncr/NCR-LV-1",
    anchor: "ncr.actions",
    title: "Non-conformance closes the loop",
    body: "A failed lot raises an NCR and a CAPA. Closing the CAPA feeds the supplier re-evaluation — repeated non-conformance drops the grade and can suspend the supplier from new awards.",
    placement: "top",
  },
  // Ch 7 — Invoice match (Finance) — the AP marquee
  {
    id: "match", chapter: "7 · Invoice match", persona: "finance_maker", route: "/invoices/INV-LV-13",
    anchor: "invoice.match",
    title: "Three-way match catches problems",
    body: "Invoices reconcile against the PO and the goods receipt. Exceptions route to the right role; a duplicate invoice is held with no payable created. Maker prepares, checker releases.",
    placement: "top",
  },
  // Ch 8 — Analytics (Management) — the payoff
  {
    id: "analytics", chapter: "8 · Analytics", persona: "management", route: "/analytics",
    anchor: "analytics.kpis",
    title: "Visibility as a byproduct",
    body: "Everything that happened rolls up here: OTIF versus perfect-order shown distinctly, spend by category, days payable, and the supplier grade that dropped after the quality loop.",
    placement: "bottom",
  },
];
