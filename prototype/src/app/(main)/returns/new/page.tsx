"use client";

/**
 * Initiate a return (diagram 11, S4.1). Creates an RMA in INITIATED; the detail
 * page drives authorize -> identify condition -> schedule shipment -> close +
 * credit/debit note via the engine. Can be linked to an NCR (return disposition).
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreate } from "@/queries/hooks";

const REASONS = ["defective", "damaged", "wrong-item", "over-delivery", "expired", "quality-fail"];

export default function NewReturn() {
  const router = useRouter();
  const create = useCreate("returns");
  const [f, setF] = useState({ sourceOrderId: "", supplierId: "", reason: "defective", productCondition: "", linkedNcrId: "" });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function submit() {
    if (!f.sourceOrderId.trim() || !f.supplierId.trim()) { toast.error("Source order and supplier are required."); return; }
    try {
      const created = await create.mutateAsync({
        sourceOrderId: f.sourceOrderId, supplierId: f.supplierId, reason: f.reason,
        productCondition: f.productCondition, linkedNcrId: f.linkedNcrId || undefined,
        authorizationStatus: "PENDING", closureStatus: "INITIATED",
      });
      toast.success("Return initiated");
      router.push(`/returns/${(created as { id: string }).id}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div>
      <PageHeader title="Initiate Return" description="Create a return / RMA against a delivered order" />
      <Card className="max-w-xl">
        <CardHeader><CardTitle className="text-base">Return details</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Fld label="Source order (PO)"><Input value={f.sourceOrderId} onChange={(e) => set("sourceOrderId", e.target.value)} data-testid="ret-order" placeholder="PO-LV-3" /></Fld>
          <Fld label="Supplier"><Input value={f.supplierId} onChange={(e) => set("supplierId", e.target.value)} data-testid="ret-supplier" placeholder="SUP-0001" /></Fld>
          <Fld label="Reason">
            <Select value={f.reason} onValueChange={(v) => set("reason", v)}>
              <SelectTrigger data-testid="ret-reason"><SelectValue /></SelectTrigger>
              <SelectContent>{REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </Fld>
          <Fld label="Product condition"><Input value={f.productCondition} onChange={(e) => set("productCondition", e.target.value)} data-testid="ret-condition" /></Fld>
          <Fld label="Linked NCR (optional)"><Input value={f.linkedNcrId} onChange={(e) => set("linkedNcrId", e.target.value)} data-testid="ret-ncr" placeholder="NCR-LV-1" /></Fld>
        </CardContent>
      </Card>
      <div className="mt-6 flex gap-2">
        <Button onClick={submit} disabled={create.isPending} data-testid="submit-return">Initiate return</Button>
        <Button variant="outline" onClick={() => router.push("/returns")}>Cancel</Button>
      </div>
    </div>
  );
}

function Fld({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="text-xs">{label}</Label><div className="mt-1">{children}</div></div>;
}
