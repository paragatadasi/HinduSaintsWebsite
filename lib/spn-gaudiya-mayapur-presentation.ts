import packet from "../data/museum/spn-gaudiya-mayapur-rebalance-v3.json";
import type {StarterMoveGuide, GuideGroup} from "./spn-move-guide";
import type {ShelfPlanningPacket} from "./museum-shelf-planning-context";

export const gaudiyaMayapurRebalance = packet;

// Membership has already been reconciled against saved proposals by the caller.
export function applyGaudiyaMayapurPresentation(guide: StarterMoveGuide): StarterMoveGuide {
 return {...guide, vitrines: guide.vitrines.map(v => {
  const approved = packet.cases.find(c => c.code === v.code);
  if (!approved) return v;
  const eligible = new Set(guide.entries.filter(e => e.destination === v.code && approved.rows.some(r => r.sourceId === e.sourceId && r.saintId === e.saintId)).map(e => e.sourceId));
  const oldGroups = [...v.families, ...v.cityGroups];
  const groups: GuideGroup[] = approved.groups.map((g, index) => {
   const sourceIds = g.sourceIds.filter(id => eligible.has(id));
   return {id: `mayapur-v3:${v.code}:${index}`, title: g.title, sourceIds, rationale: g.note, suggestedVitrines: [v.code],
    edges: oldGroups.flatMap(old => old.edges ?? []).filter(edge => sourceIds.includes(edge.fromSourceId) && sourceIds.includes(edge.toSourceId))};
  }).filter(g => g.sourceIds.length);
  const grouped = new Set(groups.flatMap(g => g.sourceIds));
  const remaining = (items: GuideGroup[]) => items.map(g => {
   const sourceIds = g.sourceIds.filter(id => !grouped.has(id) && guide.entries.some(e => e.sourceId === id && e.destination === v.code));
   const removed = new Set(g.sourceIds.filter(id => !sourceIds.includes(id)));
   return {...g, sourceIds, edges: g.edges?.filter(e => !removed.has(e.fromSourceId) && !removed.has(e.toSourceId))};
  }).filter(g => g.sourceIds.length);
  // Vitrine 28 groups describe institutions/locality, not asserted guru lineages.
  return {...v, summary: approved.story,
   families: [...(v.code === "28" ? [] : groups), ...remaining(v.families)],
   cityGroups: [...(v.code === "28" ? groups : []), ...remaining(v.cityGroups)]};
 })};
}

export function applyGaudiyaMayapurShelves(plan: ShelfPlanningPacket): ShelfPlanningPacket {
 const moved = new Map(packet.changes.map(r => [r.sourceId, r]));
 const allocations = plan.vitrines.flatMap(v => v.allocations).filter(a => moved.has(a.sourceId));
 const vitrines = plan.vitrines.map(v => ({...v, allocations: v.allocations.filter(a => !moved.has(a.sourceId)), groups: [...v.groups]}));
 let target = vitrines.find(v => v.code === "28");
 if (!target) { target = {code: "28", groups: [], allocations: [], relationships: []}; vitrines.push(target); }
 const approved = packet.cases.find(c => c.code === "28")!;
 approved.groups.forEach((g, index) => {
  const groupId = `mayapur-v3:28:${index}`;
  target!.groups.push({id: groupId, title: g.title, kind: "city"});
  for (const source of approved.rows.filter(r => g.sourceIds.includes(r.sourceId))) {
   const prior = allocations.find(a => a.sourceId === source.sourceId);
   target!.allocations.push({...prior, sourceId: source.sourceId, saintId: source.saintId, name: source.name,
    sourceRevision: source.sourceRevision, groupId, suggestedShelfIndex: null, suggestedBand: "fit-review",
    preserveCurrentPlacement: false, reviewAlerts: [{message: g.note}, {message: "Choose the shelf on site; keep living saints at the bottom."}]});
  }
 });
 return {...plan, version: `${plan.version}:${packet.version}`, vitrines: vitrines.map(v => {
  const ids = new Set([...v.allocations.map(a => a.sourceId), ...(v.contextNodes ?? []).map(n => n.id)]);
  return {...v, groups: v.groups.filter(g => v.allocations.some(a => a.groupId === g.id)),
   relationships: v.relationships.filter(e => ids.has(e.fromSourceId) && ids.has(e.toSourceId))};
 })};
}
