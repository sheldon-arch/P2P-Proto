# Data Dictionary Schema and Conventions

The consolidated, machine-readable field dictionary. One JSON file per entity in this folder. Each file drives TypeScript types, Zod validation, form fields, dropdowns, and seed-data generation. Source content is harvested from `model/data-model.md` and the per-flow field tables in `documentation/*.md`; this consolidates duplicates into ONE authoritative record per field. Every field must have intent: the `purpose` line says why it exists in the grand scheme.

## File shape (per entity)
```json
{
  "entity": "EntityName",
  "description": "what this entity is and its role in the P2P model",
  "primaryDomain": "the diagram(s) where it is created/used (e.g. 02-requisition)",
  "lifecycleEnum": "name of its status enum if it has a lifecycle, else null",
  "fields": [
    {
      "name": "fieldName",                     // camelCase, the canonical name
      "label": "User-Facing Label",            // what the UI shows (no technical names)
      "dataType": "text|textarea|integer|decimal|money|date|datetime|boolean|enum|reference|file|computed|json",
      "cardinality": "one|many",
      "mandatory": "yes|no|conditional",
      "mandatoryCondition": "expression, if conditional (else null)",
      "default": "value or null or 'computed'",
      "enumDomain": "ENUM_ID from the controlled vocabularies, if dataType=enum (else null)",
      "enumValues": ["literal","value","set"],  // inline if not a shared enum, else null
      "referenceTarget": "EntityName + displayField, if dataType=reference (else null)",
      "validation": "regex/range/min/max/cross-field rule in words or expression",
      "computedFormula": "the formula, if dataType=computed (else null)",
      "computedVsEntered": "entered|computed|auto",
      "isAuto": true,                            // true = system-set, never gates stage progression
      "owningRole": "which role fills/owns it",
      "purpose": "WHY this field exists - its intent in the end-to-end flow",
      "source": "AB|RA|blueprint|SCOR|ISO|build-new",
      "scorIso": "SCOR code | ISO clause (if applicable)"
    }
  ],
  "relationships": [
    {"name": "hasLine", "type": "1:N", "target": "RequisitionLine", "fk": "requisitionId"}
  ],
  "invariants": ["axiom references from ontology.md that constrain this entity"]
}
```

## Rules
- Use the controlled vocabularies from `model/ontology.md` section 4 for every enum (reference by ENUM_ID; do not invent new value sets).
- `label` must be the correct domain term (Goods Receipt not delivery confirmation, etc.) - this feeds the copy layer.
- `purpose` is mandatory on every field - this is the "every field has intent" mandate made concrete.
- `isAuto` true means the field is system-set and never blocks stage progression (per axiom A2).
- Money fields carry currency; amounts also have a base-currency computed sibling where they drive thresholds/analytics (axiom A12).
- Every entity lists its `invariants` referencing the ontology axioms (A1-A21) that apply.
- Reference fields name the target entity AND the display field (what the dropdown/normalizer shows).
- Optional per-field attribute `hiddenForRoles: RoleId[]` (e.g. `["quality"]`): the named roles are denied visibility of this field; the server strips the field from responses for those roles and the client omits it from form renders and table columns (axiom A17). Applies to commercial fields (price, PO value, landed cost, payment terms, internalTargetPrice) for the Quality role. Listed in the entity `description` header for each affected entity.

## Controlled vocabulary ids (from ontology.md section 4)
RequisitionCategory, PurchaseDirection, PurchaseType, Priority, RequisitionStage, RequisitionStatus, CompletionStatus, SupplierStatus, ItemStatus, InstallmentStatus, PaymentTerms, Incoterm, TransportMode, DeliveryStatus, MatchType, MatchExceptionType, MatchResolution, ItemSourceType, ReturnReason, SupplierClassification, RiskTier, TradeProgram, ScorecardGrade, TaxType, Currency, AuditCategory.

## Entity coverage (one file each)
Requisition, RequisitionLine, ApprovalStageCompletion, RoutingRule, RFQ, Quotation, QuotationLine, Contract, FrameworkAgreement, CallOffRelease, PurchaseOrder, POLine, Supplier, SupplierAddress, SupplierAddressTaxDetail, SupplierGroup, Item, ItemSourcePriority, GoodsReceipt, PartialDeliveryBlock, Inspection, NCR, CorrectiveAction, Return, Invoice, MatchResult, MatchException, Payment, PaymentSchedule, Installment, CreditDebitNote, AdvancePayment, Retention, PaymentMilestone, Budget, Commitment, GrIrEntry, Currency, PaymentTerms, TaxCode, Project, Category, UoM, Warehouse, AssetProposal, User, Role, Permission, Designation, BusinessUnit, FieldConfig, Forecast, SupplierScorecard, AuditLog.

### New entities added for gap-closure (G1-G7, 2026-06-01)
- **Inventory** (13-inventory-replenishment): stock-on-hand balance per item x warehouse; the reorder worklist source.
- **StockMovement** (13-inventory-replenishment): immutable ledger of every stock change (RECEIPT/ISSUE/ADJUSTMENT/TRANSFER); GRN posts RECEIPT.
- **SupplierQualification** (06-supplier-onboarding): material-type qualification result per supplier; gates ONBOARDED.
- **HygieneAudit** (06-supplier-onboarding): scored area-based hygiene audit (~7 areas, 0-3 per area, average determines outcome).
- **RetentionSample** (06-supplier-onboarding): per-batch physical retention sample register for API/raw suppliers.
- **QualityAgreement** (06-supplier-onboarding): signed quality agreement; mandatory gate for ONBOARDED.
- **QualificationMatrix** (06-supplier-onboarding): reference master mapping material type to required certification set (food-agro/packing-material/api-raw).
