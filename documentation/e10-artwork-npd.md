# e10 Artwork and New-Product-Development Approval

- **BPMN file:** e10-artwork-npd.bpmn

## Scope, trigger, outcome
- **Scope:** Two intertwined loops for new products and printed packaging. The NPD sample loop (raw-material and artwork samples reviewed by factory and marketing) and the artwork-proof approval loop (customer-supplied direct print, last-approved-artwork reorder shortcut, or own-brand proof reviewed in parallel by factory and marketing, quality, and a language reviewer). It covers the parallel review, the all-approved gate, the revised-proof loop, and storing the last-approved artwork. It does not cover the downstream sourcing and PO cycle the item joins after approval (04, 05).
- **Trigger:** A need for a new product and/or a printed packaging item.
- **Outcome:** NPD samples are approved (when applicable) and artwork is approved and released to print, after which the item joins the normal sourcing and PO cycle. The approved artwork is stored as the last-approved version for future reorders.

## Actors (lanes)
- **Requester:** raises the new-product or printed-item need.
- **Procurement / Buyer:** requests samples, manages the artwork decision, collates corrections.
- **Supplier / Vendor:** sends samples and submits proofs (1-up, 2-up, 10-up).
- **Approver (Factory / Marketing):** reviews samples and the proof (marketing engaged only if the product is new).
- **Quality:** reviews English text and structural correctness of the proof.
- **Reviewer (Language):** reviews the Arabic text on the proof.
- **Platform / System:** runs the parallel split and join, the all-approved gate, releases to print, and stores the last-approved artwork.

## Step-by-step narrative
Each step is tagged [SCOR code | ISO clause | source].

1. **New product / printed item need** (Requester, start). [SCOR S1.1 | source: AB].
2. **New product development needed?** (Requester, exclusive). New product runs the sample loop first; existing product goes to the artwork decision. [SCOR S1.1 | source: AB NPD].
3. **Factory requests RM + artwork samples** (Buyer, send). [SCOR S1.6 | source: AB].
4. **Supplier sends samples** (Supplier, send). [SCOR S1.6 | source: AB].
5. **Factory + marketing review samples** (Approver). Decision approve-into-flow or rework. [SCOR S1.6 | source: AB].
6. **Samples approved?** (Approver, exclusive). Approve proceeds to the artwork decision; rework loops back for revised samples. [SCOR S1.6 | source: AB].
7. **Item is printed?** (Requester, exclusive). Printed items take the artwork path; unprinted items exit to normal procurement. [SCOR S1.1 | source: AB].
8. **Reorder of last-approved artwork?** (Buyer, exclusive). An unchanged reorder takes the shortcut and prints directly; new or changed artwork needs proofing. [SCOR S1.10 | source: AB reorder shortcut].
9. **Customer-supplied or own-brand artwork?** (Buyer, exclusive). Customer-supplied prints directly; own-brand goes to the proof review. [SCOR S1.10 | source: AB].
10. **Forward customer artwork to supplier to print** (Buyer, send). No internal proof loop. [SCOR S1.10 | source: AB].
11. **Supplier submits proof (1-up / 2-up / 10-up)** (Supplier, send). Imposition per agreement. [SCOR S1.10 | source: AB].
12. **Parallel proof review** (System, parallel split). Splits to factory/marketing, quality, and language. [SCOR S1.10 | source: AB].
13. **Factory + marketing review** (Approver). Dieline/fit and branding; marketing only if the product is new. [SCOR S1.10 | source: AB].
14. **Quality review (English + structure)** (Quality). English text, declarations, barcodes, dimensions. [SCOR S1.10 | ISO 8.6 | source: AB].
15. **Language reviewer (Arabic text)** (Reviewer-Language). Arabic translation, script, right-to-left layout. [SCOR S1.10 | source: AB].
16. **Join: all reviews returned** (System, parallel join). Waits for all engaged branches. [SCOR S1.10 | source: AB].
17. **All reviewers approved?** (System, exclusive). All approve releases to print; any corrections loop back. [SCOR S1.10 | source: AB].
18. **Collate corrections; request revised proof** (Buyer). One markup; revised proof re-enters the parallel review. [SCOR S1.10 | source: AB].
19. **Release to print; store last-approved artwork** (System). Stores item.lastApprovedArtworkId with version and approval record; audit and SSE. [SCOR S1.10/OE4 | source: AB].
20. **Artwork approved / printed; into normal flow** (System, end). The item joins the normal cycle. [SCOR S1.10 | source: AB].

