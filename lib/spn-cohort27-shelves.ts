import approved from "../data/museum/spn-cohort27-presentation-v1.json";
import type {ShelfPlanningPacket} from "./museum-shelf-planning-context";

/** Relocates recommendations only; current placements and source evidence travel unchanged. */
export function applyCohort27Shelves(packet:ShelfPlanningPacket):ShelfPlanningPacket {
 const source=packet.vitrines.find(v=>v.code==="28");
 const ids=new Set(approved.sourceIds);
 if(!source||source.allocations.length!==ids.size||new Set(source.allocations.map(a=>a.sourceId)).size!==ids.size||source.allocations.some(a=>!ids.has(a.sourceId)))
  throw new Error("The reviewed Vitrine 27 shelf cohort needs reconciliation.");
 const previous=packet.vitrines.find(v=>v.code==="27");
 if(previous?.allocations.some(a=>!ids.has(a.sourceId)))throw new Error("Vitrine 27 has additional recommendations requiring review.");
 const groupId=(id:string)=>id.replace("shelf:28:","shelf:27:");
 const baman=packet.vitrines.flatMap(v=>v.allocations).find(a=>a.sourceId==="recF52jndG5wSaY9c");
 const relocated={...packet,version:packet.version+":"+approved.version,
  exceptions:packet.exceptions?.filter(e=>e.code!=="27").map(e=>e.code==="28"?{...e,code:"27"}:e),
  vitrines:packet.vitrines.filter(v=>v.code!=="27").map(v=>v.code!=="28"?v:{...v,code:"27",
   groups:v.groups.map(g=>({...g,id:groupId(g.id)})),
   allocations:v.allocations.map(a=>({...a,groupId:groupId(a.groupId),...("columnKey" in a&&typeof a.columnKey==="string"?{columnKey:groupId(a.columnKey)}:{})})),
  })};
 return {...relocated,vitrines:relocated.vitrines.map(v=>{
  if(v.code!=="29"&&v.code!=="78")return v;
  const allocations=v.allocations.filter(a=>a.sourceId!==baman?.sourceId);
  if(v.code==="78"&&baman)allocations.push({...baman,groupId:"shelf:78:recF52jndG5wSaY9c",...("columnKey" in baman?{columnKey:"shelf:78:recF52jndG5wSaY9c"}:{}),...("destination" in baman?{destination:"78"}:{}),suggestedShelfIndex:null,preserveCurrentPlacement:true,
   reviewAlerts:[...baman.reviewAlerts,{message:"Proposed beside Vaman in Vitrine 78; the recorded location in 29 remains unchanged. Choose the shelf on site."}]});
  const branch=v.code==="29"?v.groups.filter(g=>/keshava|rec5R2rIVB6cYMOxN/i.test(g.id)):[];
  const branchIds=new Set(branch.map(g=>g.id));
  const branchId=branch[0]?.id;
  const normalized=allocations.map(a=>branchId&&branchIds.has(a.groupId)?{...a,groupId:branchId}:a);
  return {...v,allocations:normalized,
   groups:v.groups.filter(g=>normalized.some(a=>a.groupId===g.id)&&(!branchIds.has(g.id)||g.id===branchId)).map(g=>({...g,...(g.id===branchId?{title:"Keshava–Narayana branch"}:{}),...("sourceIds" in g?{sourceIds:normalized.filter(a=>a.groupId===g.id).map(a=>a.sourceId)}:{})})),
   relationships:v.relationships.filter(r=>r.fromSourceId!==baman?.sourceId&&r.toSourceId!==baman?.sourceId)};
 })};
}
