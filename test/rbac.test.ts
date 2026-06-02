/**
 * RBAC + field-visibility tests. Locks the permission resolver behavior and the
 * QA commercial-field wall (one of the two defects in the prior build — the
 * Quality role must never see prices / PO value / landed cost).
 */
import { describe, it, expect } from "vitest";
import { levelFor, useCan, canWithCondition, navForRole, type CurrentUser } from "@/lib/rbac/rbac";
import { isFieldHidden, stripHiddenFields } from "@/lib/rbac/field-visibility";

const buyer: CurrentUser = {
  id: "U-buyer", name: "Buyer", roleId: "buyer", isSystemAdmin: false,
  designationRank: 4, department: "Procurement",
};
const requester: CurrentUser = {
  id: "U-req", name: "Req", roleId: "requester", isSystemAdmin: false,
  designationRank: 2, department: "Production",
};
const admin: CurrentUser = {
  id: "U-admin", name: "Admin", roleId: "administrator", isSystemAdmin: true,
  designationRank: 7, department: "IT",
};

describe("permission resolver", () => {
  it("administrator (SystemAdmin) is granted everything", () => {
    expect(levelFor(admin, "Requisition create/edit/submit")).toBe("G");
    expect(levelFor(admin, "Payments approve (release)")).toBe("G");
  });

  it("requester can create requisitions but not approve them", () => {
    expect(useCan(requester, "Requisition create/edit/submit")).toBe(true);
    expect(useCan(requester, "Approval request/approve")).toBe(false);
  });

  it("buyer has sourcing permissions", () => {
    expect(useCan(buyer, "RFQ create/invite/view")).toBe(true);
  });
});

describe("SoD conditions (A6)", () => {
  it("blocks approving one's own record", () => {
    const approver: CurrentUser = { ...buyer, roleId: "approver" };
    const can = canWithCondition(approver, "Approval request/approve", { recordOwnerId: approver.id });
    expect(can).toBe(false);
  });

  it("allows approving another's record", () => {
    const approver: CurrentUser = { ...buyer, roleId: "approver" };
    const can = canWithCondition(approver, "Approval request/approve", { recordOwnerId: "someone-else" });
    expect(can).toBe(true);
  });
});

describe("nav derivation", () => {
  it("requester sees fewer modules than buyer", () => {
    expect(navForRole("requester").length).toBeLessThan(navForRole("buyer").length);
  });
  it("every nav item has a route", () => {
    for (const item of navForRole("buyer")) {
      expect(item.route).toMatch(/^\//);
    }
  });
});

describe("QA commercial-field wall (A17)", () => {
  it("hides PO/line/quote commercial fields from quality", () => {
    expect(isFieldHidden("PurchaseOrder", "value", "quality")).toBe(true);
    expect(isFieldHidden("POLine", "agreedPrice", "quality")).toBe(true);
    expect(isFieldHidden("Quotation", "landedCostPerUnit", "quality")).toBe(true);
    expect(isFieldHidden("RFQ", "internalTargetPrice", "quality")).toBe(true);
  });

  it("hides internal target price from supplier too", () => {
    expect(isFieldHidden("RFQ", "internalTargetPrice", "supplier")).toBe(true);
  });

  it("does not hide commercial fields from buyer", () => {
    expect(isFieldHidden("PurchaseOrder", "value", "buyer")).toBe(false);
    expect(isFieldHidden("POLine", "agreedPrice", "buyer")).toBe(false);
  });

  it("stripHiddenFields removes hidden line fields without mutating original", () => {
    const po = {
      id: "PO-1",
      value: 1000,
      supplierId: "SUP-1",
      lines: [{ id: "L1", agreedPrice: 50, quantity: 20 }],
    };
    const stripped = stripHiddenFields("PurchaseOrder", po, "quality");
    expect(po.value).toBe(1000); // original intact
    expect((po.lines[0] as Record<string, unknown>).agreedPrice).toBe(50); // original intact
    expect(stripped.value).toBeUndefined(); // hidden
    const strippedLines = stripped.lines as Record<string, unknown>[];
    expect(strippedLines[0].agreedPrice).toBeUndefined(); // nested hidden
    expect(strippedLines[0].quantity).toBe(20); // non-commercial kept
  });
});
