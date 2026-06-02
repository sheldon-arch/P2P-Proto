"use client";

/**
 * Stock adjustment (diagram 13 sub-flow). Post an ADJUSTMENT movement on a
 * physical-count variance, damage write-off, or correction. A note is mandatory.
 * The platform updates stock on hand, recomputes available, and re-evaluates the
 * reorder trigger (a downward adjustment can immediately surface the item).
 */
import { useState } from "react";
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
import { useList, usePostStockMovement } from "@/queries/hooks";

export default function AdjustPage() {
  const router = useRouter();
  const { data: inv } = useList<Record<string, unknown>>("inventory");
  const post = usePostStockMovement();
  const [f, setF] = useState({ balanceId: "", direction: "subtract", quantity: "", note: "" });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  const bal = (inv ?? []).find((b) => String(b.id) === f.balanceId);

  async function submit() {
    if (!bal) { toast.error("Select an item-warehouse balance."); return; }
    if (!f.note.trim()) { toast.error("A note is required for an adjustment."); return; }
    try {
      await post.mutateAsync({
        type: "ADJUSTMENT", itemId: bal.itemId, warehouseCode: bal.warehouseCode,
        direction: f.direction, quantity: Number(f.quantity) || 0, note: f.note, reference: "count-sheet",
      });
      toast.success("Adjustment posted; stock recomputed");
      router.push("/inventory");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div>
      <PageHeader title="Stock Adjustment" description="Post an ADJUSTMENT movement (note required)" />
      <Card className="max-w-xl">
        <CardHeader><CardTitle className="text-base">Adjustment</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Item / warehouse balance</Label>
            <Select value={f.balanceId} onValueChange={(v) => set("balanceId", v)}>
              <SelectTrigger className="mt-1" data-testid="adjust-balance"><SelectValue placeholder="Select balance" /></SelectTrigger>
              <SelectContent>
                {(inv ?? []).slice(0, 30).map((b) => (
                  <SelectItem key={String(b.id)} value={String(b.id)}>
                    {String(b.itemId)} · {String(b.warehouseCode)} (on hand {String(b.stockOnHand)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Direction</Label>
              <Select value={f.direction} onValueChange={(v) => set("direction", v)}>
                <SelectTrigger className="mt-1" data-testid="adjust-direction"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add (+)</SelectItem>
                  <SelectItem value="subtract">Subtract (-)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Quantity</Label>
              <Input value={f.quantity} onChange={(e) => set("quantity", e.target.value)} inputMode="decimal" className="mt-1 font-mono" data-testid="adjust-qty" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Note (required)</Label>
            <Textarea value={f.note} onChange={(e) => set("note", e.target.value)} className="mt-1" data-testid="adjust-note" placeholder="e.g. cycle-count variance, damage write-off" />
          </div>
        </CardContent>
      </Card>
      <RuleBanner tone="info" title="Re-evaluates reorder on post" testId="adjust-note-rule">
        Adjustments are immutable ledger entries. A downward adjustment can drop available below the
        reorder point and immediately surface the item on the worklist.
      </RuleBanner>
      <div className="mt-6 flex gap-2">
        <Button onClick={submit} disabled={post.isPending} data-testid="post-adjust">Post adjustment</Button>
        <Button variant="outline" onClick={() => router.push("/inventory")}>Cancel</Button>
      </div>
    </div>
  );
}
