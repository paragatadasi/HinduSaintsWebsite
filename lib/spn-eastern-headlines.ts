import packet from "../data/museum/spn-eastern-three-headlines-v1.json";
import type {StarterMoveGuide,GuideGroup} from "./spn-move-guide";
import type {ShelfPlanningPacket} from "./museum-shelf-planning-context";
export const easternHeadlines=packet;
const sourceIds=new Set(packet.vitrines.flatMap(v=>v.allocations.map(a=>a.sourceId)));

export function easternCaseGroups(code:string,entries:StarterMoveGuide["entries"]){
 const reviewed=packet.vitrines.find(v=>v.code===code);
 if(!reviewed)return null;
 const eligible=new Set(reviewed.allocations.filter(a=>entries.some(e=>e.sourceId===a.sourceId&&e.saintId===a.saintId&&e.destination===code)).map(a=>a.sourceId));
 const groups=reviewed.groups.map(g=>({...g,sourceIds:g.sourceIds.filter(id=>eligible.has(id)),edges:g.edges.filter(e=>eligible.has(e.fromSourceId)&&eligible.has(e.toSourceId)),suggestedVitrines:[code]})).filter(g=>g.sourceIds.length);
 return {summary:reviewed.summary,fitGuidance:reviewed.notes.join(" "),families:groups.filter(g=>g.kind==="family"),cityGroups:groups.filter(g=>g.kind==="city")};
}

export function applyEasternHeadlines(guide:StarterMoveGuide,catalog:StarterMoveGuide["entries"]=[]):StarterMoveGuide{
 const current=new Map(catalog.map(e=>[e.sourceId,e]));
 const entries=guide.entries.map(e=>{const live=current.get(e.sourceId);return live&&live.destination&&live.saintId===e.saintId&&(sourceIds.has(e.sourceId)||packet.vitrines.some(v=>v.code===e.destination))?{...e,destination:live.destination}:e;});
 return {...guide,entries,vitrines:guide.vitrines.map(v=>{
  const next=easternCaseGroups(v.code,entries);
  if(!next)return v;
  const grouped=new Set([...next.families,...next.cityGroups].flatMap(g=>g.sourceIds));
  const retain=(groups:GuideGroup[])=>groups.map(g=>{
   const ids=g.sourceIds.filter(id=>!grouped.has(id)&&entries.some(e=>e.sourceId===id&&e.destination===v.code));
   return {...g,sourceIds:ids,edges:g.edges?.filter(e=>ids.includes(e.fromSourceId)&&ids.includes(e.toSourceId))};
  }).filter(g=>g.sourceIds.length);
  return {...v,...next,families:[...next.families,...retain(v.families)],cityGroups:[...next.cityGroups,...retain(v.cityGroups)]};
 })};
}

export function applyEasternShelfRecommendations(plan:ShelfPlanningPacket):ShelfPlanningPacket{
 const codes=new Set(packet.vitrines.map(v=>v.code));
 const retained=plan.vitrines.map(v=>{
  const allocations=v.allocations.filter(a=>!sourceIds.has(a.sourceId));
  const ids=new Set(allocations.map(a=>a.sourceId));
  return {...v,allocations,groups:v.groups.filter(g=>allocations.some(a=>a.groupId===g.id)),relationships:v.relationships.filter(e=>ids.has(e.fromSourceId)&&ids.has(e.toSourceId))};
 });
 return {...plan,version:plan.version+":"+packet.version,exceptions:plan.exceptions?.filter(e=>!codes.has(e.code)),vitrines:[...retained.filter(v=>!codes.has(v.code)),...packet.vitrines.map(v=>{
  const other=retained.find(r=>r.code===v.code);
  return {...v,allocations:[...v.allocations,...(other?.allocations??[])],groups:[...v.groups,...(other?.groups??[])],relationships:[...v.relationships,...(other?.relationships??[])]};
 })]};
}
