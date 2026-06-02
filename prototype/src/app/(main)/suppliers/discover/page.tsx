"use client";

/**
 * Supplier discovery / market analysis (diagram 04 — MarketAnalysis, Prequalify).
 * Surfaces candidate suppliers by HS code and keyword (a MOCKED B2B directory per
 * scope-and-gaps — the discovery UI and the lead-to-onboarding handoff are real,
 * only the data source is mocked). Buyers route promising candidates to
 * onboarding.
 */
import Link from "next/link";
import { PageHeader } from "@/components/patterns/PageHeader";
import { RuleBanner } from "@/components/patterns/RuleBanner";
import { DataTable, type Column } from "@/components/patterns/DataTable";
import { Button } from "@/components/ui/button";
import { useList } from "@/queries/hooks";

type Candidate = Record<string, unknown>;
const columns: Column<Candidate>[] = [
  { key: "name", header: "Candidate" },
  { key: "country", header: "Country" },
  { key: "hsCodes", header: "HS codes", mono: true, render: (r) => (r.hsCodes as string[] | undefined)?.join(", ") ?? "—" },
  { key: "marketRateHint", header: "Market rate", mono: true, className: "text-right", render: (r) => (r.marketRateHint ? `~$${r.marketRateHint}` : "—") },
  { key: "_a", header: "", render: () => (
    <Button asChild size="sm" variant="outline" data-testid="discover-onboard"><Link href="/suppliers/new">Route to onboarding</Link></Button>
  ) },
];

export default function SupplierDiscover() {
  const { data, isLoading, error } = useList<Candidate>("discoveryCandidates");
  return (
    <div>
      <PageHeader title="Supplier Discovery" description="Find and prequalify candidate suppliers by HS code & keyword" />
      <RuleBanner tone="info" title="Candidate directory (mocked source)" testId="discover-info">
        Candidates are matched by HS code and keyword. In the prototype this list is a mocked
        directory; the discovery workflow and the lead-to-onboarding handoff are real. Prequalify a
        candidate (AVL, certs, risk) by routing it into supplier onboarding.
      </RuleBanner>
      <div className="mt-4">
        <DataTable<Candidate> columns={columns} rows={data} isLoading={isLoading} error={error} getRowId={(r) => String(r.id)} emptyMessage="No candidates." />
      </div>
    </div>
  );
}
