import {createHash} from "node:crypto";
import type {MuseumSaintPlacement} from "./museum-proposals";

// Keep automatic membership and the live tree on the same vocabulary. Generic
// associations, influences and contemporaries do not establish a family.
export const MUSEUM_TREE_RELATIONSHIP_KINDS = ["guru", "disciple", "partner", "husband", "wife", "incarnation", "successor", "parent", "child", "father", "mother", "son", "daughter", "family", "lineage"] as const;
export type MuseumFamilyRelationship = {id:string;fromSaintId:string;toSaintId:string;relationshipType:string;status:string;evidenceStatus:string;confidence:string};
export type MuseumFamilyReconciliation = {state:"applied"|"held";reason:string;familyKey?:string;anchorIds:string[];relationshipIds:string[];previousFamilyKey?:string;previousTier?:MuseumSaintPlacement["tier"];previousRationale?:string};
const digest=(value:unknown)=>createHash("sha256").update(JSON.stringify(value)).digest("hex");
const key=(row:MuseumSaintPlacement)=>row.curatorialFamily||row.familyId;

// Read-only effective proposals, AFTER baseline arrangement validation. Never
// reinterpret a saved destination as agreement with an inferred family or tier.
export function reconcileMuseumFamilies(rows:MuseumSaintPlacement[], relationships:MuseumFamilyRelationship[], protectedIds:ReadonlySet<string>=new Set()) {
 const counts=new Map<string,number>();
 for(const row of rows)if(row.saintId)counts.set(row.saintId,(counts.get(row.saintId)||0)+1);
 const eligible=(row:MuseumSaintPlacement)=>Boolean(row.saintId&&counts.get(row.saintId)===1&&!row.placementState?.startsWith("Conflicting")&&row.section!=="Needs section proposal"&&row.placementState!=="Unlinked");
 const edges=[...new Map(relationships.filter(r=>r.status==="published"&&!["disputed","imported"].includes(r.evidenceStatus)&&r.confidence!=="low"&&r.fromSaintId!==r.toSaintId&&(MUSEUM_TREE_RELATIONSHIP_KINDS as readonly string[]).includes(r.relationshipType)).map(r=>[r.id,r])).values()].sort((a,b)=>a.id.localeCompare(b.id));
 const adjacency=new Map<string,MuseumFamilyRelationship[]>();
 for(const edge of edges)for(const id of [edge.fromSaintId,edge.toSaintId])adjacency.set(id,[...(adjacency.get(id)||[]),edge]);
 const anchors=rows.filter(r=>eligible(r)&&r.tier==="Featured");
 const anchorsById=new Map<string,MuseumSaintPlacement[]>();
 for(const anchor of anchors)anchorsById.set(anchor.saintId!,[...(anchorsById.get(anchor.saintId!)||[]),anchor]);
 return rows.map(row=>{
  if(!eligible(row)||protectedIds.has(row.id)||row.proposalReviewed||row.placementState==="Confirmed"||row.displayMembership?.detached||row.tier==="Featured")return row;
  // Match the live tree's bounded traversal. Stop at the nearest Primary layer;
  // equal-distance competing families stay held instead of depending on order.
  const seen=new Set([row.saintId!]);
  let frontier=[{id:row.saintId!,path:[] as string[]}];
  let matches:{anchor:MuseumSaintPlacement;path:string[]}[]=[];
  for(let hop=0;hop<10&&frontier.length&&!matches.length;hop++){
   const next=new Map<string,{id:string;path:string[]}>();
   for(const node of frontier)for(const edge of adjacency.get(node.id)||[]){
    if(hop>=5&&edge.relationshipType!=="successor")continue;
    const id=edge.fromSaintId===node.id?edge.toSaintId:edge.fromSaintId;
    if(seen.has(id))continue;
    const path=[...node.path,edge.id];
    for(const anchor of anchorsById.get(id)||[])matches.push({anchor,path});
    if(!next.has(id))next.set(id,{id,path});
   }
   frontier=[...next.values()];frontier.forEach(n=>seen.add(n.id));
  }
  if(!matches.length)return row;
  const choices=new Set(matches.map(m=>JSON.stringify([m.anchor.section,key(m.anchor)])));
  const sameSection=matches.every(m=>m.anchor.section===row.section);
  const familyKey=key(matches[0].anchor);
  const applied=choices.size===1&&sameSection&&Boolean(familyKey);
  const evidence:MuseumFamilyReconciliation={state:applied?"applied":"held",reason:applied?"Published family-tree connections to a Primary saint.":!familyKey?"Primary anchor has no display family; curator review required.":!sameSection?"Primary family belongs to another section; curator review required.":"Competing Primary families; curator review required.",anchorIds:[...new Set(matches.map(m=>m.anchor.saintId!))].sort(),relationshipIds:[...new Set(matches.flatMap(m=>m.path))].sort(),...(applied?{familyKey,previousFamilyKey:key(row),previousTier:row.tier,previousRationale:row.rationale}:{})};
  if(!applied)return {...row,familyReconciliation:evidence,note:row.note+" Family reconciliation held: "+evidence.reason};
  const anchor=matches[0].anchor;
  const changed=row.tier!=="Secondary"||key(row)!==familyKey;
  if(!changed)return row;
  const after:MuseumSaintPlacement={...row,tier:"Secondary",familyId:anchor.familyId,curatorialFamily:anchor.curatorialFamily,groupLabel:anchor.groupLabel||anchor.curatorialFamily||familyKey,familyReconciliation:evidence,rationale:"Automatic reconciliation: Secondary in "+(anchor.groupLabel||anchor.curatorialFamily||familyKey)+" through published family-tree relationships."};
  // Fingerprint effective evidence for stale-form checks, retaining the original
  // storage proposalRevision so Planned/Implemented coordinates remain valid.
  const revision={rule:"museum-family-v1",tier:after.tier,familyKey,evidence};
  if(row.curatorProposalRevision)after.curatorProposalRevision=digest({base:row.curatorProposalRevision,revision});
  if(row.arrangement)after.arrangement={...row.arrangement,familyKey,revision:digest({base:row.arrangement.revision,revision})};
  if(key(row)!==familyKey)after.displayMembership=undefined;
  return after;
 });
}
