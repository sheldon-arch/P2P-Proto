// AUTO-GENERATED from build-spec/data-dictionary/*.json. Do not hand-edit.
import * as E from "./enums";

/** A prepayment made against a PO before any invoice exists, driven by an advance payment term agreed at acknowledgement (e.g. 100% advance, pa */
export interface AdvancePayment {
  identifier: string;  // Advance Ref.
  poId: string;  // Purchase Order
  supplierId: string;  // Supplier
  currency: string;  // Currency
  amount: number;  // Advance Amount
  recoupedAmount?: number;  // Recouped Amount
  outstandingAmount: number;  // Outstanding Advance
  status: ("requested" | "paid" | "recouped");  // Status
  recoupedAgainstInvoiceIds?: string[];  // Recouped Against Invoices
  paymentId?: string;  // Disbursing Payment
  createdAt: string;  // Created At
}

/** The per-stage completion record (RA VerticalCompletion) for one stage of a record's approval chain. One per configured stage (REQ_DEPARTMENT */
export interface ApprovalStageCompletion {
  completionId: string;  // Completion No.
  recordId: string;  // Record
  stage: string;  // Approval Stage
  completionStatus: E.CompletionStatus;  // Stage Status
  assignedToId?: string;  // Assigned To
  approvalRequestedToId?: string;  // Approval Requested To
  approverLimit?: number;  // Approver Limit
  isAutoApproved: boolean;  // Auto-Approved
  approvedById?: string;  // Approved By
  approvedAt?: string;  // Approved At
  revertedCount: number;  // Reverted Count
}

/** A finance-master record proposing a capital asset for acquisition, classified for the fixed-asset register. It uses a composite natural key  */
export interface AssetProposal {
  financeBook: string;  // Finance Book
  assetClassCode: string;  // Asset Class
  proposalNo: string;  // Proposal No.
  description: string;  // Asset Description
  estimatedCost: number;  // Estimated Cost
  estimatedCostInBase: number;  // Estimated Cost (Base Currency)
  status: ("DRAFT" | "APPROVED" | "CAPITALIZED" | "REJECTED");  // Status
}

/** The immutable, append-only, queryable record of every significant action with field-level change detail (RA buildUpdateMetadata recursive hu */
export interface AuditLog {
  auditId: string;  // Audit Entry No.
  category: E.AuditCategory;  // Category
  actorId: string;  // Actor
  action: string;  // Action
  entityType: string;  // Entity Type
  entityId: string;  // Entity
  fieldDiffs?: unknown[];  // Field Changes
  reason?: string;  // Reason / Note
  timestamp: string;  // Timestamp
}

/** The funds allotted to a cost center or project for a period, with running available, committed, and actual balances. Soft-checked at requisi */
export interface Budget {
  identifier: string;  // Budget Ref.
  costCenterId: string;  // Cost Center / Project
  period: string;  // Period
  currency: string;  // Currency
  amount: number;  // Budget Amount
  availableAmount: number;  // Available Amount
  committedAmount: number;  // Committed Amount
  actualAmount: number;  // Actual Amount
  overCommitAllowed: boolean;  // Over-Commit Allowed
  createdAt: string;  // Created At
}

/** An access-master record for a business unit / vertical / department. It is the reference target for a user's department and a requisition's  */
export interface BusinessUnit {
  businessUnitId: string;  // Business Unit No.
  name: string;  // Business Unit Name
  code: string;  // Code
  type: ("DEPARTMENT" | "VERTICAL" | "SITE");  // Type
  permissions?: string[];  // Permissions
  parentId?: string;  // Parent Unit
  status: ("ACTIVE" | "INACTIVE");  // Status
}

/** A release of a requisition against an active FrameworkAgreement (SCOR S1.3/OE6), the framework call-off branch of sourcing that bypasses the */
export interface CallOffRelease {
  releaseId: string;  // Call-Off Release No.
  frameworkAgreementId: string;  // Framework Agreement
  requisitionId: string;  // Requisition
  quantity: number;  // Released Quantity
  agreedPrice: number;  // Agreed Unit Price
  value: number;  // Released Value
  valueInBase: number;  // Released Value (Base Currency)
  paymentTerms: E.PaymentTerms;  // Payment Terms
  deliveryTerms?: string;  // Delivery Terms
  incoterm?: E.Incoterm;  // Incoterm
  releasedAt?: string;  // Released At
  status: ("RELEASED" | "PO_READY" | "ORDERED" | "CANCELLED");  // Status
}

/** A petty-cash allotment held by a buyer/handler for local on-the-spot purchases that run with no PO. A cash buy deducts the price from the ba */
export interface CashFloat {
  identifier: string;  // Float Ref.
  handlerId: string;  // Cash Handler
  floatAmount: number;  // Float Allotment
  balance: number;  // Current Balance
  currency: string;  // Currency
  reimbursementThreshold: number;  // Reimbursement Threshold
  cashGrnNoPoRef: boolean;  // Cash GRN (No PO)
  status: ("ACTIVE" | "INACTIVE");  // Status
  lastReimbursedAt?: string;  // Last Reimbursed At
}

