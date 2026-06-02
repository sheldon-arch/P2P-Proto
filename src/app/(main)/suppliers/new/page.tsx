"use client";

/**
 * Supplier onboarding wizard (diagram 06). Steps map to the BPMN userTasks:
 *  1. Profile (CreateSupplier)         2. Tax & registration (TaxDetails)
 *  3. Qualification docs (QualDocs)    4. AVL scope + grade (AVL)
 *  5. ISO risk attributes (IsoAttributes)
 * Finishing creates the supplier in PENDING_ONBOARDING; the detail page then
 * drives requestApproval -> review -> approve via the engine.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Wizard, type WizardStep } from "@/components/patterns/Wizard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreate } from "@/queries/hooks";

const field = (label: string, node: React.ReactNode) => (
  <div className="mb-3"><Label className="text-xs">{label}</Label><div className="mt-1">{node}</div></div>
);

export default function NewSupplier() {
  const router = useRouter();
  const create = useCreate("suppliers");
  const [f, setF] = useState({
    name: "", classification: "External", purchaseType: "Local", currency: "USD",
    taxId: "", country: "", qualDoc: false, avlScope: "", grade: "B",
    riskTier: "low", esg: false, antiBribery: false,
  });
  const set = (k: string, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  const steps: WizardStep[] = [
    {
      id: "profile", title: "Profile",
      canProceed: f.name.trim().length > 0,
      content: (
        <div className="max-w-md">
          {field("Supplier name", <Input value={f.name} onChange={(e) => set("name", e.target.value)} data-testid="sup-name" placeholder="e.g. Northwind Ingredients" />)}
          {field("Classification", <SimpleSelect value={f.classification} onChange={(v) => set("classification", v)} options={["Internal", "External"]} testId="sup-class" />)}
          {field("Purchase type", <SimpleSelect value={f.purchaseType} onChange={(v) => set("purchaseType", v)} options={["Local", "Import"]} testId="sup-ptype" />)}
          {field("Deal currency", <SimpleSelect value={f.currency} onChange={(v) => set("currency", v)} options={["USD", "EUR", "GBP", "CHF", "INR"]} testId="sup-ccy" />)}
        </div>
      ),
    },
    {
      id: "tax", title: "Tax & registration",
      content: (
        <div className="max-w-md">
          {field("Tax / VAT ID", <Input value={f.taxId} onChange={(e) => set("taxId", e.target.value)} data-testid="sup-taxid" />)}
          {field("Country of registration", <Input value={f.country} onChange={(e) => set("country", e.target.value)} data-testid="sup-country" />)}
        </div>
      ),
    },
    {
      id: "qual", title: "Qualification docs",
      content: (
        <div className="max-w-md">
          <div className="flex items-center gap-2">
            <Checkbox id="qd" checked={f.qualDoc} onCheckedChange={(c) => set("qualDoc", c === true)} data-testid="sup-qualdoc" />
            <Label htmlFor="qd" className="text-sm">Qualification documents + certifications on file</Label>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Food-grade certifications (FCC/ISO 22000), audits, COA capability.</p>
        </div>
      ),
    },
    {
      id: "avl", title: "AVL & grade",
      content: (
        <div className="max-w-md">
          {field("AVL scope of approval", <Input value={f.avlScope} onChange={(e) => set("avlScope", e.target.value)} data-testid="sup-avl" placeholder="e.g. flavors, packaging" />)}
          {field("Initial grade", <SimpleSelect value={f.grade} onChange={(v) => set("grade", v)} options={["A", "B", "C"]} testId="sup-grade" />)}
        </div>
      ),
    },
    {
      id: "iso", title: "ISO risk",
      content: (
        <div className="max-w-md space-y-2">
          {field("Risk tier", <SimpleSelect value={f.riskTier} onChange={(v) => set("riskTier", v)} options={["low", "medium", "high", "critical"]} testId="sup-risk" />)}
          <div className="flex items-center gap-2"><Checkbox id="esg" checked={f.esg} onCheckedChange={(c) => set("esg", c === true)} data-testid="sup-esg" /><Label htmlFor="esg" className="text-sm">ESG / sustainability assessed (ISO 20400)</Label></div>
          <div className="flex items-center gap-2"><Checkbox id="ab" checked={f.antiBribery} onCheckedChange={(c) => set("antiBribery", c === true)} data-testid="sup-ab" /><Label htmlFor="ab" className="text-sm">Anti-bribery declaration (ISO 37001)</Label></div>
        </div>
      ),
    },
  ];

  async function finish() {
    try {
      const created = await create.mutateAsync({
        name: f.name, classification: f.classification, purchaseType: f.purchaseType,
        currency: f.currency, dealCurrency: f.currency, status: "PENDING_ONBOARDING",
        grade: f.grade, avlScopeOfApproval: f.avlScope, riskTier: f.riskTier,
        taxId: f.taxId, country: f.country,
      });
      toast.success("Supplier created (Pending Onboarding)");
      router.push(`/suppliers/${(created as { id: string }).id}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div>
      <PageHeader title="Onboard Supplier" description="Create and qualify a new supplier" />
      <Wizard steps={steps} onFinish={finish} finishLabel="Create supplier" finishing={create.isPending} />
    </div>
  );
}

function SimpleSelect({ value, onChange, options, testId }: { value: string; onChange: (v: string) => void; options: string[]; testId?: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger data-testid={testId}><SelectValue /></SelectTrigger>
      <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
    </Select>
  );
}
