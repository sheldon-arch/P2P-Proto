# e04 Nonconformance to CAPA to Supplier Re-evaluation Loop - Unified Procure-to-Pay

- **BPMN file:** e04-ncr-capa.bpmn
- **Spec:** .build/specs/e04-ncr-capa.json

## Scope, trigger, outcome
- **Scope:** Isolates the ISO feedback loop 8.6 -> 8.7 -> 10.2 -> 8.4.1: receiving inspection detects a nonconformance, an NCR is raised and dispositioned, the handler resolves with the supplier via a SCAR, the supplier provides root-cause and corrective action, effectiveness is reviewed, the result feeds the supplier scorecard re-evaluation, and the supplier may be suspended. The platform chains these so recurring NCRs auto-affect the supplier score.
- **Trigger:** Goods are received against the requisition/PO and presented for receiving verification (or an NCR is raised post-GRN when QC finds damage/off-spec later).
- **Outcome:** The NCR is dispositioned and, where the cause is systemic, the CAPA is closed with verified effectiveness; the supplier is re-evaluated; the AVL status is updated; and the supplier is either suspended (new POs blocked) or continues under monitoring. The full 8.6 -> 8.7 -> 10.2 -> 8.4.1 loop is closed and recorded.

## Actors (lanes)
Receiving/Warehouse (presents goods), Quality (inspects, raises NCR, dispositions, reviews effectiveness), Procurement/Buyer (handler, issues the SCAR, resolves with the supplier), Supplier/Vendor (submits root-cause and corrective action), Platform/System (releases on pass, routes dispositions, feeds re-evaluation, applies the suspend gate). Permission detail in `model/role-permission-matrix.md` (Quality group: qc.inspect, qc.approve, qc.reject, ncr.raise, capa.manage; Supplier group: suppliers.suspend split).

## Step-by-step narrative
Tags: [SCOR code | ISO clause | source].

1. **Goods received for inspection** (Receiving, start). [SCOR S2.5 | ISO 8.6 | albahja-receiving-inspection-grn + iso loop].
2. **8.6 Receiving inspection / verification** (Quality). Materials: store sends COA + sample to QC; QC inspects against spec at the risk-based inspection level (skip-lot / sampling / 100% / source inspection / CoC-only per ISO 8.4.2). Hard block: no COA -> cannot release. Retain conformity evidence + traceability to the authorizing person. Spares/services bypass QC (Engineering, no GRN). [SCOR S2.5 | ISO 8.6 | AB + iso 8.4.2/8.6].
3. **conforming?** (Quality, exclusive). Pass -> release; fail/quarantine -> raise NCR. Post-GRN NCRs re-enter here. [SCOR S2.5 | ISO 8.6/8.7 | AB QC approved?].
4. **Release - GRN raised** (System). GRN raised, GR/IR accrued, commitment relieved (e02), delivery counts toward OTD/OTIF and four-factor perfect-order (diagram 12). Quantity tolerance +/-5-10% for labels/cartons -> handler adjusts PO qty to actual before GRN (audited). Terminates with no nonconformance. [SCOR S2.6 | ISO 8.6 | AB GRN + e02].
5. **8.7 Raise NCR** (Quality). Fields (AB + ISO 8.7): item, deliveryNote#, date, description, percentNonConformance, image. raisedBy = QC / Finance-Maker (C) / requester or Engineering (C). Goods identified and SEGREGATED (quarantine). NCR status = raised. [SCOR S2.5 | ISO 8.7 | AB NCR fields + iso 8.7].
6. **disposition?** (Quality, exclusive). {return, rework, use-as-is-concession, scrap}. Deciding authority + disposition retained on the NCR. [SCOR S2.5 | ISO 8.7 | data-model disposition].
7. **Return -> RMA (diagram 11)** (System). disposition == return: control passes to diagram 11 (S4.1-S4.5) carrying linkedNcrId; runs in parallel with the systemic CAPA. [SCOR S4 | ISO 8.7 | diagram 11].
8. **Rework / concession / scrap** (System). rework -> correction + re-inspection (loops to 8.6); concession -> documented acceptance + authority; scrap -> write-off + possible debit note. Each retains the ISO 8.7 record. [ISO 8.7 | iso 8.7 records].
9. **Handler resolves with supplier (SCAR)** (Buyer). Issue a SCAR for any systemic nonconformance: replace / credit / corrective action; opens the CAPA record + response SLA; CAPA responsiveness feeds the scorecard. [ISO 10.2 / 8.4 | AB handler resolves + capa.manage].
10. **10.2 Supplier root cause + corrective action** (Supplier). Via the external form: rootCause (5-why), correctiveAction, preventiveAction, targetDate, evidence. CAPA status = action-proposed. [ISO 10.2 | data-model CAPA].
11. **Effectiveness review** (Quality). Verify recurrence prevented; effectivenessReview {pending, effective, not-effective}. [ISO 10.2 | data-model effectivenessReview].
12. **effective?** (Quality, exclusive). effective -> close CAPA + NCR, feed re-evaluation; not-effective -> re-open SCAR (loop). [ISO 10.2 | data-model].
13. **8.4.1 Feed supplier re-evaluation** (System). The closed NCR/CAPA feeds monitoring + re-evaluation; counts against quality (and four-factor perfect-order if late/wrong/damaged); CAPA responsiveness feeds responsiveness; recurring NCRs auto-affect the composite; re-computes the period scorecard (diagram 12) and updates the consecutive-below counter. [ISO 8.4.1 | iso 'recurring NCRs auto-affect score'].
14. **suspend supplier?** (System, exclusive). Event-driven suspend gate (conditions below). [ISO 8.4.1 | data-model SUSPENDED + iso triggers].
15. **Suspend supplier** (System). status = SUSPENDED with reason/by/at; blocks new PO issue; AVL status = Suspended; SUSPENDED -> ONBOARDED on resolution; notifications + audit. [ISO 8.4.1 | data-model SUSPENDED].
16. **Continue monitoring** (System). Remain ONBOARDED; scorecard, streaks, and risk-based re-evaluation cadence continue. [ISO 8.4.1 | iso cadence].
17. **NCR/CAPA closed, supplier re-evaluated** (System, end).