/** An item-master classification record (Category/Segment). It uses a composite natural key (classType + classCode + classDesc) and carries seg */
export interface Category {
  classType: string;  // Class Type
  classCode: string;  // Class Code
  classDesc: string;  // Class Description
  segment?: string;  // Segment
  subSegment?: string;  // Sub-Segment
  requisitionCategory?: E.RequisitionCategory;  // Requisition Category
  status: ("ACTIVE" | "INACTIVE");  // Status
}

/** An encumbrance created when a PO is issued: it reduces the budget's available amount and increases its committed amount, reserving funds aga */
export interface Commitment {
  identifier: string;  // Commitment Ref.
  budgetId: string;  // Budget
  poId: string;  // Purchase Order
  currency: string;  // Currency
  amount: number;  // Committed Amount
  relievedAmount?: number;  // Relieved Amount
  status: ("committed" | "partially-relieved" | "relieved");  // Status
  createdAt: string;  // Committed At
  relievedAt?: string;  // Relieved At
}

/** The captured agreement that results from awarding a supplier in sourcing (SCOR S1.10, OE6). It locks the awarded supplier and quotation as t */
export interface Contract {
  contractId: string;  // Contract No.
  supplierId: string;  // Supplier
  requisitionId?: string;  // Requisition
  awardedQuotationId?: string;  // Awarded Quotation
  terms: string;  // Agreed Terms
  scopeOfWork?: string;  // Scope of Work
  agreedPrices: unknown[];  // Agreed Price List
  validityStart: string;  // Validity Start
  validityEnd: string;  // Validity End
  renewalDate?: string;  // Renewal Date
  renewalReminderSentAt?: string;  // Renewal Reminder Sent At
  status: ("DRAFT" | "ACTIVE" | "EXPIRED" | "RENEWED" | "TERMINATED");  // Status
}

/** The CAPA record (ISO 10.2 corrective action) the buyer opens with a supplier, usually via a SCAR (Supplier Corrective Action Request), when  */
export interface CorrectiveAction {
  identifier: string;  // CAPA / SCAR No.
  ncrId: string;  // Source NCR
  supplierId: string;  // Supplier
  rootCause: string;  // Root Cause
  action: string;  // Corrective Action
  preventiveAction: string;  // Preventive Action
  targetDate: string;  // Target Date
  evidence?: string[];  // Evidence
  effectivenessReview?: ("pending" | "effective" | "not-effective");  // Effectiveness Review
  isSCAR: boolean;  // Is SCAR
  status: ("open" | "action-proposed" | "under-review" | "closed" | "re-opened");  // Status
  feedsReEvaluationAt?: string;  // Re-evaluation Fed At
}

/** An adjustment document that corrects a payable without re-issuing the invoice. A credit note (supplier-issued) reduces the payable; a debit  */
export interface CreditDebitNote {
  identifier: string;  // Note Ref.
  type: ("credit" | "debit");  // Note Type
  supplierId: string;  // Supplier
  linkedInvoiceId?: string;  // Linked Invoice
  linkedReturnId?: string;  // Linked Return
  linkedMatchExceptionId?: string;  // Linked Match Exception
  currency: string;  // Currency
  amount: number;  // Note Amount
  taxAmount?: number;  // Tax Amount
  reason: string;  // Reason
  postedToLedger: boolean;  // Posted to Ledger
  createdById: string;  // Raised By
  createdAt: string;  // Created At
}

/** The per-supplier payables view: the running amount owed, the supplier's payment terms, and a chronological transaction history of invoices,  */
export interface CreditorLedger {
  supplierId: string;  // Supplier
  supplierName: string;  // Supplier Name
  currency: string;  // Currency
  amount: number;  // Amount Owed
  paymentTerms: E.PaymentTerms;  // Payment Terms
  transactionHistory?: unknown[];  // Transaction History
  overdueAmount: number;  // Overdue Amount
  lastUpdatedAt: string;  // Last Updated At
}

/** A configured transaction/reporting currency master. One currency is flagged base; every money amount across the model is normalized to that  */
export interface Currency {
  isoCode: string;  // Currency Code
  name: string;  // Currency Name
  symbol?: string;  // Symbol
  isBase: boolean;  // Base Currency
  decimals: number;  // Decimal Places
  status: ("ACTIVE" | "INACTIVE");  // Status
}

/** An access-master record for a job seniority level. There are 7 ranks; the rank drives the 'same-or-higher rank' eligibility check for assign */
export interface Designation {
  designationId: string;  // Designation No.
  name: string;  // Designation Name
  rank: number;  // Rank
  permissions?: string[];  // Permissions
}

/** An access-master record from the dynamic field engine (RA FIELDS_CONFIG). It defines an admin-configured field by stage, scope (ticket/item/ */
export interface FieldConfig {
  fieldConfigId: string;  // Field Config No.
  fieldName: string;  // Field Key
  label: string;  // Display Label
  dataType: ("string" | "number" | "decimal" | "date" | "boolean" | "reference" | "enum" | "attachment");  // Data Type
  stage: E.RequisitionStage;  // Stage
  scope: ("TICKET_LEVEL" | "ITEM_LEVEL" | "BLOCK_LEVEL");  // Scope
  purchaseType: E.PurchaseType[];  // Purchase Type
  mandatory: boolean;  // Mandatory
  isAuto: boolean;  // Auto Field
  showHistory?: boolean;  // Track History
  referenceEntity?: ("project" | "vertical" | "user" | "supplier" | "item" | "ticket-item");  // Reference Entity
}

