import {resolveSnapshotIdentity} from "./museum-domain";
export type SourceRow=Record<string,string>;
export type Link={id:string;externalId:string;entityId:string|null};
export type Edge={id:string;fromSaintId:string;toSaintId:string;relationshipType:string;status:string};
export type Claim={key:string;kind:"guru"|"partner"|"incarnation";fromRecordId:string;toRecordId:string;evidence:Array<{recordId:string;field:string;target:string;familyId:string}>};
export function preservedFamilyClaims(rows:SourceRow[]) {
 const claims=new Map<string,Claim>();
 for(const row of rows)for(const [field,kind,reverse] of [["Masters","guru",false],["Disciples","guru",true],["Partner","partner",false],["Incarnation","incarnation",false]] as const){
  for(const target of (row[field]||"").split(";").map(s=>s.trim()).filter(Boolean)){
   let from=reverse?target:row.RecordId,to=reverse?row.RecordId:target;
   if(kind!=="guru"&&from>to)[from,to]=[to,from];
   const key=[kind,from,to].join(":");const claim=claims.get(key)||{key,kind,fromRecordId:from,toRecordId:to,evidence:[]};
   claim.evidence.push({recordId:row.RecordId,field,target,familyId:row.FamilyID});claims.set(key,claim);
  }
 }
 return [...claims.values()].sort((a,b)=>a.key.localeCompare(b.key));
}
function equivalent(c:Claim,from:string,to:string,e:Edge){
 if(c.kind==="guru")return e.relationshipType==="guru"&&e.fromSaintId===from&&e.toSaintId===to||e.relationshipType==="disciple"&&e.fromSaintId===to&&e.toSaintId===from;
 return (c.kind==="partner"?["partner","husband","wife"]:["incarnation"]).includes(e.relationshipType)&&[from,to].includes(e.fromSaintId)&&[from,to].includes(e.toSaintId);
}
export function planFamilyConnections(rows:SourceRow[],links:Link[],activeIds:Set<string>,edges:Edge[]) {
 const names=new Map(rows.map(r=>[r.RecordId,r.Name]));
 const rawPlans=preservedFamilyClaims(rows).map(claim=>{
  const from=resolveSnapshotIdentity(claim.fromRecordId,links,activeIds),to=resolveSnapshotIdentity(claim.toRecordId,links,activeIds);
  const fromId=from.record?.entityId||null,toId=to.record?.entityId||null;
  const base={...claim,fromId,toId,fromName:names.get(claim.fromRecordId)||claim.fromRecordId,toName:names.get(claim.toRecordId)||claim.toRecordId,existingId:null as string|null};
  if(!fromId||!toId)return {...base,state:"unresolved",reason:[from.reason,to.reason].filter(Boolean).join("; ")};
  if(fromId===toId)return {...base,state:"conflict",reason:"Both endpoints resolve to the same website saint"};
  const matches=edges.filter(e=>equivalent(claim,fromId,toId,e));
  if(matches.length){const archived=matches.find(e=>e.status==="archived");return {...base,existingId:(archived||matches[0]).id,state:archived?"conflict":"existing",reason:archived?"An archived canonical connection is preserved":"Equivalent website relationship already exists; preserve its review state"};}
  // Different types or directions can be legitimate, but require explicit review.
  const pair=edges.filter(e=>[fromId,toId].includes(e.fromSaintId)&&[fromId,toId].includes(e.toSaintId));
  if(pair.length)return {...base,state:"conflict",reason:"A canonical decision exists for this pair with a different type or direction"};
  return {...base,state:"missing",reason:"Both source identities map uniquely to active website saints"};
 });
 // Several imported rows may map to one canonical saint. Keep all source fields,
 // but create only one canonical relationship for the same type/direction.
 const grouped=new Map<string,typeof rawPlans[number]>();
 for(const p of rawPlans){const endpoints=p.kind==="guru"?[p.fromId,p.toId]:[p.fromId,p.toId].sort();
  const key=p.fromId&&p.toId?[p.kind,...endpoints].join(":"):p.key;
  const prior=grouped.get(key);if(prior)prior.evidence.push(...p.evidence);else grouped.set(key,p);
 }
 const plans=[...grouped.values()];
 const adjacency=new Map<string,Set<string>>();
 const add=(from:string,to:string)=>{const next=adjacency.get(from)||new Set<string>();next.add(to);adjacency.set(from,next);};
 for(const e of edges.filter(e=>e.status!=="archived")){if(e.relationshipType==="guru")add(e.fromSaintId,e.toSaintId);if(e.relationshipType==="disciple")add(e.toSaintId,e.fromSaintId);}
 for(const p of plans)if(p.state==="missing"&&p.kind==="guru")add(p.fromId!,p.toId!);
 const reaches=(start:string,end:string)=>{const queue=[start],seen=new Set<string>();while(queue.length){const id=queue.pop()!;if(id===end)return true;if(seen.has(id))continue;seen.add(id);queue.push(...(adjacency.get(id)||[]));}return false;};
 for(const p of plans)if(p.state==="missing"&&p.kind==="guru"&&reaches(p.toId!,p.fromId!)){p.state="conflict";p.reason="The proposed guru connection participates in a direction cycle";}
 return plans;
}
