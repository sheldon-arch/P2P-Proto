# The Tour Script (8 Chapters)

The full guided-demo script: the eight golden-path beats as eight chapters, each a real hero record from the seed with the exact figures it narrates. This is the content authority; `lib/tour/script.p2p.ts` encodes the structure and `lib/tour/narration.p2p.ts` the copy. Numbers below are the verified seed values (`../seed/data/`); narration interpolates them live, so they are shown here for traceability, not hard-coded into prose.

Company: Meridian Consumer Health. Demo today: 2026-06-01. The hero requirement: TKT-HERO / REQ-HERO, a regulated active ingredient (ITM-0006, imported, PLANT-2) plus a printed carton (PLANT-1).

Persona names are the seeded users (`../seed/data/users.json` via `../ia/03-per-role-landings.md`); the role ids are the engine's `setRole` targets.

## Title screen

- Headline: "One purchase, end to end, across every desk it touches."
- Storyline (3 sentences): "Meridian Consumer Health needs a regulated active ingredient for a new product, sourced from overseas. Follow it from the first requisition through sourcing, receiving, a quality failure, and payment, as it passes between seven people who never have to chase each other. Watch how one quality issue on this lot ripples all the way to the supplier scorecard and the company's KPIs."
- Visual: a product shot of the analytics dashboard (the payoff). Button: "Start".

## Cast screen

The personas around Meridian (avatar + role + seeded name), with the line: "Seven roles, one system, one shared record. Here is who touches this purchase." Button: "Let's begin." PiP: a preview of the requisition screen.

Cast (role -> seeded name, confirm against the seed at build): Requester, Approver, Buyer, Supplier (external), Receiving, Quality, Finance (Maker), Finance (Checker), Management. The story foregrounds the Buyer (the landed-cost flip is the marquee), bookended by the Requester who starts it and Management who closes it.

---

## Chapter 1 - Requisition (persona: requester)

| Step | Route | Anchor | Action | Advance | Narration (figures live) |
| --- | --- | --- | --- | --- | --- |
| 1.1 intro | `/requisitions/REQ-HERO` | center | none | next | "It starts here. {requester} raises a requisition for two things: a regulated active ingredient to be imported, and the printed cartons it ships in." |
| 1.2 lines | same | `requisition.lines` (table) | none | next | "Two lines, one record. The active ingredient is an import to Plant 2, so the form has already asked for its HS code and Incoterm. The carton is a domestic line to Plant 1." |
| 1.3 budget banner | same | `requisition.banner.budget-over` | none | next | "The system checks the requisition against the quarter's budget and flags it: this requirement is over the available budget for {project}. It is a soft warning, logged with a reason, not a silent block." |
| 1.4 submit | same | `requisition.submit` (PageHeader action) | transition `Requisition REQ-HERO requestApproval` | wait-event `approval.requested` | "{requester} submits it for approval. Notice the requisition number stays the same from here to payment; one key, the whole way." |

Seed figures: REQ-HERO 2 lines (TL-HERO-API import PLANT-2 ITM-0006, TL-HERO-CARTON PLANT-1); over-budget soft warning on the project's quarter budget.

## Chapter 2 - Approval (persona: approver)

| Step | Route | Anchor | Action | Advance | Narration |
| --- | --- | --- | --- | --- | --- |
| 2.1 handoff | `/approvals` | center | none | next | "Now it is {approver}'s queue. Two lines, two different paths." |
| 2.2 auto-approve | same | `approval.row.carton` (within the carton row) | none | next | "The carton line is under the approval limit, so it clears automatically through the nearest-bucket rule. No one had to rubber-stamp it." |
| 2.3 manual route | same | `approval.row.api` | none | next | "The active-ingredient line is above the limit and an import, so it routes to a person to approve. {approver} cannot approve a requisition they raised, the system enforces that separation." |
| 2.4 approve | same | `approval.api.approve` | transition `ApprovalStageCompletion <api-stage> approve` | wait-event `approval.approved` | "{approver} approves the line. It moves on to sourcing." |

Seed: carton line auto-approves (nearest-bucket, under limit); API line manual; SoD (no self-approval, A6).

## Chapter 3 - Sourcing, the landed-cost flip (persona: buyer) - MARQUEE

