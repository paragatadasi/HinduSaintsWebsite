import type { MuseumCollectionCardItem } from "./museum-collection-domain";
import { buildMuseumView, museumSectionSlug, type MuseumSaintPlacement } from "./museum-proposals";
import { resolveSnapshotIdentity } from "./museum-domain";

export type CurrentMuseumSaint = {
  collectionItems?: MuseumCollectionCardItem[];
  id: string;
  name: string;
  aliases: string[];
  sampradaya: string;
  normalizedPlaces: string[];
  spiritualRegions: string[];
  member: Record<string, string>;
  confirmed: MuseumSaintPlacement[];
};
type SourceLink = { id: string; externalId: string; entityId: string | null };
type SectionDefinition = { name: string; slug: string; descriptionMarkdown: string | null };
type ProposalView = ReturnType<typeof buildMuseumView>;

// Pure projection: never imports, confirms, or overwrites editorial data.
export function buildWorkingMuseumView(
  original: ProposalView,
  saints: CurrentMuseumSaint[],
  links: SourceLink[],
  definitions: SectionDefinition[]
) {
  const bySaint = new Map(saints.map(s => [s.id, s]));
  const activeIds = new Set(bySaint.keys());
  const members = new Map<string, Record<string, string>>();
  const labels = new Map<string, string>();
  const trees = new Map<string, string>();
  for (const section of original.sections) for (const group of section.families) {
    labels.set(group.key, group.label);
    if (group.treeFile) trees.set(group.key, group.treeFile);
  }
  const pending = new Map<string, MuseumSaintPlacement[]>();
  const placements: MuseumSaintPlacement[] = [];
  for (const source of original.placements) {
    const resolved = resolveSnapshotIdentity(source.id, links, activeIds);
    const saint = resolved.record?.entityId ? bySaint.get(resolved.record.entityId) : undefined;
    if (!saint) {
      placements.push({ ...source, placementState: "Unlinked", sourceRecordId: source.id, linkIssue: resolved.reason });
      members.set(source.id, original.membersById.get(source.id) || {});
      continue;
    }
    if (saint.confirmed.length) continue;
    const row = currentDetails(source, saint);
    row.placementState = "Proposed";
    row.sourceRecordId = source.id;
    const rows = pending.get(saint.id) || [];
    // Merged source identities may repeat one proposal; differing proposals must remain reviewable.
    const signature = (p: MuseumSaintPlacement) => JSON.stringify([
      p.section, p.tier, p.alternatives, p.confidence, p.rationale, p.note, p.familyId, p.curatorialFamily
    ]);
    if (!rows.some(p => signature(p) === signature(row))) rows.push(row);
    pending.set(saint.id, rows);
  }
  for (const [id, rows] of pending) {
    for (const row of rows) {
      if (rows.length > 1) row.placementState = "Conflicting proposals";
      members.set(row.id, bySaint.get(id)!.member);
      placements.push(row);
    }
  }
  for (const saint of saints) {
    for (const placement of saint.confirmed) {
      const row = currentDetails(placement, saint);
      row.placementState = saint.confirmed.length === 1 ? "Confirmed" : "Conflicting placements";
      // Canonical exhibit groups and imported family keys occupy separate namespaces.
      if (row.familyId) labels.set(row.familyId, row.groupLabel || row.familyId);
      placements.push(row);
      members.set(row.id, saint.member);
    }
  }
  const view = buildMuseumView(placements, members, labels, trees,
    new Set(placements.filter(p => p.needsResearch || p.placementState?.startsWith("Conflicting")).map(p => p.id)));
  // Stable section catalogue: moving the last saint must never remove a section or its link.
  const catalogue = new Map<string, SectionDefinition>(original.sections.map(s => [s.name, {
    name: s.name, slug: s.slug, descriptionMarkdown: s.idea
  }]));
  for (const definition of definitions) catalogue.set(definition.name, definition);
  for (const definition of catalogue.values()) {
    let section = view.sections.find(s => s.name === definition.name);
    if (!section) {
      section = {
        slug: definition.slug, name: definition.name, idea: "", total: 0, featured: 0, secondary: 0,
        tertiary: 0, confidence: { high: 0, medium: 0, low: 0 }, rows: [], families: [],
        primaryGroups: [], secondaryOnlyGroups: [], secondaryUngrouped: [], tertiaryGroups: [],
        tertiaryUngrouped: [], geography: [], health: []
      };
      view.sections.push(section);
    }
    section.slug = definition.slug;
    if (definition.descriptionMarkdown) section.idea = definition.descriptionMarkdown;
  }
  view.sectionBySlug = new Map(view.sections.flatMap(s => [
    [museumSectionSlug(s.name), s] as const, [s.slug, s] as const
  ]));
  return view;
}

function currentDetails(placement: MuseumSaintPlacement, saint: CurrentMuseumSaint): MuseumSaintPlacement {
  return {
    ...placement, saintId: saint.id, name: saint.name, searchNames: saint.aliases,
    collectionItems: saint.collectionItems || [],
    sampradaya: saint.sampradaya, normalizedPlaces: saint.normalizedPlaces,
    spiritualRegions: saint.spiritualRegions
  };
}

export function searchWorkingMuseumPlacements(placements: MuseumSaintPlacement[], query: string, limit = 30) {
  const term = query.trim().toLocaleLowerCase();
  if (!term) return [];
  return placements.filter(row => [
    row.name, ...(row.searchNames || []), row.section, row.sampradaya,
    ...row.spiritualRegions, ...row.normalizedPlaces
  ].some(value => value.toLocaleLowerCase().includes(term)))
    .sort((a, b) => a.name.localeCompare(b.name)).slice(0, limit);
}

type Relationship = {
  relationshipType: string; status: string; evidenceStatus: string; confidence: string;
  other: { id: string; displayName: string; status: string }; incoming: boolean;
};
export function museumRelationshipDetails(relationships: Relationship[]) {
  const groups = new Map<string, Set<string>>();
  for (const r of relationships) {
    if (r.status === "archived" || r.other.status === "archived") continue;
    const key = r.relationshipType === "guru" ? (r.incoming ? "Disciples" : "Masters")
      : r.relationshipType === "disciple" ? (r.incoming ? "Masters" : "Disciples")
      : ["partner", "husband", "wife"].includes(r.relationshipType) ? "Partner"
      : r.relationshipType === "incarnation" ? "Incarnation" : "Other relationships";
    const state = [r.status.replaceAll("_", " "), r.evidenceStatus.replaceAll("_", " "), r.confidence + " confidence"].join(", ");
    const label = key === "Other relationships"
      ? `${r.other.displayName} (${r.incoming ? "incoming " : ""}${r.relationshipType.replaceAll("_", " ")}; ${state})`
      : `${r.other.displayName} (${state})`;
    if (!groups.has(key)) groups.set(key, new Set());
    groups.get(key)!.add(label);
  }
  return Object.fromEntries([...groups].map(([key, values]) => [key, [...values].sort().join("; ")]));
}
