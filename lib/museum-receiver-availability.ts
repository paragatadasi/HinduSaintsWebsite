import {db} from "./db";
import {Prisma} from "./generated/prisma/client";
import {readPhysicalLocationView,readMuseumPreparations,type PhysicalSnapshotLoader} from "./museum-physical-locations";
import {readStarterGuideDefinition,currentReceiverGuideDefinitions} from "./spn-starter-guide-registry";
import {readMuseumData} from "./museum-working-data";
import {readEffectiveCompanionAdditions} from "./museum-companion-additions-state";
import {currentCompanionAdditions} from "./museum-companion-addition-validation";
import {readGuideAlternativeDestinations} from "./museum-guide-alternatives";
import {buildLatestSpnReview} from "./spn-reviewed-proposal";
import {spnCaseExecutionHold} from "./museum-case-execution-holds";
import {MuseumMoveSessionError} from "./museum-move-session-domain";
import {physicalFingerprint} from "./museum-physical-location-current";
import {receiverAvailabilityInput,receiverAvailabilitySnapshot,receiverAvailabilityValid,assertReceiverAvailabilityRevision,type ReceiverAvailability} from "./museum-receiver-availability-domain";
import type {MoveSessionActor} from "./museum-move-session-service";

const json=(value:unknown)=>JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
async function readAvailabilityState(loader:PhysicalSnapshotLoader,tx:Prisma.TransactionClient){
 const [physical,museum,additions,alternatives,preparations]=await Promise.all([readPhysicalLocationView(loader,tx,undefined,false),readMuseumData(tx),readEffectiveCompanionAdditions(tx),readGuideAlternativeDestinations(tx),readMuseumPreparations(tx)]);
 const valid=currentCompanionAdditions(additions,physical.rows);
 const review=buildLatestSpnReview(museum.placements,[...valid,...alternatives.filter(r=>!valid.some(a=>a.sourceId===r.sourceId))],physical.rows);
 return {physical,review,preparations};
}
function availabilityPreview(state:Awaited<ReturnType<typeof readAvailabilityState>>,vitrine:string,guideVersion:string){
 const guide=readStarterGuideDefinition(guideVersion);
 if(guide.readOnly||!currentReceiverGuideDefinitions(vitrine).some(d=>d.context.guideVersion===guideVersion))throw new MuseumMoveSessionError(409,"Open this vitrine's current receiving guide before confirming space.");
 const hold=spnCaseExecutionHold(vitrine);if(hold)throw new MuseumMoveSessionError(409,hold);
 const {physical,review,preparations}=state;
 if(!physical.vitrineCodes.includes(vitrine))throw new MuseumMoveSessionError(400,"Choose a current museum vitrine.");
 if(physical.unmappedCurrentLocations.some(r=>r.location.kind==="vitrine"&&r.location.code===vitrine))throw new MuseumMoveSessionError(409,"This vitrine has an unlinked recorded placement. Review it before confirming space.");
 const incomingIds=review.rows.filter(r=>r.effectiveVitrine===vitrine).map(r=>r.sourceId);
 return {museumId:"museum-spn" as const,...receiverAvailabilitySnapshot(guide.context,vitrine,physical.rows,incomingIds),expectedPreparationVersion:preparations.find(r=>r.vitrine===vitrine)?.version??0,physicalMoveClaim:false as const,emptyCaseClaim:false as const};
}
export async function readReceiverAvailabilityPreview(loader:PhysicalSnapshotLoader,vitrine:string,guideVersion:string,tx:Prisma.TransactionClient=db){
 return availabilityPreview(await readAvailabilityState(loader,tx),vitrine,guideVersion);
}