| Step | Route | Anchor | Action | Advance | Narration |
| --- | --- | --- | --- | --- | --- |
| 3.1 handoff | `/sourcing/rfq/RFQ-2026-0042/compare` | center | none | next | "This is {buyer}'s screen, and the one to watch. Three suppliers quoted the active ingredient. The obvious choice is about to change." |
| 3.2 unit prices | same | `sourcing.compare.row.unit` | none | next | "By unit price, Helvetia is cheapest at CHF 127.69. Synthex is INR-priced at 139.30, BioCore at 155.26. If you stopped here, you would pick Helvetia." |
| 3.3 landed build-up | same | `sourcing.compare.row.landed` | none | next | "But this is an import. Add freight and duty per unit and the ranking flips: Helvetia lands at 169.77, while Synthex lands at 155.26, the lowest. The cheapest sticker price is not the cheapest delivered cost." |
| 3.4 the flip banner | same | `sourcing.banner.landed-flip` | none | next | "The system surfaces it plainly: lowest unit price is not lowest landed cost. This is the decision support, normalized landed cost, not a guess." |
| 3.5 spike flag | same | `sourcing.compare.column.biocore` | none | next | "BioCore also carries a price-alert flag: its quote is 7% above the last purchase price. The buyer sees the risk before awarding." |
| 3.6 target price | same | `sourcing.compare.target` | none | next | "Meridian's internal target price is shown to the buyer only. It is never sent to the suppliers." |
| 3.7 award | same | `sourcing.compare.award.synthex` | transition `RFQ RFQ-HERO award {supplier:SUP-0001}` (Try-it enabled) | wait-event `po.created` OR user-action | "{buyer} awards Synthex on landed cost. Because it is not the lowest unit price, the system asks for a one-line justification, which becomes part of the record." |

Seed figures (exact): Helvetia (SUP-0003) unit CHF 127.69, landed 169.769; Synthex (SUP-0001) unit 139.298 INR, landed 155.259 (LOWEST landed); BioCore (SUP-0002) unit 155.259 EUR, landed 179.926, +7% spike flag; internal target 140.749 (never sent). RFQ reference RFQ-2026-0042.

## Chapter 4 - Supplier acknowledges (portal step, not a setRole)

| Step | Route | Anchor | Action | Advance | Narration |
| --- | --- | --- | --- | --- | --- |
| 4.1 portal handoff | `/portal` (mock supplier session) | center | none | next | "Now we cross to the other side of the desk. This is Synthex's own portal, a real second user, not an internal screen. They see the PO Meridian just issued." |
| 4.2 acknowledge | same | `portal.po.acknowledge` | transition `PurchaseOrder PO-HERO acknowledge` | wait-event `po.acknowledged` | "Synthex acknowledges the order. Because the terms carry an advance, the advance payment is triggered automatically." |

Seam note: the portal is a separate shell with a mock supplier session (the OTP is faked), handled as a `portal` step type, not a `setRole`. See `05-reset-resume-risks.md`.

## Chapter 5 - Receiving and Quality (personas: receiving, then quality)

| Step | Route | Anchor | Action | Advance | Narration |
| --- | --- | --- | --- | --- | --- |
| 5.1 receiving handoff | `/inbound` | center | none | next | "The goods arrive. {receiving} records them against the PO." |
| 5.2 tolerance amend | `/inbound/PO-HERO/grn/new` | `grn.banner.tolerance-amend` | none | next | "The carton shipment arrives 7% over the ordered quantity. That is within tolerance, so the PO is amended to match before the goods receipt is posted, no manual rework." |
| 5.3 quality handoff | `/quality/inspections` | center | none (persona: quality) | next | "The active-ingredient lot goes to {quality} for inspection. Regulated material does not pass on trust." |
| 5.4 COA block | `/quality/inspections/<id>` | `inspection.coa-block` | none | next | "The lot is held until its Certificate of Analysis is on file. A hard gate, not a checkbox." |
| 5.5 QC fail -> NCR | same | `inspection.fail` | transition `Inspection <id> fail` then `NCR NCR-HERO raise` | wait-event `ncr.raised` | "The lot fails inspection. {quality} raises a non-conformance report against Synthex. The exception is now on the record." |

Seed: carton +7% over qty (tolerance amends PO before GRN); API lot fails QC; COA hard-block; NCR-HERO raised.

## Chapter 6 - NCR to CAPA to suspension risk (persona: quality, then management view)

