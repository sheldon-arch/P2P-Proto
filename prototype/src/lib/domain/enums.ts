// AUTO-GENERATED from data-dictionary + ontology section 4. Do not hand-edit.

export type RequisitionCategory = "Items" | "Spares" | "Services" | "ProductDesign";
export type PurchaseDirection = "Direct" | "Indirect";
export type PurchaseType = "Local" | "Import";
export type Priority = "ASAP" | "SameDay" | "Within2Days" | "Within1Week";
export type RequisitionStage = "INITIATION" | "ORDERED" | "PARTIAL_DELIVERY" | "POST_DELIVERY";
export type RequisitionStatus = "IN_PROGRESS" | "ON_HOLD" | "CANCELLED" | "COMPLETED";
export type CompletionStatus = "NOT_STARTED" | "IN_PROGRESS" | "READY_FOR_APPROVAL" | "AWAITING_APPROVAL" | "APPROVED";
export type SupplierStatus = "PENDING_ONBOARDING" | "PENDING_APPROVAL" | "ONBOARDED" | "SUSPENDED" | "OFFBOARDED";
export type ItemStatus = "PENDING_ONBOARDING" | "PENDING_APPROVAL" | "ONBOARDED" | "SUSPENDED" | "OFFBOARDED";
export type InstallmentStatus = "PENDING" | "APPROVED" | "PARTIAL_APPROVAL" | "PROCESSED" | "RESCHEDULED";
export type PaymentTerms = "ADVANCE_100" | "PART_ADVANCE_AGAINST_DOCS" | "PART_ADVANCE_AGAINST_SHIPMENT" | "SPLIT_30_70" | "NET_30" | "NET_60" | "NET_90";
export type Incoterm = "EXW" | "FCA" | "FOB" | "CIF" | "CFR" | "CPT" | "CIP" | "DAP" | "DDP";
export type TransportMode = "Air" | "Sea" | "Road" | "Courier";
export type DeliveryStatus = "delivered" | "partial" | "overdue" | "upcoming";
export type MatchType = "TWO_WAY" | "THREE_WAY";
export type MatchExceptionType = "price-variance" | "qty-over" | "qty-under" | "missing-GR" | "duplicate-invoice" | "tax-mismatch";
export type MatchResolution = "accept" | "adjust" | "credit-note" | "debit-note" | "reject";
export type ItemSourceType = "MANUFACTURED" | "PURCHASED" | "SUBCONTRACTED" | "STOCK_TRANSFER";
export type ReturnReason = "defective" | "damaged" | "wrong-item" | "over-delivery" | "expired" | "quality-fail";
export type SupplierClassification = "Internal" | "External";
export type RiskTier = "low" | "medium" | "high" | "critical";
export type TradeProgram = "none" | "C-TPAT" | "AEO" | "TAPA";
export type ScorecardGrade = "A" | "B" | "C";
export type TaxType = "GST" | "VAT" | "duty" | "reverse-charge" | "withholding";
export type AuditCategory = "TICKET" | "SUPPLIER" | "ITEM" | "ADMIN" | "PAYMENT";
