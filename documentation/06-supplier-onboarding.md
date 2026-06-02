# 06 Supplier Onboarding and Qualification - Unified Procure-to-Pay / Source-to-Pay

- **BPMN file:** 06-supplier-onboarding.bpmn

## Scope, trigger, outcome
- **Scope:** Bringing a supplier from creation to ONBOARDED through the full qualification package (registration, tax, certifications, AVL scope/grade, the cross-standard ISO attribute set), via the single-record and bulk-import paths, then the post-onboarding lifecycle: edit (revert to approval), suspend, restore, offboard. A supplier must be ONBOARDED before any RFQ award or PO.
- **Trigger:** Sourcing (Diagram 04) needs a supplier not yet in the master, or an admin/buyer adds one proactively, or a supplier inquiry is recorded.
- **Outcome:** Supplier reaches ONBOARDED (orderable), SUSPENDED-then-restored (orderable), or OFFBOARDED (terminal, not orderable). ONBOARDED suppliers feed Diagram 04 (sourcing) and Diagram 05 (PO gate).

## Actors (lanes)
- **Procurement / Buyer** (`L_buyer`): creates suppliers, uploads imports, uploads qualification docs, requests approval, edits, offboards.
- **Supplier / Vendor** (`L_supplier`): completes the registration form and supplies documents via email + OTP (referenced; the external form is the data source).
- **Approver** (`L_appr`): approves the supplier into ONBOARDED.
- **Quality** (`L_qc`): sets AVL scope/grade, reviews certifications and COA, suspends on quality grounds.
- **Tax / Compliance** (`L_tax`): captures tax registration, sets ISO risk/security/continuity/ESG/infosec/anti-bribery attributes, suspends on compliance grounds.
- **Platform / System** (`L_sys`): validates imports, commits transactions, marks onboarded, runs the ERP-sync boundary, routes lifecycle events.

Full role definitions in `model/role-model.md`; permissions in `model/role-permission-matrix.md`.

## Step-by-step narrative
Tags: [SCOR code | ISO clause | source].

1. **New supplier needed** (Buyer, start). A supplier must reach ONBOARDED before any award or PO. [SCOR S1.6 | ISO 8.4.1 | source: AB + RA]
2. **Single record or bulk import?** (Buyer, exclusive). Single form (`suppliers.create`) or file upload (`suppliers.import`). [source: RA]
3. **Create supplier profile** (Buyer). Core field set; status defaults PENDING_ONBOARDING; code auto-generated `S/#####`. [SCOR S1.6 | ISO 8.4.1 | source: RA + data-model]
4. **Capture tax + registration details** (Tax/Compliance). GST/PAN/VAT with regex validation when supplied. [ISO 8.4.1 records | source: RA + multi-country build-new]
5. **Upload qualification documents + certifications** (Buyer/Supplier). Vendor registration, 3-batch COA for OTC/pharma, certifications with expiry, MSDS, permits. [ISO 8.4.1 / 7.5 / 8.4 cert gate | source: AB + platform-services 8]
6. **Set AVL scope-of-approval + grade** (Quality). AVL status, scope, grade, approval date, re-eval date. [ISO 8.4.1 AVL | SCOR BP.097 | source: AB + iso standards]
7. **Set ISO attributes** (Tax/Compliance + Quality + Buyer). Risk (31000), security (28000), continuity (22301), ESG (20400/14001), infosec (27001), anti-bribery (37001); each with last-assessed/next-due/evidence+expiry/CAPA log. [ISO family | SCOR OE9/OE10 | source: iso standards + data-model]
8. **Request approval** (Buyer). Guard status = PENDING_ONBOARDING; status -> PENDING_APPROVAL; SUPPLIER_APPROVAL_REQUESTED notification fires only here. [SCOR S1.6 | ISO 8.4.1 | source: RA]
9. **Review qualification** (Quality + Tax/Compliance). Verify certs/COA/AVL and screening/tax/ISO; deficiencies return to the buyer. [ISO 8.4.1 / 8.4 cert gate | source: AB QC gate]
10. **Qualification complete + approved?** (Approver, exclusive). Approve iff complete; else return. [ISO 8.4.1 | source: RA]
11. **Approve supplier** (Approver). Guard status = PENDING_APPROVAL; status -> ONBOARDED; no notification at approve. [SCOR S1.6 | ISO 8.4.1 | source: RA]
12. **Mark onboarded, optional ERP sync** (System). ERP-sync toggle only when ONBOARDED; later edit reverts to PENDING_APPROVAL and resets the sync flag. [SCOR OE4 | source: RA + platform-services 13]
13. **Post-onboarding lifecycle event** (System, exclusive). Edit, suspend, offboard, or stay onboarded. [source: RA + review SUSPENDED]
14. **Edit supplier** (Buyer). Reverts ONBOARDED/PENDING_APPROVAL to PENDING_APPROVAL; isErpSynced reset; address replace-on-update. [source: RA]
15. **Suspend supplier** (Quality or Tax/Compliance). Guard status = ONBOARDED; blocks new POs without offboarding; CAPA-loop driven. [ISO 8.4.1 re-evaluation | SCOR OE3 | source: review addition]
16. **Suspension resolved?** (Quality, exclusive). Restore to ONBOARDED or terminate (offboard). [ISO 10.2 -> 8.4.1 | source: build-new]
17. **Restore to ONBOARDED** (System). Re-enables PO eligibility; resolution audited. [ISO 8.4.1 | source: build-new]
18. **Offboard supplier** (Buyer). Guard status = ONBOARDED; OFFBOARDED is terminal (soft-delete, retained); no notification. [SCOR S1.6 | ISO 7.5 | source: RA]
19. **Supplier ONBOARDED / OFFBOARDED** (System, end).

