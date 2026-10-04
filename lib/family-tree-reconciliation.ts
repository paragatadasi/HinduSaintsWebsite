import {createHash} from "node:crypto";
import {db} from "@/lib/db";
import type {Prisma} from "@/lib/generated/prisma/client";
import {getMuseumProposalData} from "./museum-proposals";
import {planFamilyConnections,type SourceRow} from "./family-tree-reconciliation-domain";
const json=(v:unknown):Prisma.InputJsonValue=>JSON.parse(JSON.stringify(v));
const digest=(v:unknown)=>createHash("sha256").update(JSON.stringify(v)).digest("hex");
type Client=Prisma.TransactionClient;
export async function readFamilyTreeReconciliation(client:Client=db,sourceRows?:SourceRow[]) {
 const rows=sourceRows??[...getMuseumProposalData().membersById.values()];
 const [saints,links,edges]=await Promise.all([
  client.saint.findMany({where:{status:{not:"archived"}},select:{id:true},orderBy:{id:"asc"}}),
  client.externalRecord.findMany({where:{sourceType:"airtable",entityType:"Saint"},select:{id:true,externalId:true,entityId:true},orderBy:{id:"asc"}}),
  client.saintRelationship.findMany({select:{id:true,fromSaintId:true,toSaintId:true,relationshipType:true,status:true,updatedAt:true},orderBy:{id:"asc"}})
 ]);
 const plans=planFamilyConnections(rows,links,new Set(saints.map(s=>s.id)),edges);
 const snapshotHash=digest(rows),version=digest({snapshotHash,saints,links,edges});
 return {rows,plans,snapshotHash,version,counts:Object.fromEntries(["missing","existing","unresolved","conflict"].map(state=>[state,plans.filter(p=>p.state===state).length]))};
}
// Explicit protected operation only. Never run during refresh, build or rendering.
export async function reconcileFamilyTreeConnections(actorId:string,version:string,sourceRows?:SourceRow[]) {
 if(!/^[a-f0-9]{64}$/.test(version))throw Error("Invalid review version");
 return db.$transaction(async tx=>{
  await tx.$queryRaw`SELECT true AS locked FROM pg_advisory_xact_lock(8496245)`;
  const review=await readFamilyTreeReconciliation(tx,sourceRows);
  if(review.version!==version)throw Error("Website identities or connections changed; reload the review");
  const snapshot=await tx.externalRecord.upsert({where:{sourceType_externalId:{sourceType:"museum_family_export",externalId:review.snapshotHash}},create:{sourceType:"museum_family_export",externalId:review.snapshotHash,entityType:"FamilyTreeSourceSnapshot",rawPayloadJson:json({path:"data/museum/airtable-saint-family-members.csv",rows:review.rows})},update:{}});
  let created=0,issues=0;
  for(const p of review.plans){
   if(p.state==="existing")continue;
   const externalId=review.snapshotHash+":"+p.key;
   const evidence=await tx.externalRecord.upsert({where:{sourceType_externalId:{sourceType:"museum_family_connection",externalId}},create:{sourceType:"museum_family_connection",externalId,entityType:"FamilyTreeConnectionEvidence",rawPayloadJson:json({...p,snapshotId:snapshot.id})},update:{}});
   if(p.state!=="missing"){
    const prior=await tx.reconciliationIssue.findFirst({where:{issueType:"family_tree_connection",entityType:"ExternalRecord",entityId:evidence.id}});
    if(!prior){await tx.reconciliationIssue.create({data:{issueType:"family_tree_connection",severity:"warning",entityType:"ExternalRecord",entityId:evidence.id,message:p.reason,rawValue:JSON.stringify(p)}});issues++;}
    continue;
   }
   const relationship=await tx.saintRelationship.create({data:{fromSaintId:p.fromId!,toSaintId:p.toId!,relationshipType:p.kind,status:"needs_review",publicVisible:false,evidenceStatus:"imported",confidence:"medium",externalRecordId:evidence.id,notes:"Preserved museum family-tree export; not independently researched. Guru direction is disciple to teacher."}});
   await tx.saintRelationshipSource.create({data:{relationshipId:relationship.id,externalRecordId:evidence.id,notes:"Original linked record IDs and reciprocal fields retained in the immutable source snapshot."}});
   await tx.auditEvent.create({data:{userId:actorId,action:"museum.family_connection.imported",entityType:"SaintRelationship",entityId:relationship.id,afterJson:json({relationship,source:evidence.id,snapshot:snapshot.id})}});created++;
  }
  await tx.auditEvent.create({data:{userId:actorId,action:"museum.family_connections.reconciled",entityType:"ExternalRecord",entityId:snapshot.id,afterJson:json({created,issues,counts:review.counts})}});
  return {created,issues};
 },{isolationLevel:"Serializable",timeout:60000});
}
