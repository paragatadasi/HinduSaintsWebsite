import type {TreeClaim,TreePerson} from "./museum-tree-layout";
import type {normalizeTreeClaims} from "./museum-tree-layout";
import {resolveSnapshotIdentity} from "./museum-domain";
type RecordLink={id:string;externalId:string;entityId:string|null};
type Canonical=Parameters<typeof normalizeTreeClaims>[0][number];
// Read-only reference overlay; never writes relationships or infers identities by name.
export function sourceTreeReference(rows:Record<string,string>[],links:RecordLink[],people:TreePerson[],canonical:Canonical[]) {
 const active=new Map(people.map(p=>[p.id,p]));const resolved=new Map<string,string>();const nodes=new Map<string,TreePerson>();
 for(const row of rows){const match=resolveSnapshotIdentity(row.RecordId,links,new Set(active.keys()));
  // A known but archived saint must not return as an anonymous source node.
  if(match.reason==="Source has no active CMS saint"&&links.some(l=>l.entityId&&l.externalId.endsWith(":"+row.RecordId)))continue;
  const id=match.record?.entityId||"source:"+row.RecordId;resolved.set(row.RecordId,id);
  const year=(s:string)=>/^-?\d{1,4}$/.test(s||"")?Number(s):null;
  nodes.set(id,active.get(id)||{id,name:row.Name,birthYear:year(row.BirthYear),samadhiYear:year(row.SamadhiYear),sourceOnly:true});
 }
 const claims:TreeClaim[]=[];
 const key=(e:Pick<TreeClaim,"from"|"to">)=>[e.from,e.to].sort().join(":");
 // Any canonical decision (including archived rejection) takes precedence over source.
 const decisions=new Set(canonical.map(r=>key({from:r.fromSaintId,to:r.toSaintId})));
 for(const row of rows){const id=resolved.get(row.RecordId);if(!id)continue;
  for(const [field,kind,reverse] of [["Masters","guru",true],["Disciples","guru",false],["Partner","partner",false],["Incarnation","incarnation",false]] as const){
   for(const target of (row[field]||"").split(";").map(s=>s.trim()).filter(Boolean)){const other=resolved.get(target);if(!other||id===other)continue;
    let from=reverse?other:id,to=reverse?id:other;if(kind!=="guru"&&from>to)[from,to]=[to,from];
    const claim:TreeClaim={id:`export:${row.RecordId}:${field}:${target}`,from,to,kind,status:"source reference",evidence:"preserved export; not website-reviewed",confidence:"unreviewed"};
    if(!decisions.has(key(claim)))claims.push(claim);
   }
  }
 }
 return {nodes:[...nodes.values()],claims};
}