### Bulk branch
- **Upload supplier import file** (Buyer). XLSX/CSV; file/sheet/data-row guards. [source: RA + platform-services 7]
- **Validate header + rows** (System). Exact header; per-row validate + resolve refs; accumulate all errors; natural key = code. [source: RA e06]
- **All rows valid?** (System, exclusive). Zero errors -> commit; any error -> one BadRequestException listing every `{rowNumber, reason}`, nothing written. [source: RA e06]
- **Upsert by code in one transaction** (System). All-or-nothing; duplicate keys last-wins; defaults PENDING_ONBOARDING; audit only on commit. [source: RA e06]
- **Imported records join lifecycle** (Buyer). Each still requires docs + attributes + request-approval -> review -> approve. [source: convergence]

## Material-type qualification gate (G2, axiom A18)

For suppliers of food-agro materials, packing materials, or API/raw materials, ONBOARDED requires completion of the material-type qualification package in addition to the standard documents and ISO attributes:

### Qualification matrix (QualificationMatrix entity)
| Material type | Required certifications |
| --- | --- |
| food-agro | FSMS (Food Safety Management System certification), HACCP, ISO 22000 |
| packing-material | Food-grade material declaration, migration-free ink certification, child-resistant packaging certification (where applicable), BSE-TSE declaration |
| api-raw | GMP certification, FDA registration, USP/BP/EP/IP compliance, three-batch COA (Certificate of Analysis), ICH guidelines compliance, retention samples retained |

### Scored hygiene audit (HygieneAudit entity)
The Quality team conducts a scored hygiene audit covering approximately 7 areas (housekeeping, pest control, water/sanitation, personnel hygiene, equipment cleaning, waste management, documentation quality). Each area is scored 0-3 (0 = non-compliant, 1 = partial, 2 = mostly compliant, 3 = fully compliant). The averageScore (sum of area scores divided by count) determines the qualification outcome:
- averageScore >= 1.5: APPROVED; supplier may reach QUALIFIED.
- averageScore 1.0 to < 1.5: PRE_QUALIFIED; conditional approval with additional oversight required; supplier cannot be awarded orders above a configurable value threshold without a re-audit within 6 months.
- averageScore < 1.0: REJECTED; the supplier cannot be ONBOARDED for this material type.

### Retention samples (RetentionSample entity; api-raw suppliers)
For API/raw material suppliers, a physical retention sample from each of the three qualifying batches must be logged in the RetentionSample register. Each sample record carries: batchRef (traceable to the COA), quantity, storage location, and a retainUntil date. The platform alerts Quality 30 days before a retainUntil date. Samples are retained until disposed per the documented disposal SOP (typically 2 years from manufacture or 1 year past shelf life, whichever is later).

### Quality Agreement (QualityAgreement entity)
A signed Quality Agreement (status = ACTIVE, scope covering the material type) is a mandatory gate for ONBOARDED. The agreement covers quality responsibilities, test methods, specification standards, COA requirements, change-notification obligations, and audit rights. An expiring agreement triggers a 30-day renewal alert; an expired agreement may drive the supplier to SUSPENDED.

## Gateways and branches (exact conditions)
- **Single record or bulk import?**: operator chooses single (`suppliers.create`) or bulk (`suppliers.import`).
- **Qualification complete + approved?**: `status = PENDING_APPROVAL AND vendorRegistration present AND required certs valid/unexpired AND (materialType IN {food-agro, packing-material, api-raw} -> SupplierQualification.status IN {QUALIFIED, PRE_QUALIFIED} AND HygieneAudit.outcome IN {APPROVED, PRE_QUALIFIED} AND QualityAgreement.status = ACTIVE AND (api-raw -> RetentionSample records for 3 batches present)) AND AVL scope/grade set AND sanctions/anti-bribery screening clear AND required ISO attributes populated for risk tier` -> approve; else return.
- **All rows valid?**: `accumulated errors = 0` -> commit; else reject whole import.
- **Post-onboarding lifecycle event**: edit -> revert to PENDING_APPROVAL; suspend (failed audit / quality stop / expired ISO cert / sanctions hit / active CAPA) -> SUSPENDED; offboard -> OFFBOARDED; else stay ONBOARDED.
- **Suspension resolved?**: `CAPA effectiveness verified OR cert renewed OR sanctions cleared OR audit passed` -> restore; else terminate (offboard).

