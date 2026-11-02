import packet from "../data/museum/spn-solapur-kerala-refinement-v1.json";
import type {CompanionAddition} from "./museum-companion-additions-state";
import type {StarterMoveGuide} from "./spn-move-guide";
import type {ShelfPlanningPacket} from "./museum-shelf-planning-context";

export const solapurKeralaRefinement = packet;

export function applySolapurKeralaShelves(plan:ShelfPlanningPacket):ShelfPlanningPacket {
 const ids=new Set(packet.allocations.map(a=>a.sourceId));
 return {...plan,version:plan.version+":"+packet.version,vitrines:plan.vitrines.map(v=>{
  const removed=v.allocations.filter(a=>ids.has(a.sourceId));
  const incoming=packet.allocations.filter(a=>a.destination===v.code);
  if(!removed.length&&!incoming.length)return v;
  const allocations=[...v.allocations.filter(a=>!ids.has(a.sourceId)),...incoming];
  const loads={...v.conceptualAssignedLoads};
  for(const a of removed){const known=packet.allocations.find(r=>r.sourceId===a.sourceId)!.knownFootprint;if(a.suggestedShelfIndex!==null&&loads[String(a.suggestedShelfIndex)]!==undefined)loads[String(a.suggestedShelfIndex)]-=known;}
  for(const a of incoming)loads[String(a.suggestedShelfIndex)]=(loads[String(a.suggestedShelfIndex)]??0)+a.knownFootprint;
  const groups=v.groups.filter(g=>allocations.some(a=>a.groupId===g.id));
  for(const a of incoming)if(!groups.some(g=>g.id===a.groupId))groups.push({id:a.groupId,title:v.code==="56"?"Adi Shankaracharya · Kalady":"Laul & Nazare · Solapur-region connections",kind:"locality"});
  return {...v,allocations,groups,conceptualAssignedLoads:loads,relationships:v.relationships.filter(r=>!ids.has(r.fromSourceId)&&!ids.has(r.toSourceId))};
 })};
}

// Only annotate exact, saved additions. The packet alone cannot authorize a move.
export function applySolapurKeralaGuide(guide: StarterMoveGuide, additions: CompanionAddition[], catalog: StarterMoveGuide["entries"] = []): StarterMoveGuide {
 const eligible = packet.allocations.filter(row => additions.some(a => a.sourceId === row.sourceId && a.saintId === row.saintId && a.sourceRevision === row.sourceRevision && a.vitrine === row.destination)
  && guide.entries.some(e => e.sourceId === row.sourceId && e.saintId === row.saintId && e.destination === row.destination));
 if (!eligible.length) return guide;
 const ids = new Set(eligible.map(row => row.sourceId));
 return {...guide, entries: guide.entries.map(entry => {
  const row = eligible.find(row => row.sourceId === entry.sourceId);
  const live=catalog.find(e=>e.sourceId===entry.sourceId&&e.saintId===entry.saintId);
  return row ? {...entry,...(live?{tier:live.tier}:{}), reviewNotes: [...new Set([...(entry.reviewNotes ?? []), ...row.reviewAlerts.map(alert => alert.message)])]} : entry;
 }), vitrines: guide.vitrines.map(v => {
  const rows = eligible.filter(row => row.destination === v.code);
  if (!rows.length) return v;
  const strip = (groups: typeof v.families) => groups.map(g => ({...g, sourceIds: g.sourceIds.filter(id => !ids.has(id)), edges: g.edges?.filter(e => !ids.has(e.fromSourceId) && !ids.has(e.toSourceId))})).filter(g => g.sourceIds.length);
  const group = {id: rows[0].groupId, title: v.code === "56" ? "Adi Shankaracharya · Kalady" : "Laul & Nazare · Solapur-region connections", sourceIds: rows.map(row => row.sourceId), rationale: v.code === "56" ? "Kerala birthplace connection; other display stories remain separate." : "Shared regional locality; no asserted personal lineage.", suggestedVitrines: [v.code], edges: []};
  return {...v, families: v.code === "56" ? [group, ...strip(v.families)] : strip(v.families), cityGroups: v.code === "56" ? strip(v.cityGroups) : [group, ...strip(v.cityGroups)]};
 })};
}
