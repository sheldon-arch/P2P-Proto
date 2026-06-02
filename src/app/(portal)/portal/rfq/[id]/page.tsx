"use client";

/**
 * Supplier RFQ response (SubmitQuote, diagram 04). The supplier enters unit
 * price, incoterm, payment terms, freight, and duty; submitting creates a quote
 * that the buyer sees in the landed-cost comparison. (Two-sided system.)
 */
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOne, useCreate } from "@/queries/hooks";

const INCOTERMS = ["EXW", "FCA", "FOB", "CIF", "CFR", "CPT", "CIP", "DAP", "DDP"];

export default function PortalRfq({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: rfq } = useOne<Record<string, unknown>>("rfqs", id);
  const create = useCreate("quotes");
  const [f, setF] = useState({ unitPrice: "", currency: "USD", incoterm: "CIF", paymentTerms: "30-70", freight: "", duty: "" });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function submit() {
    if (!f.unitPrice) { toast.error("Unit price is required."); return; }
    const unit = Number(f.unitPrice);
    const landed = unit + (Number(f.freight) || 0) + (Number(f.duty) || 0);
    try {
      await create.mutateAsync({
        rfqId: id, supplierId: "SUP-0001", unitPrice: unit, currency: f.currency,
        incoterm: f.incoterm, paymentTerms: f.paymentTerms,
        freightPerUnit: Number(f.freight) || 0, dutyPerUnit: Number(f.duty) || 0,
        landedCostPerUnit: Math.round(landed * 1000) / 1000,
      });
      toast.success("Quote submitted to Harvest Foods");
      router.push("/portal");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div>
      <PageHeader title={`Submit quote — ${(rfq?.reference as string) ?? id}`} description="Respond to the RFQ from Harvest Foods" />
      <Card className="max-w-xl">
        <CardHeader><CardTitle className="text-base">Your quotation</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Fld label="Unit price"><Input value={f.unitPrice} onChange={(e) => set("unitPrice", e.target.value)} inputMode="decimal" data-testid="quote-unit" /></Fld>
          <Fld label="Currency"><Sel value={f.currency} onChange={(v) => set("currency", v)} options={["USD", "EUR", "GBP", "CHF", "INR"]} testId="quote-ccy" /></Fld>
          <Fld label="Incoterm"><Sel value={f.incoterm} onChange={(v) => set("incoterm", v)} options={INCOTERMS} testId="quote-incoterm" /></Fld>
          <Fld label="Payment terms"><Input value={f.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} data-testid="quote-terms" /></Fld>
          <Fld label="Freight / unit"><Input value={f.freight} onChange={(e) => set("freight", e.target.value)} inputMode="decimal" data-testid="quote-freight" /></Fld>
          <Fld label="Duty / unit"><Input value={f.duty} onChange={(e) => set("duty", e.target.value)} inputMode="decimal" data-testid="quote-duty" /></Fld>
        </CardContent>
      </Card>
      <div className="mt-6 flex gap-2">
        <Button onClick={submit} disabled={create.isPending} data-testid="submit-quote">Submit quote</Button>
        <Button variant="outline" onClick={() => router.push("/portal")}>Cancel</Button>
      </div>
    </div>
  );
}

function Fld({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="text-xs">{label}</Label><div className="mt-1">{children}</div></div>;
}
function Sel({ value, onChange, options, testId }: { value: string; onChange: (v: string) => void; options: string[]; testId?: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger data-testid={testId}><SelectValue /></SelectTrigger>
      <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
    </Select>
  );
}