## Fields and dropdowns (full detail)

### Core supplier
| Field | Type | M/O | Default | Validation / rule | Owner |
| --- | --- | --- | --- | --- | --- |
| code | string | M (auto) | `S/#####` | `S/` + 5-digit zero-padded counter (max+1); first `S/00001`; configurable prefix/width; immutable; natural key | System |
| name | text | M | - | - | Buyer |
| currency | dropdown | M | configurable first currency | `USD \| OMR \| SAR \| AED \| EUR \| CHF \| INR` | Buyer |
| dealCurrency | dropdown | O | = currency | - | Buyer |
| classification | dropdown | M | - | `Internal \| External` | Buyer |
| group | reference | O | - | SupplierGroup master, natural key = name | Buyer |
| minimumOrderValue | decimal | O | 1 | - | Buyer |
| advancePayable | boolean | O | false | - | Buyer |
| advanceTolerance | decimal | O | 0 | - | Buyer |
| autoInvoicing | boolean | O | false | - | Buyer |
| isErpSynced | boolean | O | false | toggle only when ONBOARDED; reset on every edit | System |
| addresses[] | child | M (>=1) | - | SupplierAddress; state/region code padded to 2 digits; replace-on-update | Buyer |

### Tax / registration
| Field | Type | M/O | Validation |
| --- | --- | --- | --- |
| gstNumber | string | O | regex `^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$` when supplied (India GST) |
| panNumber | string | O | regex `^[A-Z]{5}\d{4}[A-Z]$` when supplied (India PAN) |
| vatNumber / taxRegistrationNumber | string | O | per jurisdiction (e.g. Oman VAT) |
| taxRegion / stateCode | string | O | padded to 2 digits |
| recoverable | boolean | O | input-credit eligibility |

### Qualification documents
| Field | Type | M/O | Rule |
| --- | --- | --- | --- |
| vendorRegistration | file | M | onboarding/registration form (email + OTP) |
| threeBatchCOA | file[] | M for OTC/pharma RM/PM | three batches' COA + samples |
| certifications[] | object[] | M (cert gate) | certType `ISO 9001 \| ISO 14001 \| ISO 45001 \| ISO 22000/HACCP \| GMP \| other`; certNumber, issuingBody, issueDate, expiryDate (M), evidence; expiry alerts on selection + >= 1 week before expiry |
| MSDS | file | M for chemicals | - |
| permits | file[] | M for regulated chemicals | ministry permits with expiry + quantity |

### AVL
| Field | Type | M/O | Value set / rule |
| --- | --- | --- | --- |
| avlStatus | dropdown | M | `Approved \| Conditional \| Suspended \| Disqualified \| Preferred` (default Conditional) |
| scopeOfApproval | text | M | categories/items approved to supply |
| grade | dropdown | M | `A \| B \| C \| D \| F` from composite bands A>=90 / B>=80 / C>=70 / D>=60 / F<=59 (configurable) |
| approvalDate | date | O | - |
| nextReEvalDate | date | O | cadence monthly KPI / quarterly review / annual re-approval (configurable) |

AVL gate: certifications 100% valid AND composite score >= threshold (~80, configurable). Preferred = sustained Grade A.

### ISO attribute set (each group: last-assessed, next-due, evidence/cert + expiry, corrective-action log)
| Standard | Attributes |
| --- | --- |
| ISO 31000 risk | riskCategory, likelihood, impact, inherent vs residual, riskScore, riskTier `low \| medium \| high \| critical`, treatment, owner |
| ISO 28000 security | securityRiskRating, facilityScreening, tradeProgram `none \| C-TPAT \| AEO \| TAPA` + cert# + expiry, sealIntegrity (ISO 17712), incidentRegister |
| ISO 22301 continuity | criticalityFlag, ownBcms, bcPlan, lastTestDate, MTPD, RTO, MBCO, RPO, backupSupplierRegister, dualSourcingCoverage |
| ISO 20400 / 14001 ESG | iso14001Status + expiry + scope, EcoVadis/CDP, ghgData, modernSlaveryStatement, codeOfConductSignoff, conflictMinerals |
| ISO 27001 infosec | dataClassificationAccessed, securityCertStatus + expiry, dpaStatus, incidentLog, cloudAttestations (27017/27018/SOC2) |
| ISO 37001 anti-bribery | briberyRiskRating, dueDiligenceStatus + date, beneficialOwnership/PEP/sanctions screening, antiBriberyClauseSignoff, reScreeningCadence, redFlagLog |

