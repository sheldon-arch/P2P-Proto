"use client";

/**
 * e05 — Auto-create supplier/item from a free-text reference. When a requisition
 * line references an item or supplier that is not in the master (a non-UUID
 * free-text string), the system auto-creates it in PENDING_ONBOARDING (so the
 * requisition is never blocked) and routes it into the onboarding lifecycle.
 */
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RuleBanner } from "@/components/patterns/RuleBanner";
import { eventBus } from "@/lib/events/event-bus";

export default function AutoCreate() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<null | { kind: string; code: string }>(null);

  function resolve() {
    if (!text.trim()) return;
    // a UUID-like reference resolves to existing; free text auto-creates.
    const isUuid = /^[0-9a-f]{8}-/.test(text) || /^(ITM|SUP)-\d+$/i.test(text);
    if (isUuid) {
      setResult({ kind: "existing", code: text });
      toast.success("Resolved to existing master record");
    } else {
      const code = "ITM-NEW-0001";
      setResult({ kind: "auto-created", code });
      toast.success("Auto-created new item (Pending Onboarding)");
      // Lets the guided tour's Try-it step advance once the free-text item is
      // auto-created (the page is otherwise local state, no transition fires).
      eventBus.emit({ type: "item.autocreated", entity: "items", entityId: code, payload: { freeText: text } });
    }
  }

  return (
    <div>
      <PageHeader title="Auto-create from Free-text" description="Free-text reference resolution (e05)" />
      <Card className="max-w-xl">
        <CardHeader><CardTitle className="text-base">Item reference on a requisition line</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Label className="text-xs">Type an item code (e.g. ITM-0006) or free text (e.g. &quot;maltodextrin powder&quot;)</Label>
          <div className="flex gap-2">
            <Input value={text} onChange={(e) => setText(e.target.value)} data-testid="autocreate-input" placeholder="ITM-0006 or free text" />
            <Button onClick={resolve} data-testid="autocreate-resolve">Resolve</Button>
          </div>
          {result?.kind === "existing" && (
            <RuleBanner tone="success" title="Resolved to existing master" testId="autocreate-existing">
              Reference matched an existing item ({result.code}). The line uses the master record.
            </RuleBanner>
          )}
          {result?.kind === "auto-created" && (
            <RuleBanner tone="info" title="Auto-created: requisition not blocked" testId="autocreate-new">
              No master match. A new item ({result.code}) was auto-created in PENDING_ONBOARDING with
              the free text as its description; it enters the item onboarding lifecycle while the
              requisition proceeds.
            </RuleBanner>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
