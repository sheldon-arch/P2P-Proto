/**
 * Seeded smoke + integrity test. Loads the real FMCG seed into the store and
 * verifies: (a) collections populate to expected magnitude, (b) the hero record
 * exists, (c) key foreign keys resolve, (d) the engine runs a real transition
 * against actual seed data (not just hand-built fixtures). This is the bridge
 * from "the engine works on fixtures" to "the engine works on the demo data".
 */
import { describe, it, expect, beforeAll } from "vitest";
import { store } from "@/lib/store/store";
import { buildSeedSnapshot, DEMO_PARAMS } from "@/lib/seed";
import { transition, legalActions } from "@/lib/services/transition-engine";

beforeAll(() => {
  store.load(buildSeedSnapshot());
});

describe("seed loads with expected magnitude", () => {
  it("company is Harvest Foods (FMCG)", () => {
    expect(DEMO_PARAMS.company).toBe("Harvest Foods");
    expect(DEMO_PARAMS.baseCurrency).toBe("USD");
  });

  it("populates the major collections", () => {
    expect(store.list("suppliers").length).toBeGreaterThanOrEqual(40);
    expect(store.list("items").length).toBeGreaterThanOrEqual(150);
    expect(store.list("tickets").length).toBeGreaterThanOrEqual(150); // history + live
    expect(store.list("budgets").length).toBeGreaterThanOrEqual(20);
    expect(store.list("users").length).toBeGreaterThanOrEqual(15);
    expect(store.list("scorecards").length).toBeGreaterThanOrEqual(40);
  });

  it("has the hero record", () => {
    const hero = store.get("tickets", "TKT-HERO");
    expect(hero).toBeDefined();
    expect(hero?.isHero).toBe(true);
    expect(hero?.stage).toBe("INITIATION");
  });
});

describe("referential integrity (sample FKs resolve)", () => {
  it("the hero ticket's supplier and requester exist", () => {
    const hero = store.get("tickets", "TKT-HERO")!;
    if (hero.supplierId) expect(store.get("suppliers", hero.supplierId as string)).toBeDefined();
    expect(store.get("users", hero.requesterId as string)).toBeDefined();
  });

  it("live POs reference existing suppliers (freight-forwarder POs reference a freight forwarder)", () => {
    const pos = store.list("purchaseOrders");
    expect(pos.length).toBeGreaterThan(0);
    for (const po of pos) {
      if (po.poType === "freight-forwarder") {
        // A19: a freight-forwarder PO's party is a freight forwarder, not a supplier.
        expect(store.get("freightForwarders", po.supplierId as string)).toBeDefined();
      } else {
        expect(store.get("suppliers", po.supplierId as string)).toBeDefined();
      }
    }
  });

  it("scorecards reference existing suppliers", () => {
    const scorecards = store.list("scorecards");
    let resolved = 0;
    for (const sc of scorecards) {
      const sid = (sc.supplierId ?? sc.supplier) as string | undefined;
      if (sid && store.get("suppliers", sid)) resolved++;
    }
    // the vast majority should resolve
    expect(resolved).toBeGreaterThan(scorecards.length * 0.8);
  });
});

describe("engine runs against real seed data", () => {
  it("an ACKNOWLEDGED live PO offers legal actions and can be amended", () => {
    const po = store.list("purchaseOrders").find((p) => p.status === "ACKNOWLEDGED");
    expect(po).toBeDefined();
    const id = (po!.id ?? po!.poNumber) as string;
    const actions = legalActions("purchaseOrders", id);
    // ACKNOWLEDGED PO can amend or close per the machine
    expect(actions).toContain("amend");
  });

  it("derives approval completions for INITIATION tickets and can approve them", () => {
    // the hero ticket has a derived chain; its first stage is IN_PROGRESS
    const heroCompletions = store
      .list("approvalCompletions")
      .filter((c) => c.recordId === "TKT-HERO")
      .sort((a, b) => Number(a.stageOrder) - Number(b.stageOrder));
    expect(heroCompletions.length).toBeGreaterThanOrEqual(3);
    expect(heroCompletions[0].completionStatus).toBe("IN_PROGRESS");

    // request approval then approve the first stage as a non-requester
    const first = heroCompletions[0];
    const id = first.completionId as string;
    const req = transition({ collection: "approvalCompletions", id, action: "requestApproval", actorId: "U-buyer" });
    expect(req.ok).toBe(true);
    const appr = transition({ collection: "approvalCompletions", id, action: "approve", actorId: "U-mgr" });
    expect(appr.ok).toBe(true);
    if (appr.ok) expect(appr.to).toBe("APPROVED");
  });

  it("suspending then reinstating an ONBOARDED supplier round-trips", () => {
    const sup = store.list("suppliers").find((s) => s.status === "ONBOARDED")!;
    const id = (sup.id ?? sup.identifier) as string;

    const suspend = transition({
      collection: "suppliers", id, action: "suspend",
      payload: { reason: "test audit finding" }, actorId: "U-qa", actorRole: "Quality",
    });
    expect(suspend.ok).toBe(true);
    if (suspend.ok) expect(suspend.to).toBe("SUSPENDED");

    const reinstate = transition({
      collection: "suppliers", id, action: "reinstate",
      actorId: "U-qa", actorRole: "Quality",
    });
    expect(reinstate.ok).toBe(true);
    if (reinstate.ok) expect(reinstate.to).toBe("ONBOARDED");
  });
});