All thresholds, scales, and weights are configurable defaults; ISO prescribes none.

### Suspension
| Field | Type | M/O | Value set |
| --- | --- | --- | --- |
| suspendReason | text | M | - |
| suspendCategory | dropdown | M | `quality \| compliance \| expired-cert \| sanctions \| active-CAPA` |
| reviewDate | date | O | - |

## Edge cases and error handling
- **Wrong-status transition**: request-approval requires PENDING_ONBOARDING; approve requires PENDING_APPROVAL; offboard requires ONBOARDED. Any wrong status raises BadRequestException and leaves the record unchanged.
- **Edit on approved record**: silently recomputes status to PENDING_APPROVAL and resets isErpSynced; pulls the record back into the approval queue.
- **Invalid GST/PAN format**: blocks save with a field error; validated only when a value is supplied.
- **Import errors**: any file/header/row/persistence problem rejects the entire import; even valid rows are not saved; late DB failure rolls back fully (audit not emitted). No file -> "No file uploaded"; header-only -> "No valid data found".
- **Expired certification / sanctions hit / active CAPA**: drives ONBOARDED -> SUSPENDED, blocking new POs without offboarding.
- **ERP-sync toggle off ONBOARDED**: not allowed; the toggle is only valid in ONBOARDED.
- **Offboarded reactivation**: not documented; OFFBOARDED is terminal (record retained for history).

## Business rules and invariants
- Lifecycle: PENDING_ONBOARDING -> PENDING_APPROVAL -> ONBOARDED -> OFFBOARDED (terminal), plus ONBOARDED <-> SUSPENDED.
- For food-agro, packing-material, and api-raw suppliers: ONBOARDED additionally requires a SupplierQualification record with status QUALIFIED or PRE_QUALIFIED, a HygieneAudit with outcome APPROVED or PRE_QUALIFIED, and a signed ACTIVE QualityAgreement scoped to the material type (axiom A18).
- For api-raw suppliers: three-batch COA and RetentionSample records for those three batches must be present before ONBOARDED (axiom A18).
- HygieneAudit averageScore >= 1.5 = APPROVED (QUALIFIED); 1.0 to < 1.5 = PRE_QUALIFIED (gated, conditional); < 1.0 = REJECTED (blocks ONBOARDED for this material type).
- An expired QualityAgreement or a REJECTED hygiene audit re-evaluation drives ONBOARDED -> SUSPENDED for the affected material type.
- The QualificationMatrix is versioned; the version in force at assessment time is stamped on the SupplierQualification record for audit traceability.
- Edit reverts ONBOARDED/PENDING_APPROVAL to PENDING_APPROVAL; isErpSynced reset on every update; ERP-sync toggle only when ONBOARDED.
- SUPPLIER_APPROVAL_REQUESTED notification fires only at request-approval (not at approve/offboard).
- Suspend is split: Quality on a quality stop, Tax/Compliance on a sanctions/compliance hit, Admin always.
- SUSPENDED blocks new POs without offboarding; resolution restores ONBOARDED.
- Certifications are a hard gate (pass/fail) before scoring; AVL records scope-of-approval + grade + dates.
- Bulk import: exact header, accumulate all errors, all-or-nothing, upsert by natural key = code, duplicates last-wins, default PENDING_ONBOARDING, audit only on commit, row numbering header = 1.
- The CAPA-to-re-evaluation loop (Diagram 11) feeds the supplier scorecard and can trigger SUSPENDED.
- Every committed change emits audit (category SUPPLIER) + SSE.

## Cross-references
- Upstream: 04 sourcing (qualification before RFQ award; QC COA/MSDS gate for regulated items).
- Downstream: 05 purchase order (ONBOARDED gate), 11 returns/RMA + CAPA (re-evaluation -> SUSPENDED), 12 analytics (scorecard, AVL gate).
- Related: 07 item onboarding (parallel lifecycle), e06 import all-or-nothing.
- Benchmarks: SCOR S1.6 (Prequalify Suppliers), BP.097 (Supplier Appraisal), OE9 (Risk), OE10 (ESG); ISO 9001 8.4 / 8.4.1 (evaluation, selection, monitoring, re-evaluation, AVL), 7.5 (records), and the family 31000 / 28000 / 22301 / 20400 / 14001 / 27001 / 37001. Sources: `model/data-model.md` (Supplier, SupplierGroup, SupplierAddress, qualification), `model/platform-services.md` (bulk import, document storage, RBAC, notifications, ERP boundary), memory `iso-supply-chain-standards`, `raphe-supplier-item-onboarding`, `raphe-bulk-import`, `albahja-sourcing-rfq-compare`.
