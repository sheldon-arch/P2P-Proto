// RBAC resolver for the Unified P2P prototype.
// The permission matrix (permission-matrix.json) and nav config (nav-config.json) are generated
// from model/role-permission-matrix.md. This resolver consumes them. Mirrors the Raphe RBAC model:
// effective permissions = union of role + direct grant + designation + business-unit, + `all` super-permission;
// administrator/system-admin bypasses. See model/raphe-auth-rbac + ui-ux-to-unified-mapping.

export type Level = 'G' | 'C' | '-';
export type RoleId =
  | 'requester' | 'approver' | 'buyer' | 'finance_maker' | 'finance_checker' | 'management'
  | 'supplier' | 'receiving' | 'quality' | 'engineering' | 'budget_owner' | 'tax_compliance' | 'administrator'
  | 'inventory_manager';

// Loaded from permission-matrix.json: role -> permissionGroup -> Level
import matrixJson from './permission-matrix.json';
import navJson from './nav-config.json';

type Matrix = Record<RoleId, Record<string, Level>>;
const MATRIX = (matrixJson as { matrix: Matrix }).matrix;

export interface CurrentUser {
  id: string;
  name: string;
  roleId: RoleId;
  isSystemAdmin: boolean;       // administrator => true (full bypass)
  designationRank: number;      // 1..7, for the designation-based approval/assignment checks
  department: string;
  ownedRecordIds?: Set<string>; // for SoD "own record" conditions in the prototype
}

/** Can the user act on a permission GROUP at all (G or C)? Group keys match permission-matrix.json. */
export function levelFor(user: CurrentUser, group: string): Level {
  if (user.isSystemAdmin) return 'G';
  return MATRIX[user.roleId]?.[group] ?? '-';
}

/** Hard yes/no for showing or enabling a control. C (conditional) returns true here;
 *  the specific SoD condition is evaluated by canWithCondition() at action time. */
export function useCan(user: CurrentUser, group: string): boolean {
  return levelFor(user, group) !== '-';
}

/** Evaluate a conditional (C) permission with the SoD ruleset (model/role-model SoD ruleset, axiom A6). */
export function canWithCondition(
  user: CurrentUser,
  group: string,
  ctx: { recordOwnerId?: string; isReceiverOfRecord?: boolean; isMakerOfPayment?: boolean; requestedApproverId?: string; minDesignationRank?: number },
): boolean {
  const lvl = levelFor(user, group);
  if (lvl === '-') return false;
  if (lvl === 'G') return true;
  // lvl === 'C': apply the SoD conditions relevant to the group
  // 1) Never approve own requisition/PO
  if (group.startsWith('Approval') || group.startsWith('Award')) {
    if (ctx.recordOwnerId && ctx.recordOwnerId === user.id) return false;
    if (ctx.requestedApproverId && ctx.requestedApproverId !== user.id && (ctx.minDesignationRank ?? 0) > user.designationRank) return false;
  }
  // 2) Receiver != invoice approver
  if (group === 'Invoice approve' && ctx.isReceiverOfRecord) return false;
  // 3) Maker != checker on payment release
  if (group === 'Payments approve (release)' && ctx.isMakerOfPayment) return false;
  return true;
}

/** The nav modules visible to a role (from nav-config.json). Supplier is routed to the portal, not this sidebar. */
export function navForRole(roleId: RoleId): { id: string; label: string; route: string }[] {
  const nav = (navJson as { navByRole: Record<RoleId, { id: string; label: string; route: string }[]> }).navByRole;
  return nav[roleId] ?? [];
}

export function isInternalRole(roleId: RoleId): boolean {
  return roleId !== 'supplier';
}
