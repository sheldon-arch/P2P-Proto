"use client";

/**
 * New requisition form. Demonstrates: category/type/priority dropdowns from
 * enums, a dynamic import field (HS code appears when purchaseType = Import),
 * line items, a live budget soft-check warning when the total exceeds the
 * selected budget's available amount, and submit -> creates the ticket and
 * navigates to its detail. Create == edit (same form), RHF + Zod.
 */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/patterns/PageHeader";
import { RuleBanner } from "@/components/patterns/RuleBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Info } from "lucide-react";
import { useList, useCreate } from "@/queries/hooks";
import { useSession } from "@/lib/session/SessionProvider";

// `priceAutoFilled` tracks whether the est. unit price was pre-filled from the
// item master (vs typed by the requester). We only auto-fill while it is still
// auto-filled/blank, so a value the requester edited is never clobbered.
type LineDraft = { itemId: string; quantity: string; unitPrice: string; hsCode: string; priceAutoFilled: boolean };

const CATEGORIES = ["Items", "Spares", "Services", "ProductDesign"];
const DIRECTIONS = ["Direct", "Indirect"];
const TYPES = ["Local", "Import"];
const PRIORITIES = ["ASAP", "SameDay", "Within2Days", "Within1Week"];

export default function NewRequisition() {
  const router = useRouter();
  const { user } = useSession();
  const create = useCreate("tickets");
  const createLine = useCreate("requisitionLines");
  const { data: budgets } = useList<Record<string, unknown>>("budgets");
  // Item master, used to pre-fill a budgetary estimate (lastPurchasePrice) when
  // the requester picks a known item. The requester rarely knows the real price
  // at intake; the binding price is established later at sourcing (see hint).
  const { data: items } = useList<Record<string, unknown>>("items");

  const [category, setCategory] = useState("Items");
  const [direction, setDirection] = useState("Direct");
  const [purchaseType, setPurchaseType] = useState("Local");
  const [priority, setPriority] = useState("Within1Week");
  const [budgetId, setBudgetId] = useState<string>("");
  const [justification, setJustification] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([{ itemId: "", quantity: "", unitPrice: "", hsCode: "", priceAutoFilled: false }]);

  const isImport = purchaseType === "Import";

  // Last purchase price for a typed item id (the budgetary estimate). Items are
  // matched on `id` (e.g. "ITM-0006"); `code` is a non-unique structured string.
  function estPriceFor(itemId: string): string {
    const it = (items ?? []).find((x) => String(x.id) === itemId.trim());
    return it && it.lastPurchasePrice != null ? String(Number(it.lastPurchasePrice)) : "";
  }

  const total = useMemo(
    () => lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0),
    [lines],
  );

  const selectedBudget = (budgets ?? []).find((b) => b.id === budgetId);
  const available = selectedBudget ? Number(selectedBudget.availableAmount) : undefined;
  const overBudget = available != null && total > available;

  function setLine(i: number, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function submit() {
    if (lines.every((l) => !l.itemId)) {
      toast.error("Add at least one line item.");
      return;
    }
    if (overBudget && justification.trim() === "") {
      toast.error("Over budget: a justification (override) is required.");
      return;
    }
    try {
      const created = await create.mutateAsync({
        identifier: undefined, // engine/store assigns
        requesterId: user.id,
        departmentId: user.department,
        category, directOrIndirect: direction, purchaseType, priority,
        currency: "USD", stage: "INITIATION", status: "IN_PROGRESS",
        totalAmount: total, totalAmountInBase: total,
        budgetId: budgetId || undefined,
        budgetOverride: overBudget ? { approvedBy: user.id, reason: justification } : undefined,
      });
      const ticketId = (created as { id: string }).id;
      // persist each line item so the requisition detail shows them
      await Promise.all(
        lines
          .filter((l) => l.itemId.trim())
          .map((l) =>
            createLine.mutateAsync({
              ticketId,
              itemId: l.itemId,
              quantity: Number(l.quantity) || 0,
              unitPrice: Number(l.unitPrice) || 0,
              hsCode: isImport ? l.hsCode || undefined : undefined,
              unitOfMeasure: "EA",
            }),
          ),
      );
      toast.success("Requisition created");
      router.push(`/requisitions/${ticketId}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div>
      <PageHeader title="New Requisition" description="Raise a purchase requisition" />

      <Card>
        <CardHeader><CardTitle className="text-base">Header</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Field label="Category">
            <SelectInput value={category} onChange={setCategory} options={CATEGORIES} testId="field-category" />
          </Field>
          <Field label="Direct / Indirect">
            <SelectInput value={direction} onChange={setDirection} options={DIRECTIONS} testId="field-direction" />
          </Field>
          <Field label="Purchase Type">
            <SelectInput value={purchaseType} onChange={setPurchaseType} options={TYPES} testId="field-purchaseType" />
          </Field>
          <Field label="Priority">
            <SelectInput value={priority} onChange={setPriority} options={PRIORITIES} testId="field-priority" />
          </Field>
          <Field label="Budget (cost center)">
            <Select value={budgetId} onValueChange={setBudgetId}>
              <SelectTrigger data-testid="field-budget"><SelectValue placeholder="Select budget" /></SelectTrigger>
              <SelectContent>
                {(budgets ?? []).slice(0, 20).map((b) => (
                  <SelectItem key={b.id as string} value={b.id as string}>
                    {String(b.projectId)} · {String(b.period)} (${Number(b.availableAmount).toLocaleString()} avail)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle className="text-base">Line items</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-12 items-end gap-2" data-testid="line-row">
              <div className="col-span-4">
                <Label className="text-xs">Item code</Label>
                <Input
                  value={l.itemId}
                  onChange={(e) => {
                    const itemId = e.target.value;
                    // Pre-fill the budgetary estimate from the item master, but
                    // only while the price is still auto-filled or blank (never
                    // overwrite a price the requester typed themselves).
                    if (l.priceAutoFilled || l.unitPrice === "") {
                      const est = estPriceFor(itemId);
                      setLine(i, { itemId, unitPrice: est, priceAutoFilled: est !== "" });
                    } else {
                      setLine(i, { itemId });
                    }
                  }}
                  placeholder="ITM-0006 or free text"
                  data-testid="line-item"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Qty</Label>
                <Input value={l.quantity} onChange={(e) => setLine(i, { quantity: e.target.value })} inputMode="decimal" data-testid="line-qty" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Est. unit price</Label>
                <Input
                  value={l.unitPrice}
                  onChange={(e) => setLine(i, { unitPrice: e.target.value, priceAutoFilled: false })}
                  inputMode="decimal"
                  placeholder="optional"
                  data-testid="line-price"
                />
              </div>
              {isImport && (
                <div className="col-span-3">
                  <Label className="text-xs">HS code (import)</Label>
                  <Input value={l.hsCode} onChange={(e) => setLine(i, { hsCode: e.target.value })} placeholder="2942..." data-testid="line-hscode" />
                </div>
              )}
              <div className="col-span-1">
                <Button variant="ghost" size="icon" onClick={() => setLines((p) => p.filter((_, idx) => idx !== i))} aria-label="Remove line">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setLines((p) => [...p, { itemId: "", quantity: "", unitPrice: "", hsCode: "", priceAutoFilled: false }])} data-testid="add-line">
            <Plus className="mr-1 h-4 w-4" /> Add line
          </Button>
          <div className="flex justify-end pt-2 text-sm">
            <span className="text-muted-foreground">Est. total:&nbsp;</span>
            <span className="font-mono font-semibold" data-testid="req-total">${total.toLocaleString()}</span>
          </div>
          <div
            className="mt-1 flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground"
            data-tour-id="req.price-note"
            data-testid="req-price-note"
          >
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Estimated price is optional and pre-filled from the item&apos;s last purchase price. It is used only for the
              budget check. The firm price is set later, competitively, at sourcing.
            </span>
          </div>
        </CardContent>
      </Card>

      {overBudget && (
        <RuleBanner tone="warning" title="Over available budget (soft check)" testId="budget-over-banner">
          Total ${total.toLocaleString()} exceeds the selected budget&apos;s available
          ${available?.toLocaleString()}. The soft check warns now; the hard commit is at PO issue.
          A justification (override) is required to submit.
          <Textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Override reason…"
            className="mt-2 text-sm"
            data-testid="override-reason"
          />
        </RuleBanner>
      )}

      <div className="mt-6 flex gap-2">
        <Button onClick={submit} disabled={create.isPending} data-testid="submit-requisition">
          Submit requisition
        </Button>
        <Button variant="outline" onClick={() => router.push("/requisitions")}>Cancel</Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function SelectInput({ value, onChange, options, testId }: { value: string; onChange: (v: string) => void; options: string[]; testId?: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger data-testid={testId}><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
