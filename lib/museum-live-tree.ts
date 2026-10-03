import {db} from "@/lib/db";
import {normalizeTreeClaims,layoutMuseumTree,type TreePerson} from "./museum-tree-layout";
import {readSaintCollectionItems} from "./museum-collections";
import {readVrindavanMuseumInventory} from "./vrindavan-museum-inventory";
import {projectSourceVitrines,SPN_WEBSITE_AIRTABLE_BASE_ID} from "./museum-vitrine-source";
import {readMuseumSaintProfiles} from "./museum-saint-profiles";

// Private read-only API. Caller must check access_museum AND view_full_saint_catalog.
const relationshipKinds=["guru","disciple","partner","husband","wife","incarnation"] as const;
const NODE_LIMIT=120,EDGE_LIMIT=500,HOPS=5;
export async function readMuseumLiveTree(seeds:string[],museum:"spn"|"vrindavan",includeUnreviewed:boolean) {
 const select={id:true,displayName:true,birthYear:true,samadhiYear:true} as const;
 const initial=await db.saint.findMany({where:{id:{in:seeds},status:{not:"archived"}},select,orderBy:{id:"asc"}});
 const people=new Map(initial.map(n=>[n.id,n]));
 let frontier=initial.map(n=>n.id),truncated=false;
 const records=new Map<string,Parameters<typeof normalizeTreeClaims>[0][number]>();
 for(let hop=0;hop<HOPS&&frontier.length;hop++){
  const found=await db.saintRelationship.findMany({where:{relationshipType:{in:[...relationshipKinds]},status:includeUnreviewed?{not:"archived"}:"published",fromSaint:{status:{not:"archived"}},toSaint:{status:{not:"archived"}},OR:[{fromSaintId:{in:frontier}},{toSaintId:{in:frontier}}]},select:{id:true,fromSaintId:true,toSaintId:true,relationshipType:true,status:true,evidenceStatus:true,confidence:true},orderBy:{id:"asc"},take:EDGE_LIMIT+1});
  if(found.length>EDGE_LIMIT)truncated=true;
  const unknown=[...new Set(found.slice(0,EDGE_LIMIT).flatMap(e=>[e.fromSaintId,e.toSaintId]))].filter(id=>!people.has(id)).sort();
  const room=NODE_LIMIT-people.size;if(unknown.length>room)truncated=true;
  const next=await db.saint.findMany({where:{id:{in:unknown.slice(0,room)},status:{not:"archived"}},select,orderBy:{id:"asc"}});
  next.forEach(n=>people.set(n.id,n));
  for(const edge of found)if(people.has(edge.fromSaintId)&&people.has(edge.toSaintId)){if(records.size<EDGE_LIMIT||records.has(edge.id))records.set(edge.id,edge);else truncated=true;}
  frontier=next.map(n=>n.id);
  if(hop===HOPS-1&&frontier.length)truncated=true;
  if(!room)break;
 }
 const [collections,sourceIds,profiles]=await Promise.all([
  readSaintCollectionItems(),
  museum==="vrindavan"?readVrindavanMuseumInventory().then(data=>new Set(data.saints.map(s=>s.id))):readSpnSourceIds(new Set(people.keys())),
  readMuseumSaintProfiles([...people.keys()])
 ]);
 const museumId="museum-"+museum;
 const nodes:TreePerson[]=[...people.values()].map(n=>{
  const items=collections.get(n.id)||[];
  const presence=items.some(i=>i.location?.museumId===museumId)?"location":items.some(i=>i.catalogMuseum.id===museumId)?"catalogue":sourceIds.has(n.id)?"source":"none";
  return {id:n.id,name:n.displayName,birthYear:n.birthYear,samadhiYear:n.samadhiYear,presence};
 });
 return {layout:layoutMuseumTree(nodes,normalizeTreeClaims([...records.values()])),profiles,truncated,limits:{nodes:NODE_LIMIT,hops:HOPS},retrievedAt:new Date().toISOString()};
}
export type MuseumLiveTree=Awaited<ReturnType<typeof readMuseumLiveTree>>;

async function readSpnSourceIds(ids:Set<string>) {
 const [mirrors,links]=await Promise.all([
  db.airtableMirrorRecord.findMany({where:{baseId:SPN_WEBSITE_AIRTABLE_BASE_ID,tableIdOrName:"Saints"},select:{baseId:true,tableIdOrName:true,recordId:true,rawFieldsJson:true}}),
  db.externalRecord.findMany({where:{sourceType:"airtable",entityType:"Saint"},select:{externalId:true,entityId:true}})
 ]);
 return new Set(projectSourceVitrines(mirrors,links,ids).keys());
}
