// Imported only by the protected museum reader. Never include this research in public bundles.
import reference from "../data/museum/reviewed-sikh-guru-context.json";
import type {TreePerson,TreeClaim} from "./museum-tree-layout";

export function sikhContextSeeds(){return reference.nodes.flatMap(n=>n.canonicalSaintId?[n.canonicalSaintId]:[]);}
export function buildSikhContext(current:TreePerson[],claims:TreeClaim[]){
 const live=new Map(current.map(n=>[n.id,n]));
 const ids=new Map(reference.nodes.filter(n=>n.kind==="person").flatMap(n=>n.canonicalSaintId&&!live.has(n.canonicalSaintId)?[]:[[n.id,n.canonicalSaintId||n.id] as const]));
 const nodes:TreePerson[]=reference.nodes.filter(n=>ids.has(n.id)).map(n=>n.canonicalSaintId?live.get(n.canonicalSaintId)!:{id:n.id,name:n.name,birthYear:null,samadhiYear:null,presence:"none",contextOnly:true});
 const included=new Set(nodes.map(n=>n.id));
 const result=claims.filter(c=>included.has(c.from)&&included.has(c.to));
 for(const edge of reference.edges){
  const from=ids.get(edge.from),to=ids.get(edge.to);
  // A reviewed canonical decision takes precedence, even if later removed or archived.
  if(!from||!to||edge.type==="affiliation"||edge.canonicalRelationshipSaved)continue;
  if(result.some(c=>c.from===from&&c.to===to&&c.kind===edge.type))continue;
  result.push({id:edge.id,from,to,kind:edge.type as TreeClaim["kind"],status:"reviewed_context",evidence:edge.evidence,confidence:"high"});
 }
 return {nodes,claims:result,researchContext:{title:reference.title,reviewedAt:reference.reviewedAt,sources:reference.sources,
  contextCount:nodes.filter(n=>n.contextOnly).length,
  affiliations:reference.edges.filter(e=>e.type==="affiliation").map(e=>({name:reference.nodes.find(n=>n.id===e.from)!.name,label:e.label,notes:e.reviewNotes}))}};
}