/** A demand-record (DemandRecord) holding a manual, procurement-only forecast entry: an expected quantity for an item in a month or quarter. Fr */
export interface Forecast {
  forecastId: string;  // Forecast No.
  itemId: string;  // Item
  periodType: ("MONTH" | "QUARTER");  // Period Type
  period: string;  // Period
  quantity: number;  // Forecast Quantity
  actualQuantity?: number;  // Actual Quantity
  variancePercent?: number;  // Variance %
  varianceFlag?: boolean;  // Variance Flag
}

/** A blanket/framework order with a supplier for repeat or indirect buys (SCOR S1.3/OE6). It fixes agreed prices and terms and sets a total-val */
export interface FrameworkAgreement {
  frameworkAgreementId: string;  // Framework Agreement No.
  supplierId: string;  // Supplier
  validityStart: string;  // Validity Start
  validityEnd: string;  // Validity End
  agreedPrices: unknown[];  // Agreed Prices
  currency: string;  // Currency
  totalValueCeiling?: number;  // Total Value Ceiling
  totalQuantityCeiling?: number;  // Total Quantity Ceiling
  consumedValue?: number;  // Consumed Value
  consumedQuantity?: number;  // Consumed Quantity
  status: ("DRAFT" | "ACTIVE" | "EXHAUSTED" | "EXPIRED" | "TERMINATED");  // Status
}

/** The Goods Receipt Note (GRN) raised by Receiving when materials are physically received and QC-passed against a PO and its originating requi */
export interface GoodsReceipt {
  grnNumber: string;  // GRN No.
  poReference: string;  // Purchase Order
  requisitionReference: string;  // Requisition
  supplierId: string;  // Supplier
  receivedLines: unknown[];  // Received Lines
  receivedQty: number;  // Total Received Quantity
  receiptDate: string;  // GRN Date
  receivingStore: string;  // Receiving Store
  coaAttached: boolean;  // COA Received
  erpGrNumber?: string;  // ERP GR Number
  qcDecision?: ("approve" | "reject");  // QC Decision
  raisedBy: string;  // Raised By
  grnDate: string;  // Raised At
}

/** A goods-received / invoice-received clearing entry, the accounting backbone of the three-way match (BUILD NEW; neither source company had it */
export interface GrIrEntry {
  identifier: string;  // GR/IR Entry Ref.
  poLineId: string;  // PO Line
  grnId: string;  // Goods Receipt
  invoiceId?: string;  // Invoice
  matchResultId?: string;  // Match Result
  accruedAmount: number;  // Accrued Amount
  clearedAmount: number;  // Cleared Amount
  openAmount: number;  // Open Amount
  status: ("accrued" | "partially-cleared" | "cleared");  // Status
  accruedAt: string;  // Accrued At
  clearedAt?: string;  // Cleared At
}

/** The receiving-inspection / verification record (ISO 8.6) that Quality raises against a Goods Receipt on the materials path: it reviews the s */
export interface Inspection {
  identifier: string;  // Inspection No.
  grnId: string;  // Goods Receipt
  requisitionReference: string;  // Requisition
  supplierId: string;  // Supplier
  coaReceived: boolean;  // COA Received
  msdsReceived?: boolean;  // MSDS Received
  sampleSent: boolean;  // Sample Sent to QC
  inspectionLevel?: ("skip-lot" | "sampling" | "100%" | "source" | "CoC-only");  // Inspection Level
  qcDecision: ("approve" | "reject");  // QC Decision
  defectQuantity?: number;  // Defect Quantity
  inspectionNotes?: string;  // Inspection Notes
  testAttachments?: string[];  // Test Reports
  inspectionDate: string;  // Inspection Date
  inspectorId: string;  // Inspector
}

/** One scheduled payment entry within a PaymentSchedule: an agreed amount due on an event or a fixed date, carried through the maker-approves / */
export interface Installment {
  identifier: string;  // Installment Ref.
  scheduleId: string;  // Payment Schedule
  amount: number;  // Agreed Amount
  dueEvent?: ("after PO" | "against documents" | "on delivery" | "on milestone acceptance");  // Due Event
  date?: string;  // Due Date
  description: string;  // Description
  term: E.PaymentTerms;  // Payment Term
  status: E.InstallmentStatus;  // Status
  approvedAmount?: number;  // Approved Amount
  remainderInstallmentId?: string;  // Remainder Installment
  approvedById?: string;  // Approved By
  approvedAt?: string;  // Approved At
  approvalNote?: string;  // Approval Remarks
  processedAt?: string;  // Processed At
  processedById?: string;  // Processed By
  paymentDate?: string;  // Payment Date
  processNotes?: string;  // Process Notes
  receiptFile?: string;  // Payment Receipt
  originalDate?: string;  // Original Due Date
  rescheduleReason?: string;  // Reschedule Reason
  overdueReminderSent?: boolean;  // Overdue Reminder Sent
}

