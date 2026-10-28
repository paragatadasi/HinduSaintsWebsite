import { db } from "./db";
import { Prisma } from "./generated/prisma/client";
import { companionWorkInput, assertShelfContext } from "./museum-companion-work-domain";
import { physicalFingerprint } from "./museum-physical-location-current";
import { readPhysicalLocationView, type PhysicalSnapshotLoader } from "./museum-physical-locations";
import { SPN_WEBSITE_AIRTABLE_BASE_ID } from "./museum-vitrine-source";
import { MuseumMoveSessionError } from "./museum-move-session-domain";
import type { MoveSessionActor } from "./museum-move-session-service";
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
export async function readCompanionWork(sourceIds: string[], tx: Prisma.TransactionClient = db) {
 const [shelves,tasks] = await Promise.all([
  tx.museumCompanionShelf.findMany({where:{museumId:"museum-spn",sourceId:{in:sourceIds}},orderBy:{sourceId:"asc"}}),
  tx.museumCompanionTask.findMany({where:{museumId:"museum-spn",sourceId:{in:sourceIds}},orderBy:[{createdAt:"asc"},{id:"asc"}]})
 ]);
 return {museumId:"museum-spn",sourceIds,shelves,tasks};
}
async function assertSource(tx: Prisma.TransactionClient, sourceId:string, saintId:string|null) {
 const source = await tx.externalRecord.findUnique({where:{sourceType_externalId:{sourceType:"airtable",externalId:`${SPN_WEBSITE_AIRTABLE_BASE_ID}:Saints:${sourceId}`}},select:{entityType:true,entityId:true}});
 if(!source || (source.entityType === "Saint" ? source.entityId : null) !== saintId)
  throw new MuseumMoveSessionError(409,"This source identity changed. Reload before saving museum work.");
}
export async function saveCompanionWork(raw:unknown, actor:MoveSessionActor, loader:PhysicalSnapshotLoader) {
 if(!actor.canManage)throw new MuseumMoveSessionError(403,"A museum curator must save display work.");
 const input=companionWorkInput.parse(raw);
 return db.$transaction(async tx=>{
  await tx.$queryRaw`SELECT true FROM pg_advisory_xact_lock(hashtext('museum-move-session:spn'))`;
  const fingerprint=physicalFingerprint(input), entityId=`museum-spn:${input.clientRequestId}`;
  const retry=await tx.auditEvent.findFirst({where:{action:"museum.companion.work.updated",entityType:"MuseumCompanionWork",entityId},select:{id:true,afterJson:true}});
  if(retry){
   const data=retry.afterJson as {fingerprint?:string;sourceId?:string}|null;
   if(data?.fingerprint!==fingerprint || !data.sourceId)throw new MuseumMoveSessionError(409,"This request already saved different work. Reload before trying again.");
   return {...await readCompanionWork([data.sourceId],tx),receipt:retry,replayed:true};
  }
  let sourceId:string,before:unknown=null,after:unknown;
  if(input.action==="task.complete"){
   const task=await tx.museumCompanionTask.findFirst({where:{id:input.taskId,museumId:input.museumId}});
   if(!task)throw new MuseumMoveSessionError(404,"This display task is no longer available.");
   await assertSource(tx,task.sourceId,task.saintId);
   if(task.version!==input.expectedVersion)throw new MuseumMoveSessionError(409,"This task changed. Reload its current status.");
   sourceId=task.sourceId;before=task;
   after=await tx.museumCompanionTask.update({where:{id:task.id},data:{status:input.completed?"completed":"open",completedAt:input.completed?new Date():null,version:{increment:1},updatedById:actor.id}});
  }else{
   sourceId=input.sourceId;await assertSource(tx,sourceId,input.saintId);
   if(input.action==="task.create") after=await tx.museumCompanionTask.create({data:{museumId:input.museumId,sourceId,saintId:input.saintId,title:input.title,createdById:actor.id,updatedById:actor.id}});
   else{
    const physical=await readPhysicalLocationView(loader,tx,[sourceId],false);const row=physical.rows[0];
    if(!row || row.identityChanged || row.saintId!==input.saintId)throw new MuseumMoveSessionError(409,"This source changed. Reload before saving its shelf.");
    assertShelfContext(row,input);
    const prior=await tx.museumCompanionShelf.findUnique({where:{museumId_sourceId:{museumId:input.museumId,sourceId}}});
    if((prior?.version??0)!==input.expectedVersion)throw new MuseumMoveSessionError(409,"This shelf note changed. Reload before saving.");
    before=prior;after=await tx.museumCompanionShelf.upsert({where:{museumId_sourceId:{museumId:input.museumId,sourceId}},
     create:{museumId:input.museumId,sourceId,saintId:input.saintId,vitrine:input.vitrine,shelf:input.shelf,physicalVersion:row.currentVersion,updatedById:actor.id},
     update:{saintId:input.saintId,vitrine:input.vitrine,shelf:input.shelf,physicalVersion:row.currentVersion,version:{increment:1},updatedById:actor.id}});
   }
  }
  const receipt=await tx.auditEvent.create({data:{userId:actor.id,action:"museum.companion.work.updated",entityType:"MuseumCompanionWork",entityId,beforeJson:before?json(before):Prisma.JsonNull,
   afterJson:json({fingerprint,sourceId,operation:input.action,value:after,physicalMoveClaim:false,proposalChanged:false,editorialChanged:false})},select:{id:true,afterJson:true}});
  return {...await readCompanionWork([sourceId],tx),receipt,replayed:false};
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:60_000});
}
