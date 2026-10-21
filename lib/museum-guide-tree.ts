import {layoutMuseumTree,type TreePerson,type TreeClaim} from "./museum-tree-layout";
import type {ResolvedGuideConnection} from "./vrindavan-guide-connections-domain";
// Display-only projection. Context keys never resolve to inventory identities.
export function guideTreeOverlay(nodes:TreePerson[],claims:TreeClaim[],connections:ResolvedGuideConnection[],seeds=nodes.map(n=>n.id)) {
 const reachable=new Set(seeds);
 const usable=connections.filter(c=>c.from.available&&c.to.available);
 for(let i=0;i<usable.length;i++)for(const c of usable)if(reachable.has(c.from.id)||reachable.has(c.to.id)){reachable.add(c.from.id);reachable.add(c.to.id);}
 const selected=usable.filter(c=>reachable.has(c.from.id)&&reachable.has(c.to.id));
 const people=new Map(nodes.map(n=>[n.id,n]));
 const extra:TreeClaim[]=selected.map(c=>{
  for(const ep of [c.from,c.to])if(!people.has(ep.id))people.set(ep.id,{id:ep.id,name:ep.person?.name??ep.label,birthYear:ep.person?.birthYear??null,samadhiYear:ep.person?.samadhiYear??null,contextOnly:ep.contextOnly,presence:ep.presence});
  return {id:c.id,from:c.from.id,to:c.to.id,kind:c.kind==="teaching"?"guru":c.kind==="succession"?"successor":c.kind==="biological_family"?"family":c.kind,label:c.label,structural:c.structural,status:"guide_reference",evidence:c.evidence,confidence:c.confidence};
 });
 return {layout:layoutMuseumTree([...people.values()],[...claims,...extra]),guideConnections:selected};
}
