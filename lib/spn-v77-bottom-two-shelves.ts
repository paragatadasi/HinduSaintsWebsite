import recommendation from "../data/museum/spn-v77-bottom-two-shelves-v1.json";
import {ramashrayTyagiReunion} from "./spn-source-family-reunion";
import type {ShelfPlanningPacket, ShelfPlanningAllocation} from "./museum-shelf-planning-context";

export function applyV77BottomTwoRecommendations(packet: ShelfPlanningPacket): ShelfPlanningPacket {
  const plan = packet.vitrines.find(v => v.code === "77");
  if (!plan) throw new Error("Vitrine 77 is missing from the shelf packet.");
  const existing = recommendation.rows.filter(row => row.previousSuggestedBand !== null);
  if (existing.length !== plan.allocations.length || existing.some(row => !plan.allocations.some(a =>
    a.sourceId === row.sourceId && a.saintId === row.saintId && a.sourceRevision === row.sourceRevision && a.suggestedShelfIndex === row.previousSuggestedBand)))
    throw new Error("Vitrine 77's captured shelf plan changed; review the bottom-two recommendations.");
  const pair = recommendation.sourceRecordedPair;
  const pairIds = new Set(pair.sourceIds);
  const allocations: ShelfPlanningAllocation[] = recommendation.rows.map(row => {
    const old = plan.allocations.find(a => a.sourceId === row.sourceId);
    return {...old, sourceId: row.sourceId, saintId: row.saintId, name: row.name,
      tier: old?.tier ?? row.tierAtCapture, sourceRevision: row.sourceRevision,
      groupId: pairIds.has(row.sourceId) ? pair.groupId : old!.groupId,
      suggestedShelfIndex: row.recommendedBand, reviewAlerts: old?.reviewAlerts ?? [],
      knownFootprint: row.knownFootprint};
  });
  return {...packet, version: recommendation.version, vitrines: packet.vitrines.map(v => v !== plan ? v : {...v,
    livingAllowedBands: [4, 5], allocations,
    groups: [...v.groups, {id: pair.groupId, title: "Ramashray & Tyagi Baba", kind: "family"}],
    relationships: [...v.relationships.filter(edge => !pairIds.has(edge.fromSourceId) && !pairIds.has(edge.toSourceId)),
      {fromSourceId: ramashrayTyagiReunion.teacher.sourceId, toSourceId: ramashrayTyagiReunion.disciple.sourceId,
        label: "disciple · source-recorded", direction: "forward", uncertain: false}],
    conceptualAssignedLoads: Object.fromEntries(recommendation.bandLoads.map(band => [String(band.band),band.load])),
    notes: [...(v.notes ?? []), "Living saints may use shelves 4–5 in this vitrine. Ramashray and Tyagi Baba are suggested together on shelf 4. Shelves 3 and 5 reach the estimated allowance; check the fit on site."]})};
}
