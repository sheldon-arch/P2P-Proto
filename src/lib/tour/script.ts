/**
 * Guided tour scripts. Two variants:
 *  - SHORT: the original 10-step golden-path walkthrough (Watch only).
 *  - LONG: a comprehensive ~28-step tour across every flow, edge case, the
 *    supplier portal, admin, and the reorder + multi-supplier capabilities, with
 *    interactive "Try-it" steps where the viewer performs the real action.
 *
 * No AI/ML claims (tour-lint enforces). Try-it steps name the domain event
 * (advanceWhen) whose firing advances them; a Skip always exists so the tour
 * can never hard-stall.
 */
import type { TourStep } from "./types";

export const TOUR_STEPS_SHORT: TourStep[] = [
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
  {
    id: "approve", chapter: "2 · Approval", persona: "approver", route: "/requisitions/TKT-HERO",
    anchor: "req.approval-panel",
    title: "Approval routes by rules",
    body: "The low-value carton line auto-approves within the finance limit; the high-value ingredient routes to a human. The requester cannot approve their own request (segregation of duties).",
    placement: "top",
  },
  {
    id: "compare", chapter: "3 · Sourcing", persona: "buyer", route: "/sourcing/rfq/RFQ-HERO",
    anchor: "sourcing.compare",
    title: "Landed-cost reorders the recommendation",
    body: "Three suppliers quote. The cheapest unit price is not the lowest landed cost — once freight and duty are normalized, the recommended award changes. One quote is flagged for a price spike.",
    placement: "bottom",
  },
  {
    id: "po", chapter: "4 · Purchase Order", persona: "buyer", route: "/purchase-orders/PO-HERO",
    anchor: "po.budget-impact",
    title: "PO issue commits the budget",
    body: "Issuing the PO is a hard budget commit. This order exceeds the available budget, so it is blocked unless an override is approved — a real financial control.",
    placement: "top",
  },
  {
    id: "receive", chapter: "5 · Receiving", persona: "receiving", route: "/deliveries/PO-LV-3/receive",
    anchor: "receive.qty",
    title: "Receiving with tolerance & COA gate",
    body: "A carton delivery arrives a few percent over — within tolerance, so the PO quantity is amended before receipt. Quality-sensitive imports are blocked until the Certificate of Analysis is on file.",
    placement: "bottom",
  },
  {
    id: "capa", chapter: "6 · Quality loop", persona: "quality", route: "/quality/ncr/NCR-LV-1",
    anchor: "ncr.actions",
    title: "Non-conformance closes the loop",
    body: "A failed lot raises an NCR and a CAPA. Closing the CAPA feeds the supplier re-evaluation — repeated non-conformance drops the grade and can suspend the supplier from new awards.",
    placement: "top",
  },
  {
    id: "match", chapter: "7 · Invoice match", persona: "finance_maker", route: "/invoices/INV-LV-13",
    anchor: "invoice.match",
    title: "Three-way match catches problems",
    body: "Invoices reconcile against the PO and the goods receipt. Exceptions route to the right role; a duplicate invoice is held with no payable created. Maker prepares, checker releases.",
    placement: "top",
  },
  {
    id: "analytics", chapter: "8 · Analytics", persona: "management", route: "/analytics",
    anchor: "analytics.kpis",
    title: "Visibility as a byproduct",
    body: "Everything that happened rolls up here: OTIF versus perfect-order shown distinctly, spend by category, days payable, and the supplier grade that dropped after the quality loop.",
    placement: "bottom",
  },
];

