"use client";

/**
 * e06 — Bulk import (all-or-nothing). A wizard: pick a master, download the
 * template, upload a file, see validation (row-level errors accumulate; any
 * error rejects the whole file — no partial import), then a success result.
 * The parse/upsert is stubbed (scope-and-gaps); the pattern and the
 * all-or-nothing rule are demonstrated.
 */
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Wizard, type WizardStep } from "@/components/patterns/Wizard";
import { RuleBanner } from "@/components/patterns/RuleBanner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Download, Upload } from "lucide-react";

const MASTERS = ["suppliers", "items", "currencies", "tax codes", "UoM", "warehouses", "payment terms", "projects", "budgets"];

export default function BulkImport() {
  const [master, setMaster] = useState("items");
  const [scenario, setScenario] = useState<"clean" | "errors" | null>(null);

  const steps: WizardStep[] = [
    {
      id: "pick", title: "Select master",
      content: (
        <div className="max-w-sm">
          <Label className="text-xs">Master to import</Label>
          <Select value={master} onValueChange={setMaster}>
            <SelectTrigger className="mt-1" data-testid="import-master"><SelectValue /></SelectTrigger>
            <SelectContent>{MASTERS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="mt-3" data-testid="download-template">
            <Download className="mr-1 h-4 w-4" /> Download {master} template
          </Button>
        </div>
      ),
    },
    {
      id: "upload", title: "Upload & validate",
      content: (
        <div className="max-w-md space-y-3">
          <p className="text-sm text-muted-foreground">Upload a CSV/XLSX with the exact template header. Pick a sample to validate:</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setScenario("clean")} data-testid="upload-clean"><Upload className="mr-1 h-4 w-4" /> Upload clean file</Button>
            <Button variant="outline" onClick={() => setScenario("errors")} data-testid="upload-errors"><Upload className="mr-1 h-4 w-4" /> Upload file with errors</Button>
          </div>
          {scenario === "clean" && (
            <RuleBanner tone="success" title="Validation passed: 42 rows ready" testId="import-valid">
              All rows valid against the {master} template. Importing upserts by natural key.
            </RuleBanner>
          )}
          {scenario === "errors" && (
            <RuleBanner tone="danger" title="3 row errors: file rejected (all-or-nothing)" testId="import-errors">
              Row 7: missing required column &quot;UoM&quot;. Row 12: duplicate natural key. Row 28:
              invalid currency code. No rows are imported until every error is fixed.
            </RuleBanner>
          )}
        </div>
      ),
    },
    {
      id: "result", title: "Result",
      canProceed: scenario === "clean",
      content: (
        <RuleBanner tone={scenario === "clean" ? "success" : "warning"} title={scenario === "clean" ? "Ready to import" : "Fix errors first"}>
          {scenario === "clean" ? "Confirm to upsert 42 rows by natural key." : "Re-upload a clean file to proceed."}
        </RuleBanner>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Bulk Import" description="All-or-nothing master data import (e06)" />
      <Wizard
        steps={steps}
        finishLabel="Import"
        onFinish={() => toast.success(`Imported 42 ${master} (upsert by natural key)`)}
      />
    </div>
  );
}