/** The supplier invoice captured into AP against a PO (diagram 09): its lines carry tax as a first-class attribute, its documents (invoice, pac */
export interface Invoice {
  identifier: string;  // Invoice Ref.
  invoiceNumber: string;  // Supplier Invoice No.
  supplierId: string;  // Supplier
  poId: string;  // Purchase Order
  invoiceDate: string;  // Invoice Date
  currency: string;  // Currency
  lines: unknown[];  // Invoice Lines
  amount: number;  // Net Amount
  taxAmount: number;  // Tax Amount
  totalInclTax: number;  // Total (Incl. Tax)
  totalInclTaxInBase: number;  // Total Incl. Tax (Base)
  documents: unknown[];  // Documents
  duplicateKey: number;  // Duplicate Key
  reverseCharge?: boolean;  // Reverse Charge / Import VAT
  approvedBy?: string;  // Approved By
  captureDate: string;  // Capture Date
  status: ("captured" | "on-hold" | "matched" | "exception" | "approved" | "released" | "rejected");  // Status
}

/** The catalog master for a purchasable material, spare, or product-design item. Carries a configurable structured code, an auto-populated desc */
export interface Item {
  code: string;  // Item Code
  runningNumber: number;  // Running Number
  shortDescription: string;  // Short Description
  description: number;  // Description
  status: E.ItemStatus;  // Status
  stockUom: string;  // Stock UoM
  purchaseUom: string;  // Purchase UoM
  segmentId?: string;  // Segment
  subSegmentId?: string;  // Sub-Segment
  categoryId?: string;  // Category / Finished-Product Category
  hsCode?: string;  // HS Code
  standardSupplierId?: string;  // Standard Supplier
  regulatedItem?: boolean;  // Regulated Item
  isErpSynced?: boolean;  // ERP Synced
}

/** An ordered sourcing-preference entry for an item: which source type (manufactured, purchased, subcontracted, stock-transfer) to use and at w */
export interface ItemSourcePriority {
  itemId: string;  // Item
  priority: number;  // Priority
  sourceType: E.ItemSourceType;  // Source Type
}

/** The normalized total cost of a quotation laid down at the buyer's door, computed by the system per quote so that quotes (which differ on inc */
export interface LandedCost {
  landedCostId: string;  // Landed Cost No.
  quotationId: string;  // Quotation
  quote: number;  // Quote Price
  freight?: number;  // Freight
  insurance?: number;  // Insurance
  duty?: number;  // Customs Duty
  exemption?: number;  // Duty Exemption
  localPOD?: number;  // Local Charges at POD
  localPOL?: number;  // Local Charges at POL
  customsClearance?: number;  // Customs Clearance
  demurrage?: number;  // Demurrage / Storage
  misc?: number;  // Miscellaneous
  documentation?: number;  // Documentation
  damage?: number;  // Damage (tracked separately)
  averagingFallbackUsed?: unknown;  // Averaging Fallback Used
  landedTotal: number;  // Landed Total
  landedTotalInBase: number;  // Landed Total (Base Currency)
}

/** A typed exception raised when a MatchResult falls outside any tolerance band (or the duplicate pre-check fires). Each exception carries one  */
export interface MatchException {
  identifier: string;  // Exception Ref.
  matchResultId: string;  // Match Result
  type: E.MatchExceptionType;  // Exception Type
  routedTo: ("Buyer" | "Receiving" | "TaxCompliance" | "FinanceMaker");  // Routed To
  variance?: number;  // Variance
  resolution?: E.MatchResolution;  // Resolution
  resolvedBy?: string;  // Resolved By
  resolutionNote?: string;  // Resolution Note
  linkedNoteId?: string;  // Credit / Debit Note
  resolvedAt?: string;  // Resolved At
}

/** The reconciliation record for one invoice against its PO and (if a GRN exists) its GRN. It records the match type selected by GRN existence  */
export interface MatchResult {
  identifier: string;  // Match Ref.
  poId: string;  // Purchase Order
  grnId?: string;  // Goods Receipt
  invoiceId: string;  // Invoice
  matchType: E.MatchType;  // Match Type
  matchStatus: ("unmatched" | "matched" | "exception");  // Match Status
  tolerancePricePercent: number;  // Price Tolerance %
  toleranceQtyPercent: number;  // Quantity Tolerance %
  toleranceAbsolute: number;  // Absolute Tolerance
  taxInclusive: boolean;  // Tax-Inclusive
  expectedTotalInclTax: number;  // Expected Total (Incl. Tax)
  matchedAt?: string;  // Matched At
}

