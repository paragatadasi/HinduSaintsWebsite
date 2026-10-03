import { createHash } from "node:crypto";
import { buildMuseumView, type MuseumSaintPlacement } from "./museum-proposals";

import { membershipRevision, type DisplayMembershipChange } from "./museum-display-membership-domain";

export type FamilyProposalMove = { familyKey: string; section: string; version: number };
export type FamilyMoveOption = { key: string; label: string; count: number; revision: string; arrangement?: import("./museum-arrangement-domain").FamilyArrangementControl; moveUnavailable?:boolean };
export function proposalFamilyKey(row: MuseumSaintPlacement) {
  return row.curatorialFamily || row.familyId;
}

export function familyMoveRevision(rows: MuseumSaintPlacement[], move?: FamilyProposalMove, changes: DisplayMembershipChange[] = []) {
  return createHash("sha256").update(JSON.stringify({
    membership: [...changes].sort((a,b)=>a.placementId.localeCompare(b.placementId)),
    move: move ? [move.section, move.version] : null,
    rows: [...rows].sort((a, b) => a.id.localeCompare(b.id))
  })).digest("hex");
}

// Return new objects; the original imported values remain available for comparison.
export function applyFamilyProposalMoves(
  original: ReturnType<typeof buildMuseumView>, moves: FamilyProposalMove[], changes: DisplayMembershipChange[] = []
) {
  const byFamily = new Map(moves.map(move => [move.familyKey, move]));
  const labels = new Map<string, string>();
  const trees = new Map<string, string>();
  for (const section of original.sections) for (const family of section.families) {
    labels.set(family.key, family.label);
    if (family.treeFile) trees.set(family.key, family.treeFile);
  }
  const byPlacement = new Map(changes.map(change=>[change.placementId,change]));
  const placements = original.placements.map(row => {
    const key = proposalFamilyKey(row);
    const move = byFamily.get(key);
    const change = byPlacement.get(row.id);
    const detached = change?.detached || false;
    const current = detached ? {...row,section:change!.section,alternatives:row.alternatives.filter(s=>s!==change!.section),familyId:"",curatorialFamily:"",groupLabel:""}
      : move ? {...row,section:move.section,alternatives:row.alternatives.filter(s=>s!==move.section)} : {...row};
    if (key || detached) current.displayMembership = {familyKey:detached?change!.familyKey:key,label:detached?change!.familyLabel:labels.get(key)||key,detached,
      revision:membershipRevision({row,move:move||null},change)};
    if(detached) trees.delete(key);
    return current;
  });
  // Exported SVGs describe the original membership, not the edited display group.
  for (const change of changes) if (change.detached) trees.delete(change.familyKey);
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
    const familyChanges = changes.filter(change=>change.familyKey===key || original.placements.some(row=>row.id===change.placementId && proposalFamilyKey(row)===key));
    const rows = original.placements.filter(row => proposalFamilyKey(row) === key && !familyChanges.some(change=>change.placementId===row.id&&change.detached));
    return { key, label, count: rows.length, revision: familyMoveRevision(rows, byFamily.get(key), familyChanges) };
  });
  return { ...view, familyMoveOptions: families };
}
