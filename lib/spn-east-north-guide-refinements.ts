import packet from "../data/museum/spn-east-north-accepted-additions-v1.json";
import type {CompanionAddition} from "./museum-companion-additions-state";
import type {GuideGroup, StarterMoveGuide} from "./spn-move-guide";

const activeIds = new Set(packet.activeSourceIds);
type ActiveRow = (typeof packet.rows)[number] & {proposedVitrine: string};
export const eastNorthReadyRows = packet.rows.filter((row): row is ActiveRow => activeIds.has(row.sourceId) && typeof row.proposedVitrine === "string");
const matilal = {sourceId: "recwX7dFfmlq9FfAh", saintId: "cms0w7jbl08pr07qi8w9i43tn"};

export function applyEastNorthGuideRefinements(guide: StarterMoveGuide, additions: CompanionAddition[]): StarterMoveGuide {
  const saved = new Map(additions.map(row => [row.sourceId, row]));
  const applicable = new Map(eastNorthReadyRows.filter(row => {
    const addition = saved.get(row.sourceId);
    return addition?.vitrine === row.proposedVitrine && addition.saintId === row.canonicalId && addition.sourceRevision === row.sourceRevision;
  }).map(row => [row.sourceId, row]));
  const entries = guide.entries.map(entry => {
    const detail = applicable.get(entry.sourceId);
    if (!detail || entry.saintId !== detail.canonicalId || entry.destination !== detail.proposedVitrine) return entry;
    const recordedSamadhi = detail.sourceId === "recVcmAKuNX8Dpp54" ? "18 October 1992" : detail.sourceId === "reckSOP93swGpRjsT" ? "19 November 1987" : null;
    const lifeStatus = recordedSamadhi && (!entry.lifeStatus?.tag || entry.lifeStatus.tag === "May be alive") ? {tag: null, basis: `Collection record gives samadhi: ${recordedSamadhi}.`} : entry.lifeStatus;
    return {...entry, lifeStatus, reviewNotesCollapsible: true, reviewNotes: [...new Set([...(entry.reviewNotes ?? []), detail.qualification, detail.receiverCaveat, ...(recordedSamadhi ? [`Collection record gives samadhi: ${recordedSamadhi}.`] : [])].filter(Boolean))]};
  });
  return {...guide, entries, vitrines: guide.vitrines.map(vitrine => {
    const eligible = new Set(entries.filter(entry => applicable.has(entry.sourceId) && entry.destination === vitrine.code && entry.saintId === applicable.get(entry.sourceId)?.canonicalId).map(entry => entry.sourceId));
    if (!eligible.size) return vitrine;
    const grouped = new Map<string, GuideGroup>();
    const cityGroups = vitrine.cityGroups.flatMap(group => {
      if (!group.id.startsWith("curator-additions:")) return [group];
      const remaining = group.sourceIds.filter(id => !eligible.has(id));
      for (const id of group.sourceIds.filter(id => eligible.has(id))) {
        const detail = applicable.get(id)!;
        const title = id === "recXEQEn9vNl1zmig" ? "Azamgarh" : detail.allocationStory;
        const next = grouped.get(title) ?? {id: `east-north:${vitrine.code}:${title}`, title, sourceIds: [], rationale: "", suggestedVitrines: [vitrine.code]};
        next.sourceIds.push(id);
        grouped.set(title, next);
      }
      return remaining.length ? [{...group, sourceIds: remaining}] : [];
    });
    cityGroups.push(...grouped.values());
    const families = vitrine.families.map(group => ({...group, sourceIds: [...group.sourceIds], edges: group.edges ? [...group.edges] : undefined}));
    const radhaPair = ["recf5WiUhs05Gg6dK", "recW6BHfpK6hd8n7S"];
    if (vitrine.code === "11" && radhaPair.every(id => eligible.has(id))) {
      if (!families.some(group => group.id === "east-north:radha-bhagat")) families.push({id: "east-north:radha-bhagat", title: "Radha Babaji & Bhagat Ji", sourceIds: radhaPair, rationale: "Recorded display family within the Gorakhpur cohort.", suggestedVitrines: ["11"], edges: undefined});
      for (const group of cityGroups) group.sourceIds = group.sourceIds.filter(id => !radhaPair.includes(id));
    }
    for (const edge of packet.treeAdditions) {
      if (!eligible.has(edge.toSourceId)) continue;
      const parent = entries.find(entry => entry.sourceId === edge.fromSourceId && entry.sourceId === matilal.sourceId && entry.saintId === matilal.saintId && entry.destination === vitrine.code);
      const family = parent && families.find(group => group.sourceIds.includes(parent.sourceId));
      if (!family) continue;
      if (!family.sourceIds.includes(edge.toSourceId)) family.sourceIds.push(edge.toSourceId);
      if (!family.edges?.some(existing => existing.fromSourceId === edge.fromSourceId && existing.toSourceId === edge.toSourceId)) {
        family.edges = [...(family.edges ?? []), {fromSourceId: edge.fromSourceId, toSourceId: edge.toSourceId, label: edge.label, basis: "source"}];
      }
      for (const group of cityGroups) group.sourceIds = group.sourceIds.filter(id => id !== edge.toSourceId);
    }
    return {...vitrine, families, cityGroups: cityGroups.filter(group => group.sourceIds.length),
      ...(vitrine.code === "11" ? {fitGuidance: "Provisional Gorakhpur / eastern-UP allocation. Review the planned hinge expansion before moving these additions; fit is not confirmed."} : {})};
  })};
}
