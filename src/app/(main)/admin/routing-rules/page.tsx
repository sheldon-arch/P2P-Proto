"use client";

/**
 * Admin: Approval chain & routing rules (diagram 01 — Chain; e01 routing). Shows
 * the configurable approval verticals, their order, and per-stage approver
 * limits used by the nearest-bucket selection and auto-approval.
 */
import { PageHeader } from "@/components/patterns/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RuleBanner } from "@/components/patterns/RuleBanner";
import { DataTable, type Column } from "@/components/patterns/DataTable";

type Stage = Record<string, unknown>;
const STAGES: Stage[] = [
  { order: 1, vertical: "Req Department", limit: 75000, auto: "No", note: "Department manager review" },
  { order: 2, vertical: "Procurement", limit: 200000, auto: "No", note: "Buyer/category review" },
  { order: 3, vertical: "Finance", limit: 150000, auto: "Yes (≤ limit)", note: "Auto-approves within limit; else nearest-bucket" },
  { order: 4, vertical: "Management", limit: 1000000, auto: "No", note: "Terminal vertical" },
];
const columns: Column<Stage>[] = [
  { key: "order", header: "Order", mono: true },
  { key: "vertical", header: "Vertical" },
  { key: "limit", header: "Approver limit", mono: true, className: "text-right", render: (r) => `$${Number(r.limit).toLocaleString()}` },
  { key: "auto", header: "Auto-approve" },
  { key: "note", header: "Rule" },
];

export default function RoutingRules() {
  return (
    <div>
      <PageHeader title="Approval Chain & Routing" description="Configurable verticals, limits, and nearest-bucket routing" />
      <RuleBanner tone="info" title="Rules-based routing (no AI)" testId="routing-rules-info">
        Requisitions route through the verticals in order. Finance auto-approves within the approver
        limit; otherwise the system selects the minimum-sufficient approver bucket and breaks ties by
        least current load, weighted by urgency. Editing pay terms reverts an auto-approved finance
        stage for re-approval.
      </RuleBanner>
      <Card className="mt-4">
        <CardHeader><CardTitle className="text-base">Approval verticals</CardTitle></CardHeader>
        <CardContent>
          <DataTable<Stage> columns={columns} rows={STAGES} getRowId={(r) => String(r.order)} />
        </CardContent>
      </Card>
    </div>
  );
}