/** The Non-Conformance Report (ISO 8.7 control of nonconforming outputs) raised when a received lot fails QC at receiving inspection or when da */
export interface NCR {
  id: string;  // NCR No.
  grnId?: string;  // Goods Receipt
  inspectionId?: string;  // Inspection
  itemId: string;  // Item
  supplierId: string;  // Supplier
  deliveryNoteNumber: string;  // Delivery Note No.
  deliveryDate: string;  // Delivery Date
  description: string;  // Description of Non-Compliance
  percentNonConformance: number;  // % Non-Conformance
  image?: string[];  // Evidence Image
  raisedBy: string;  // Raised By
  disposition?: ("return" | "rework" | "use-as-is-concession" | "scrap");  // Disposition
  decidingAuthority?: string;  // Deciding Authority
  status: ("raised" | "dispositioned" | "closed");  // Status
}

/** A single ordered line on a PurchaseOrder: one item (or free-text service deliverable) with quantity, agreed price, quantity tolerance, and t */
export interface POLine {
  poId: string;  // Purchase Order
  itemId?: string;  // Item
  description: string;  // Description
  quantity: number;  // Quantity
  unitOfMeasure: string;  // Unit of Measure
  agreedPrice: number;  // Agreed Price
  tolerancePercent?: number;  // Quantity Tolerance %
  taxCodeId?: string;  // Tax Code
  taxableAmount: number;  // Taxable Amount
  taxAmount: number;  // Tax Amount
  lineValue: number;  // Line Value
}

/** One inbound-consignment record (one block per arriving shipment) that captures the manual inbound-logistics tracking layer (transport mode,  */
export interface PartialDeliveryBlock {
  grnId?: string;  // Goods Receipt
  transportMode: E.TransportMode;  // Transport Mode
  carrier?: string;  // Carrier / Line Name
  courierCargo?: string;  // Courier / Cargo
  trackingNumber_MAWB_HAWB?: string;  // Tracking / AWB-BL Reference
  eta: string;  // ETA
  etaAlarmLeadDays?: number;  // ETA Alarm Lead (days)
  boeNumber?: string;  // Bill of Entry / Bayan No.
  clearanceBy?: string;  // Cleared By (Agent)
  homeMOOWR?: boolean;  // Bonded / MOOWR
  actualDeliveryDate: string;  // Actual Delivery Date
  erpGrNumber?: string;  // ERP GR Number
  erpCcNumber?: string;  // ERP CC Number
  itemsDelivery?: unknown[];  // Items Delivered
  deliveryStatus?: number;  // Delivery Status
}

/** The settlement record that pays a supplier (or cash handler) against a matched, approved invoice or an acknowledged PO advance term. It owns */
export interface Payment {
  identifier: string;  // Payment Ref.
  supplierId: string;  // Supplier
  poId?: string;  // Purchase Order
  invoiceId?: string;  // Invoice
  currency: string;  // Currency
  totalAmount: number;  // Payment Total
  totalAmountPaid: number;  // Amount Paid
  upcomingPaymentAmount: number;  // Upcoming Amount
  overduePaymentAmount: number;  // Overdue Amount
  withholdingTaxCodeId?: string;  // Withholding Tax Code
  withholdingTaxAmount?: number;  // Withholding Tax
  advanceRecoupedAmount?: number;  // Advance Recouped
  retentionWithheldAmount?: number;  // Retention Withheld
  netReleaseAmount: number;  // Net Release
  purchaseChannel: ("credit" | "advance" | "cash");  // Payment Channel
  destination: ("supplier" | "cashHandler");  // Release Destination
  realizedFxGainLoss?: number;  // Realized FX Gain/Loss
}

/** A deliverable checkpoint on a service or contract PO whose acceptance releases the associated payment. For service POs there is no goods rec */
export interface PaymentMilestone {
  identifier: string;  // Milestone Ref.
  poId: string;  // Purchase Order
  description: string;  // Description
  dueEvent: string;  // Due Event
  amount: number;  // Milestone Amount
  currency: string;  // Currency
  acceptanceStatus: ("pending" | "accepted" | "rejected");  // Acceptance Status
  paymentReleaseOnAcceptance: boolean;  // Release Payment on Acceptance
  acceptedById?: string;  // Accepted By
  acceptedAt?: string;  // Accepted At
  linkedInstallmentId?: string;  // Linked Installment
}

/** The fixed plan of installment entries that a Payment must settle, built from the agreed PaymentTerms when the supplier/PO is finalised. It o */
export interface PaymentSchedule {
  identifier: string;  // Schedule Ref.
  paymentId: string;  // Payment
  poId?: string;  // Purchase Order
  terms: E.PaymentTerms;  // Payment Terms
  currency: string;  // Currency
  totalAmount: number;  // Schedule Total
  locked: boolean;  // Schedule Locked
  financialRevertOnEdit: boolean;  // Reverts Finance Approval on Edit
  createdAt: string;  // Created At
}

/** A finance-master record defining when payment is due relative to delivery, documents, or shipment. The locked term set is the seven business */
export interface PaymentTerms {
  code: string;  // Payment Term Code
  label: string;  // Payment Term
  termType: E.PaymentTerms;  // Term Type
  advancePercent?: number;  // Advance %
  netDays?: number;  // Net Days
  triggerEvent: ("ORDER" | "DOCUMENTS" | "SHIPMENT" | "INVOICE" | "DELIVERY" | "MILESTONE");  // Payment Trigger
  status: ("ACTIVE" | "INACTIVE");  // Status
}

