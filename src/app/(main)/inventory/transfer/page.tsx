"use client";

/**
 * Inter-warehouse transfer (diagram 13 sub-flow). Moves stock between
 * warehouses: posts a TRANSFER debit on the source and a credit on the
 * destination (both share a movement order id). Source available is reduced.
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
import { useList, usePostStockMovement } from "@/queries/hooks";

export default function TransferPage() {
  const router = useRouter();
  const { data: inv } = useList<Record<string, unknown>>("inventory");
  const { data: whs } = useList<Record<string, unknown>>("warehouses");
  const post = usePostStockMovement();
  const [f, setF] = useState({ itemId: "", sourceWarehouse: "", destWarehouse: "", quantity: "" });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  const itemIds = [...new Set((inv ?? []).map((b) => String(b.itemId)))];

  async function submit() {
    if (!f.itemId || !f.sourceWarehouse || !f.destWarehouse || f.sourceWarehouse === f.destWarehouse) {
      toast.error("Pick an item and two different warehouses."); return;
    }
    try {
      await post.mutateAsync({
        type: "TRANSFER", itemId: f.itemId, sourceWarehouse: f.sourceWarehouse,
        destWarehouse: f.destWarehouse, quantity: Number(f.quantity) || 0,
      });
      toast.success("Transfer posted (debit + credit)");
      router.push("/inventory");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div>
      <PageHeader title="Inter-Warehouse Transfer" description="Move stock between warehouses (TRANSFER movements)" />
      <Card className="max-w-xl">
        <CardHeader><CardTitle className="text-base">Transfer</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Item</Label>
            <Select value={f.itemId} onValueChange={(v) => set("itemId", v)}>
              <SelectTrigger className="mt-1" data-testid="transfer-item"><SelectValue placeholder="Select item" /></SelectTrigger>
              <SelectContent>{itemIds.slice(0, 30).map((id) => <SelectItem key={id} value={id}>{id}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">From warehouse</Label>
              <Select value={f.sourceWarehouse} onValueChange={(v) => set("sourceWarehouse", v)}>
                <SelectTrigger className="mt-1" data-testid="transfer-source"><SelectValue placeholder="Source" /></SelectTrigger>
                <SelectContent>{(whs ?? []).map((w) => <SelectItem key={String(w.code)} value={String(w.code)}>{String(w.code)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">To warehouse</Label>
              <Select value={f.destWarehouse} onValueChange={(v) => set("destWarehouse", v)}>
                <SelectTrigger className="mt-1" data-testid="transfer-dest"><SelectValue placeholder="Destination" /></SelectTrigger>
                <SelectContent>{(whs ?? []).map((w) => <SelectItem key={String(w.code)} value={String(w.code)}>{String(w.code)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Quantity</Label>
            <Input value={f.quantity} onChange={(e) => set("quantity", e.target.value)} inputMode="decimal" className="mt-1 font-mono" data-testid="transfer-qty" />
          </div>
        </CardContent>
      </Card>
      <div className="mt-6 flex gap-2">
        <Button onClick={submit} disabled={post.isPending} data-testid="post-transfer">Post transfer</Button>
        <Button variant="outline" onClick={() => router.push("/inventory")}>Cancel</Button>
      </div>
    </div>
  );
}
