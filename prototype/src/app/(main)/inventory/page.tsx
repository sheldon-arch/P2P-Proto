"use client";

/**
 * Inventory reorder worklist (diagram 13) — the demand signal that starts the
 * golden path. Surfaces item-warehouse balances at/below reorder point (deduped
 * against open requisitions), shows suggested quantity, lead time, and supplier,
 * sorted by urgency, with a one-click "Raise requisition" that creates a
 * pre-filled draft and navigates to it.
 */
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Boxes, ArrowLeftRight, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/patterns/PageHeader";
import { RuleBanner } from "@/components/patterns/RuleBanner";
import { DataTable, type Column } from "@/components/patterns/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useReorderWorklist, useRaiseReorder } from "@/queries/hooks";
import { cn } from "@/lib/utils";

type Row = Record<string, unknown>;

function UrgencyBadge({ u }: { u: string }) {
  const map: Record<string, string> = {
    critical: "border-status-danger/30 bg-status-danger-bg text-status-danger",
    low: "border-status-warning/40 bg-status-warning-bg text-status-warning",
    reorder: "border-status-info/30 bg-status-info-bg text-status-info",
  };
  const label = u === "critical" ? "Critical" : u === "low" ? "Low" : "Reorder";
  return <Badge variant="outline" className={cn("font-medium", map[u])}>{label}</Badge>;
}

export default function InventoryPage() {
  const router = useRouter();
  const { data, isLoading, error } = useReorderWorklist<Row>();
  const raise = useRaiseReorder();

  const columns: Column<Row>[] = [
    { key: "urgency", header: "Urgency", render: (r) => <UrgencyBadge u={String(r.urgency)} /> },
    { key: "itemCode", header: "Item", mono: true, render: (r) => `${r.itemCode}` },
    { key: "description", header: "Description" },
    { key: "warehouseCode", header: "Warehouse", mono: true },
    { key: "available", header: "Available", mono: true, className: "text-right" },
    { key: "reorderPoint", header: "Reorder Pt", mono: true, className: "text-right" },
    { key: "suggestedQty", header: "Suggested", mono: true, className: "text-right",
      render: (r) => `${Number(r.suggestedQty).toLocaleString()} ${r.purchaseUom ?? ""}` },
    { key: "leadTimeDays", header: "Lead (d)", mono: true, className: "text-right" },
    { key: "primarySupplierId", header: "Supplier", mono: true },
    { key: "_action", header: "", render: (r) => (
      <div className="flex items-center justify-end gap-1">
        <Button
          size="sm"
          data-testid={`raise-${r.itemId}`}
          disabled={raise.isPending}
          onClick={async (e) => {
            e.stopPropagation();
            try {
              const res = await raise.mutateAsync(r);
              toast.success(`Replenishment requisition raised for ${r.itemCode}`);
              router.push(`/requisitions/${res.ticketId}`);
            } catch (err) {
              toast.error((err as Error).message);
            }
          }}
        >
          Raise requisition
        </Button>
        <Button size="sm" variant="ghost" data-testid={`defer-${r.itemId}`}
          onClick={(e) => { e.stopPropagation(); toast.success(`${r.itemCode} deferred (snoozed with reminder)`); }}>
          Defer
        </Button>
        <Button size="sm" variant="ghost" data-testid={`investigate-${r.itemId}`}
          onClick={(e) => { e.stopPropagation(); toast.success(`${r.itemCode} flagged for investigation`); }}>
          Investigate
        </Button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader
        title="Inventory Reorder Worklist"
        description="Items at or below reorder point — the demand signal for replenishment"
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline" data-testid="link-adjust"><Link href="/inventory/adjust"><SlidersHorizontal className="mr-1 h-4 w-4" /> Adjust</Link></Button>
            <Button asChild variant="outline" data-testid="link-transfer"><Link href="/inventory/transfer"><ArrowLeftRight className="mr-1 h-4 w-4" /> Transfer</Link></Button>
            <Button asChild variant="outline" data-testid="link-stock"><Link href="/inventory/stock"><Boxes className="mr-1 h-4 w-4" /> All stock</Link></Button>
          </div>
        }
      />
      <RuleBanner tone="info" title="Reorder-point replenishment" tourId="inventory.worklist" testId="reorder-rule">
        When an item&apos;s available quantity (stock on hand minus allocated) falls to or below its
        reorder point, it surfaces here with a suggested order quantity (max stock minus available)
        and its lead time. Raising a requisition creates a pre-filled draft and joins the standard
        approval-to-PO flow. Items with an open requisition are hidden until it closes.
      </RuleBanner>
      <div className="mt-4">
        <DataTable<Row>
          columns={columns}
          rows={data}
          isLoading={isLoading}
          error={error}
          getRowId={(r) => String(r.id)}
          emptyMessage="Nothing below reorder point."
        />
      </div>
    </div>
  );
}