export async function readReceiverAvailabilities(loader:PhysicalSnapshotLoader,tx:Prisma.TransactionClient=db,vitrines?:string[]){
 const events=await tx.auditEvent.findMany({where:{action:"museum.vitrine.preparation.updated",entityType:"MuseumVitrinePreparation",entityId:{startsWith:"museum-spn:"}},orderBy:[{createdAt:"desc"},{id:"desc"}],select:{id:true,createdAt:true,afterJson:true}});
 const relevant=events.filter(event=>{const data=event.afterJson as {receiverAvailability?:unknown;vitrine?:string}|null;return data?.receiverAvailability&&data.vitrine&&(!vitrines||vitrines.includes(data.vitrine));});
 if(!relevant.length)return [];
 const state=await readAvailabilityState(loader,tx),preparations=state.preparations;
 const seen=new Set<string>();const result:{vitrine:string;guideVersion:string;receiptId:string;recordedAt:string;valid:boolean;reason:string|null}[]=[];
 for(const event of relevant){
  const data=event.afterJson as {museumId?:string;vitrine?:string;version?:number;receiverAvailability?:ReceiverAvailability}|null;
  if(data?.museumId!=="museum-spn"||!data.receiverAvailability||!data.vitrine||seen.has(data.vitrine)||(vitrines&&!vitrines.includes(data.vitrine)))continue;
  seen.add(data.vitrine);const saved=data.receiverAvailability;let valid=false;
  const prep=preparations.find(r=>r.vitrine===data.vitrine);
  if(prep?.prepared&&prep.version===data.version)try{valid=receiverAvailabilityValid(saved,event.createdAt.toISOString(),availabilityPreview(state,data.vitrine,saved.guideContext.guideVersion));}catch(error){if(!(error instanceof MuseumMoveSessionError))throw error;}
  result.push({vitrine:data.vitrine,guideVersion:saved.guideContext.guideVersion,receiptId:event.id,recordedAt:event.createdAt.toISOString(),valid,reason:valid?null:"The contents, proposal or preparation changed. Check the available space again."});
 }
 return result;
}

export async function saveReceiverAvailability(raw:unknown,actor:MoveSessionActor,loader:PhysicalSnapshotLoader){
 if(!actor.canManage)throw new MuseumMoveSessionError(403,"A museum curator must confirm available space.");
 const input=receiverAvailabilityInput.parse(raw),fingerprint=physicalFingerprint(input);
 return db.$transaction(async tx=>{
  await tx.$queryRaw`SELECT true FROM pg_advisory_xact_lock(hashtext('museum-move-session:spn'))`;
  await tx.$queryRaw`SELECT true FROM pg_advisory_xact_lock(hashtext('museum-companion-additions:spn'))`;
  await tx.$queryRaw`SELECT true FROM pg_advisory_xact_lock(hashtext('museum-guide-decisions:spn'))`;
  const action="museum.vitrine.preparation.updated",entityType="MuseumVitrinePreparation",entityId=`museum-spn:${input.clientRequestId}`;
  const prior=await tx.auditEvent.findFirst({where:{action,entityType,entityId},select:{id:true,afterJson:true}});
  if(prior){if((prior.afterJson as {fingerprint?:string}|null)?.fingerprint!==fingerprint)throw new MuseumMoveSessionError(409,"This request already saved another acknowledgement. Refresh before trying again.");return {museumId:"museum-spn",receipt:prior,replayed:true,preparations:await readMuseumPreparations(tx),receiverAvailabilities:await readReceiverAvailabilities(loader,tx)};}
  const preview=await readReceiverAvailabilityPreview(loader,input.vitrine,input.guideContext.guideVersion,tx);
  if(JSON.stringify(preview.guideContext)!==JSON.stringify(input.guideContext))throw new MuseumMoveSessionError(409,"The guide changed. Reload before confirming space.");
  assertReceiverAvailabilityRevision(input.expectedRevision,input.expectedPreparationVersion,preview);
  const {guideContext,vitrine,occupants,incoming}=preview;
  const receipt=await tx.auditEvent.create({data:{userId:actor.id,action,entityType,entityId,afterJson:json({...input,fingerprint,prepared:true,version:input.expectedPreparationVersion+1,receiverAvailability:{guideContext,vitrine,occupants,incoming},physicalMoveClaim:false,emptyCaseClaim:false,proposalChanged:false})},select:{id:true,afterJson:true}});
  return {museumId:"museum-spn",receipt,replayed:false,preparations:await readMuseumPreparations(tx),receiverAvailabilities:await readReceiverAvailabilities(loader,tx)};
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:60000});
}
