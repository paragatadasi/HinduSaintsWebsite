import {db} from "./db";
import {Prisma} from "./generated/prisma/client";
import {readPhysicalLocationView,type PhysicalSnapshotLoader} from "./museum-physical-locations";
import {readMuseumData} from "./museum-working-data";
import {readEffectiveCompanionAdditions} from "./museum-companion-additions-state";
import {currentCompanionAdditions} from "./museum-companion-addition-validation";
import {readGuideAlternativeDestinations} from "./museum-guide-alternatives";
import {buildLatestSpnReview} from "./spn-reviewed-proposal";
import {physicalFingerprint} from "./museum-physical-location-current";
import {MuseumMoveSessionError} from "./museum-move-session-domain";
import {assertSelectedCaseContents,caseContentsPreview,caseStagingReconciliation,type CasePreparationEvidence} from "./museum-case-contents-domain";
import type {MoveSessionActor} from "./museum-move-session-service";

const json=(value:unknown)=>JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
type PreviewOptions={vitrine:string;mode:"selected_contents"|"historical";preparationReceiptId?:string};
export async function readCaseContentsPreview(loader:PhysicalSnapshotLoader,options:PreviewOptions,client:Prisma.TransactionClient=db){
 const [physical,current,additions,alternatives]=await Promise.all([readPhysicalLocationView(loader,client,undefined,false),readMuseumData(client),readEffectiveCompanionAdditions(client),readGuideAlternativeDestinations(client)]);
 let preparation:CasePreparationEvidence|undefined;
 if(options.mode==="historical"){
  const event=await client.auditEvent.findFirst({where:{...(options.preparationReceiptId?{id:options.preparationReceiptId}:{}),action:"museum.vitrine.preparation.updated",entityType:"MuseumVitrinePreparation",AND:[{afterJson:{path:["museumId"],equals:"museum-spn"}},{afterJson:{path:["vitrine"],equals:options.vitrine}},{afterJson:{path:["prepared"],equals:true}}]},orderBy:[{createdAt:"desc"},{id:"desc"}],select:{id:true,createdAt:true}});
  if(!event)throw new MuseumMoveSessionError(409,"No saved availability acknowledgement was found for this vitrine. Review its current contents instead.");
  preparation={receiptId:event.id,vitrine:options.vitrine,prepared:true,recordedAt:event.createdAt.toISOString(),physicalMoveClaim:false,emptyCaseClaim:false};
 }
 const valid=currentCompanionAdditions(additions,physical.rows);
 const review=buildLatestSpnReview(current.placements,[...valid,...alternatives.filter(row=>!valid.some(a=>a.sourceId===row.sourceId))],physical.rows);
 return caseContentsPreview(physical.rows,review.rows.map(row=>({sourceId:row.sourceId,vitrine:row.effectiveVitrine})),options.vitrine,options.mode,preparation);
}

export async function reconcileCaseStaging(raw:unknown,actor:MoveSessionActor,loader:PhysicalSnapshotLoader){
 if(!actor.canManage)throw new MuseumMoveSessionError(403,"A museum curator must reconcile staging records.");
 const input=caseStagingReconciliation.parse(raw),fingerprint=physicalFingerprint(input);
 return db.$transaction(async tx=>{
  await tx.$queryRaw`SELECT true FROM pg_advisory_xact_lock(hashtext('museum-move-session:spn'))`;
  const entityId=`museum-spn:${input.clientRequestId}`,action="museum.physical_location.confirmed",entityType="MuseumPhysicalConfirmation";
  const prior=await tx.auditEvent.findFirst({where:{action,entityType,entityId},select:{id:true,afterJson:true}});
  if(prior){const data=prior.afterJson as {fingerprint?:string}|null;if(data?.fingerprint!==fingerprint)throw new MuseumMoveSessionError(409,"This request already saved a different correction.");return {receipt:prior,replayed:true,preview:await readCaseContentsPreview(loader,{vitrine:input.vitrine,mode:"historical",preparationReceiptId:input.preparationReceiptId},tx)};}
  const preview=await readCaseContentsPreview(loader,{vitrine:input.vitrine,mode:"historical",preparationReceiptId:input.preparationReceiptId},tx);
  assertSelectedCaseContents(input.records,input.expectedRevision,preview);
  const location={kind:"table",code:"staging-area",label:"Staging area"},recordedAt=new Date();
  const moves=input.records.map(record=>{const row=preview.eligible.find(row=>row.sourceId===record.sourceId)!;return {sourceId:row.sourceId,saintId:row.saintId,name:row.name,original:row.from,previous:row.from,previousState:{basis:"source",location:row.from,effectiveConfirmedAt:null},location,version:row.expectedLocationVersion+1};});
  for(const move of moves)await tx.museumMoveCurrentLocation.upsert({where:{museumId_sourceId:{museumId:"museum-spn",sourceId:move.sourceId}},create:{museumId:"museum-spn",sourceId:move.sourceId,location:json(location),confirmedAt:recordedAt,confirmedById:actor.id},update:{location:json(location),version:{increment:1},confirmedAt:recordedAt,confirmedById:actor.id}});
  const receipt=await tx.auditEvent.create({data:{userId:actor.id,action,entityType,entityId,beforeJson:json(input.records),afterJson:json({museumId:"museum-spn",fingerprint,clientRequestId:input.clientRequestId,recordedAt:recordedAt.toISOString(),confirmedDate:input.reportedDate,datePrecision:"date",evidence:"Curator confirms these selected residual source entries were cleared earlier and are still in staging. Availability alone did not establish their location.",historicalPreparation:preview.preparation,preservedConfirmedCount:preview.preservedConfirmedCount,scope:"source_observation",moves,guideContext:null,clearedVitrines:[],emptyCaseClaim:"none",inventoryCompleteness:"unverified",proposalChanged:false,sourceChanged:false})},select:{id:true,afterJson:true}});
  return {receipt,replayed:false,preview:await readCaseContentsPreview(loader,{vitrine:input.vitrine,mode:"historical",preparationReceiptId:input.preparationReceiptId},tx)};
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:60000});
}

