# Data Contracts: FX and Analytics

Two data contracts the mock layer (#9) and the dashboards (#12) depend on, pinned here so the build is unambiguous: the static FX rate table the currency service uses, and the precompute-vs-compute split that decides which KPI numbers come from the seed and which the prototype recomputes live. Both are nice-to-haves done as mocks (no live FX feed, no analytics engine), so the contract is what keeps the mock honest and consistent with the seed.

## 1. FX rate contract

The prototype has no live FX feed. The currency service (`fxService.toBase`, axiom A12) converts using a fixed rate table. The same table is already used by the seed generator (`seed/generate.py`), so the seed's base-currency figures and the runtime conversions agree exactly.

### The rate table (base USD, as-of the pinned demo date 2026-06-01)

| Currency | Symbol | Rate to USD (base) | Decimals |
| --- | --- | --- | --- |
| USD | $ | 1.00 (base) | 2 |
| EUR | euro | 1.08 | 2 |
| INR | rupee | 0.012 | 2 |
| AED | dirham | 0.27 | 2 |
| CHF | CHF | 1.12 | 2 |
| GBP | pound | 1.27 | 2 |
| CNY | yuan | 0.14 | 2 |
| SGD | S$ | 0.74 | 2 |

These eight match the seed currencies. The rate is an as-of snapshot, not a live feed; it is the same number every run (deterministic), which is required for the demo to reproduce.

### The contract (rules the service honors)

- `toBase(amount, currency)` returns `round(amount * rate[currency], 2)`. For the base currency the rate is 1.0 and the call is a passthrough.
- The rate and its as-of date (2026-06-01) are available on hover wherever a converted figure shows (the `MoneyValue` component, `patterns/04`).
- A converted figure is marked approximate (the `~` prefix in `copy/02`) because it is FX-derived.
- **Degradation toggle (axiom A12):** the demo can simulate an FX failure. When on, `toBase` returns `{ ok: false }`; `MoneyValue` drops the base line and shows "rate unavailable" (`copy/03` `err.fx.unavailable`), and the transaction-currency amount stays correct and unblocked. This is the graceful-degradation path the model requires; the toggle exists so a presenter can show it without breaking the demo.
- **Per-PO override:** a PO may carry its own `exchangeRate` (the dictionary field); when present it overrides the table for that PO's conversions, so a locked-in contract rate is honored over the snapshot. This is the only place a non-table rate enters.
- **Realized FX gain/loss** (table rate vs PO override at settlement) is a nice-to-have, not computed in the prototype; noted in `scope-and-gaps.md`.

### Where the rate is stored at build time

The rate becomes a field on the currency master record (the seed `currencies.json` gains a `rateToBase` per row, populated from this table) so the service reads it from the store like any other master datum, rather than from a hard-coded constant. This keeps the currency master the single source for both the symbol/decimals and the rate.

## 2. Analytics precompute-vs-compute split

The prototype has no analytics engine. The dashboard KPIs (`screens/12-analytics.md`) come from two places: most are precomputed in the seed (so a fresh load shows defensible numbers instantly), and a small set are recomputed live by transition effects (so a demo action visibly moves a number). The contract below says which is which, so the build does not accidentally try to compute a 12-month KPI live, nor leave an action-driven number stale.

### Precomputed in the seed (read-only on the dashboard)

These are 12-month-history aggregates; computing them live would need the full history engine, which is out of scope. They are computed once by `seed/generate.py` from the seeded history and stored, already verified in defensible bands:

| KPI | Source in seed | Value (verified) |
| --- | --- | --- |
| Portfolio OTIF (two-factor) | history GRNs vs need dates | 93.9% |
| Perfect order (four-factor) | history GRNs + docs + damage | 88.9% (< OTIF, 0 violations) |
| DPO | history invoices/payments vs COGS | 44.6 days |
| Total spend (12mo) | history tickets | ~$125M |
| Spend by category / supplier | history lines | the Pareto split |
| Cycle time (req-to-PO) | history timestamps | mean 7.8d |
| Hard savings / cost avoidance | history vs last-purchase baseline | separate figures |
| Supplier scorecards (grades, sub-scores) | history per supplier | 25A/18B/3C |
| Three-way-match exception rate | history match outcomes | the first-pass rate |

The dashboard reads these; it does not recompute them. Each tile shows its formula on hover (honesty), but the value is the stored seed figure.

### Recomputed live (moves when a demo action fires)

A small set of numbers must change when the viewer acts, or the demo feels static. These are recomputed on read from the current store state by the analytics selectors (`mock-and-tech-spine/02`), triggered by the transition effects:

| Live number | Recomputed when | Effect that triggers it |
| --- | --- | --- |
| Queue counts (per role) | any record enters/leaves a queue | every approve/route/match/release transition |
| Budget committed vs actual vs available | a PO is issued / a requirement completes | `budgetService.commit` / `relieve` |
| A supplier's scorecard grade + AVL standing | an NCR/CAPA affects that supplier | `scorecardService.recompute` (the Chapter-6 -> Chapter-8 ripple) |
| OTIF / on-time stat (incremental) | an approval or GRN updates the operational streak | the approve / GRN effects |
| The alert feed (spike, expiry, 2-below) | the underlying record crosses a threshold | the relevant transition |

The contract: a live number is derived from the current store on read (never cached stale); a precomputed number is the seed figure (never recomputed from partial demo data, which would be wrong because the demo only mutates a handful of records, not the 12-month history).

### The boundary rule (why the split exists)

The demo mutates ~10 live records on top of 12 months of frozen history. If the dashboard tried to recompute portfolio OTIF from only the mutated records, it would show a nonsense number. So: 12-month portfolio KPIs are precomputed and read-only; only the action-local numbers (this supplier's grade, this budget's commitment, the queue counts, the alert feed) recompute live. The Chapter-6-to-Chapter-8 ripple works because the supplier scorecard is in the live set (the NCR recomputes that one supplier's grade), while portfolio OTIF stays the stable seed figure. This is the honest, correct split: real movement where the action reaches, stable history everywhere else.