| Step | Route | Anchor | Action | Advance | Narration |
| --- | --- | --- | --- | --- | --- |
| 6.1 CAPA | `/quality/ncr/NCR-HERO` | `ncr.capa.open` | transition `CorrectiveAction CAPA-HERO open` | wait-event `capa.opened` | "The non-conformance opens a corrective action. Synthex must remediate to stay in good standing." |
| 6.2 scorecard | `/analytics/scorecards/SUP-0001` | `scorecard.grade` | none | next | "Here is the consequence. This failure ticks Synthex's consecutive-below streak. Its scorecard grade drops, and it moves one step closer to suspension from the Approved Vendor List." |
| 6.3 near-suspend | same | `scorecard.banner.capa-near-suspend` | none | next | "The system flags it: one more failure with an open corrective action and Synthex is suspended from new awards. The quality loop is closed, and visible." |

Seed: CAPA-HERO; supplier consecutive-below streak; AVL grade drops; near-SUSPENDED banner.

## Chapter 7 - Invoice and three-way match (personas: finance_maker, then finance_checker) - MARQUEE

| Step | Route | Anchor | Action | Advance | Narration |
| --- | --- | --- | --- | --- | --- |
| 7.1 maker handoff | `/invoices/INV-LV-10/match` | center | none | next | "Invoices arrive. {finance_maker} matches each one against its PO and goods receipt, the three-way match." |
| 7.2 price variance | same | `invoice.match.exception` | none | next | "This invoice's price does not match the PO beyond tolerance. The system does not block it blindly; it routes the price-variance exception to the buyer to adjudicate." |
| 7.3 duplicate hold | `/invoices/INV-LV-13/match` | `invoice.banner.duplicate-hold` | none | next | "And this one is caught as a likely duplicate, same supplier, invoice number, and amount, and held automatically before it can be paid twice." |
| 7.4 checker release | `/payments/release-queue` | `payment.release` | transition `Installment <id> release` (Try-it enabled) | wait-event `installment.processed` OR user-action | "{finance_maker} prepared the payment; {finance_checker} releases it. The same person cannot do both, the maker-checker control is enforced." |
| 7.5 partial + overdue | `/payments` | `payment.installment.partial` | none | next | "Two more controls in flight: one installment was approved in part with a remainder held for the rest, and an overdue installment fired its reminder to the supplier automatically." |

Seed figures: INV-LV-10 price-variance routed to buyer (560.00 + 100.80 tax USD); INV-LV-13 duplicate-invoice held (1,120.00 + 201.60 tax USD); INST-LV-1 partial approval 35,000 of 50,000 with 15,000 remainder; INST-LV-2 overdue 28,000, reminder fired 2026-05-29.

## Chapter 8 - Analytics, the closed loop (persona: management) - PAYOFF

| Step | Route | Anchor | Action | Advance | Narration |
| --- | --- | --- | --- | --- | --- |
| 8.1 dashboard | `/analytics` | center | none | next | "And here is where it all lands. {management}'s dashboard, built from everything that just happened, not typed in." |
| 8.2 OTIF vs perfect | same | `analytics.kpi.otif` + `analytics.kpi.perfect-order` | none | next | "On-time-in-full is 93.9% across the portfolio. Perfect order, which also counts documentation and damage, is 88.9%, always below OTIF, because it is a stricter measure." |
| 8.3 spend + DPO | same | `analytics.kpi.spend` | none | next | "Total spend is about $125M over twelve months; days-payable-outstanding sits at 44.6 days, in a healthy range." |
| 8.4 the ripple | same | `analytics.scorecard-widget` | none | next | "And the quality failure you watched is already here: Synthex's dropped grade shows in the supplier risk view. One lot, upstream, visible downstream." |
| 8.5 budget | same | `analytics.budget-commitment` | none | next | "Budget commitment versus actual closes the financial loop: the PO you issued is committed here, and relieves to actual when the requirement completes." |
| 8.6 close | same | center | none | next ("Finish") | "One purchase, seven people, one record, and a dashboard that reflects every step, with no one chasing anyone. That is the system." |

Seed KPIs (verified): OTIF 93.9%, perfect-order 88.9% (< OTIF), DPO 44.6d, spend ~$125M, 25A/18B/3C grades.

---

## Notes for the script encoding

- Steps 3.7 and 7.4 are the two Try-it opt-in moments (award on landed cost; checker release). Everywhere else defaults to Watch.
- Persona hand-offs (chapters 1->2->3, 5 internal receiving->quality, 7 maker->checker, ->8) play the `PersonaTransition`. Chapter 4 is the portal seam (not a `setRole`).
- Every `transition` step has matching `expects` (e.g. 3.7 expects RFQ-HERO has 3 quotations and is RESPONDED) so re-entry and chapter-jump are safe.
- All figures interpolate from live queries; the values above are the seed truth for `tour-lint` to assert against.
