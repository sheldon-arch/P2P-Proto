# e11 Permit and Document Expiry Tracking

- **BPMN file:** e11-permit-expiry.bpmn

## Scope, trigger, outcome
- **Scope:** The expiry-and-quantity tracking for permits and certificates, the on-selection status surfacing, the two alert triggers, the ministry-permit requirement for regulated chemicals, the quantity-or-date consumption rule, and the supplier-suspension feed from a lapsed certificate. It does not cover the full supplier onboarding/qualification flow (06) or the NCR/CAPA loop (11), though it triggers the suspension state those flows also reach.
- **Trigger:** A buyer selects an item on a requisition or PO, or a permit/cert expiry timer fires.
- **Outcome:** The item proceeds with a valid permit attached where required, the order quantity reserved against the permit, expiry alerts armed (on selection and one week before expiry), and supplier compliance enforced by suspending a supplier whose certificate has lapsed.

## Actors (lanes)
- **Procurement / Buyer:** selects the item, attaches the ministry permit, and is the handler alerted on expiry.
- **Quality:** classifies the item as a regulated chemical; may suspend on a lapsed quality certificate.
- **Tax / Compliance:** evaluates certificate expiry and suspends the supplier on a lapsed compliance certificate.
- **Platform / System:** surfaces status, computes consumption, fires alerts, reserves quantity, audits, and notifies.

## Step-by-step narrative
Each step is tagged [SCOR code | ISO clause | source].

1. **Item selected on requisition / PO** (Buyer, start). Documents attach at supplier level and item level; permits and certs carry an expiry date and a quantity allowance. [SCOR OE4 | ISO 7.5 | source: AB].
2. **Surface permit / cert status on selection** (System). Displays status, remaining quantity, expiry date, and days to expiry; fires the first alert (on selection). [SCOR OE4 | ISO 7.5 | source: AB surface-on-selection].
3. **Regulated chemical (solvent / pesticide)?** (Quality, exclusive). Regulated items require a ministry permit on the PO; others need only standard documents. [SCOR OE4 | ISO 8.4.3 | source: AB regulated-chemical].
4. **Permit valid by date AND quantity?** (System, exclusive). A permit is usable only within date and with sufficient remaining quantity; either failing blocks the PO. [SCOR OE4 | ISO 8.4.3 | source: AB consumed by qty OR date].
5. **Block PO; require valid ministry permit** (Buyer). PO issue blocked until a valid permit is attached. [SCOR OE4 | ISO 8.4.3 | source: AB hard requirement].
6. **Attach ministry permit to PO; reserve quantity** (Buyer). Permit attached; order quantity reserved against remaining quantity. [SCOR OE4 | ISO 8.4.3 | source: AB quantity consumption].
7. **Expiry alert >= 1 week before** (System, timer). Second alert at seven days before expiry (and on low remaining quantity), to handler and head. [SCOR OE4 | ISO 7.5 | source: AB two-trigger alert].
8. **Supplier cert expired?** (Tax/Compliance, exclusive). A lapsed certificate feeds suspension; a valid one continues monitoring. [SCOR S1.6 | ISO 8.4.1 | source: AB cert-to-suspension].
9. **Suspend supplier (expired cert)** (Tax/Compliance). ONBOARDED to SUSPENDED; blocks new POs until the certificate is renewed. [SCOR S1.6 | ISO 8.4.1 | source: data-model SUSPENDED + AB].
10. **Audit + notify (handler + head)** (System). Audits permit attach, reservation, alerts, and suspension; notifies; retains documents per ISO 7.5. [SCOR OE4 | ISO 7.5 | source: platform-services].
11. **Compliant item proceeds; alerts armed** (System, end). [SCOR OE4 | source: AB].

## Gateways and branches (exact conditions)
- **Regulated chemical?** True: `item.regulatoryClass in {solvent, pesticide, controlled-chemical}` -> ministry permit required. False -> standard documents.
- **Permit valid by date AND quantity?** True: `today <= permit.expiryDate AND permit.remainingQuantity >= orderQuantity` -> attach. False (expired OR exhausted) -> block.
- **Supplier cert expired?** True: `today > supplierCert.expiryDate` -> suspend. False -> continue.

## Fields and dropdowns (full detail)

| Field | Type | Mandatory | Default | Validation | Owner |
| --- | --- | --- | --- | --- | --- |
| item.regulatoryClass | dropdown {none, solvent, pesticide, controlled-chemical} | mandatory | none | one of set | Quality |
| permit.permitNumber | text | mandatory (regulated) | none | unique | Buyer |
| permit.issuingMinistry | text | mandatory (regulated) | none | free text | Buyer |
| permit.expiryDate | date | mandatory | none | valid date | Buyer |
| permit.totalQuantity | number | mandatory | none | > 0 | Buyer |
| permit.remainingQuantity | number | system | totalQuantity | decremented on issue | System |
| orderQuantity | number | mandatory | none | <= remainingQuantity | Buyer |
| cert.expiryDate | date | mandatory | none | valid date | Tax/Compliance |
| status (computed) | derived {valid, expiring-soon, expired, quantity-exhausted} | system | computed | n/a | System |

## Values, thresholds, and formats
- Permits and certs carry both an expiry date and a quantity allowance.
- Consumption rule: a permit is consumed by quantity OR date, whichever comes first; either condition failing makes it unusable.
- Alert triggers: two, on item selection AND at least one week (7 days) before expiry; recipients are the handler (buyer) and the head. A configurable low-remaining-quantity threshold also fires the alert.
- Regulated chemicals (solvents, pesticides, controlled chemicals) require a ministry permit attached to the PO before issue.
- A lapsed supplier certificate is one of the suspension triggers (failed audit, expired cert, sanctions, active CAPA).

## Edge cases and error handling
- **Permit within date but exhausted.** Treated as unusable; the PO is blocked until a new or topped-up permit is attached.
- **Permit with quantity but expired.** Treated as unusable; renewal required.
- **Low remaining quantity.** Fires the expiry alert path early so the buyer renews before exhaustion.
- **Certificate renewed.** The supplier returns from SUSPENDED to ONBOARDED and new POs are allowed again.
- **Non-regulated item.** Skips the ministry-permit requirement but still surfaces cert status and feeds suspension on a lapsed cert.

## Business rules and invariants
- Permits and certs are tracked by both expiry date and quantity; consumption is by quantity or date, whichever first.
- Regulated chemicals cannot issue a PO without a valid ministry permit attached.
- The order quantity is reserved against the permit's remaining quantity at PO issue.
- Two alert triggers exist: on selection and one week before expiry, to handler and head.
- A lapsed supplier certificate suspends the supplier (ONBOARDED to SUSPENDED), blocking new POs until renewal.

## Cross-references
- 06 supplier onboarding (qualification documents and the SUSPENDED state); 05 purchase order (permit attachment gates PO issue); e03 quantity tolerance (quantity tracking on receipts); 11 returns and CAPA (other suspension triggers); platform-services document storage and notifications. Benchmarks: SCOR OE4 (manage data), S1.6 (supplier), ISO 9001 7.5 (documented information), ISO 9001 8.4.1 and 8.4.3 (external providers and information to providers).