/** An access-master record for a single namespaced permission (resource.action). Permissions are granted from four sources (Role, direct user g */
export interface Permission {
  value: string;  // Permission Value
  description: string;  // Description
  isAdminOnly: boolean;  // Admin Only
  resource?: string;  // Resource
  action?: string;  // Action
}

/** A finance-master record representing a project or cost-center the spend is charged to. A requisition line is chargedTo a project/cost-center */
export interface Project {
  code: string;  // Project / Cost Center Code
  name: string;  // Project / Cost Center Name
  type: ("PROJECT" | "COST_CENTER");  // Type
  status: ("ACTIVE" | "INACTIVE");  // Status
  budgetId?: string;  // Linked Budget
  managerId?: string;  // Budget Owner
}

/** The committed buying instruction issued to an ONBOARDED supplier from an approved requisition and awarded quotation. It hard-commits (encumb */
export interface PurchaseOrder {
  number: string;  // PO No.
  requisitionId: string;  // Requisition Ref
  quotationId: string;  // Quotation Ref
  supplierId: string;  // Supplier
  supplierCode: string;  // Supplier Code
  type: ("item" | "service" | "maintenance" | "freight");  // PO Type
  currency: string;  // Currency
  exchangeRate?: number;  // Exchange Rate
  incoterm: E.Incoterm;  // Incoterm
  scopeOfWork?: string;  // Scope of Work
  termsAndConditions: string;  // Terms and Conditions
  deliveryPlace: string;  // Delivery Place
  deliveryDate: string;  // Delivery Date
  contactPerson: string;  // Contact Person
  isoDocRef?: string;  // ISO Document Ref
  value: number;  // PO Value
  valueInBase: number;  // PO Value (Base Currency)
  acknowledged?: boolean;  // Acknowledged
  status: ("draft" | "awaiting-approval" | "issued" | "acknowledged" | "closed" | "cancelled");  // Status
  editableUntilReceipt?: boolean;  // Editable Until Receipt
  frameworkAgreementId?: string;  // Framework Agreement
  attachments?: string[];  // Attachments
}

/** A supplier's structured response to an RFQ (SCOR S1.8/S1.9). The supplier is the sole editor of its own quote via a unique authenticated lin */
export interface Quotation {
  quotationId: string;  // Quotation No.
  rfqId: string;  // RFQ
  supplierId: string;  // Supplier
  price: number;  // Quoted Price
  currency: string;  // Quote Currency
  paymentTerms: E.PaymentTerms;  // Payment Terms
  deliveryTerms: string;  // Delivery Terms
  incoterm: E.Incoterm;  // Incoterm
  transportMode?: E.TransportMode;  // Transport Mode
  dieCylinderCharges?: number;  // Die / Cylinder Charges
  documentationCharges?: number;  // Documentation Charges
  notes?: string;  // Supplier Notes
  attachments?: string[];  // Attachments
  submittedAt?: string;  // Submitted At
  revisedAt?: string;  // Last Revised At
  status: ("SUBMITTED" | "UNDER_NEGOTIATION" | "REVISED" | "SELECTED" | "REJECTED");  // Status
}

/** One priced line of a supplier's quotation, mapping to one RFQ line item (and thus to one requisition line). Holds the per-line unit price, l */
export interface QuotationLine {
  lineId: string;  // Quote Line No.
  quotationId: string;  // Quotation
  rfqLineRef: string;  // RFQ Line
  itemId?: string;  // Item
  quantity: number;  // Quoted Quantity
  uom: string;  // Unit of Measure
  unitPrice: number;  // Unit Price
  lineTotal: number;  // Line Total
  leadTime?: number;  // Lead Time (days)
  lineNotes?: string;  // Line Notes
}

/** A Request For Quotation floated for an approved requisition during strategic sourcing (SCOR S1.8). One RFQ with an auto reference links ever */
export interface RFQ {
  reference: string;  // RFQ Reference No.
  requisitionId: string;  // Requisition
  invitedSupplierIds: string[];  // Invited Suppliers
  templateVariant: ("Import" | "Local" | "Service");  // Template Variant
  lineItems: unknown[];  // RFQ Line Items
  paymentTermsRequest?: E.PaymentTerms;  // Payment Terms Requested
  deliveryTermsRequest?: string;  // Delivery Terms Requested
  internalTargetPrice?: number;  // Internal Target Price
  sentDate?: string;  // Sent Date
  deadline: string;  // Response Deadline
  status: ("DRAFT" | "SENT" | "RESPONSES_IN" | "AWARDED" | "CANCELLED");  // Status
}

