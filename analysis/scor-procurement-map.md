# SCOR Procurement Mapping (the canonical spine for the unified model)

Maps the procurement-relevant SCOR DS processes and metrics to unified-model domains. SCOR codes and names are verbatim from the supplied dataset (see `scor-taxonomy.md`). Per the project decision, SCOR is the canonical process spine and naming; it is primary over ISO where they overlap. Scope decision: deep-dive Orchestrate, Order, Source; note the procure-to-pay-touching parts of Plan, Fulfill, Return.

PROVENANCE CAVEAT (added after senior-practitioner review): the Source codes used here (S1 Strategic Source, S2 Direct Procure, S3 Indirect Procure, S4 Source Return, with the leaf decompositions S1.1-S4.5) are taken VERBATIM from the supplied scordata.json export. They differ from the classic published SCOR Source taxonomy that a SCOR-literate reviewer may expect (older editions used sS1 Source Stocked / sS2 Source Make-to-Order / sS3 Source Engineer-to-Order). The codes here reflect this particular SCOR DS dataset edition. When presenting to a SCOR-literate audience, describe these as the process steps as named in the supplied SCOR dataset, not as a claim about a specific published SCOR release. The step SEQUENCE and decomposition are sound regardless of the code labels; the unified model relies on the step semantics, not the exact code string.

## 1. The canonical procurement spine (SCOR step names the diagrams will use)

**Strategic sourcing (S1 Strategic Source)** -> unified Sourcing/RFQ domain:
- S1.1 Define Business Need
- S1.2 Conduct Supply Market Analysis
- S1.3 Develop Sourcing Strategy
- S1.4 Pre-procurement Market Testing
- S1.5 Source the Supply Market
- S1.6 Prequalify Suppliers
- S1.7 Determine Level of Collaboration Arrangement
- S1.8 Invite to Tender/Request for Quotation
- S1.9 Analyze Offers and Select Suppliers
- S1.10 Negotiate and Award Contract

**Operational procurement (S2 Direct Procure / S3 Indirect Procure - identical 7-step decomposition)** -> unified PO + Delivery/GRN + Payment domains:
- S2.1 / S3.1 Establish Order Signal  (the purchase order / order release)
- S2.2 / S3.2 Schedule Product Delivery
- S2.3 / S3.3 Manage Inbound Transport  (Al Bahja delivery tracking lives here)
- S2.4 / S3.4 Receive Product
- S2.5 / S3.5 Inspect and Verify  (QC / GRN gate)
- S2.6 / S3.6 Transfer Product  (move into stores/inventory)
- S2.7 / S3.7 Authorize Supplier Payment

Direct vs Indirect: S2 = materials that go into the product (Al Bahja RM/PM); S3 = indirect/MRO/office/services. The unified model treats them as one PO->receipt->pay spine with a direct/indirect flag (matches Raphe's LOCAL/IMPORT + purchase-type config and Al Bahja's category split).

**Returns (S4 Source Return)** -> unified Returns/RMA domain (a gap neither company fully covers):
- S4.1 Initiate a Source Return
- S4.2 Request Authorize Product Return
- S4.3 Identify Product Condition/Return Reason
- S4.4 Schedule Product Shipment
- S4.5 Close or Adjust Return Order

## 2. Supporting SCOR areas (deep where procurement-relevant)

**Orchestrate Supply Chain (OE) - the cross-cutting governance the platform foundation embodies:**
- OE2 Business Rules -> configurable approval engine, field engine, routing rules.
- OE6 Contracts and Agreements -> contract capture (S1.10), contract/constant supply, payment terms.
- OE8 Regulatory and Compliance -> permits, customs, ISO compliance, documentation.
- OE9 Risk -> supplier risk register (ISO 31000), single-source/continuity.
- OE10 Environment, Social, and Governance -> sustainable procurement (ISO 20400), supplier ESG criteria.
- OE3 Performance and Continuous Improvement -> analytics, supplier scorecard, CAPA loop.
- OE4 Data, Information, and Technology -> master data, audit, integration.
- OE5 Human Resources -> roles, RBAC, designation hierarchy.
- OE12 Segmentation -> supplier/spend/category segmentation.

