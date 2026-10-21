import {normalizeTreeClaims,type TreeClaim,type TreePerson} from "./museum-tree-layout";
import {sourceTreeReference} from "./museum-tree-source";
import type {GuideConnection} from "./vrindavan-guide-connections-domain";

type Canonical=Parameters<typeof normalizeTreeClaims>[0][number];
// A family label or an isolated node is not a tree. Match the focused viewer:
// the selected saint must itself have an edge with two available endpoints.
export function treeAvailability(people:TreePerson[],canonical:Canonical[],guide:GuideConnection[],families:Map<string,Record<string,string>[]>,links:Parameters<typeof sourceTreeReference>[1]){
 const active=new Set(people.map(p=>p.id));
 const endpoints=(claims:Pick<TreeClaim,"from"|"to">[])=>new Set(claims.filter(c=>c.from!==c.to).flatMap(c=>[c.from,c.to]));
 const connected=endpoints(normalizeTreeClaims(canonical.filter(c=>c.status!=="archived"&&active.has(c.fromSaintId)&&active.has(c.toSaintId))));
 for(const c of guide){
  if([c.from,c.to].every(e=>e.kind==="context"||active.has(e.saintId))){
   const ids=[c.from,c.to].map(e=>e.kind==="context"?"guide-context:"+e.key:e.saintId);
   if(ids[0]!==ids[1])for(const e of [c.from,c.to])if(e.kind==="saint")connected.add(e.saintId);
  }
 }
 const source=new Map([...families].map(([key,rows])=>[key,endpoints(sourceTreeReference(rows,links,people,canonical).claims)]));
 return (saintId:string,familyKey?:string)=>active.has(saintId)&&(connected.has(saintId)||!!source.get(familyKey?.replace(/^suggested:/,"")??"")?.has(saintId));
}