/** The originating demand record: a requester's validated request to buy materials, spares, services, or product-design items. The spine of the */
export interface Requisition {
  identifier: string;  // Requisition No.
  date: string;  // Date of Request
  requesterId: string;  // Requester
  departmentId: string;  // Department
  category: E.RequisitionCategory;  // Category
  directOrIndirect: E.PurchaseDirection;  // Direct / Indirect
  purchaseType: E.PurchaseType;  // Purchase Type
  priority: E.Priority;  // Priority
  currency: string;  // Currency
  projectOrCostCenterId: string;  // Project / Cost Center
  justification?: string;  // Justification / Notes
  stage: E.RequisitionStage;  // Stage
  status: E.RequisitionStatus;  // Status
  totalAmount: number;  // Total Amount
  totalAmountInBase: number;  // Total (Base Currency)
  budgetOverride?: unknown;  // Budget Override
  remarks?: unknown[];  // Activity Log
}

/** A single demand line on a requisition: one item (or service) the requester wants to buy, with quantity, unit price, need date, and supportin */
export interface RequisitionLine {
  requisitionId: string;  // Requisition
  item: string;  // Item
  itemCode?: string;  // Item Code
  hsCode?: string;  // HS Code
  itemDescription: string;  // Item Description
  productUsedFor?: string;  // Product Used For
  quantity: number;  // Quantity
  unitOfMeasure: string;  // Unit of Measure
  unitPrice?: number;  // Unit Price
  lineAmount: number;  // Line Amount
  availableStock?: number;  // Available Stock
  needDate: string;  // Need Date
  lineNote?: string;  // Line Note
  attachments?: string[];  // Attachments
  serviceName?: string;  // Service Name
  itemReferenceNumber?: string;  // Item Reference Number
  contractDuration?: ("3m" | "6m" | "1y" | "2y" | "Custom");  // Contract Duration
}

/** A holdback: a configured percentage of a gross payment withheld at release and paid only when a release condition is met (acceptance, or the */
export interface Retention {
  identifier: string;  // Retention Ref.
  poId?: string;  // Purchase Order
  invoiceId?: string;  // Invoice
  supplierId: string;  // Supplier
  currency: string;  // Currency
  withheldPercent: number;  // Withheld Percent
  withheldAmount: number;  // Withheld Amount
  status: ("withheld" | "released");  // Status
  releaseCondition: ("acceptance" | "warranty");  // Release Condition
  releaseDueDate?: string;  // Release Due Date
  releasedAt?: string;  // Released At
  paymentId?: string;  // Source Payment
}

/** The source-return / RMA record (SCOR S4.1-S4.5) for goods already received from a supplier: initiate, authorize (supplier RMA number), ident */
export interface Return {
  rmaNumber: string;  // RMA No.
  sourceOrderId: string;  // Source Purchase Order
  supplierId: string;  // Supplier
  linkedNcrId?: string;  // Linked NCR
  reason: E.ReturnReason;  // Return Reason
  authorizationStatus: ("requested" | "authorized" | "declined");  // Authorization Status
  supplierRmaNumber?: string;  // Supplier RMA Reference
  quantityToReturn: number;  // Quantity to Return
  productCondition: string;  // Product Condition
  carrier?: string;  // Return Carrier
  returnLabelRef?: string;  // Return Label / Who Pays
  returnTrackingNumber?: string;  // Return Tracking No.
  returnIncoterm?: E.Incoterm;  // Return Incoterm
  shipmentDate?: string;  // Shipment / Pickup Date
  segregationLocation?: string;  // Segregation Location
  creditDebitNoteId?: string;  // Credit / Debit Note
  closureStatus: ("raised" | "authorized" | "blocked" | "in-transit" | "closed");  // Closure Status
}

/** An access-master record naming a set of namespaced permissions. A user references one role; the role's permissions are the primary of the fo */
export interface Role {
  roleId: string;  // Role No.
  name: string;  // Role Name
  description?: string;  // Description
  permissions: string[];  // Permissions
  isSystem: boolean;  // System Role
}

/** An access-master configuration row (RA RoutingRuleEntry) that maps a department and an approval stage (vertical) to the pool of users who ca */
export interface RoutingRule {
  ruleId: string;  // Routing Rule No.
  departmentId: string;  // Department
  stage: string;  // Stage / Vertical
  category?: E.RequisitionCategory;  // Category Scope
  recordType?: ("Requisition" | "PurchaseOrder" | "Award" | "Supplier" | "PaymentSchedule");  // Record Type Scope
  valueBandMin?: number;  // Value Band From
  valueBandMax?: number;  // Value Band To
  assigneeUserIds?: string[];  // Assignee Pool
  approverUserIds: string[];  // Approver Pool
  approverLimits?: unknown[];  // Per-Approver Limits
  allowAutoApproval: boolean;  // Allow Auto-Approval
  requiredDesignationRank?: number;  // Required Designation Rank
  siteCondition?: unknown;  // Site / Conditional Rule
  isActive: boolean;  // Active
}