**Order (O):** O1 Order B2C / O2 Order B2B / O3 Order Intra-Company. Procurement is the buy-side; the requisition->order signal aligns with the order-management capability. The unified requisition/intake domain uses this framing for how a need becomes an order.

**Plan (P) - procurement touch-points:** P1 Plan Supply Chain, P3 Plan Source (supply planning, forecasting, and demand signals). Al Bahja's marketing forecast + variance flag and Raphe's demand inputs map here. P3 is now partially built: the reorder-point replenishment flow (inventory-driven demand, Diagram 13) operationalizes P3 as a trigger-based demand signal from the inventory position into O2 Order B2B. This covers the demand-sensing and order-triggering portion of P3; full supply planning (multi-period capacity and demand balancing) remains a forecasting reference and is noted in `documentation/12-analytics.md`. See `documentation/13-inventory-replenishment.md` for the built P3 flow.

**Fulfill (F) - overlap with receiving:** F1/F2/F3 fulfillment. The buy-side receiving (S2.4-S2.6) is where Fulfill (sell-side) and Source (buy-side) meet at the warehouse; the unified Delivery/GRN domain sits on the Source side.

**Transform (T):** T1 Product / T2 Service / T3 MRO. Out of the procure-to-pay core (manufacturing), but T2 Service and T3 MRO inform the services/maintenance procurement variant (Al Bahja maintenance/service contracts).

## 3. SCOR procurement performance metrics (Reliability pillar) - feed the scorecard

These complement the ISO/industry KPIs ([[procurement-metrics-kpis]]) and are the SCOR-standard supplier metrics:
- RL.1.2 Perfect Supplier Order Fulfillment (the supplier OTIF roll-up)
- RL.2.5 Percentage of Orders Delivered In Full from the Supplier
- RL.2.6 Delivery Performance to Original Supplier Commit Date (on-time)
- RL.2.7 Supplier Order Documentation Accuracy
- RL.2.8 Supplier Order Perfect Condition
- RL.3.13 Delivery Item Accuracy from the Supplier
- RL.3.14 Delivery Quantity Accuracy from the Supplier
- RL.3.17-3.20 Supplier Order Compliance / Other / Payment / Shipping Documentation Accuracy
- RL.3.22-3.24 Percentage of Supplier Orders/Lines Received Damage Free / Delivered Damage Free / Defect Free Conformance
- RL.3.34 Percentage of Suppliers Meeting Environmental Metrics and Criteria
- RL.3.35 Percentage of Suppliers with ISO 14001 Certification  (SCOR explicitly ties to ISO here)
Other pillars: RS (Responsiveness) cycle times, CO (Cost) Total Supply Chain Management Cost, AM (Assets) payables/inventory, plus Profit/Environmental/Social/ESG pillars.

## 4. SCOR best practices relevant to procurement (Practices pillar)

Titles only in the dataset, but the canonical practice names to align the model to: BP.097 Supplier Appraisal, BP.068 Supplier Performance Reporting, BP.056 Supplier Raw Material Quality Assurance, BP.100 Strategic Sourcing, BP.101 Purchasing and Procurement Strategy, BP.042 Procurement Terms and Conditions Review, BP.001/002 Supply Chain Risk Management, BP.069 Raw Materials Receiving Process, BP.114 Order Quotation System, BP.055 Freight Carrier Delivery Performance Evaluation, BP.036 Consignment Inventory with Suppliers.

## 5. Coverage note

Every Source leaf (S1.1-S4.5) is in the spine and tagged in at least one diagram (S1.4 Pre-procurement Market Testing is folded into the sourcing market-analysis step alongside S1.2/S1.5). Orchestrate is mapped to platform foundation + governance: OE1 (final-approval / Management terminal vertical) and OE12 (Segmentation: supplier groups, classification, category/tail spend) are embodied in the analytics and onboarding diagrams; OE8/OE9/OE10 (regulatory/risk/ESG) are concentrated in the supplier ISO-attribute set. Order frames intake. Plan/Transform/Fulfill/Return are noted at L1 with procurement relevance (forecasting, services/MRO, receiving overlap, returns). This is the benchmark the unified flows are measured against in Phase E.

Parent benchmark: [[scor-model]]. Related: [[iso-supply-chain-standards]], [[procurement-metrics-kpis]], [[p2p-blueprint-overview]].
