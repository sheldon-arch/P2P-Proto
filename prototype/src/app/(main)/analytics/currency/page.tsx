"use client";

/**
 * e07 — Currency conversion & graceful degradation. Foreign-currency amounts are
 * normalized to the base currency (USD) using the FX table. If a rate is missing
 * or invalid (0/NaN/negative), the system logs and returns the original amount
 * unconverted rather than failing — the demo never breaks on a bad rate.
 */
import { useState } from "react";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RuleBanner } from "@/components/patterns/RuleBanner";
import { FX_TO_BASE, BASE_CURRENCY } from "@/lib/domain/constants";

const CURRENCIES = ["USD", "EUR", "GBP", "CHF", "INR", "OMR", "AED", "CNY", "ZZZ"];

export default function CurrencyDemo() {
  const [amount, setAmount] = useState("1000");
  const [ccy, setCcy] = useState("EUR");

  const rate = FX_TO_BASE[ccy];
  const valid = typeof rate === "number" && Number.isFinite(rate) && rate > 0;
  const amt = Number(amount) || 0;
  const converted = valid ? Math.round(amt * rate * 100) / 100 : amt;

  return (
    <div>
      <PageHeader title="Currency Conversion" description="FX normalization with graceful degradation (e07)" />
      <Card className="max-w-xl">
        <CardHeader><CardTitle className="text-base">Convert to base ({BASE_CURRENCY})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Amount</Label><Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className="mt-1 font-mono" data-testid="fx-amount" /></div>
            <div>
              <Label className="text-xs">Currency</Label>
              <Select value={ccy} onValueChange={setCcy}>
                <SelectTrigger className="mt-1" data-testid="fx-currency"><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}{c === "ZZZ" ? " (no rate)" : ""}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-baseline justify-between border-t pt-3">
            <span className="text-sm text-muted-foreground">In {BASE_CURRENCY}</span>
            <span className="font-mono text-2xl font-semibold" data-testid="fx-converted">${converted.toLocaleString()}</span>
          </div>
          {valid ? (
            <RuleBanner tone="success" title={`Converted at ${rate}`} testId="fx-ok">
              {amt.toLocaleString()} {ccy} × {rate} = ${converted.toLocaleString()} {BASE_CURRENCY}.
            </RuleBanner>
          ) : (
            <RuleBanner tone="warning" title="No valid rate — graceful degradation" testId="fx-degrade">
              No usable rate for {ccy}. The system logs the issue and returns the original amount
              unconverted (${amt.toLocaleString()}) rather than failing.
            </RuleBanner>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
