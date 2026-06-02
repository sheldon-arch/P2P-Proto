/**
 * MSW request handlers — the mock API. Routes:
 *   GET    /api/:entity                 -> store.list(entity) (filtered by query)
 *   GET    /api/:entity/:id             -> store.get(entity, id)
 *   POST   /api/:entity                 -> create (store.put with generated id)
 *   PATCH  /api/:entity/:id             -> store.patch
 *   POST   /api/:entity/:id/transition  -> transition-engine (the only mutator path)
 * Plus computed read routes (kpis, landed-cost, budget, ledger, reorder, discovery).
 *
 * The store lives in the same JS context as the UI and the tour, so a transition
 * fired by a screen and one fired by the tour hit the same store instance. The
 * field-visibility wall is applied on read using the X-Role header (defense in
 * depth; the client also guards).
 *
 * Deterministic latency (no Math.random) keeps the demo reproducible while still
 * exercising loading states the tour's settle() depends on.
 */
import { http, HttpResponse } from "msw";
import { store } from "@/lib/store/store";
import { transition, legalActions } from "@/lib/services/transition-engine";
import { stripHiddenFields } from "@/lib/rbac/field-visibility";
import { buildSeedSnapshot } from "@/lib/seed";
import { computeWorklist, buildReorderRequisition, type WorklistRow } from "@/lib/services/reorder-service";
import { splitAwardIntoPos, type AwardLine } from "@/lib/services/award-split";
import { eventBus } from "@/lib/events/event-bus";
import { DEMO_TODAY } from "@/lib/domain/constants";

// collection name -> the entity label used by field-visibility rules
const ENTITY_LABEL: Record<string, string> = {
  purchaseOrders: "PurchaseOrder",
  quotes: "Quotation",
  invoices: "Invoice",
  rfqs: "RFQ",
};

let latencySeq = 0;
function settleDelay(): Promise<void> {
  // 120..260ms deterministic cycle
  latencySeq = (latencySeq + 1) % 8;
  const ms = 120 + latencySeq * 20;
  return new Promise((r) => setTimeout(r, ms));
}

function roleOf(request: Request): string | undefined {
  return request.headers.get("x-role") ?? undefined;
}

function applyVisibility(entity: string, rows: Record<string, unknown>[], role: string | undefined) {
  const label = ENTITY_LABEL[entity];
  if (!label || !role) return rows;
  return rows.map((r) => stripHiddenFields(label, r, role));
}

function filterByQuery(rows: Record<string, unknown>[], url: URL): Record<string, unknown>[] {
  let out = rows;
  for (const [key, value] of url.searchParams.entries()) {
    if (["_sort", "_order", "_limit", "_page", "q"].includes(key)) continue;
    out = out.filter((r) => String(r[key] ?? "") === value);
  }
  const q = url.searchParams.get("q");
  if (q) {
    const needle = q.toLowerCase();
    out = out.filter((r) =>
      Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(needle)),
    );
  }
  return out;
}

