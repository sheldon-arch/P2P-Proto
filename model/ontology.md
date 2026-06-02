# Unified P2P Ontology

A formal ontology-level model of the unified Procure-to-Pay domain: the concepts (entity classes), their attributes, the relationships between them, the controlled vocabularies (enums), the lifecycle states, and the axioms (invariants/rules) that constrain them. This is the single conceptual map to hold in your head when building the prototype. It sits above the data model (which is the buildable schema) and is the semantic layer the knowledge graph visualizes.

Layers, from abstract to concrete:
- **Ontology (this file):** concept classes, relationships, controlled vocabularies, axioms. The "what exists and how it relates" model.
- **Knowledge graph (`knowledge-graph.md` / `graph.json`):** the visual pillar/process/entity/service map.
- **Data model (`data-model.md`):** entities + fields + state machines (the buildable schema).
- **Diagrams (`../diagrams/`, `../documentation/`):** the behavioural flows per role.

## 1. Concept taxonomy (the classes of thing)

```
Thing
├── Actor                         (who acts)
│   ├── InternalActor             Requester, Approver, Buyer, FinanceMaker, FinanceChecker,
│   │                             Management, Receiving, Quality, Engineering, BudgetOwner,
│   │                             TaxCompliance, Administrator
│   ├── ExternalActor             Supplier/Vendor, FreightForwarder, CustomsAgent
│   └── SystemActor               Platform (automated)
├── TransactionalRecord           (the things that flow and have lifecycles)
│   ├── DemandRecord              Requisition, RequisitionLine, Forecast
│   ├── SourcingRecord            RFQ, Quotation, Contract/Agreement, FrameworkAgreement, CallOffRelease
│   ├── OrderRecord               PurchaseOrder, POLine
│   ├── ReceiptRecord             GoodsReceipt, PartialDeliveryBlock, Inspection, NCR
│   ├── SettlementRecord          Invoice, MatchResult, Payment, Installment, CreditNote, DebitNote,
│   │                             AdvancePayment, Retention, PaymentMilestone
│   ├── ReturnRecord              Return/RMA, CorrectiveAction(CAPA)
│   └── FinanceControlRecord      Budget, Commitment, GrIrEntry
├── MasterRecord                  (the reference data transactions draw on)
│   ├── PartyMaster               Supplier, SupplierGroup, SupplierAddress, SupplierAddressTaxDetail, User
│   ├── ItemMaster                Item, ItemSourcePriority, Category/Segment
│   ├── FinanceMaster             Currency, PaymentTerms, TaxCode, Project/CostCenter, AssetProposal
│   ├── LogisticsMaster           UoM, Warehouse, Inventory, StockMovement
│   ├── QualityMaster             SupplierQualification, HygieneAudit, RetentionSample, QualityAgreement, QualificationMatrix
│   └── AccessMaster              Role, Permission, Designation, BusinessUnit/Vertical, RoutingRule, FieldConfig
├── PlatformService               (the capabilities that govern records)
│   └── ApprovalEngine, FieldEngine, FxService, AuditService, NotificationService,
│       RealtimeService, BulkImportService, DocumentStore, AnalyticsEngine, RBACService,
│       BudgetService, TaxService, ErpBoundary
├── Insight                       (computed outputs)
│   └── SupplierScorecard, SpendCut, CycleTimeKPI, OTIF/PerfectOrder, PayablesAging, RiskScore
└── ConceptualValue               (controlled vocabularies / states - see section 4)
```

## 2. Core relationships (object properties)

Read as `Subject --relationship--> Object`.

- Requester `raises` Requisition; Requisition `hasLine` RequisitionLine.
- RequisitionLine `references` Item; RequisitionLine `chargedTo` Project/CostCenter.
- Requisition `checkedAgainst` Budget; Budget `encumberedBy` Commitment; Commitment `createdAt` PurchaseOrder; Commitment `relievedAt` GoodsReceipt|Invoice.
- Requisition `routedThrough` ApprovalChain; ApprovalChain `hasStage` ApprovalStage; ApprovalStage `assignedTo` Approver; ApprovalStage `governedBy` ApprovalEngine.
- Requisition `sourcedVia` RFQ; RFQ `invites` Supplier (>=3); Supplier `submits` Quotation; Quotation `comparedOn` LandedCost; Quotation `awardedAs` Contract.
- Contract `realizedBy` PurchaseOrder; PurchaseOrder `issuedTo` Supplier; PurchaseOrder `hasLine` POLine; PurchaseOrder `acknowledgedBy` Supplier; PurchaseOrder `taxedBy` TaxCode.
- PurchaseOrder `fulfilledBy` GoodsReceipt; GoodsReceipt `hasBlock` PartialDeliveryBlock; GoodsReceipt `inspectedBy` Quality; Inspection `mayRaise` NCR.
- GoodsReceipt `accrues` GrIrEntry; Invoice `clears` GrIrEntry; Invoice `matchedBy` MatchResult; MatchResult `reconciles` PurchaseOrder + GoodsReceipt + Invoice (3-way) OR PurchaseOrder + Invoice (2-way).
- Invoice `settledBy` Payment; Payment `hasInstallment` Installment; Payment `releasedBy` FinanceChecker; Payment `convertedBy` FxService.
- NCR `triggers` CorrectiveAction; NCR `triggers` Return/RMA; CorrectiveAction `feeds` SupplierScorecard; SupplierScorecard `gates` Supplier (AVL/SUSPENDED); Return `adjustsVia` CreditNote|DebitNote.
- Supplier `qualifiedBy` (certs/COA/AVL + ISO attributes); Item `onboardedAs` (lifecycle).
- Every TransactionalRecord `recordedIn` AuditService, `broadcastBy` RealtimeService, `feeds` Insight.
- Actor `holds` Permission (resolved by RBACService from Role+UserRole+Designation+BusinessUnit).

