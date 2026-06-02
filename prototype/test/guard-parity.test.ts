/**
 * Guard-parity tests — the centerpiece of the Phase 0 gate.
 *
 * Each test asserts the transition engine takes the EXACT branch the BPMN guard
 * specifies. These are the rules the prior build left "simplified for prototype"
 * (auto-approve limit, A3 completion, partial-installment remainder, supplier
 * auto-suspend, PO budget gate, SoD). A rule is not "done" until a test proves
 * it fires. BPMN flow ids are cited so the assertion traces to the diagram.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { store } from "@/lib/store/store";
import { transition } from "@/lib/services/transition-engine";

function seed(snapshot: Record<string, Record<string, unknown>[]>) {
  store.load(snapshot);
}

describe("Approval auto-approve (03-approval f10 / e01 GwThreshold / A7)", () => {
  beforeEach(() => {
    seed({
      approvalCompletions: [
        {
          completionId: "C1",
          recordId: "REQ-1",
          stage: "FINANCE",
          vertical: "FINANCE",
          completionStatus: "IN_PROGRESS",
          approverLimit: 200000,
          totalAmountInBase: 150000,
          isAutoApproved: false,
          stageOrder: 1,
        },
      ],
    });
  });

  it("auto-approves a FINANCE stage when amount <= approver limit", () => {
    const r = transition({ collection: "approvalCompletions", id: "C1", action: "autoApprove" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.to).toBe("APPROVED");
    expect(store.get("approvalCompletions", "C1")?.isAutoApproved).toBe(true);
  });

  it("REJECTS auto-approve when amount EXCEEDS the limit (the old build skipped this)", () => {
    store.patch("approvalCompletions", "C1", { totalAmountInBase: 250000 });
    const r = transition({ collection: "approvalCompletions", id: "C1", action: "autoApprove" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("GUARD_FAILED");
    expect(store.get("approvalCompletions", "C1")?.completionStatus).toBe("IN_PROGRESS");
  });

  it("REJECTS auto-approve on a non-FINANCE vertical", () => {
    store.patch("approvalCompletions", "C1", { stage: "DEPARTMENT", vertical: "DEPARTMENT" });
    const r = transition({ collection: "approvalCompletions", id: "C1", action: "autoApprove" });
    expect(r.ok).toBe(false);
  });
});

describe("Approval approve + SoD (03-approval ApproveDecision / A6)", () => {
  beforeEach(() => {
    seed({
      tickets: [{ id: "REQ-1", requesterId: "U-req", stage: "INITIATION" }],
      approvalCompletions: [
        { completionId: "C1", recordId: "REQ-1", stage: "DEPT", completionStatus: "AWAITING_APPROVAL", stageOrder: 1 },
      ],
    });
  });

  it("approves when actor is not the requester", () => {
    const r = transition({ collection: "approvalCompletions", id: "C1", action: "approve", actorId: "U-mgr" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.to).toBe("APPROVED");
  });

  it("BLOCKS self-approval (SoD)", () => {
    const r = transition({ collection: "approvalCompletions", id: "C1", action: "approve", actorId: "U-req" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("GUARD_FAILED");
  });

  it("routes the requisition INITIATION -> ORDERED when the last stage approves", () => {
    transition({ collection: "approvalCompletions", id: "C1", action: "approve", actorId: "U-mgr" });
    expect(store.get("tickets", "REQ-1")?.stage).toBe("ORDERED");
  });
});

describe("Installment partial vs full (10-payments / A9)", () => {
  beforeEach(() => {
    seed({
      installments: [{ id: "INST-1", scheduleId: "S1", poId: "PO-1", amount: 1000, agreedAmount: 1000, status: "PENDING" }],
    });
  });

  it("full approval when amount == agreed", () => {
    const r = transition({ collection: "installments", id: "INST-1", action: "approve", payload: { amount: 1000 } });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.to).toBe("APPROVED");
  });

  it("partial approval creates ONE remainder installment for the leftover", () => {
    const before = store.list("installments").length;
    const r = transition({ collection: "installments", id: "INST-1", action: "approve", payload: { amount: 600 } });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.to).toBe("PARTIAL_APPROVAL");
    const after = store.list("installments");
    expect(after.length).toBe(before + 1);
    const remainder = after.find((i) => i.isRemainder);
    expect(remainder?.amount).toBe(400);
    expect(store.get("installments", "INST-1")?.amount).toBe(600);
  });
});

describe("PO issue budget gate (05-purchase-order / A4)", () => {
  beforeEach(() => {
    seed({
      suppliers: [{ id: "SUP-1", status: "ONBOARDED" }],
      budgets: [{ id: "BUD-1", availableAmount: 100000, committedAmount: 0, actualAmount: 0 }],
      purchaseOrders: [{ id: "PO-1", supplierId: "SUP-1", budgetId: "BUD-1", poValueInBase: 80000, status: "DRAFT" }],
    });
  });

  it("issues and hard-commits budget (available down, committed up)", () => {
    const r = transition({ collection: "purchaseOrders", id: "PO-1", action: "issue", actorId: "U-buyer" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.to).toBe("ISSUED");
    const bud = store.get("budgets", "BUD-1");
    expect(bud?.availableAmount).toBe(20000);
    expect(bud?.committedAmount).toBe(80000);
  });

  it("BLOCKS issue when PO value exceeds available budget without override", () => {
    store.patch("purchaseOrders", "PO-1", { poValueInBase: 120000 });
    const r = transition({ collection: "purchaseOrders", id: "PO-1", action: "issue", actorId: "U-buyer" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("GUARD_FAILED");
  });

  it("ALLOWS over-budget issue WITH override (logged)", () => {
    store.patch("purchaseOrders", "PO-1", { poValueInBase: 120000 });
    const r = transition({ collection: "purchaseOrders", id: "PO-1", action: "issue", actorId: "U-buyer", payload: { budgetOverride: true } });
    expect(r.ok).toBe(true);
  });

  it("BLOCKS issue when supplier is not ONBOARDED", () => {
    store.patch("suppliers", "SUP-1", { status: "SUSPENDED" });
    const r = transition({ collection: "purchaseOrders", id: "PO-1", action: "issue", actorId: "U-buyer" });
    expect(r.ok).toBe(false);
  });
});

describe("NCR -> CAPA -> supplier auto-suspend (e04 / A11)", () => {
  beforeEach(() => {
    seed({
      suppliers: [{ id: "SUP-1", status: "ONBOARDED", belowThresholdStreak: 2 }],
      ncrs: [{ id: "NCR-1", supplierId: "SUP-1", status: "IN_CAPA" }],
    });
  });

  it("closing a CAPA that crosses the streak suspends the supplier (old build did NOT auto-trigger)", () => {
    const r = transition({ collection: "ncrs", id: "NCR-1", action: "closeCapa", actorId: "U-qa" });
    expect(r.ok).toBe(true);
    const sup = store.get("suppliers", "SUP-1");
    expect(sup?.belowThresholdStreak).toBe(3);
    expect(sup?.status).toBe("SUSPENDED");
  });
});

describe("Requisition completion A3 (00/02 / A3)", () => {
  it("BLOCKS completion when an NCR is still open", () => {
    seed({
      tickets: [{ id: "REQ-1", stage: "POST_DELIVERY", status: "IN_PROGRESS", totalAmountInBase: 5000 }],
      approvalCompletions: [{ completionId: "C1", recordId: "REQ-1", completionStatus: "APPROVED", stageOrder: 1 }],
      matchResults: [{ id: "M1", requisitionId: "REQ-1", matchStatus: "MATCHED" }],
      ncrs: [{ id: "NCR-1", requisitionId: "REQ-1", status: "RAISED" }],
    });
    const r = transition({ collection: "tickets", id: "REQ-1", action: "changeStatus", payload: { status: "COMPLETED" } });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("GUARD_FAILED");
  });

  it("COMPLETES when at POST_DELIVERY, all stages approved, matches cleared, no open NCR", () => {
    seed({
      tickets: [{ id: "REQ-1", stage: "POST_DELIVERY", status: "IN_PROGRESS", totalAmountInBase: 5000 }],
      approvalCompletions: [{ completionId: "C1", recordId: "REQ-1", completionStatus: "APPROVED", stageOrder: 1 }],
      matchResults: [{ id: "M1", requisitionId: "REQ-1", matchStatus: "MATCHED" }],
      ncrs: [],
    });
    const r = transition({ collection: "tickets", id: "REQ-1", action: "changeStatus", payload: { status: "COMPLETED" } });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.to).toBe("COMPLETED");
  });
});

describe("Idempotent re-entry (tour replay safety)", () => {
  it("re-firing a transition to the current state is a successful no-op", () => {
    seed({ suppliers: [{ id: "SUP-1", status: "SUSPENDED" }] });
    const r = transition({ collection: "suppliers", id: "SUP-1", action: "suspend", payload: { reason: "x" } });
    // already SUSPENDED, suspend targets SUSPENDED from ONBOARDED only -> no-op path
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.noop).toBe(true);
  });
});
