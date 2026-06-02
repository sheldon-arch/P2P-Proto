# Data Dictionary

The consolidated, machine-readable field dictionary for the Unified P2P prototype. 57 entities, 627 fields, one JSON file per entity. Each field carries the full metadata profile (see `_SCHEMA.md`): name, label, dataType, cardinality, mandatory(+condition), default, enumDomain/enumValues, referenceTarget, validation, computedFormula, computedVsEntered, isAuto, owningRole, purpose, source, scorIso. Every field has an explicit `purpose` (its intent in the end-to-end flow). Enums reference the controlled vocabularies in `model/ontology.md` section 4; invariants reference axioms A1-A15.

This is the foundation the rest of the build consumes: it generates TypeScript types + Zod schemas (task #2), drives form fields and dropdowns (screens/copy), and seeds demo-data generation (task #3).

## Entities by domain

- **Demand:** Requisition, RequisitionLine, Forecast
- **Approval:** ApprovalStageCompletion, RoutingRule
- **Sourcing:** RFQ, Quotation, QuotationLine, LandedCost, Contract, FrameworkAgreement, CallOffRelease
- **Order:** PurchaseOrder, POLine
- **Supplier:** Supplier, SupplierAddress, SupplierAddressTaxDetail, SupplierGroup
- **Item:** Item, ItemSourcePriority
- **Receipt/Quality:** GoodsReceipt, PartialDeliveryBlock, Inspection, NCR, CorrectiveAction
- **Returns:** Return
- **Invoice/Match:** Invoice, MatchResult, MatchException, GrIrEntry
- **Payments:** Payment, PaymentSchedule, Installment, CreditDebitNote, AdvancePayment, Retention, PaymentMilestone
- **Finance control:** Budget, Commitment, CashFloat, CreditorLedger
- **Masters:** Currency, PaymentTerms, TaxCode, Project, Category, UoM, Warehouse, AssetProposal
- **Platform/Access:** User, Role, Permission, Designation, BusinessUnit, FieldConfig, AuditLog
- **Analytics:** SupplierScorecard

## Validation
`for f in *.json; do python3 -c "import json;d=json.load(open('$f'));assert all(x.get('purpose') for x in d['fields'])"; done` passes for all 57 (verified 2026-05-31). All enumDomain references resolve to ontology vocabularies. No field is missing core metadata.
