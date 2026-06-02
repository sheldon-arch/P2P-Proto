# Hero Screen Layout Sketches

The 3 marquee screens get a layout sketch (per the readiness brief: pixel-level layout is only needed for the hero/demo screens; the rest are resolved by the pattern-library archetypes). These are the screens an investor stares at: the landed-cost comparison (the #1 wow), the three-way-match workbench, and the management dashboard payoff. Sketches use the pattern library (`../patterns/`), the copy layer (`../copy/`), and the seed hero numbers (`../seed/`).

ASCII wireframes show structure and content priority, not pixels. Color tokens are the semantic status set from `../patterns/01-design-tokens.md`. Every labelled element references a real field/screen-spec so the builder can trace it.

---

## Hero 1: Landed-Cost Comparison Workbench (S04.4)

Route `/sourcing/rfq/RFQ-2026-0042/compare`. Persona: Buyer. The screen where the cheapest unit price loses once freight and duty are added. Spec: `../screens/04-sourcing.md` S04.4.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← RFQ-2026-0042  ·  Active Pharmaceutical Ingredient (ITM-0006)   [Buyer: Mei Lin]│
│ Compare on landed cost      [Ranking: ●Landed ○Unit price]  [Summary ○Per-line] │   <- toggle drives the reorder
├──────────────────────────────────────────────────────────────────────────────┤
│  RuleBanner (info):  "Lowest unit price is not lowest landed cost. Helvetia is  │   <- banner.landed-flip, copy/03
│  cheapest per unit; Synthex is lowest landed once freight and duty are added."  │
├───────────────────────┬───────────────────┬───────────────────┬───────────────┤
│                       │  ① SYNTHEX  [A]    │  ② HELVETIA [B]   │  ③ BIOCORE [C]│   <- ranked cols; rank-1 left, green border
│                       │  lowest landed ✓   │                   │  +7% spike ⚠  │   <- StatusBadge: success / neutral / warning
├───────────────────────┼───────────────────┼───────────────────┼───────────────┤
│ Unit price            │  139.30 INR        │  127.69 CHF  ←cheapest unit        │   <- highlight cheapest-unit cell (amber, to show the trap)
│ Incoterm / mode       │  CIF / Sea         │  CIF / Sea        │  CIF / Sea    │
│ ─ Landed build-up ─   │                    │                   │               │
│   + Freight / unit    │  7.26              │  26.12            │  11.61        │
│   + Duty / unit       │  8.71              │  15.96            │  13.06        │
│   + Insurance, POD/POL│  …                 │  … (est) ⓘ        │  …            │   <- averagingFallbackUsed -> "est" marker + tooltip
│  ═ LANDED / unit      │  155.26  ✓ lowest  │  169.77           │  179.93       │   <- landedTotalInBase; rank-1 green
│   (Damage, separate)  │  — excluded —      │  — excluded —     │  — excluded — │   <- A14: damage shown, NOT in total
│ ─ Scorecard ─         │  87 ●green         │  79 ●amber        │  64 ●red      │   <- composite + band color; compliance = pass/fail gate, not in score
│ Savings vs target     │  +1.0% (target     │  −20.6%           │  −27.8%       │   <- vs RFQ.internalTargetPrice 140.749 (buyer-only)
│   140.75, buyer-only 🔒)│                  │                   │               │
├───────────────────────┼───────────────────┼───────────────────┼───────────────┤
│ Regulated COA/MSDS    │  ✓ Approved (QC)   │  ⧗ Pending QC     │  ✓ Approved   │   <- regulated gate; Select hard-blocked until qc.approve
│ ACTION                │ [Select Synthex]   │ [Select] (needs   │ [Select]      │
│                       │  rank-1, no just.  │  justification)   │  (needs just.)│   <- non-rank-1 -> Select disabled until justificationForNonTopPick
└───────────────────────┴───────────────────┴───────────────────┴───────────────┘
```

Demo beat (Chapter 3, the marquee): the coach-mark walks the unit-price row (Helvetia cheapest), then the landed row (Synthex flips to lowest at 155.26), then the `banner.landed-flip`, then the +7% spike on BioCore, then "Select Synthex" with justification. Toggling "Unit price" ranking visibly reorders the columns; that reorder is the wow.

Key layout rules:
- Columns are the comparison unit (one quote each), ranked left-to-right by `landedTotalInBase`; rank-1 carries a `success` left-border, the spike column a `warning` flag.
- The cheapest-unit cell is highlighted in `warning` (it is the trap), the lowest-landed cell in `success` (it is the answer). The two being in different columns is the entire point.
- Damage row is present but visibly outside the total (A14); the internal target price carries a lock icon and "buyer-only" (sourcing invariant).
- Built as the `comparison` archetype (bespoke side-by-side Table), the one net-new pattern Raphe lacked.

---

## Hero 2: Three-Way-Match Workbench (S09.3)

Route `/invoices/:id/match`. Persona: Finance (Maker). The PO / GRN / Invoice reconciliation that auto-clears or routes a typed exception. Spec: `../screens/09-invoice-match.md` S09.3.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Invoice SUP-INV-8800  ·  Synthex  ·  PO-HERO        [THREE_WAY]  [Maker: Omar]│   <- matchType Badge: THREE_WAY iff GRN exists
├──────────────────────────────────────────────────────────────────────────────┤
│  Three panes, the differing leg highlighted in red                              │
│ ┌─── PO (agreed) ────┐ ┌─── GRN (received) ──┐ ┌─── INVOICE (billed) ────────┐ │
│ │ Item  API lot      │ │ Accepted qty  500   │ │ Qty billed   500            │ │
│ │ Agreed price 4.00  │ │ (GRN-HERO)          │ │ Unit price   4.20  ⚠        │ │   <- price leg fails -> red highlight
│ │ Qty ordered  500   │ │ COA  ✓ on file      │ │ Net 560.00 + tax 100.80 USD │ │
│ │ Tax  18% GST       │ │                     │ │ Total incl. tax  660.80     │ │
│ └────────────────────┘ └─────────────────────┘ └─────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────┤
│  Tolerance (tax-inclusive):  price ±5%   qty ±2%   absolute ±50               │   <- MatchResult bands, read
│  Expected (incl. tax): 3-way = GRN accepted qty 500 × agreed 4.00 + tax        │
│  Per-leg:  price +5.0% ⚠ exceeds band  ·  qty 0% ✓  ·  amount +28.00 ⚠         │   <- highlight the failing leg
├──────────────────────────────────────────────────────────────────────────────┤
│  [ Run match ]                                                                  │
│  ↳ Result:  EXCEPTION — price-variance.  Routed to Buyer (Mei Lin).             │   <- StatusBadge danger/warning; routed-to from spec
│     GR/IR not relieved; invoice held pending resolution.                        │
└──────────────────────────────────────────────────────────────────────────────┘

  Duplicate variant (INV-LV-13):  RuleBanner (danger): "On hold: possible duplicate
  of SUP-INV-8803 (same supplier, invoice number, and amount). Confirm before release."
```

Demo beat (Chapter 7, marquee): the coach-mark shows the three panes, the price leg failing by +5%, "Run match" producing a typed `price-variance` exception routed to the Buyer (not silently accepted), then the separate duplicate-invoice held with the `banner.duplicate-hold`. Then the maker→checker release (maker != checker).

Key layout rules:
- Three panes left-to-right (PO, GRN, Invoice); the GRN pane is absent on the two-way path (services), present on three-way (decided by GRN existence, not category).
- The failing leg is highlighted `danger`; passing legs `success`. All comparisons are tax-inclusive (a price within band with a tax error still routes).
- "Run match" is the only action; its result is either a green auto-clear (GR/IR relieved) or a typed, routed exception. Routing target is shown explicitly.
- Built as the `workbench` archetype (multi-pane), net-new.

---

## Hero 3: Management Dashboard (S12.1) — the payoff

Route `/analytics`. Persona: Management. The closed loop: every upstream action shows up as a defensible KPI. Spec: `../screens/12-analytics.md` S12.1.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Procurement performance        [Management ▾]   Period: [Q2 2026 ▾]  [Mgmt|Buyer|Quality|Finance]│
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌── OTIF ─────────┐ ┌── Perfect order ─┐ ┌── DPO ──────────┐ ┌── Spend (12mo) ─┐ │   <- KpiCards; OTIF and perfect-order DISTINCT
│ │  93.9%   ▲       │ │  88.9%   ▲       │ │  44.6 days      │ │  $125M          │ │
│ │  on-time+in-full│ │  +damage-free    │ │  AP / COGS×365  │ │  RM > PM > MRO  │ │   <- formula on hover (Tooltip)
│ │  (two-factor)   │ │  +docs (4-factor)│ │                 │ │                 │ │
│ └─────────────────┘ └──────────────────┘ └─────────────────┘ └─────────────────┘ │
│  note: perfect order is BELOW OTIF by construction (stricter measure)           │   <- A14; never conflated
├───────────────────────────────────────┬────────────────────────────────────────┤
│  Spend by category (donut)            │  Supplier risk                          │
│   RM 62% · PM 24% · MRO 9% · Svc 5%   │   Synthex   B ▼ (was A)  ⚠ open CAPA    │   <- the ripple: dropped grade visible here
│                                       │   25 A · 18 B · 3 C                      │
├───────────────────────────────────────┼────────────────────────────────────────┤
│  Savings (hard vs avoidance, SEPARATE)│  Budget commitment vs actual            │
│   Hard  3.2%   ·  Avoidance  1.8%      │   Committed ▓▓▓▓░  Actual ▓▓░  Avail ░  │   <- never summed (A); commit/actual/avail from Budget
│   (shown apart, never summed)         │   relieved to actual at GR/invoice      │
├───────────────────────────────────────┴────────────────────────────────────────┤
│  Alert feed:  price-spike >5% (BioCore) · cert expiring (12d) · Synthex 2-below │   <- the same rules from copy/03 banners
└──────────────────────────────────────────────────────────────────────────────┘
```

Demo beat (Chapter 8, payoff): the coach-mark lands on OTIF 93.9% vs perfect-order 88.9% (distinct, stricter), then spend + DPO, then the supplier-risk widget where Synthex's grade has dropped from the NCR the viewer watched in Chapter 6 (the ripple), then budget commitment-vs-actual. The closing line ties the loop.

Key layout rules:
- KpiCards top row, OTIF and perfect-order as separate tiles with the "below by construction" note (A14, never conflated). Every tile shows its formula on hover; no AI/ML labels.
- Savings shows hard and avoidance apart (never summed). Budget commit/actual/available as a single bar.
- The supplier-risk widget is where the upstream NCR becomes visible downstream; that traceability is the payoff.
- Built as the `dashboard` archetype (KpiCard + Recharts), adopted from Raphe analytics, restyled.

---

## What these sketches lock for the build

- The three hero screens' content priority and the cells that must be highlighted (the flip, the failing leg, the dropped grade). The pattern-library archetypes resolve everything else.
- The exact seed numbers each screen renders (so the build and the demo narration match): Synthex landed 155.26 < Helvetia 169.77; +5% price-variance routed to Buyer; OTIF 93.9% / perfect-order 88.9% / DPO 44.6d / $125M.
- These three are built first in the screen phase (they carry the demo) and are the Try-it / marquee anchors for the guided tour (`../guided-demo/`).
