import packet from "../data/museum/spn-west-mount-abu-v6.json";
import type {StarterMoveGuide,GuideGroup} from "./spn-move-guide";
import type {ShelfPlanningPacket} from "./museum-shelf-planning-context";
export const westMountAbu = packet;
const displayCases=[...packet.vitrines,...packet.transfers];

export function registerWestReceiver<T extends string>(guides:Record<T,StarterMoveGuide>):Record<T,StarterMoveGuide>{
 const owner=(Object.keys(guides) as T[]).find(key=>guides[key].vitrines.some(v=>v.code==="40"));
 if(!owner||Object.values<StarterMoveGuide>(guides).some(g=>g.vitrines.some(v=>v.code==="83")))return guides;
 return {...guides,[owner]:{...guides[owner],vitrines:[...guides[owner].vitrines,{code:"83",summary:packet.vitrines.find(v=>v.code==="83")!.headline,fitGuidance:"New vitrine; confirm shelf spacing and actual fit on site.",families:[],cityGroups:[]}]}};
}

export function applyWestMountAbuGuide(guide:StarterMoveGuide):StarterMoveGuide{
 return {...guide,vitrines:guide.vitrines.map(v=>{
  const plan=displayCases.find(p=>p.code===v.code);if(!plan)return v;
  const groups:GuideGroup[]=plan.groups.map(g=>({id:g.id,title:g.title,rationale:"Reviewed display grouping; no new personal relationship asserted.",suggestedVitrines:[v.code],sourceIds:g.sources.filter(s=>guide.entries.some(e=>e.sourceId===s.sourceId&&e.saintId===s.saintId&&e.destination===v.code)).map(s=>s.sourceId)})).filter(g=>g.sourceIds.length);
  if(!groups.length)return v;
  const grouped=new Set(groups.flatMap(g=>g.sourceIds));
  const retain=(items:GuideGroup[])=>items.map(g=>({...g,sourceIds:g.sourceIds.filter(id=>!grouped.has(id)),edges:g.edges?.filter(e=>!grouped.has(e.fromSourceId)&&!grouped.has(e.toSourceId))})).filter(g=>g.sourceIds.length);
  // Preserve only previously reviewed edges whose endpoints remain in the same display group.
  const edges=guide.vitrines.flatMap(item=>[...item.families,...item.cityGroups].flatMap(g=>g.edges??[]));
  for(const group of groups)group.edges=edges.filter(e=>group.sourceIds.includes(e.fromSourceId)&&group.sourceIds.includes(e.toSourceId));
  return {...v,summary:plan.headline||v.summary,fitGuidance:plan.headline?plan.notes.join(" "):v.fitGuidance,families:[...groups.filter(g=>g.edges?.length),...retain(v.families)],cityGroups:[...groups.filter(g=>!g.edges?.length),...retain(v.cityGroups)]};
 })};
}

export function applyWestMountAbuShelves(plan:ShelfPlanningPacket):ShelfPlanningPacket{
 const sources=new Map(displayCases.flatMap(v=>v.groups.flatMap(g=>g.sources.map(s=>[s.sourceId,{...s,code:v.code,groupId:g.id}] as const))));
 const old=new Map(plan.vitrines.flatMap(v=>v.allocations.map(a=>[a.sourceId,{allocation:a,code:v.code}] as const)));
 const revised=plan.vitrines.map(v=>({...v,allocations:v.allocations.filter(a=>!sources.has(a.sourceId))}));
 for(const v of displayCases){
  let target=revised.find(p=>p.code===v.code);
  if(!target){target={code:v.code,allocations:[],groups:[],relationships:[]};revised.push(target);}
  for(const group of v.groups)for(const source of group.sources){
   const prior=old.get(source.sourceId);const unchanged=prior?.code===v.code;
   target.allocations.push({...prior?.allocation,sourceId:source.sourceId,saintId:source.saintId,sourceRevision:source.sourceRevision,name:source.name,groupId:group.id,
    suggestedShelfIndex:unchanged?prior.allocation.suggestedShelfIndex:null,
    suggestedBand:unchanged?prior.allocation.suggestedBand:"fit-review",
    capturedBaseline:unchanged?prior.allocation.capturedBaseline:undefined,
    reviewAlerts:[...(unchanged?prior.allocation.reviewAlerts:[]),...(!unchanged?[{message:"Shelf position to arrange on site."}]:[])]});
  }
  target.groups=[...v.groups.map(g=>({id:g.id,title:g.title,kind:"display"})),...target.groups.filter(g=>target!.allocations.some(a=>a.groupId===g.id))];
  target.notes=v.headline?v.notes:target.notes;
  // Whole-case reference loads and instrument reservations are not measured shelf dimensions.
  target.conceptualAssignedLoads=undefined;
 }
 const relationships=plan.vitrines.flatMap(v=>v.relationships);
 for(const v of revised){const ids=new Set(v.allocations.map(a=>a.sourceId));v.relationships=relationships.filter(e=>ids.has(e.fromSourceId)&&ids.has(e.toSourceId));v.groups=v.groups.filter(g=>v.allocations.some(a=>a.groupId===g.id));}
 return {...plan,version:plan.version+":"+packet.version,vitrines:revised,exceptions:plan.exceptions?.filter(e=>!packet.vitrines.some(v=>v.code===e.code))};
}