export const handlers = [
  // ---- reset to a fresh deterministic seed (demo reset + test isolation) --
  http.post("/api/__reset", async () => {
    store.load(buildSeedSnapshot());
    return HttpResponse.json({ ok: true });
  }),

  // ---- computed: KPIs ------------------------------------------------
  http.get("/api/kpis", async () => {
    await settleDelay();
    // 12-month portfolio KPIs are precomputed in seed _index; expose with live counts.
    const suppliers = store.list("suppliers");
    const grades = { A: 0, B: 0, C: 0 } as Record<string, number>;
    for (const s of suppliers) {
      const g = (s.grade as string) ?? "";
      if (g in grades) grades[g] += 1;
    }
    return HttpResponse.json({
      otifPercent: 93.9,
      perfectOrderPercent: 88.9,
      dpoDays: 44.6,
      spend12mo: 125_000_000,
      grades,
      openExceptions: store.list("matchResults").filter((m) => m.matchStatus === "EXCEPTION").length,
    });
  }),

  // ---- computed: spend by category (analytics) ----------------------
  http.get("/api/spend", async () => {
    await settleDelay();
    const tickets = store.list("tickets");
    const byCategory: Record<string, number> = {};
    for (const t of tickets) {
      const cat = String(t.category ?? "Other");
      byCategory[cat] = (byCategory[cat] ?? 0) + Number(t.totalAmountInBase ?? 0);
    }
    const spend = Object.entries(byCategory)
      .map(([category, amount]) => ({ category, amount: Math.round(amount) }))
      .sort((a, b) => b.amount - a.amount);
    return HttpResponse.json({ spend });
  }),

  // ---- computed: reorder worklist (diagram 13) ----------------------
  http.get("/api/reorder-worklist", async () => {
    await settleDelay();
    const rows = computeWorklist({
      items: store.list("items"),
      inventory: store.list("inventory"),
      tickets: store.list("tickets"),
      requisitionLines: store.list("requisitionLines"),
    });
    return HttpResponse.json(rows);
  }),

  // ---- raise a replenishment requisition from a worklist row --------
  http.post("/api/reorder/raise", async ({ request }) => {
    await settleDelay();
    const body = (await request.json().catch(() => ({}))) as { row: WorklistRow };
    const row = body.row;
    if (!row) return HttpResponse.json({ error: "missing row" }, { status: 400 });
    // derive purchaseType from the primary supplier (Import if supplier is import-type)
    const supplier = row.primarySupplierId ? store.get("suppliers", row.primarySupplierId) : undefined;
    const purchaseType = (supplier?.purchaseType as "Local" | "Import") ?? "Local";
    const ticketId = store.nextId("TKT");
    const lineId = store.nextId("TL");
    const { ticket, line } = buildReorderRequisition({
      row, requesterId: request.headers.get("x-user-id") ?? "U-INV1",
      department: "Stores", purchaseType, demoToday: DEMO_TODAY, ticketId, lineId,
    });
    store.put("tickets", ticket);
    store.put("requisitionLines", line);
    eventBus.emit({ type: "reorder.raised", entity: "tickets", entityId: ticketId });
    return HttpResponse.json({ ticketId, ticket, line }, { status: 201 });
  }),

  // ---- award an RFQ: split awarded lines into one PO per supplier ---
  http.post("/api/rfq/:id/award", async ({ params, request }) => {
    await settleDelay();
    const rfqId = params.id as string;
    const body = (await request.json().catch(() => ({}))) as { awards: AwardLine[]; justification?: string };
    const awards = body.awards ?? [];
    if (awards.length === 0) return HttpResponse.json({ error: "no awards" }, { status: 400 });
    const rfq = store.get("rfqs", rfqId);
    const ticketId = (rfq?.ticketId as string) ?? (rfq?.requisitionId as string) ?? null;

    const split = splitAwardIntoPos(awards);
    const poIds: string[] = [];
    for (const po of split) {
      const poId = store.nextId("PO");
      store.put("purchaseOrders", {
        id: poId,
        ticketId,
        rfqId,
        supplierId: po.supplierId,
        status: "DRAFT",
        poDate: DEMO_TODAY,
        currency: po.currency,
        value: po.value,
        poValueInBase: po.value,
        lines: po.lines,
        fromMultiSupplierAward: split.length > 1,
      });
      poIds.push(poId);
    }
    store.patch("rfqs", rfqId, {
      status: "awarded",
      awardedSupplierIds: split.map((p) => p.supplierId),
      resultingPoIds: poIds,
      awardJustification: body.justification ?? null,
    });
    eventBus.emit({ type: "rfq.awarded", entity: "rfqs", entityId: rfqId, payload: { poIds } });
    return HttpResponse.json({ poIds, supplierCount: split.length }, { status: 201 });
  }),

  // ---- post a stock movement (ADJUSTMENT / TRANSFER) ----------------
  http.post("/api/stock-movement", async ({ request }) => {
    await settleDelay();
    const m = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const type = String(m.type ?? "ADJUSTMENT");
    if (type === "ADJUSTMENT" && !String(m.note ?? "").trim()) {
      return HttpResponse.json({ error: "ADJUSTMENT requires a note" }, { status: 400 });
    }
    function applyDelta(itemId: string, warehouseCode: string, delta: number, ref: string) {
      const bal = store.list("inventory").find((b) => b.itemId === itemId && b.warehouseCode === warehouseCode);
      const movementId = store.nextId("SMV");
      store.put("stockMovements", {
        id: movementId, itemId, warehouseCode, type, quantity: Math.abs(delta),
        direction: delta >= 0 ? "add" : "subtract", reference: ref, at: DEMO_TODAY, note: m.note ?? null,
      });
      if (bal) {
        const soh = Number(bal.stockOnHand ?? 0) + delta;
        store.patch("inventory", String(bal.id), {
          stockOnHand: soh, available: soh - Number(bal.allocated ?? 0), lastMovementAt: DEMO_TODAY,
        });
      }
    }
    if (type === "TRANSFER") {
      const qty = Number(m.quantity ?? 0);
      const orderId = store.nextId("MOV");
      applyDelta(String(m.itemId), String(m.sourceWarehouse), -qty, orderId);
      applyDelta(String(m.itemId), String(m.destWarehouse), qty, orderId);
    } else {
      const signed = String(m.direction) === "subtract" ? -Number(m.quantity ?? 0) : Number(m.quantity ?? 0);
      applyDelta(String(m.itemId), String(m.warehouseCode), signed, String(m.reference ?? "manual"));
    }
    return HttpResponse.json({ ok: true }, { status: 201 });
  }),

  // ---- computed: budget availability --------------------------------
  http.get("/api/budget/:id", async ({ params }) => {
    await settleDelay();
    const b = store.get("budgets", params.id as string);
    if (!b) return HttpResponse.json({ error: "not found" }, { status: 404 });
    return HttpResponse.json(b);
  }),

  // ---- legal actions for a record (UI gating) -----------------------
  http.get("/api/:entity/:id/actions", async ({ params }) => {
    await settleDelay();
    return HttpResponse.json({
      actions: legalActions(params.entity as string, params.id as string),
    });
  }),

  // ---- generic transition (the only mutator path) -------------------
  http.post("/api/:entity/:id/transition", async ({ params, request }) => {
    await settleDelay();
    const body = (await request.json().catch(() => ({}))) as {
      action: string;
      payload?: Record<string, unknown>;
    };
    const result = transition({
      collection: params.entity as string,
      id: params.id as string,
      action: body.action,
      payload: body.payload ?? {},
      actorId: request.headers.get("x-user-id") ?? "system",
      actorRole: roleOf(request) ?? "Platform / System",
    });
    if (!result.ok) {
      return HttpResponse.json({ error: result.error, code: result.code }, { status: 409 });
    }
    return HttpResponse.json(result.entity);
  }),

  // ---- generic list -------------------------------------------------
  http.get("/api/:entity", async ({ params, request }) => {
    await settleDelay();
    const entity = params.entity as string;
    const url = new URL(request.url);
    const rows = filterByQuery(store.list(entity), url);
    const visible = applyVisibility(entity, rows, roleOf(request));
    return HttpResponse.json(visible);
  }),

  // ---- generic get one ----------------------------------------------
  http.get("/api/:entity/:id", async ({ params, request }) => {
    await settleDelay();
    const entity = params.entity as string;
    const row = store.get(entity, params.id as string);
    if (!row) return HttpResponse.json({ error: "not found" }, { status: 404 });
    const [visible] = applyVisibility(entity, [row], roleOf(request));
    return HttpResponse.json(visible);
  }),

  // ---- generic create -----------------------------------------------
  http.post("/api/:entity", async ({ params, request }) => {
    await settleDelay();
    const entity = params.entity as string;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const id = (body.id as string) ?? store.nextId(entity.toUpperCase().slice(0, 3));
    const created = store.put(entity, { ...body, id });
    return HttpResponse.json(created, { status: 201 });
  }),

  // ---- generic patch ------------------------------------------------
  http.patch("/api/:entity/:id", async ({ params, request }) => {
    await settleDelay();
    const entity = params.entity as string;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const updated = store.patch(entity, params.id as string, body);
    if (!updated) return HttpResponse.json({ error: "not found" }, { status: 404 });
    return HttpResponse.json(updated);
  }),
];
