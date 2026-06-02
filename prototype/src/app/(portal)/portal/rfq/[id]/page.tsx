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
import { incotermValidForMode } from "@/lib/domain/incoterm";

const INCOTERMS = ["EXW", "FCA", "FOB", "CIF", "CFR", "CPT", "CIP", "DAP", "DDP"];
const TRANSPORT_MODES = ["Sea", "Air", "Road", "Courier"];

export default function PortalRfq({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: rfq } = useOne<Record<string, unknown>>("rfqs", id);
  const create = useCreate("quotes");
  const [f, setF] = useState({ unitPrice: "", currency: "USD", incoterm: "CIF", transportMode: "Sea", paymentTerms: "30-70", freight: "", duty: "" });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  // Incoterms 2020: FOB/CIF/CFR are sea/inland-waterway only; air/road/courier
  // use FCA/CPT/CIP/DAP; EXW is mode-agnostic (04-sourcing.md, SRC-09).
  const incotermOk = incotermValidForMode(f.incoterm, f.transportMode);

  async function submit() {
    if (!f.unitPrice) { toast.error("Unit price is required."); return; }
    if (!incotermOk) {
      toast.error(`Incoterm ${f.incoterm} is not valid for ${f.transportMode} transport.`);
      return;
    }
    const unit = Number(f.unitPrice);
    const landed = unit + (Number(f.freight) || 0) + (Number(f.duty) || 0);
    try {
      await create.mutateAsync({
        rfqId: id, supplierId: "SUP-0001", unitPrice: unit, currency: f.currency,
        incoterm: f.incoterm, transportMode: f.transportMode, paymentTerms: f.paymentTerms,
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
      <PageHeader title={`Submit quote: ${(rfq?.reference as string) ?? id}`} description="Respond to the RFQ from Harvest Foods" />
      <Card className="max-w-xl">
        <CardHeader><CardTitle className="text-base">Your quotation</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Fld label="Unit price"><Input value={f.unitPrice} onChange={(e) => set("unitPrice", e.target.value)} inputMode="decimal" data-testid="quote-unit" /></Fld>
          <Fld label="Currency"><Sel value={f.currency} onChange={(v) => set("currency", v)} options={["USD", "EUR", "GBP", "CHF", "INR"]} testId="quote-ccy" /></Fld>
          <Fld label="Transport mode"><Sel value={f.transportMode} onChange={(v) => set("transportMode", v)} options={TRANSPORT_MODES} testId="quote-transport-mode" /></Fld>
          <Fld label="Incoterm"><Sel value={f.incoterm} onChange={(v) => set("incoterm", v)} options={INCOTERMS} testId="quote-incoterm" /></Fld>
          <Fld label="Payment terms"><Input value={f.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} data-testid="quote-terms" /></Fld>
          <Fld label="Freight / unit"><Input value={f.freight} onChange={(e) => set("freight", e.target.value)} inputMode="decimal" data-testid="quote-freight" /></Fld>
          <Fld label="Duty / unit"><Input value={f.duty} onChange={(e) => set("duty", e.target.value)} inputMode="decimal" data-testid="quote-duty" /></Fld>
        </CardContent>
      </Card>
      {!incotermOk && (
        <div className="mt-3 max-w-xl rounded-md border border-status-danger/40 bg-status-danger-bg px-3 py-2 text-sm text-status-danger" data-testid="incoterm-mode-error">
          Incoterm {f.incoterm} is not valid for {f.transportMode} transport. FOB, CIF, and CFR are sea or
          inland-waterway only; air, road, and courier use FCA, CPT, CIP, or DAP.
        </div>
      )}
      <div className="mt-6 flex gap-2">
        <Button onClick={submit} disabled={create.isPending || !incotermOk} data-testid="submit-quote">Submit quote</Button>
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