export async function readCaseClearingAudit(loader:PhysicalSnapshotLoader){
 const [physical,events]=await Promise.all([readPhysicalLocationView(loader,db,undefined,false),db.auditEvent.findMany({where:{OR:[{action:"museum.vitrine.preparation.updated",entityType:"MuseumVitrinePreparation"},{action:"museum.physical_location.confirmed",entityType:"MuseumPhysicalConfirmation"},{action:"museum.physical_location.check_undone",entityType:"MuseumPhysicalCheckUndo"}]},orderBy:[{createdAt:"asc"},{id:"asc"}],select:{id:true,createdAt:true,action:true,afterJson:true}})]);
 const recorded=new Map<string,{location:unknown;basis:string}>();
 for(const row of physical.rows)recorded.set(row.sourceId,{location:row.original,basis:"source_fallback_not_verified"});
 const preparations:unknown[]=[];
 for(const event of events){
  const data=event.afterJson as Record<string,unknown>|null;if(!data||data.museumId!=="museum-spn")continue;
  if(event.action==="museum.vitrine.preparation.updated"){
   const code=String(data.vitrine);const atTime=physical.rows.filter(row=>{const state=recorded.get(row.sourceId)?.location as {kind?:string;code?:string}|null;return state?.kind==="vitrine"&&state.code===code;});
   preparations.push({receiptId:event.id,vitrine:code,prepared:data.prepared,recordedAt:event.createdAt.toISOString(),physicalMoveClaim:data.physicalMoveClaim===true,emptyCaseClaim:data.emptyCaseClaim===true,requiresCuratorEvidence:true,sourceObservationsAtPreparation:atTime.map(row=>({sourceId:row.sourceId,name:row.name,evidenceBasis:recorded.get(row.sourceId)?.basis,current:row.current,currentBasis:row.currentBasis,currentVersion:row.currentVersion,preserveCurrentConfirmation:row.currentBasis==="confirmed"})),currentSourceResiduals:physical.rows.filter(row=>row.currentBasis==="source"&&row.current?.kind==="vitrine"&&row.current.code===code).map(row=>row.sourceId)});
  }
  if(Array.isArray(data.moves))for(const raw of data.moves){const move=raw as {sourceId?:string;location?:unknown};if(move.sourceId)recorded.set(move.sourceId,{location:move.location,basis:"recorded_receipt"});}
  if(typeof data.sourceId==="string"&&data.restored&&typeof data.restored==="object"){const restored=data.restored as {location?:unknown;basis?:string};recorded.set(data.sourceId,{location:restored.location,basis:restored.basis??"restored_recorded_state"});}
  if(Array.isArray(data.componentMoves))for(const raw of data.componentMoves){const move=raw as {sourceId?:string};if(move.sourceId)recorded.set(move.sourceId,{location:null,basis:"partial_components_whole_location_unknown"});}
 }
 return {museumId:"museum-spn",capturedAt:new Date().toISOString(),historyComplete:true,receiptCount:events.length,preparations,physicalWrites:false,caveats:["Availability is not proof of clearing. Each historical write requires explicit current-staging confirmation.","Source fallback locations at an old receipt time are research leads, not verified inventory at that time.","Confirmed later placements are preserved. Component-only receipts do not locate the whole collection."]};
}