## Gateways and branches (exact conditions)
- **conforming?** `QC result == pass (within spec, COA valid, qty within PO tolerance)` -> release, GRN, no NCR. `QC result == fail / quarantine (off-spec, damage, missing/invalid COA, expired, wrong item)` -> raise NCR.
- **disposition?** exact set `{return | rework | use-as-is-concession | scrap}`. return -> RMA (diagram 11); the other three -> rework/concession/scrap handling. All four proceed to SCAR/CAPA when the cause is systemic.
- **effective?** `effectivenessReview == 'effective'` -> close CAPA + NCR, feed re-evaluation. `effectivenessReview == 'not-effective'` -> re-open SCAR (supplier resubmits root cause/action).
- **suspend supplier?** Suspend if ANY of: `a critical NCR; two consecutive periods below target (consecutive-below counter); a failed audit; an expired mandatory ISO cert; a sanctions hit; an unresolved / not-effective active CAPA`. Else remain ONBOARDED.

## NCR fields (8.7)
| Field | Type | Mandatory | Notes |
| --- | --- | --- | --- |
| item | name / itemId | yes | the nonconforming item |
| deliveryNote# | string | yes | delivery note reference |
| date | date | yes | delivery date |
| description | text | yes | nature of non-compliance |
| percentNonConformance | number 0-100 | yes | extent of the lot affected |
| image | attachment | >= 1 | visual evidence |
| raisedBy | reference | auto | QC / Finance-Maker (C) / requester or Engineering (C) |
| disposition | dropdown | yes | {return, rework, use-as-is-concession, scrap} |
| decidingAuthority | reference | yes | retained per ISO 8.7 |

## CAPA fields (10.2)
| Field | Type | Mandatory | Notes |
| --- | --- | --- | --- |
| ncrId | reference | auto | the source NCR |
| supplierId | reference | auto | the supplier |
| rootCause | text | yes | e.g. 5-why |
| correctiveAction | text | yes | immediate correction |
| preventiveAction | text | yes | systemic, prevent recurrence |
| targetDate | date | yes | response SLA |
| evidence | attachments | - | supplier evidence |
| effectivenessReview | dropdown | yes | {pending, effective, not-effective} |

