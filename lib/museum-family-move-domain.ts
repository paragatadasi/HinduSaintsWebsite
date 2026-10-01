import { createHash } from "node:crypto";
import { buildMuseumView, type MuseumSaintPlacement } from "./museum-proposals";

export type FamilyProposalMove = { familyKey: string; section: string; version: number };
export type FamilyMoveOption = { key: string; label: string; count: number; revision: string };
export function proposalFamilyKey(row: MuseumSaintPlacement) {
  return row.curatorialFamily || row.familyId;
}

export function familyMoveRevision(rows: MuseumSaintPlacement[], move?: FamilyProposalMove) {
  return createHash("sha256").update(JSON.stringify({
    move: move ? [move.section, move.version] : null,
    rows: [...rows].sort((a, b) => a.id.localeCompare(b.id))
  })).digest("hex");
}

// Return new objects; the original imported values remain available for comparison.
export function applyFamilyProposalMoves(
  original: ReturnType<typeof buildMuseumView>, moves: FamilyProposalMove[]
) {
  const byFamily = new Map(moves.map(move => [move.familyKey, move]));
  const labels = new Map<string, string>();
  const trees = new Map<string, string>();
  for (const section of original.sections) for (const family of section.families) {
    labels.set(family.key, family.label);
    if (family.treeFile) trees.set(family.key, family.treeFile);
  }
  const placements = original.placements.map(row => {
    const move = byFamily.get(proposalFamilyKey(row));
    return move ? { ...row, section: move.section, alternatives: row.alternatives.filter(s => s !== move.section) } : { ...row };
  });
  const view = buildMuseumView(placements, original.membersById, labels, trees,
    new Set(placements.filter(row => row.needsResearch).map(row => row.id)));
  // Keep the source section navigable after its last family moves away.
  for (const section of original.sections) if (!view.sectionBySlug.has(section.slug)) {
    const empty = { ...section, total: 0, featured: 0, secondary: 0, tertiary: 0,
      confidence: { high: 0, medium: 0, low: 0 }, rows: [], families: [], primaryGroups: [],
      secondaryOnlyGroups: [], secondaryUngrouped: [], tertiaryGroups: [], tertiaryUngrouped: [], geography: [], health: [] };
    view.sections.push(empty);
    view.sectionBySlug.set(empty.slug, empty);
  }
  const families = [...labels].map(([key, label]): FamilyMoveOption => {
    const rows = original.placements.filter(row => proposalFamilyKey(row) === key);
    return { key, label, count: rows.length, revision: familyMoveRevision(rows, byFamily.get(key)) };
  });
  return { ...view, familyMoveOptions: families };
}
