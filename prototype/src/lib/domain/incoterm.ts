/**
 * Incoterms 2020 validity vs transport mode (04-sourcing.md, SRC-09).
 *
 * FOB, CIF, CFR are sea / inland-waterway only. Air, road, courier (and any
 * non-sea mode) must use FCA, CPT, CIP, DAP (or EXW). EXW is mode-agnostic.
 * Pure + unit-testable; used by the supplier quote form and any award check.
 */
const SEA_ONLY = new Set(["FOB", "CIF", "CFR"]);

/** True if `incoterm` is valid for `transportMode`. Unknown/empty -> permissive
 *  (true) so a missing value never blocks; the sea-only set is the hard rule. */
export function incotermValidForMode(
  incoterm: string | undefined | null,
  transportMode: string | undefined | null,
): boolean {
  if (!incoterm || !transportMode) return true;
  const code = incoterm.trim().toUpperCase();
  const isSea = /^(SEA|OCEAN|INLAND.?WATERWAY)$/i.test(transportMode.trim());
  if (SEA_ONLY.has(code) && !isSea) return false;
  return true;
}
