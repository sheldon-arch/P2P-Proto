"use client";

/**
 * Supplier invoice submission (SubmitInvoice, diagram 09). The supplier submits
 * an invoice against a PO; it enters the internal AP match flow (2-/3-way).
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreate } from "@/queries/hooks";

export default function PortalInvoice() {
  const router = useRouter();
  const create = useCreate("invoices");
  const [f, setF] = useState({ invoiceNumber: "", poRef: "PO-HERO", amount: "", taxAmount: "", currency: "USD" });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function submit() {
    if (!f.invoiceNumber || !f.amount) { toast.error("Invoice number and amount are required."); return; }
    try {
      await create.mutateAsync({
        invoiceNumber: f.invoiceNumber, poId: f.poRef, supplierId: "SUP-0001",
        invoiceDate: "2026-06-01", amount: Number(f.amount), taxAmount: Number(f.taxAmount) || 0,
        currency: f.currency, matchType: "THREE_WAY", matchStatus: "unmatched",
      });
      toast.success("Invoice submitted: entering match flow");
      router.push("/portal");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div>
      <PageHeader title="Submit Invoice" description="Invoice Harvest Foods against a purchase order" />
      <Card className="max-w-xl">
        <CardHeader><CardTitle className="text-base">Invoice details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Fld label="Invoice number"><Input value={f.invoiceNumber} onChange={(e) => set("invoiceNumber", e.target.value)} data-testid="inv-number" placeholder="SUP-INV-9001" /></Fld>
          <Fld label="PO reference"><Input value={f.poRef} onChange={(e) => set("poRef", e.target.value)} data-testid="inv-po" /></Fld>
          <Fld label="Amount"><Input value={f.amount} onChange={(e) => set("amount", e.target.value)} inputMode="decimal" data-testid="inv-amount" /></Fld>
          <Fld label="Tax amount"><Input value={f.taxAmount} onChange={(e) => set("taxAmount", e.target.value)} inputMode="decimal" data-testid="inv-tax" /></Fld>
        </CardContent>
      </Card>
      <div className="mt-6 flex gap-2">
        <Button onClick={submit} disabled={create.isPending} data-testid="submit-invoice">Submit invoice</Button>
        <Button variant="outline" onClick={() => router.push("/portal")}>Cancel</Button>
      </div>
    </div>
  );
}

function Fld({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="text-xs">{label}</Label><div className="mt-1">{children}</div></div>;
}
