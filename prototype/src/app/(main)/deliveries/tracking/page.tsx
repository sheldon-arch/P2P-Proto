"use client";

/**
 * Inbound delivery tracking (diagram 08 — TrackAir/Sea/Road/Courier, Customs,
 * RecordBlock). Shows in-transit shipments by mode with their tracking refs,
 * customs status, and ETA; partial-delivery blocks are recorded against a PO.
 * Modes: Air (AWB), Sea (Bill of Lading) -> always road haulage, Road
 * (consignment note), Courier (tracking number).
 */
import { useState } from "react";
import { PageHeader } from "@/components/patterns/PageHeader";
import { RuleBanner } from "@/components/patterns/RuleBanner";
import { DataTable, type Column } from "@/components/patterns/DataTable";
import { StatusBadge } from "@/components/patterns/StatusBadge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Ship = Record<string, unknown>;
const SHIPMENTS: Record<string, Ship[]> = {
  Air: [{ id: "PO-HERO", ref: "MAWB 020-44119", carrier: "Cargolux", customs: "Bayan filed", eta: "2026-06-04", state: "upcoming" }],
  Sea: [{ id: "PO-LV-3", ref: "BL MSCU7781234", carrier: "MSC", customs: "Cleared", eta: "2026-06-02", state: "partial" }],
  Road: [{ id: "PO-HERO-CTN", ref: "LR 55821", carrier: "Inland Freight Co", customs: "Domestic", eta: "2026-06-01", state: "delivered" }],
  Courier: [{ id: "PO-LV-010", ref: "DHL 7741-2290", carrier: "DHL", customs: "n/a", eta: "2026-06-01", state: "delivered" }],
};

const columns: Column<Ship>[] = [
  { key: "id", header: "PO", mono: true },
  { key: "ref", header: "Tracking ref", mono: true },
  { key: "carrier", header: "Carrier" },
  { key: "customs", header: "Customs" },
  { key: "eta", header: "ETA", mono: true },
  { key: "state", header: "Status", render: (r) => <StatusBadge status={r.state as string} /> },
];

export default function DeliveryTracking() {
  const [mode, setMode] = useState("Air");
  return (
    <div>
      <PageHeader title="Inbound Tracking" description="In-transit shipments by transport mode" />
      <RuleBanner tone="info" title="Mode-specific tracking + customs + ETA alarm" testId="tracking-info">
        Air uses the AWB, sea the Bill of Lading (always followed by road haulage), road the
        consignment note, and courier a tracking number. International road/sea legs pass through
        customs (Bayan / bill of entry). An ETA alarm fires 5 days before the committed date, and an
        overdue shipment docks the supplier&apos;s on-time score. Partial deliveries are recorded as
        blocks against the PO.
      </RuleBanner>
      <Tabs value={mode} onValueChange={setMode} className="mt-4">
        <TabsList>
          {Object.keys(SHIPMENTS).map((m) => <TabsTrigger key={m} value={m} data-testid={`tracking-tab-${m}`}>{m}</TabsTrigger>)}
        </TabsList>
        {Object.entries(SHIPMENTS).map(([m, rows]) => (
          <TabsContent key={m} value={m} className="mt-3">
            <DataTable<Ship> columns={columns} rows={rows} getRowId={(r) => String(r.id)} emptyMessage={`No ${m} shipments.`} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