## Edge cases and error handling
- **No COA on a material lot:** hard block; the lot cannot be released regardless of other results (AB rule).
- **Post-GRN NCR:** QC can raise an NCR after the GRN when damage/off-spec surfaces later (labels 10-15 days, RM 2-3 days); it re-enters at the conforming gate.
- **Spares/services:** received by Engineering against the requisition, no QC and no GRN; an NCR there is raised by Engineering and routed to the handler.
- **Declined return (diagram 11):** a return that the supplier declines is re-dispositioned here to rework / concession / scrap.
- **Not-effective CAPA:** re-opens the SCAR; repeated not-effective outcomes feed the consecutive-below counter toward suspension.
- **Suspend split by permission:** Quality suspends on a quality stop (suppliers.suspend C); Tax/Compliance on a sanctions/compliance hit (C); Admin always (G).
- **Suspended supplier:** new PO issue is blocked (PO guard requires ONBOARDED); existing open POs handled per policy; SUSPENDED -> ONBOARDED on resolution (effective CAPA / renewed cert / lifted sanction).
- **Quantity tolerance:** labels/cartons/printed packaging routinely +/-5-10% from ordered; the handler adjusts PO qty to actual before GRN (audited); no-tolerance items skip adjustment and an over/under is itself a nonconformance.

## Business rules and invariants
- The loop is chained: 8.6 detection -> 8.7 NCR/disposition -> 10.2 CAPA -> 8.4.1 re-evaluation, so recurring NCRs auto-affect the supplier score.
- **Rejected-goods quarantine (axiom A20):** goods identified as non-conforming at the receiving inspection or post-GRN NCR are physically quarantined immediately at the segregationLocation (quarantine bin) on NCR raise. Quarantined goods are identified, segregated from conforming stock, and cannot be issued to production. The quarantine location is recorded on the NCR and is cleared only when the disposition is executed (return dispatched, rework completed, concession accepted, or scrap/disposal done).
- **Disposal SOP (~90-day trigger):** if a return is not authorized and goods are not shipped back within approximately 90 days of quarantine start, the disposal SOP is triggered. Under the SOP: Quality confirms disposition as scrap/disposal, the Buyer raises a debit note for the applicable value, and Receiving disposes per local regulatory requirements for the material type (regulated/hazardous materials require specific disposal documentation). Disposal date, quantity, method, and authority are recorded on the NCR; the GR/IR accrual for the disposed quantity is reversed and the commitment is relieved.
- Goods are segregated from raising until dispositioned (ISO 8.7).
- An NCR closes when the disposition is done and, if a CAPA was opened, effectiveness is verified.
- The disposition and deciding authority are always retained on the NCR (ISO 8.7 record).
- A SUSPENDED supplier cannot receive new POs without offboarding; resolution returns it to ONBOARDED.
- Suspend is event-driven and split across Quality / Tax-Compliance / Admin by permission.

## Cross-references
- **Diagram 08** (delivery/GRN): the receiving inspection and QC gate this edge case expands.
- **Diagram 11** (returns/RMA): the return disposition hands off to S4.1-S4.5.
- **Diagram 12** (analytics): the scorecard re-evaluation, consecutive-below counter, and AVL status.
- **Diagram 06** (supplier onboarding): the supplier lifecycle states, including SUSPENDED.
- **e02** (budget/commitment): a conforming release relieves the commitment; a return reverses it.
- **Benchmarks:** ISO 9001 8.6 (release/receiving verification), 8.7 (control of nonconforming outputs), 10.2 (corrective action), 8.4.1 (monitoring/re-evaluation); SCOR S2.5 Inspect and Verify, OE3 continuous improvement. Sources: memory `albahja-receiving-inspection-grn`, `iso-supply-chain-standards` (central feedback loop), `model/data-model.md` (NCR/Return/CAPA state machine, supplier SUSPENDED state).
