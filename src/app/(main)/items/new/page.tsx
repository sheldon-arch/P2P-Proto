"use client";

/**
 * Item onboarding form (diagram 07): CreateItem + SourcePriority. Creates the
 * item in PENDING_ONBOARDING; the detail page drives requestApproval -> approve
 * -> ONBOARDED via the engine (edit reverts to PENDING_APPROVAL).
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

const TYPES = ["RM", "PM", "MRO", "SVC"];
const UOMS = ["EA", "KG", "L", "DRUM", "CTN", "BOX", "ROLL"];

export default function NewItem() {
  const router = useRouter();
  const create = useCreate("items");
  const [f, setF] = useState({ description: "", type: "RM", segment: "", stockUom: "KG", purchaseUom: "KG", sourcePriority: "1" });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function submit() {
    if (!f.description.trim()) { toast.error("Item description is required."); return; }
    try {
      const created = await create.mutateAsync({
        description: f.description, type: f.type, segment: f.segment || f.type,
        stockUom: f.stockUom, purchaseUom: f.purchaseUom, salesUom: f.stockUom,
        sourcePriority: Number(f.sourcePriority), status: "PENDING_ONBOARDING",
      });
      toast.success("Item created (Pending Onboarding)");
      router.push(`/items/${(created as { id: string }).id}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div>
      <PageHeader title="Onboard Item" description="Create a new item in the master" />
      <Card className="max-w-xl">
        <CardHeader><CardTitle className="text-base">Item details</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Fld label="Description"><Input value={f.description} onChange={(e) => set("description", e.target.value)} data-testid="item-desc" placeholder="e.g. Natural Vanilla Flavor Concentrate" /></Fld>
          <div className="grid grid-cols-2 gap-3">
            <Fld label="Type"><Sel value={f.type} onChange={(v) => set("type", v)} options={TYPES} testId="item-type" /></Fld>
            <Fld label="Segment"><Input value={f.segment} onChange={(e) => set("segment", e.target.value)} data-testid="item-segment" placeholder="e.g. Flavors" /></Fld>
            <Fld label="Stock UoM"><Sel value={f.stockUom} onChange={(v) => set("stockUom", v)} options={UOMS} testId="item-stockuom" /></Fld>
            <Fld label="Purchase UoM"><Sel value={f.purchaseUom} onChange={(v) => set("purchaseUom", v)} options={UOMS} testId="item-purchuom" /></Fld>
            <Fld label="Source priority"><Input value={f.sourcePriority} onChange={(e) => set("sourcePriority", e.target.value)} inputMode="numeric" data-testid="item-priority" /></Fld>
          </div>
        </CardContent>
      </Card>
      <div className="mt-6 flex gap-2">
        <Button onClick={submit} disabled={create.isPending} data-testid="submit-item">Create item</Button>
        <Button variant="outline" onClick={() => router.push("/items")}>Cancel</Button>
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
