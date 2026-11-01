import packet from "../data/museum/spn-jamnagar-receiver-v1.json";
import type {CompanionAddition} from "./museum-companion-additions-state";
import type {StarterMoveGuide} from "./spn-move-guide";
import type {ShelfPlanningPacket} from "./museum-shelf-planning-context";

export const jamnagarReceiver = packet;
const sourceIds = new Set(packet.allocations.map(row => row.sourceId));

// The saved, source-guarded additions own routing and move actions. This only names their city block.
export function applyJamnagarGuideRefinement(guide: StarterMoveGuide, additions: CompanionAddition[]): StarterMoveGuide {
 const eligible = new Set(packet.allocations.filter(row => additions.some(a => a.sourceId === row.sourceId && a.saintId === row.saintId && a.sourceRevision === row.sourceRevision && a.vitrine === packet.destination))
  .filter(row => guide.entries.some(entry => entry.sourceId === row.sourceId && entry.saintId === row.saintId && entry.destination === packet.destination)).map(row => row.sourceId));
 if (!eligible.size) return guide;
 return {...guide, vitrines: guide.vitrines.map(v => {
  if (v.code !== packet.destination) return v;
  const present = new Set(v.cityGroups.flatMap(g => g.sourceIds).filter(id => eligible.has(id)));
  if (!present.size) return v;
  return {...v, cityGroups: [
   ...v.cityGroups.map(g => ({...g, sourceIds: g.sourceIds.filter(id => !present.has(id))})).filter(g => g.sourceIds.length),
   {id: packet.group.id, title: packet.group.title, sourceIds: [...present], rationale: packet.fitNote, suggestedVitrines: [packet.destination], edges: []},
  ]};
 })};
}

// Immutable historic packets remain available; current context still checks identity, revisions and newer destinations.
export function applyJamnagarShelfRefinement(plan: ShelfPlanningPacket): ShelfPlanningPacket {
 if (!plan.vitrines.some(v => v.code === packet.destination)) throw new Error("Jamnagar shelf receiver is missing.");
 return {...plan, version: plan.version + ":" + packet.version, vitrines: plan.vitrines.map(v => {
  const removed = v.allocations.filter(a => sourceIds.has(a.sourceId));
  const allocations = v.allocations.filter(a => !sourceIds.has(a.sourceId));
  if (!removed.length && v.code !== packet.destination) return v;
  if (v.code === packet.destination) allocations.push(...packet.allocations);
  const kept = new Set(allocations.map(a => a.sourceId));
  const loads = {...v.conceptualAssignedLoads};
  for (const row of removed) {
   const original = packet.allocations.find(a => a.sourceId === row.sourceId)!;
   if (row.suggestedShelfIndex !== null && loads[String(row.suggestedShelfIndex)] !== undefined) loads[String(row.suggestedShelfIndex)] -= original.knownFootprint;
  }
  if (v.code === packet.destination) loads['5'] = (loads['5'] ?? 0) + packet.allocations.reduce((sum,a) => sum + a.knownFootprint,0);
  return {...v, allocations, conceptualAssignedLoads: loads,
   groups: [...v.groups.filter(g => allocations.some(a => a.groupId === g.id) && g.id !== packet.group.id), ...(v.code === packet.destination ? [packet.group] : [])],
   relationships: v.relationships.filter(r => (!sourceIds.has(r.fromSourceId) || kept.has(r.fromSourceId)) && (!sourceIds.has(r.toSourceId) || kept.has(r.toSourceId))),
   ...(v.code === packet.destination ? {notes: ["Reviewed estimate: 24 entries · about 4.88 shelf spaces.",packet.fitNote]} : {}),
  };
 })};
}