export const TOUR_STEPS_LONG: TourStep[] = [
  // --- Demand ---
  {
    id: "l-intro", chapter: "Welcome", persona: "buyer", route: "/dashboard", anchor: "dashboard.kpis",
    title: "The full source-to-pay walkthrough",
    body: "This longer tour covers every flow, the hard edge cases, the supplier side, and admin — across all the roles. At a few points it hands you the controls. Click Next to begin.",
    placement: "bottom",
  },
  {
    id: "l-reorder", chapter: "1 · Demand", persona: "inventory_manager", route: "/inventory", anchor: "inventory.worklist",
    title: "Demand starts with inventory",
    body: "Before anyone raises a requisition, the system watches stock. Items at or below their reorder point surface here with a suggested order quantity and lead time, sorted by urgency.",
    placement: "bottom",
  },
  {
    id: "l-reorder-try", chapter: "1 · Demand", persona: "inventory_manager", route: "/inventory", anchor: "inventory.worklist",
    title: "Your turn — raise a replenishment", mode: "tryit", advanceWhen: "reorder.raised",
    hint: "Click “Raise requisition” on any worklist row.",
    body: "Raising a requisition from a worklist row creates a pre-filled draft and joins the standard approval-to-PO flow.",
    placement: "bottom",
  },
  // --- Requisition ---
  {
    id: "l-req", chapter: "2 · Requisition", persona: "requester", route: "/requisitions/TKT-HERO", anchor: "req.budget-banner",
    title: "A requisition with a budget warning",
    body: "The hero requisition is over the quarter's available budget — a soft warning with a logged override at intake; the hard commit comes at PO issue.",
    placement: "bottom",
  },
  {
    id: "l-req-lines", chapter: "2 · Requisition", persona: "requester", route: "/requisitions/TKT-HERO", anchor: "req.lines",
    title: "Category-adaptive lines",
    body: "Import lines show an HS code; the form adapts to category and purchase type.",
    placement: "top",
  },
  {
    id: "l-autocreate", chapter: "2 · Requisition", persona: "requester", route: "/requisitions/auto-create", anchor: "autocreate-input",
    title: "Free-text items auto-create",
    body: "Type an item that is not in the master and the system auto-creates it (pending onboarding) so the requisition is never blocked.",
    placement: "bottom",
  },
  // --- Approval ---
  {
    id: "l-approve", chapter: "3 · Approval", persona: "approver", route: "/requisitions/TKT-HERO", anchor: "req.approval-panel",
    title: "Rules-based approval routing",
    body: "Each stage has a limit. Finance auto-approves within its limit; larger amounts route to a human via the nearest-bucket rule. Segregation of duties blocks self-approval.",
    placement: "top",
  },
  {
    id: "l-approve-try", chapter: "3 · Approval", persona: "approver", route: "/requisitions/TKT-LV-002", anchor: "req.approval-panel",
    title: "Your turn — approve a stage", mode: "tryit", advanceWhen: "approvalstagecompletion.approve",
    hint: "Click “Approve stage” in the approval chain.",
    body: "Approving advances the requisition. Try it on this requisition you do not own.",
    placement: "top",
  },
  // --- Sourcing ---
  {
    id: "l-discover", chapter: "4 · Sourcing", persona: "buyer", route: "/suppliers/discover", anchor: "discover-info",
    title: "Find and prequalify suppliers",
    body: "Candidates are matched by HS code and keyword; promising ones are routed into supplier onboarding.",
    placement: "bottom",
  },
  {
    id: "l-compare", chapter: "4 · Sourcing", persona: "buyer", route: "/sourcing/rfq/RFQ-HERO", anchor: "sourcing.compare",
    title: "Landed-cost reorders the recommendation",
    body: "The cheapest unit price is not the lowest landed cost once freight and duty are included. A quote with a price spike is flagged.",
    placement: "bottom",
  },
  {
    id: "l-multi", chapter: "4 · Sourcing", persona: "buyer", route: "/sourcing/rfq/RFQ-MULTI", anchor: "multi-line-banner",
    title: "Split one requisition across suppliers",
    body: "A multi-line RFQ can award each line to a different supplier — the system creates one purchase order per supplier.",
    placement: "bottom",
  },
  {
    id: "l-award-try", chapter: "4 · Sourcing", persona: "buyer", route: "/sourcing/rfq/RFQ-MULTI", anchor: "multi-line-banner",
    title: "Your turn — award the split", mode: "tryit", advanceWhen: "rfq.awarded",
    hint: "Click “Award” to create one PO per supplier.",
    body: "The lowest-landed supplier is pre-selected per line. Award to split into two POs.",
    placement: "bottom",
  },
  // --- PO ---
  {
    id: "l-po", chapter: "5 · Purchase Order", persona: "buyer", route: "/purchase-orders/PO-HERO", anchor: "po.budget-impact",
    title: "PO issue is a hard budget commit",
    body: "Issuing commits the budget. An over-budget PO is blocked unless an override is approved.",
    placement: "top",
  },
  {
    id: "l-po-suspended", chapter: "5 · Purchase Order", persona: "buyer", route: "/purchase-orders/PO-SUSP-1", anchor: "action-panel",
    title: "A suspended supplier blocks issue",
    body: "This draft PO is to a suspended supplier. Issuing is blocked until the supplier is reinstated — a quality and compliance control.",
    placement: "top",
  },
  // --- Receiving ---
  {
    id: "l-tracking", chapter: "6 · Receiving", persona: "receiving", route: "/deliveries/tracking", anchor: "tracking-info",
    title: "Inbound tracking by mode",
    body: "Air, sea, road, and courier each have their own tracking, with customs and an ETA alarm. Partial deliveries are recorded as blocks against the PO.",
    placement: "bottom",
  },
  {
    id: "l-receive", chapter: "6 · Receiving", persona: "receiving", route: "/deliveries/PO-LV-3/receive", anchor: "receive.qty",
    title: "Tolerance and the COA gate",
    body: "A delivery within tolerance amends the PO quantity; over tolerance is blocked. Quality-sensitive imports are blocked until the Certificate of Analysis is on file.",
    placement: "bottom",
  },
  // --- Quality ---
  {
    id: "l-capa", chapter: "7 · Quality", persona: "quality", route: "/quality/ncr/NCR-LV-1", anchor: "ncr.actions",
    title: "The quality loop can suspend a supplier",
    body: "A failed lot raises an NCR and a CAPA. Closing the CAPA feeds the supplier re-evaluation; repeated non-conformance drops the grade and can suspend the supplier.",
    placement: "top",
  },
  {
    id: "l-capa-try", chapter: "7 · Quality", persona: "quality", route: "/quality/ncr/NCR-LV-1", anchor: "ncr.actions",
    title: "Your turn — close the CAPA", mode: "tryit", advanceWhen: "supplier.suspended",
    hint: "Click “Close CAPA”.",
    body: "Closing this CAPA crosses the supplier's below-threshold streak and suspends them from new awards.",
    placement: "top",
  },
  // --- Returns ---
  {
    id: "l-returns", chapter: "8 · Returns", persona: "buyer", route: "/returns/RMA-EDGE-1", anchor: "action-panel",
    title: "Returns and RMA",
    body: "A return is authorized or declined; an authorized return is condition-checked, shipped, and closed with a credit or debit note. A declined claim goes back for re-disposition.",
    placement: "top",
  },
  // --- Invoice & payment ---
  {
    id: "l-match", chapter: "9 · Invoice match", persona: "finance_maker", route: "/invoices/INV-LV-13", anchor: "invoice.match",
    title: "Three-way match and duplicate hold",
    body: "Invoices reconcile against the PO and the goods receipt. Exceptions route to the right role; a duplicate invoice is held with no payable created.",
    placement: "top",
  },
  {
    id: "l-match-price", chapter: "9 · Invoice match", persona: "buyer", route: "/invoices/INV-LV-10", anchor: "invoice.match",
    title: "Price-variance routes to the buyer",
    body: "A price-variance exception routes to the buyer to accept, adjust, or raise a credit/debit note before payment.",
    placement: "top",
  },
  {
    id: "l-pay", chapter: "10 · Payments", persona: "finance_maker", route: "/payments/INST-LV-1R", anchor: "payment-actions",
    title: "Maker prepares, checker releases",
    body: "Payments run maker/checker. A partial approval creates a remainder installment for the balance. Withholding and retention apply before release.",
    placement: "top",
  },
  {
    id: "l-cashflow", chapter: "10 · Payments", persona: "finance_maker", route: "/cashflow/float", anchor: "float-low",
    title: "Cash float for on-the-spot buys",
    body: "Small local purchases run on a cash float with no PO; a maker/checker-approved reimbursement tops it back up when low.",
    placement: "bottom",
  },
  // --- Supplier portal (two-sided) ---
  {
    id: "l-portal", chapter: "11 · Supplier portal", persona: "supplier", route: "/portal", anchor: "portal-home",
    title: "The supplier's own view",
    body: "Suppliers have their own portal: respond to RFQs, acknowledge POs, and submit invoices — the same records the buyer and finance see.",
    placement: "bottom",
  },
  // --- Items & masters ---
  {
    id: "l-artwork", chapter: "12 · Items", persona: "buyer", route: "/items/artwork", anchor: "artwork-parallel",
    title: "Parallel artwork approval",
    body: "New own-brand packaging artwork is reviewed concurrently by marketing, quality, and a language reviewer; all must approve before release.",
    placement: "bottom",
  },
  {
    id: "l-permit", chapter: "12 · Items", persona: "buyer", route: "/items/permit-expiry", anchor: "permit-expiry-rule",
    title: "Permit and document expiry",
    body: "Regulated items track permit expiry and quantity; a PO is blocked until a valid permit is attached.",
    placement: "bottom",
  },
  // --- Admin ---
  {
    id: "l-routing", chapter: "13 · Admin", persona: "administrator", route: "/admin/routing-rules", anchor: "routing-rules-info",
    title: "Configurable approval routing",
    body: "Verticals, limits, and the nearest-bucket rule are all configurable — the routing you saw earlier is data, not code.",
    placement: "bottom",
  },
  {
    id: "l-bulk", chapter: "13 · Admin", persona: "administrator", route: "/admin/bulk-import", anchor: "wizard",
    title: "All-or-nothing bulk import",
    body: "Master data imports validate every row; any error rejects the whole file so nothing is half-loaded.",
    placement: "bottom",
  },
  // --- Payoff ---
  {
    id: "l-analytics", chapter: "14 · Analytics", persona: "management", route: "/analytics", anchor: "analytics.kpis",
    title: "Visibility as a byproduct",
    body: "Everything that happened rolls up here: OTIF versus perfect-order, spend by category, days payable, and the supplier grade that moved after the quality loop.",
    placement: "bottom",
  },
];

export const TOUR_VARIANTS: Record<"short" | "long", TourStep[]> = {
  short: TOUR_STEPS_SHORT,
  long: TOUR_STEPS_LONG,
};

// Back-compat export (some imports referenced TOUR_STEPS).
export const TOUR_STEPS = TOUR_STEPS_SHORT;
