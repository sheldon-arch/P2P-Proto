/**
 * field-visibility.ts — QA Access Wall (axiom A17).
 *
 * Enforces commercial-field separation of duties: the Quality role NEVER
 * receives commercial fields (price, PO value, landed cost, payment terms,
 * internal target price). Loaded from field-visibility.json.
 *
 * Used server-side (MSW handlers strip before HttpResponse.json) AND
 * client-side (FieldRenderer / FieldGuard defense-in-depth).
 */

import rules from "./field-visibility.json";

type VisibilityRule = { hiddenFor: string[] };
const RULES: Record<string, VisibilityRule> = rules as Record<string, VisibilityRule>;

/**
 * Returns true if the given field on the given entity should be hidden
 * for the given role. Returns false for any undefined role or undefined rule.
 */
export function isFieldHidden(
  entity: string,
  field: string,
  role: string | undefined
): boolean {
  if (!role) return false;
  const rule = RULES[`${entity}.${field}`];
  if (!rule) return false;
  return rule.hiddenFor.includes(role);
}

/**
 * Returns a shallow clone of `record` with any hidden fields deleted.
 * Also recurses into a top-level `lines` array to strip hidden POLine fields.
 *
 * The entity name for a `lines` array element is always "POLine".
 * If role is undefined or has no rules for this entity, the record is
 * returned unchanged (cloned).
 *
 * Never mutates the original record.
 */
export function stripHiddenFields(
  entity: string,
  record: Record<string, unknown>,
  role: string | undefined
): Record<string, unknown> {
  const clone: Record<string, unknown> = { ...record };

  // Strip top-level fields for this entity
  for (const key of Object.keys(clone)) {
    if (isFieldHidden(entity, key, role)) {
      delete clone[key];
    }
  }

  // Recurse into nested lines[] (POLine commercial fields)
  if (Array.isArray(clone["lines"])) {
    clone["lines"] = (clone["lines"] as Record<string, unknown>[]).map((line) =>
      stripHiddenFields("POLine", line, role)
    );
  }

  return clone;
}