/** The party master for an external (or internal) vendor the organization buys from. Carries identity, currency and commercial terms, the quali */
export interface Supplier {
  code: string;  // Supplier Code
  name: string;  // Supplier Name
  currency: string;  // Currency
  dealCurrency?: string;  // Deal Currency
  classification: E.SupplierClassification;  // Classification
  groupId?: string;  // Supplier Group
  status: E.SupplierStatus;  // Status
  paymentTerms?: E.PaymentTerms;  // Payment Terms
  vendorRegistration?: string;  // Vendor Registration
  threeBatchCOA?: string[];  // Three-Batch COA
  certifications?: unknown[];  // Certifications
  avlScopeOfApproval?: string;  // AVL Scope of Approval
  avlGrade?: E.ScorecardGrade;  // AVL Grade
  riskTier?: E.RiskTier;  // Risk Tier (ISO 31000)
  securityTradeProgram?: E.TradeProgram;  // Security Trade Program (ISO 28000)
  continuity?: unknown;  // Business Continuity (ISO 22301)
  sustainabilityESG?: unknown;  // Sustainability / ESG (ISO 20400)
  iso14001?: unknown;  // Environmental Cert (ISO 14001)
  infoSecDPA?: unknown;  // Information Security / DPA (ISO 27001)
  antiBriberyDDscreening?: unknown;  // Anti-Bribery Due Diligence / Screening (ISO 37001)
  isErpSynced?: boolean;  // ERP Synced
  minimumOrderValue?: number;  // Minimum Order Value
  advancePayable?: boolean;  // Advance Payable
  advanceTolerance?: number;  // Advance Tolerance
  autoInvoicing?: boolean;  // Auto-Invoicing
}

/** A postal address belonging to a supplier (registered office, billing, shipping, or plant). A supplier has at least one; addresses are replac */
export interface SupplierAddress {
  supplierId: string;  // Supplier
  addressCode: string;  // Address Code
  line1: string;  // Address Line 1
  line2?: string;  // Address Line 2
  line3?: string;  // Address Line 3
  city: string;  // City
  state: string;  // State / Province
  zip: string;  // Postal Code
  country: string;  // Country
  gstin?: string;  // GSTIN
  pan?: string;  // PAN
}

/** Per-address tax registration detail for a supplier: the tax registration number and the state/region code (padded to two digits) for the jur */
export interface SupplierAddressTaxDetail {
  supplierAddressId: string;  // Supplier Address
  taxRegistration: string;  // Tax Registration Number
  stateCode: string;  // State / Tax Region Code
  taxRegion?: string;  // Tax Region
}

/** A reference grouping for suppliers (commercial group, category, or parent organization) that suppliers are bucketed into for consolidated sp */
export interface SupplierGroup {
  name: string;  // Group Name
  description?: string;  // Description
}

/** An Insight record: the computed performance scorecard for one supplier in one period (month/quarter). Built by the two-stage analytics engin */
export interface SupplierScorecard {
  scorecardId: string;  // Scorecard No.
  supplierId: string;  // Supplier
  period: string;  // Period
  qualityScore: number;  // Quality Score
  deliveryScore: number;  // Delivery Score
  costScore: number;  // Cost Score
  responsivenessScore: number;  // Responsiveness Score
  weights: unknown;  // Dimension Weights
  composite: number;  // Composite Score
  grade: E.ScorecardGrade;  // Grade
  complianceGate: boolean;  // Compliance Gate Passed
  avlStatus: ("Approved" | "Conditional" | "Preferred" | "Suspended" | "Disqualified");  // AVL Status
  otifTwoFactor: number;  // OTIF (Two-Factor)
  perfectOrderFourFactor: unknown;  // Perfect Order (Four-Factor)
}

/** A finance-master record defining a tax rate by type and jurisdiction, and whether the tax is recoverable (input-credit eligible). Built new  */
export interface TaxCode {
  code: string;  // Tax Code
  type: E.TaxType;  // Tax Type
  rate: number;  // Rate %
  jurisdiction: string;  // Jurisdiction
  recoverable: boolean;  // Recoverable (Input Credit)
  isReverseCharge?: boolean;  // Reverse Charge
  status: ("ACTIVE" | "INACTIVE");  // Status
}

/** A logistics-master record for a unit of measure. The uom code is the natural key; an item carries a stockUom and a purchaseUom, and a requis */
export interface UoM {
  uom: string;  // Unit of Measure
  fullForm: string;  // Full Form
  category: ("Volume" | "Weight" | "Length" | "Area" | "Quantity" | "Commercial");  // Category
  status: ("ACTIVE" | "INACTIVE");  // Status
}

/** A platform/party-master record for a person who can authenticate and act in the system. Pre-seeded (sign-up disabled); authenticates by emai */
export interface User {
  userId: string;  // User No.
  email: string;  // Email
  name: string;  // Name
  status: ("ACTIVE" | "INACTIVE");  // Status
  departmentId: string;  // Department
  designationId: string;  // Designation
  businessUnitId?: string;  // Business Unit / Vertical
  roleId: string;  // Role
  userPermissions?: string[];  // Direct Permissions
  approvalLimit?: number;  // Approval Limit
}

/** A logistics-master record for a warehouse / store / site (e.g. Barka, Vadi Kabir). The code is the natural key; a requisition line and goods */
export interface Warehouse {
  code: string;  // Warehouse Code
  name: string;  // Warehouse Name
  location: string;  // Site / Location
  type?: ("STORE" | "FACTORY" | "TRANSIT" | "BONDED");  // Type
  status: ("ACTIVE" | "INACTIVE");  // Status
}

