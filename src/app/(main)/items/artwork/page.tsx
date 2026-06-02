"use client";

/**
 * e10 — Artwork / New-Product-Development approval. Demonstrates the NPD sample
 * loop and PARALLEL multi-reviewer artwork approval (Marketing, Quality, and a
 * Language reviewer review concurrently; all must approve before the artwork is
 * released). Reviewers are independent — the gate clears only when all pass.
 */
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RuleBanner } from "@/components/patterns/RuleBanner";
import { StatusBadge } from "@/components/patterns/StatusBadge";
import { CheckCircle2, Clock } from "lucide-react";

type Reviewer = { id: string; role: string; status: "PENDING" | "APPROVED" };

export default function ArtworkNpd() {
  const [reviewers, setReviewers] = useState<Reviewer[]>([
    { id: "mkt", role: "Marketing (brand)", status: "PENDING" },
    { id: "qa", role: "Quality (claims/compliance)", status: "PENDING" },
    { id: "lang", role: "Language reviewer (regulatory text)", status: "PENDING" },
  ]);

  const allApproved = reviewers.every((r) => r.status === "APPROVED");

  function approve(id: string) {
    setReviewers((prev) => prev.map((r) => (r.id === id ? { ...r, status: "APPROVED" } : r)));
    toast.success("Reviewer approved");
  }

  return (
    <div>
      <PageHeader title="Artwork / NPD Approval" description="Parallel multi-reviewer artwork approval (e10)" />

      <RuleBanner tone="info" title="Parallel approval — all reviewers must approve" testId="artwork-parallel">
        New own-brand packaging artwork is reviewed concurrently by Marketing, Quality, and the
        Language reviewer. The reviews are independent; the artwork is released only when all three
        approve. This follows the NPD sample loop.
      </RuleBanner>

      <Card className="mt-4 max-w-xl">
        <CardHeader><CardTitle className="text-base">Reviewers</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {reviewers.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-md border px-3 py-2" data-testid={`reviewer-${r.id}`}>
              <div className="flex items-center gap-2">
                {r.status === "APPROVED" ? <CheckCircle2 className="h-4 w-4 text-status-success" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
                <span className="text-sm">{r.role}</span>
                <StatusBadge status={r.status} />
              </div>
              {r.status === "PENDING" && (
                <Button size="sm" onClick={() => approve(r.id)} data-testid={`approve-${r.id}`}>Approve</Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {allApproved && (
        <RuleBanner tone="success" title="Artwork released" testId="artwork-released">
          All reviewers approved. The artwork is released and the NPD item can proceed to sourcing.
        </RuleBanner>
      )}
    </div>
  );
}
