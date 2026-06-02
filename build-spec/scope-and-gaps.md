# Scope and Intentional Gaps

The explicit list of what the prototype deliberately does not do, with the reason and what each becomes in a production build. The purpose is conscious acceptance: every gap below is a decision, not an oversight, so that none of them surprises a client in a demo or a stakeholder in review. These are drawn from the readiness brief's nice-to-have list and the architectural decisions made along the way.

A gap is acceptable for a prototype when it does not undermine the thing the prototype must prove (that the disciplines work and connect, on real data, across roles) and when it is cheaper and clearer to mock than to build. Each entry states why it meets that bar.

## Authentication and identity

- **Gap:** no real authentication. A fake login and a role-switcher stand in.
- **Why:** the prototype's job is to show the cross-role flow; real auth (OTP, SSO) adds no demo value and the role-switcher is a better demo device (a presenter hops personas live). The model already specifies email-OTP and Microsoft auth and the full RBAC union; only the login mechanism is mocked, not the permission model.
- **Production:** real OTP/SSO behind the same `useCan` resolver, which is already built against the real permission matrix. The role-switcher is removed (or gated to internal demo builds).

## Currency and FX

- **Gap:** no live FX feed; a static rate table (`data-contracts.md`) with a degradation toggle.
- **Why:** a live feed would make the demo non-deterministic and adds no narrative value; the static table is the same one the seed uses, so figures reconcile. The degradation path (axiom A12) is demonstrated via the toggle.
- **Production:** a live rate service behind the same `fxService.toBase` interface; realized FX gain/loss (table vs PO-override rate at settlement) computed, which the prototype does not do.

## Document storage

- **Gap:** no real file storage; uploads are filename stubs (the file is named and listed, not stored or retrievable).
- **Why:** the demo needs to show that a COA, an MSDS, a PO PDF, and a payment receipt are attached at the right step (the gate behavior), not that a file is actually persisted. The gate logic (COA hard-block, etc.) is real; the bytes are not.
- **Production:** object storage behind the upload component; document generation (branded PO/RFQ PDFs) which the prototype stubs.

## Analytics

- **Gap:** no live analytics engine; the 12-month KPIs are precomputed in the seed, only action-local numbers recompute live (`data-contracts.md`).
- **Why:** computing portfolio OTIF from the demo's handful of mutated records would be wrong; the precompute-vs-compute split is the honest, correct approach for a seeded demo. Every tile still shows its formula.
- **Production:** a real aggregation layer computing all KPIs from the live transaction store on the same formulas.

## Bulk import

- **Gap:** the import dialog accepts a file and shows a canned success result; it does not actually parse and upsert.
- **Why:** the import pattern (template, sample, all-or-nothing, the result toast) is shown; real parsing adds engineering with no demo payoff, since the seed already populates the masters.
- **Production:** real CSV/XLSX parsing, validation, and upsert by natural key, which the model and the screen spec already define.

## Platform breadth

- **Gap:** desktop-first, English, left-to-right only. No mobile/responsive layout, no right-to-left, no Arabic localization, no timezone handling beyond the tenant default.
- **Why:** the demo audience views on a laptop; responsive and localization are real production work that does not change what the prototype proves. Worth flagging specifically: one of the source operations is a Gulf business, so Arabic/RTL is a genuine production requirement, consciously deferred, not forgotten.
- **Production:** responsive layout, RTL support, Arabic (and other) localization, full timezone handling. Accessibility is partly inherited from shadcn/Radix even in the prototype.

## Notifications

- **Gap:** no notification center or activity feed; seeded queue-count badges stand in.
- **Why:** the badges convey "there is work waiting" without building a notification system; the event bus that a real notification center would use already exists (it drives the re-query).
- **Production:** a notification center subscribed to the same event bus, plus email/in-app delivery.

## Segregation-of-duties enforcement

- **Gap:** the SoD conditions are enforced generally by the resolver, but the demo relies on the seed staging distinct users per role to demonstrate them; full conditional-permission enforcement across every edge is not exhaustively tested in the prototype.
- **Why:** the hero-path SoD blocks (no self-approval, maker != checker, receiver != invoice-approver) are real and demonstrated with real distinct people; exhaustive enforcement is a hardening task, not a demo requirement.
- **Production:** complete conditional-permission enforcement with a test matrix over every SoD edge.

## Polish deferred

- **Gap:** branded PO/RFQ PDFs, realized FX gain/loss, forecast-vs-actual, multi-plant spend split, an audit-log diff viewer, and pixel-perfect layout on non-hero screens.
- **Why:** these are polish after the data and the flow are right; the shadcn defaults give a credible layout on the non-hero screens, and the three hero screens get explicit sketches (`ux/01`).
- **Production:** each is a known, scoped addition; none changes the model.

## B2B supplier discovery (G4)

- **Gap:** the supply market analysis step in Diagram 04 surfaces a candidate-supplier list by HS code and keyword. In the prototype this list is MOCKED: a pre-loaded static table of candidate suppliers, not a live integration with any external B2B directory, marketplace (Alibaba, IndiaMART, Global Sources), or data provider.
- **Why:** the mock demonstrates the discovery step in the demo flow (buyer scans candidates, selects leads, routes non-onboarded suppliers to Diagram 06); a live API integration adds engineering with no demo-value payoff since the seed already contains plausible supplier data. The discovery UI, the HS-code match logic, and the lead-to-onboarding handoff are real; only the data source is mocked.
- **Production:** a live integration with one or more B2B supplier directories behind the same `supplierDiscovery.search(hsCode, keywords)` interface; the buyer workflow is unchanged.

## What is explicitly NOT a gap (real in the prototype)

To balance the list, these are fully real, not mocked, because they are what the prototype must prove:

- The data model, the 627+ fields, and their validation.
- The state machines: every transition is guarded, and illegal states are unreachable (the transitions are the only mutators).
- The RBAC permission model and the per-role nav derivation.
- The landed-cost computation and the ranking reorder.
- The supplier scorecard computation and the closed quality-to-scorecard-to-sourcing loop.
- The three-way match logic, tolerance bands, and duplicate detection.
- The budget commitment-vs-actual accounting.
- The copy layer and the exact domain terminology.
- The deterministic seed and the reproducible demo.
- **Inventory ledger and reorder-point replenishment (G7, now built):** the inventory tracking per item x warehouse (Inventory entity), the StockMovement ledger (RECEIPT/ISSUE/ADJUSTMENT/TRANSFER), the reorder trigger evaluation on every movement, the reorder worklist, and the one-click replenishment requisition raise are fully built per Diagram 13 and axiom A21. This was previously deferred (noted as "forecasting reference" in the SCOR map); it is now a built core flow. See `documentation/13-inventory-replenishment.md` and `analysis/scor-procurement-map.md` P3 note for full detail.

## Sign-off

This list is the boundary of the prototype. Accepting it means accepting that the prototype proves the disciplines and their connection on real data across roles, and defers production hardening (auth, storage, live feeds, breadth, polish) to the build that follows. Each deferred item has a defined production path and does not require a model change. If a client or stakeholder needs one of the deferred items to evaluate, it is pulled forward as a scoped addition rather than discovered as a surprise.

Reviewed and accepted by: [product owner], [engineering lead], [date].
