"use client";

/**
 * Supplier PO view + acknowledge + dispatch (diagram 05/08). Acknowledging the
 * PO fires the same `acknowledge` transition the internal app would (triggering
 * advance payment per terms); marking dispatched records the shipment.
 */
import { use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/patterns/StatusBadge";
import { useOne, useTransition, useUpdate } from "@/queries/hooks";

export default function PortalPo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: po } = useOne<Record<string, unknown>>("purchaseOrders", id);
  const transition = useTransition("purchaseOrders");
  const update = useUpdate("purchaseOrders");

  if (!po) return <p className="text-sm text-muted-foreground" data-testid="portal-po-loading">Loading…</p>;
  const status = po.status as string;

  async function acknowledge() {
    try {
      await transition.mutateAsync({ id, action: "acknowledge", payload: {} });
      toast.success("PO acknowledged — advance payment triggered per terms");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  async function dispatch() {
    try {
      await update.mutateAsync({ id, body: { dispatched: true, dispatchedAt: "2026-06-01" } });
      toast.success("Marked dispatched — shipment documents shared");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div>
      <PageHeader title={`PO ${id}`} description="Purchase order from Harvest Foods" actions={<StatusBadge status={status} />} />
      <Card>
        <CardHeader><CardTitle className="text-base">Order</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
            <Row label="Incoterm" value={String(po.incoterm ?? "—")} />
            <Row label="Currency" value={String(po.currency ?? "—")} />
            <Row label="Value" value={po.value ? `${po.currency ?? ""} ${Number(po.value).toLocaleString()}` : "—"} mono />
          </dl>
        </CardContent>
      </Card>
      <div className="mt-6 flex gap-2">
        {status === "ISSUED" && (
          <Button onClick={acknowledge} disabled={transition.isPending} data-testid="portal-acknowledge">Acknowledge PO</Button>
        )}
        {status === "ACKNOWLEDGED" && !po.dispatched && (
          <Button onClick={dispatch} disabled={update.isPending} data-testid="portal-dispatch">Mark dispatched</Button>
        )}
        {status === "DRAFT" && (
          <p className="text-sm text-muted-foreground" data-testid="portal-po-draft">This PO has not been issued yet.</p>
        )}
        <Button variant="outline" onClick={() => router.push("/portal")}>Back</Button>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono text-sm" : "text-sm"}>{value}</dd>
    </div>
  );
}