## Gateways and branches (exact conditions)
- **New product development needed?** True: `isNewProduct == true` -> sample loop. False -> artwork decision.
- **Samples approved?** True: `sampleDecision == approve` -> into flow. False -> rework loop.
- **Item is printed?** True: `item.isPrinted == true` -> artwork path. False -> normal procurement.
- **Reorder of last-approved artwork?** True: `item.lastApprovedArtworkId != null AND noArtworkChange == true` -> shortcut, print directly. False -> proofing.
- **Customer-supplied or own-brand artwork?** Customer: `artworkOrigin == customer-supplied` -> direct print. Own-brand -> proof review.
- **Marketing engagement (within Branch A):** `isNewProduct == true` -> marketing reviews; else factory only.
- **All reviewers approved?** True: `reviewA == approve AND reviewB == approve AND reviewC == approve` -> print. False -> corrections loop.

## Fields and dropdowns (full detail)

| Field | Type | Mandatory | Default | Validation | Owner |
| --- | --- | --- | --- | --- | --- |
| isNewProduct | boolean | mandatory | false | true triggers sample loop | Requester |
| item.isPrinted | boolean | mandatory | false | true triggers artwork path | Requester |
| sampleType | dropdown {RM, artwork} | mandatory | none | one of set | Buyer |
| sampleDecision | dropdown {approve, rework} | mandatory | none | one of set | Approver |
| artworkOrigin | dropdown {customer-supplied, own-brand} | mandatory | none | one of set | Buyer |
| proof imposition | dropdown {1-up, 2-up, 10-up} | mandatory | none | one of set | Supplier |
| reviewA / reviewB / reviewC | dropdown {approve, corrections} | mandatory per branch | none | one of set | Approver / Quality / Language |
| item.lastApprovedArtworkId | reference | system | null | set on print release | System |
| noArtworkChange | boolean | mandatory on reorder | none | enables shortcut | Buyer |

## Values, thresholds, and formats
- Proof imposition values: 1-up, 2-up, 10-up.
- Marketing is engaged in Branch A only when isNewProduct is true; otherwise factory reviews alone.
- The all-approved gate requires every engaged branch to return approve; a single corrections result sends the proof back.
- The last-approved artwork is stored with a version and approval record to enable the reorder shortcut.

## Edge cases and error handling
- **Sample rework.** Failed samples loop back to a fresh sample request until factory and marketing approve.
- **Customer-supplied artwork.** Bypasses the internal proof review entirely; the customer owns correctness.
- **Reorder shortcut.** An unchanged reorder reuses the last-approved artwork and skips the review loop.
- **Partial corrections.** Any single reviewer raising corrections fails the all-approved gate; all corrections are collated into one revised proof.
- **New product on the artwork path.** Marketing is added to Branch A; an existing-product reprint runs factory-only in Branch A.

## Business rules and invariants
- The artwork proof is reviewed in parallel by three competencies; print requires all engaged branches to approve.
- Marketing reviews only for new products.
- Customer-supplied artwork prints directly with no internal review; own-brand artwork always proofs.
- An unchanged reorder reuses the last-approved artwork; new or changed artwork always re-proofs.
- Released artwork is stored as the last-approved version for future reorders, with an audit record.

## Cross-references
- 04 sourcing and 05 purchase order (the cycle the item joins after approval); 07 item onboarding (new product master); e11 permit expiry (regulatory text and declarations on labels); 12 analytics (NPD and artwork cycle time). Benchmarks: SCOR S1.10 (agreements/specifications), S1.6 (supplier identification), product lifecycle, ISO 9001 8.6 (release of products).
