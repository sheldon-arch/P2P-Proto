/**
 * Demo personas: one representative seed user per RBAC role, for the role
 * switcher. The seed stages DISTINCT people per role so segregation-of-duties
 * (maker != checker, requester != approver, receiver != invoice approver) is
 * demonstrable live. Supplier routes to the external portal, not the main shell.
 */
import type { RoleId, CurrentUser } from "@/lib/rbac/rbac";

export type Persona = CurrentUser & { title: string };

export const PERSONAS: Persona[] = [
  { id: "U-REQ1", name: "Aarav Shah", title: "Requester — R&D/NPD", roleId: "requester", isSystemAdmin: false, designationRank: 2, department: "R&D/NPD" },
  { id: "U-REQMGR1", name: "Marcus Cole", title: "Approver — R&D/NPD", roleId: "approver", isSystemAdmin: false, designationRank: 5, department: "R&D/NPD" },
  { id: "U-BUY1", name: "Daniel Osei", title: "Buyer — Procurement", roleId: "buyer", isSystemAdmin: false, designationRank: 4, department: "Procurement" },
  { id: "U-FINMK1", name: "Ines Dubois", title: "Finance Maker", roleId: "finance_maker", isSystemAdmin: false, designationRank: 4, department: "Finance" },
  { id: "U-FINCHK", name: "Helena Brandt", title: "Finance Checker", roleId: "finance_checker", isSystemAdmin: false, designationRank: 6, department: "Finance" },
  { id: "U-MGMT1", name: "David Okonkwo", title: "Management", roleId: "management", isSystemAdmin: false, designationRank: 7, department: "Management" },
  { id: "U-RECV1", name: "Lucas Fernandes", title: "Receiving / Warehouse", roleId: "receiving", isSystemAdmin: false, designationRank: 3, department: "Warehouse" },
  { id: "U-QC1", name: "Sofia Marino", title: "Quality (QC)", roleId: "quality", isSystemAdmin: false, designationRank: 4, department: "QA/QC" },
  { id: "U-ENG1", name: "Omar Haddad", title: "Engineering", roleId: "engineering", isSystemAdmin: false, designationRank: 4, department: "Maintenance/Engineering" },
  { id: "U-REQMGR2", name: "Priya Nair", title: "Budget Owner — Production", roleId: "budget_owner", isSystemAdmin: false, designationRank: 5, department: "Production" },
  { id: "U-TAX1", name: "Wei Zhang", title: "Tax / Compliance", roleId: "tax_compliance", isSystemAdmin: false, designationRank: 4, department: "Finance" },
  { id: "U-INV1", name: "Kavya Reddy", title: "Inventory Manager", roleId: "inventory_manager", isSystemAdmin: false, designationRank: 3, department: "Stores" },
  { id: "U-ADMIN", name: "Riya Malhotra", title: "Administrator", roleId: "administrator", isSystemAdmin: true, designationRank: 7, department: "IT" },
  { id: "SUP-0001", name: "Synthex Food Ingredients", title: "Supplier (external portal)", roleId: "supplier", isSystemAdmin: false, designationRank: 0, department: "External" },
];

export const PERSONA_BY_ROLE: Record<RoleId, Persona> = Object.fromEntries(
  PERSONAS.map((p) => [p.roleId, p]),
) as Record<RoleId, Persona>;

export const DEFAULT_PERSONA = PERSONA_BY_ROLE.buyer;
