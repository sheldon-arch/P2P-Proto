# e07 Currency Conversion and Graceful Degradation

- **BPMN file:** e07-currency.bpmn

## Scope, trigger, outcome
- **Scope:** The convertToBase(amount, currency) function and its graceful-degradation behaviour, plus the per-PO manual exchange-rate override and the realized FX gain/loss computation. It covers the base/null short-circuit, the live rate fetch, the fetch-success and rate-validity guards, the round-to-two-decimals conversion, the never-throws degradation path, persistence of FX context (rate, date, source), and the PO-date-versus-payment-date realized gain/loss. It does not cover landed-cost comparison itself (04) or payment scheduling (10), which consume the base amount.
- **Trigger:** Any transaction amount (requisition total, quote price, PO line value, invoice amount, payment) needs its base-currency equivalent.
- **Outcome:** Either a normalized base amount with full FX context, or, on any failure, the original amount returned unchanged and flagged unconverted. The function never throws, so an FX provider outage never blocks the cycle.

## Actors (lanes)
- **Procurement / Buyer:** may set a per-PO manual exchange-rate override.
- **Finance - Maker:** computes the realized FX gain/loss at payment.
- **Platform / System:** runs convertToBase, calls the FX provider, applies the guards, persists FX context, and degrades gracefully.

## Step-by-step narrative
Each step is tagged [SCOR code | ISO clause | source].

1. **Amount needs base-currency value** (System, start). Entry point convertToBase(amount, currency); base currency is configurable per tenant. [SCOR OE4 | source: platform-services FX + RA e08].
2. **Per-PO manual exchange rate set?** (Buyer, exclusive). If the PO carries a manual rate, use it and skip the fetch. [SCOR OE4 | source: AB per-PO override].
3. **Apply manual rate; record date + source = manual** (System). baseAmount = round(amount * PO.exchangeRate, 2); no external call. [SCOR OE4 | source: AB override].
4. **currency is base or null?** (System, exclusive). Base or null returns the amount unchanged with no call; a foreign currency proceeds to fetch. [SCOR OE4 | source: platform-services FX short-circuit].
5. **Fetch live rate (Frankfurter)** (System). Provider call wrapped so it never throws. [SCOR OE4 | source: platform-services FX + RA e08].
6. **Fetch succeeded?** (System, exclusive). On failure, log and return the original amount. [SCOR OE4 | source: RA e08].
7. **Rate finite and > 0?** (System, exclusive). On an invalid rate, log and return the original amount. [SCOR OE4 | source: RA e08].
8. **baseAmount = round(amount * rate, 2)** (System). Convert and record rate, date, and provider source. [SCOR OE4 | source: platform-services FX].
9. **Log + return original amount unconverted** (System). Graceful degradation; mark source unconverted and rate null. [SCOR OE4 | source: RA e08 never-throws].
10. **Persist base amount + FX context (rate, date, source)** (System). Store totalAmountInBase (or line baseAmount), exchangeRate, fxRateDate, fxSource; emit SSE. [SCOR OE4 | source: review FX-context].
11. **Compute realized FX gain/loss at payment** (Finance-Maker). For foreign settlements, gain/loss = PO-date base value minus payment-date base value; posted to the ledger. [SCOR S2.7 | source: review realized FX].
12. **Base value available (or original, flagged)** (System, end). The call returned without throwing. [SCOR OE4 | source: platform-services FX].

## Gateways and branches (exact conditions)
- **Per-PO manual exchange rate set?** True: `PO.exchangeRate != null` -> apply manual rate, skip fetch. False -> convertToBase.
- **currency is base or null?** True: `currency == baseCurrency OR currency == null` -> return unchanged, no call. False -> fetch.
- **Fetch succeeded?** True: `provider returned 2xx with a parseable rate`. False (timeout, non-2xx, network error, unparseable body) -> log, return original.
- **Rate finite and > 0?** True: `isFinite(rate) AND rate > 0`. False (0, NaN, Infinity, negative) -> log, return original.

## Fields and dropdowns (full detail)

| Field | Type | Mandatory | Default | Validation | Owner |
| --- | --- | --- | --- | --- | --- |
| amount | number | input | none | numeric | caller |
| currency | enum | input | document currency | valid currency or null | caller |
| baseCurrency | enum (config) | tenant | configurable | one valid currency | Administrator |
| PO.exchangeRate | number | optional | null | > 0 when set | Buyer |
| baseAmount / totalAmountInBase | number | system | computed | round to 2 dp | System |
| fxRate | number | system | fetched or manual | finite, > 0 (else null) | System |
| fxRateDate | date | system | fetch or entered date | valid date | System |
| fxSource | enum {provider name, manual, unconverted} | system | derived | one of set | System |
| realizedFxGainLoss | number | system | computed at payment | signed | Finance-Maker |

## Values, thresholds, and formats
- Conversion: `baseAmount = round(amount * rate, 2)` (2 decimal places).
- Rate validity: a rate is valid only if `isFinite(rate) AND rate > 0`; 0, NaN, Infinity, and negative values are invalid.
- Base/null short-circuit: when currency equals the base currency or is null, the amount is returned unchanged with no external call (rate implicitly 1.0).
- Provider: Frankfurter (example); configurable. Source on the FX context records which provider supplied the rate.
- Realized FX gain/loss: `(PO-date base value) - (payment-date base value)` for the same foreign amount, using each date's stored rate.

## Edge cases and error handling
- **Provider outage or timeout.** Logged; original amount returned unconverted; the cycle proceeds. The function never throws.
- **Garbage rate after a successful fetch.** A 2xx response carrying 0, NaN, Infinity, or a negative rate is rejected by the validity guard and degrades to the original amount.
- **Manual override present.** The live fetch is skipped entirely; the override rate, its date, and source = manual are recorded.
- **Re-conversion.** An amount flagged unconverted can be re-run through convertToBase later when the provider recovers.
- **Base-currency transaction.** No call and no conversion; the figure is used as-is.

## Business rules and invariants
- convertToBase never throws; on any failure it returns the original amount and flags it unconverted.
- The base/null case makes no external call.
- Every conversion (live, manual, or degraded) records FX context: rate, date, and source.
- The base amount drives approval thresholds, landed-cost comparison, and analytics, so a degraded (unconverted) figure is explicitly flagged to avoid silently mis-stating those.
- Realized FX gain/loss is computed only for foreign-currency settlements, using the stored PO-date and payment-date rates.

## Cross-references
- 04 sourcing (landed-cost comparison consumes the base amount); 05 purchase order (per-PO override and exchange rate); 10 payments (realized FX at settlement); 12 analytics (base amounts drive spend and savings); platform-services FX service. Benchmarks: SCOR OE4 (manage data), SCOR S2.7 (payment).