## 3. Attribute pattern (data properties)

Every concept attribute carries this metadata profile (the prototype's field dictionary will make each explicit): name, dataType (text|decimal|integer|date|boolean|enum|reference|file|computed), cardinality (one|many|optional), mandatory (yes|no|conditional + condition), default, validation (regex|range|cross-field), enumDomain (the controlled vocabulary id, if enum), referenceTarget + displayField (if reference), computedFormula (if computed), owningRole, isAuto (gates stage progression or never). The data model holds the per-entity field lists; the companion docs hold the per-flow field tables; the build's data dictionary consolidates both into one record per attribute.

## 4. Controlled vocabularies (enums - the authoritative value sets)

- **RequisitionCategory:** Items | Spares | Services | ProductDesign
- **PurchaseDirection:** Direct | Indirect
- **PurchaseType:** Local | Import
- **Priority(Urgency):** ASAP(weight 4) | SameDay(2) | Within2Days(1) | Within1Week(0)
- **RequisitionStage:** INITIATION -> ORDERED -> PARTIAL_DELIVERY -> POST_DELIVERY  (linear, one step)
- **RequisitionStatus:** IN_PROGRESS | ON_HOLD | CANCELLED | COMPLETED
- **CompletionStatus (per approval stage):** NOT_STARTED -> IN_PROGRESS -> AWAITING_APPROVAL -> APPROVED (READY_FOR_APPROVAL)
- **SupplierStatus / ItemStatus:** PENDING_ONBOARDING -> PENDING_APPROVAL -> ONBOARDED -> (SUSPENDED) -> OFFBOARDED
- **InstallmentStatus:** null(pending) | APPROVED | PARTIAL_APPROVAL | PROCESSED | RESCHEDULED
- **PaymentTerms:** 100% advance | part-advance + against documents | part-advance + against shipment | 30/70 | net 30 | net 60 | net 90
- **Incoterm (2020):** EXW | FCA | FOB | CIF | CFR | CPT | CIP | DAP | DDP  (FOB/CIF/CFR sea-only; validate vs transport mode)
- **TransportMode:** Air | Sea | Road | Courier
- **DeliveryStatus (derived):** delivered | partial | overdue | upcoming  (precedence in that order)
- **MatchType:** TWO_WAY | THREE_WAY  (three-way iff a GRN exists)
- **MatchExceptionType:** price-variance | qty-over | qty-under | missing-GR | duplicate-invoice | tax-mismatch
- **MatchResolution:** accept | adjust | credit-note | debit-note | reject
- **ItemSourceType:** MANUFACTURED | PURCHASED | SUBCONTRACTED | STOCK_TRANSFER
- **ReturnReason:** defective | damaged | wrong-item | over-delivery | expired | quality-fail
- **SupplierClassification:** Internal | External
- **RiskTier:** low | medium | high | critical
- **TradeProgram:** none | C-TPAT | AEO | TAPA
- **ScorecardGrade:** A(>=90) | B(70-89) | C(<70); statuses Approved | Conditional | Preferred | Suspended | Disqualified
- **TaxType:** GST | VAT | duty | reverse-charge | withholding(TDS/WHT)
- **Currency:** configurable base + {USD, EUR, INR, AED, OMR, SAR, CHF, ...}
- **AuditCategory:** TICKET | SUPPLIER | ITEM | ADMIN | PAYMENT
- **StockMovementType:** RECEIPT | ISSUE | ADJUSTMENT | TRANSFER
- **QualificationStatus:** QUALIFIED | PRE_QUALIFIED | REJECTED | PENDING
- **MaterialType:** food-agro | packing-material | api-raw
- **HygieneAuditOutcome:** APPROVED | PRE_QUALIFIED | REJECTED
- **RFQStatus:** DRAFT | SENT | RESPONDED | AWARDED | CANCELLED

## 5. Axioms (the invariants the ontology guarantees)

These are the always-true rules; the prototype must never let a state violate them.

A1. A Requisition identifier is immutable for the whole lifecycle (including delays).
A2. Stage advances exactly one step and only when all mandatory fields for the current stage are filled.
A3. COMPLETED requires POST_DELIVERY AND all approval stages APPROVED AND all matches cleared AND no open NCR/CAPA block.
A4. Budget is soft-checked at requisition and hard-committed (encumbered) at PO; commitment is relieved to actual at GR/invoice. Approval limits are not budget control.
A5. Finance/Management approval stages cannot be assigned to users (approval-only); an APPROVED stage cannot be reassigned.
A6. SoD: buyer != PO approver; receiver != invoice approver; maker != checker; no actor approves their own requisition or PO. Auto-approval within threshold is the only no-second-person path and is logged.
A7. Finance auto-approval requires amountInBase <= approverLimit (default 200000, configurable); editing payTerms/paymentSchedules reverts an auto-approved Finance/Management stage to AWAITING_APPROVAL.
A8. MatchType is THREE_WAY iff a GoodsReceipt exists for the line; otherwise TWO_WAY (+ milestone acceptance for services). Match reconciles amounts including tax. Within tolerance auto-clears and relieves GR/IR; outside raises a typed exception routed to a resolver.
A9. A payment schedule is locked (no delete/edit) if any installment is APPROVED/PARTIAL_APPROVAL/PROCESSED. Partial approval (amount < agreed) creates exactly one remainder installment.
A10. Supplier/Item edit on ONBOARDED or PENDING_APPROVAL reverts to PENDING_APPROVAL; ERP-sync flag resets on update. SUSPENDED blocks new POs without offboarding.
A11. The CAPA loop is closed: receiving inspection (8.6) -> NCR (8.7) -> corrective action (10.2) -> supplier re-evaluation (8.4.1) -> may suspend. Quality events drive AVL status which gates PO eligibility.
A12. Currency: all amounts normalized to a configurable base via the FX service; conversion never throws (graceful degradation to the original amount). Thresholds/comparison/analytics use the base amount.
A13. Every committed change emits an audit-log entry and a real-time event; access control is enforced on the re-fetch, not on the event stream.
A14. OTIF is computed two ways and labelled distinctly: two-factor (on-time + in-full) for the operational streak; four-factor perfect order (+ damage-free + documentation-accurate, SCOR RL.1.2) for the re-qualification gate.
A15. Compliance (certification validity, document completeness) is a hard eligibility gate for the AVL, not a weighted scorecard input.
A16. An RFQ is raised per requisition and carries all its lines; each line is awarded independently; a single award event groups the winning supplier's lines and emits one PurchaseOrder per distinct winning supplier. (SCOR S1.9/S1.10)
A17. Field visibility is a structural access control enforced both server-side and client-side; commercial fields (price, PO value, landed cost, payment terms, internalTargetPrice) are stripped from the payload for roles that are denied commercial visibility, with Quality as the canonical denied role. (SCOR OE5 | ISO 8.4.1 SoD)
A18. A supplier reaches ONBOARDED only after: material-type qualification complete (required certifications per the QualificationMatrix + hygiene-audit average score >= 1.0; average >= 1.5 = QUALIFIED, 1.0 to < 1.5 = PRE_QUALIFIED gated, < 1.0 = REJECTED) AND a signed Quality Agreement on file; for API/raw material suppliers also: three-batch COA and retention samples retained. (SCOR S1.6 | ISO 8.4.1 / 8.6 / HACCP / GMP)
A19. A one-time tooling charge (die/cylinder) applies on the first print order for a packaging item and is waived on all repeat orders for the same item; buyer-arranged incoterms (EXW, FOB) require a freight-forwarder PO to be issued in parallel with the supplier PO, while seller-arranged incoterms (CIF, CFR) do not emit a freight-forwarder PO. (SCOR S2.3 / OE6)
A20. Exactly one designated requester per department is registered in the master; rejected or non-conforming goods are physically quarantined immediately on NCR raise and held in quarantine until dispositioned; goods not collected within approximately 90 days are disposed per the documented disposal SOP. (SCOR S4 | ISO 8.7)
A21. Inventory is tracked per item x warehouse; a GRN posts a RECEIPT movement that increments stockOnHand; when an item's available quantity (stockOnHand minus allocated) falls at or below its reorderPoint it surfaces on the reorder worklist; an Inventory Manager reviews the worklist and one-click raises a requisition pre-filled with suggestedQty = maxStock minus available; the requisition is reviewed and submitted by that person before it enters the standard approval flow. (SCOR P3 Plan Source -> O2 Order B2B | ISO 8.4)

## 6. How to use this when building

- The concept taxonomy (1) becomes your module/route grouping and your TypeScript domain types.
- The relationships (2) become your foreign keys and the navigation between screens (a record's detail screen links to its related records).
- The attribute pattern (3) becomes the field dictionary every form and table reads from.
- The controlled vocabularies (4) become every dropdown/Select option set and every status Badge variant.
- The lifecycle states (4) drive which actions/buttons are legal in a given state (the UI shows only valid transitions).
- The axioms (5) become the guards in the mock service layer and the validations on forms; they are also the rules to demo, because each is a credibility signal.

Parent: [[unified-p2p-model]]. Visual: `knowledge-graph.md`. Schema: `data-model.md`.
