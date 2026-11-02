import {db} from "./db";
import {Prisma,type MuseumFinalReviewState} from "./generated/prisma/client";
import {readCompanionCatalog,projectCatalog} from "./museum-companion-catalog";
import {readSharedMuseumCompanionRevision,readSharedMuseumCompanionSnapshot} from "./museum-companion-read-snapshot";
import {readMuseumRevision} from "./museum-snapshot-cache";
import {physicalFingerprint} from "./museum-physical-location-current";
import {MuseumMoveSessionError} from "./museum-move-session-domain";
import {isCountedSpnProgressSource} from "./spn-progress-exclusions";
import {readStarterGuideDefinition} from "./spn-starter-guide-registry";
import {lockFinalReviewSource} from "./museum-final-review-plans";
import {retryMuseumSerialization,lockMuseumPlacement} from "./museum-write-concurrency";
import {finalReviewInput,assertFinalReviewVersion,finalReviewAddressed,effectiveFinalReviewDecision,isFinallyReviewed,type FinalReviewRecord,type FinalReviewSnapshot,type FinalReviewMutationResult} from "./museum-final-review-domain";

type Entry=ReturnType<typeof projectCatalog>["entries"][number];
const museumId="museum-spn" as const;
const json=(value:unknown)=>JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
class SnapshotChanged extends Error {}
export async function readFinalReviewHead(){
 const [base,row]=await Promise.all([readSharedMuseumCompanionRevision(),db.museumFinalReviewRevision.findUnique({where:{museumId}})]);
 return {base,counter:row?.revision??0n,revision:`${base}:${row?.revision??0n}`};
}
export function projectFinalReviewRecord(entry:Entry,state:MuseumFinalReviewState|null,description:string,priorDecision:FinalReviewRecord["decision"]="pending"):FinalReviewRecord{
 const bound=state&&state.saintId===entry.saintId&&state.sourceRevision===entry.sourceRevision?state:null;
 const safeDecision=effectiveFinalReviewDecision(bound,priorDecision);
 const finallyReviewed=isFinallyReviewed(entry,entry.destination||null,bound);
 const flag=bound?.flagKind&&bound.flagStatus?{kind:bound.flagKind as "missing"|"other",note:bound.flagNote,status:bound.flagStatus as "open"|"resolved"}:null;
 return {sourceId:entry.sourceId,saintId:entry.saintId,sourceRevision:entry.sourceRevision,name:entry.name,tier:entry.tier,section:entry.section,region:entry.region,city:entry.city,relicDescription:description,
  physical:entry,effectiveDestination:entry.destination?{vitrine:entry.destination,shelf:entry.destinationShelf||null,basis:entry.destinationBasis}:null,
  reviewVersion:state?.version??0,flag,finallyReviewed,reviewedAt:finallyReviewed?bound!.reviewedAt!.toISOString():null,decision:safeDecision,addressed:finallyReviewed||finalReviewAddressed(entry,entry.destination||null,safeDecision)};
}
async function priorDecisions(){
 const decisions=await db.museumGuideSuggestionDecision.findMany({where:{museumId},orderBy:{updatedAt:"desc"}});
 const result=new Map<string,{decision:FinalReviewRecord["decision"];updatedAt:number}>();
 for(const decision of decisions){
  let guide;try{guide=readStarterGuideDefinition(decision.guideVersion);}catch(error){if(error instanceof MuseumMoveSessionError&&error.status===409)continue;throw error;}
  const suggestion=guide.suggestions.find(row=>row.id===decision.suggestionId);
  for(const sourceId of suggestion?.sourceIds??[])if(!result.has(sourceId))result.set(sourceId,{decision:decision.decision==="declined"&&!decision.alternativeVitrine?"declined":decision.decision==="deferred"?"deferred":"pending",updatedAt:decision.updatedAt.getTime()});
 }
 return result;
}
export async function readFinalReviewSnapshot(options:{sourceId?:string;since?:string}={}):Promise<FinalReviewSnapshot>{
 const head=await readFinalReviewHead();
 let changedIds:string[]|null=null;
 const match=options.since?.match(/^([a-f0-9]{64}):(\d{1,19})$/);
 if(!options.sourceId&&match&&match[1]===head.base&&BigInt(match[2])<=head.counter){
  const receipts=await db.museumFinalReviewReceipt.findMany({where:{museumId,revision:{gt:BigInt(match[2])}},select:{sourceId:true}});
  if(BigInt(receipts.length)===head.counter-BigInt(match[2]))changedIds=[...new Set(receipts.map(row=>row.sourceId))];
 }
 const [catalog,states,decisions]=await Promise.all([readCompanionCatalog(),db.museumFinalReviewState.findMany({where:{museumId,...(options.sourceId?{sourceId:options.sourceId}:changedIds?{sourceId:{in:changedIds}}:{})}}),priorDecisions()]);
 const bySource=new Map(states.map(row=>[row.sourceId,row]));
 const entries=[...new Map(catalog.entries.filter(row=>isCountedSpnProgressSource(row.sourceId)&&(!options.sourceId||row.sourceId===options.sourceId)&&(!changedIds||changedIds.includes(row.sourceId))).map(row=>[row.sourceId,row])).values()];
 const records=entries.map(entry=>{
  const prior=decisions.get(entry.sourceId);
  const newerPlan=catalog.additions.some(plan=>plan.sourceId===entry.sourceId&&Date.parse(plan.updatedAt)>(prior?.updatedAt??Infinity));
  return projectFinalReviewRecord(entry,bySource.get(entry.sourceId)??null,entry.relicDescription,newerPlan?"pending":prior?.decision??"pending");
 });
 const existing=new Set(records.map(row=>row.sourceId));
 return {museumId,revision:head.revision,availableVitrines:catalog.vitrines,records,complete:!options.sourceId&&!changedIds,removedSourceIds:options.sourceId&&!existing.has(options.sourceId)?[options.sourceId]:changedIds?.filter(id=>!existing.has(id))??[]};
}
async function currentReplay(result:FinalReviewMutationResult):Promise<FinalReviewMutationResult>{
 const current=await readFinalReviewSnapshot({sourceId:result.record.sourceId});
 const record=current.records[0];
 if(!record)throw new MuseumMoveSessionError(409,"This source is no longer in the review inventory. Reload the museum records.");
 return {...result,record,revision:current.revision,replayed:true};
}
export async function saveFinalReview(raw:unknown,actorId:string):Promise<FinalReviewMutationResult>{
 const input=finalReviewInput.parse(raw),fingerprint=physicalFingerprint(input);
 // A retry reuses its original receipt even after later edits or physical moves.
 const replay=await db.museumFinalReviewReceipt.findUnique({where:{museumId_clientRequestId:{museumId,clientRequestId:input.clientRequestId}}});
 if(replay){if(replay.fingerprint!==fingerprint)throw new MuseumMoveSessionError(409,"This request already saved a different review.");return currentReplay(replay.result as unknown as FinalReviewMutationResult);}
 for(let refresh=0;refresh<8;refresh++){
  const [snapshot,decisions]=await Promise.all([readSharedMuseumCompanionSnapshot(),priorDecisions()]);
  const catalog=projectCatalog(snapshot,input.sourceId);
  const entry=catalog.entries.find(row=>row.sourceId===input.sourceId&&isCountedSpnProgressSource(row.sourceId));
  if(!entry||entry.saintId!==input.saintId||entry.sourceRevision!==input.expectedSourceRevision)throw new MuseumMoveSessionError(409,"The source identity or evidence changed. Reload this record before reviewing it.");
  if((input.action==="proposal.set"||input.action==="review.confirm")&&entry.identityChanged)throw new MuseumMoveSessionError(409,"Resolve this source identity before changing its destination.");
  if(input.action==="proposal.set"&&!catalog.vitrines.includes(input.vitrine))throw new MuseumMoveSessionError(400,"Choose an available museum vitrine.");
  const description=entry.relicDescription;
  const prior=decisions.get(entry.sourceId);
  const priorDecision=catalog.additions.some(plan=>plan.sourceId===entry.sourceId&&Date.parse(plan.updatedAt)>(prior?.updatedAt??Infinity))?"pending":prior?.decision??"pending";
  try{const result=await retryMuseumSerialization(()=>db.$transaction(async tx=>{
   if(input.action==="proposal.set"||input.action==="review.confirm"||input.action==="review.clear")await lockMuseumPlacement(tx,input.clientRequestId,[input.sourceId],Boolean(entry.componentPlacement));
   await tx.$queryRaw`SELECT true FROM pg_advisory_xact_lock(hashtextextended(${"museum-final-review-request:spn:"+input.clientRequestId},0))`;
   await lockFinalReviewSource(tx,input.sourceId);
   const previousReceipt=await tx.museumFinalReviewReceipt.findUnique({where:{museumId_clientRequestId:{museumId,clientRequestId:input.clientRequestId}}});
   if(previousReceipt){if(previousReceipt.fingerprint!==fingerprint)throw new MuseumMoveSessionError(409,"This request already saved a different review.");return {...previousReceipt.result as unknown as FinalReviewMutationResult,replayed:true};}
   const currentRevision=await readMuseumRevision(tx);
   if(currentRevision!==snapshot.dataRevision){
    // Final-review plans and physical moves on other sources leave this source unchanged.
    // Count only their committed transactions absent from the pinned PG snapshot;
    // any other inventory revision still requires a fresh source read.
    const xmin=BigInt(snapshot.transactionSnapshot.split(":")[0]);
    const [changes]=await tx.$queryRaw<{count:bigint}[]>`SELECT COUNT(*)::bigint AS count FROM "MuseumFinalReviewReceipt"
     WHERE "museumId"=${museumId} AND "inventoryRevisionBumped"=true AND ("sourceEvidenceUnchanged"=true OR "sourceId"<>${input.sourceId}) AND "transactionId">=${xmin}
      AND NOT pg_visible_in_snapshot("transactionId"::text::xid8,${snapshot.transactionSnapshot}::pg_snapshot)`;
    if(BigInt(currentRevision)-BigInt(snapshot.dataRevision)!==changes.count)throw new SnapshotChanged();
   }
   const key={museumId,sourceId:input.sourceId};
   const before=await tx.museumFinalReviewState.findUnique({where:{museumId_sourceId:key}});
   assertFinalReviewVersion(input.expectedReviewVersion,before?.version??0);
   if((input.action==="proposal.set"||input.action==="review.confirm"||input.action==="review.clear")&&(entry.currentVersion!==input.expectedLocationVersion||entry.currentRevision!==input.expectedCurrentRevision))throw new MuseumMoveSessionError(409,"The physical location changed. Reload it before proposing a destination.");
   const rebound=before&&(before.saintId!==entry.saintId||before.sourceRevision!==entry.sourceRevision);
   if(input.action==="flag.resolve"&&(!before?.flagKind||rebound))throw new MuseumMoveSessionError(409,"There is no flag to resolve. Reload this record.");
   const now=new Date();
   const clearedReview={reviewedAt:null,reviewedVitrine:null,reviewedPlanVersion:null,reviewedPhysicalVersion:null,reviewedComponentRevision:null};
   let reviewedPhysical=entry;
   let physicalChanged=false;
   if(input.action==="review.confirm"){
    if(!rebound&&before?.flagKind==="missing"&&before.flagStatus==="open")throw new MuseumMoveSessionError(409,"This record is flagged as missing. Resolve the missing flag before confirming its placement review.");
    if(entry.destination!==input.vitrine||!catalog.vitrines.includes(input.vitrine))throw new MuseumMoveSessionError(409,"The final destination changed. Reload it before confirming the review.");
    if(effectiveFinalReviewDecision(rebound?null:before,priorDecision)==="not_on_display")throw new MuseumMoveSessionError(409,"This record is marked not on display. Update its destination before reviewing its placement.");
    const location=entry.componentPlacement?.location??entry.current;
    if(!(entry.componentPlacement||entry.currentBasis==="confirmed")||location?.kind!=="vitrine"||location.code!==input.vitrine){
     const {confirmMuseumPhysicalLocations}=await import("./museum-physical-locations");
     const source=await import("./museum-move-session-source");
     const physical=await confirmMuseumPhysicalLocations({museumId,clientRequestId:input.clientRequestId,confirmedDate:now.toISOString().slice(0,10),datePrecision:"date",evidence:"Final review: curator confirmed this source observation in the selected final vitrine.",physicalConfirmation:true,inventoryAcknowledged:true,records:[{sourceId:input.sourceId,saintId:input.saintId,expectedSourceRevision:input.expectedSourceRevision,expectedCurrentRevision:input.expectedCurrentRevision,expectedLocationVersion:input.expectedLocationVersion,to:{kind:"vitrine",code:input.vitrine,label:`Vitrine ${input.vitrine}`}}]}, {id:actorId,canManage:true},transaction=>source.readMuseumMoveSessionSource(source.registeredMoveProposal.version,transaction),tx);
     reviewedPhysical={...entry,...physical.rows[0]};
     physicalChanged=true;
    }
   }
   const changes=input.action==="proposal.set"?{vitrine:input.vitrine,shelf:input.shelf||null,plannedAt:now,planVersion:(before?.planVersion??0)+1,decision:"pending",decisionNote:null,decisionAt:now,...clearedReview}
    :input.action==="review.confirm"?{...(effectiveFinalReviewDecision(rebound?null:before,priorDecision)!=="pending"?{decision:"pending",decisionAt:now,decisionNote:null}:{}),reviewedAt:now,reviewedVitrine:input.vitrine,reviewedPlanVersion:rebound?(before!.planVersion+1):(before?.planVersion??0),reviewedPhysicalVersion:reviewedPhysical.currentVersion,reviewedComponentRevision:reviewedPhysical.componentPlacement?.revision??null}
    :input.action==="review.clear"?clearedReview
    :input.action==="flag.set"?{flagKind:input.kind,flagNote:input.note||null,flagStatus:"open",...(input.kind==="missing"?clearedReview:{})}
    :input.action==="flag.resolve"?{flagStatus:"resolved"}
    :{decision:input.decision,decisionNote:input.note||null,decisionAt:now,...clearedReview};
   const reset=rebound?{...clearedReview,vitrine:null,shelf:null,plannedAt:null,planVersion:(before?.planVersion??0)+1,decision:"pending",decisionNote:null,decisionAt:now,flagKind:null,flagNote:null,flagStatus:null}:{};
   const state=await tx.museumFinalReviewState.upsert({where:{museumId_sourceId:key},create:{...key,saintId:entry.saintId,sourceRevision:entry.sourceRevision,updatedById:actorId,...changes},update:{saintId:entry.saintId,sourceRevision:entry.sourceRevision,updatedById:actorId,version:{increment:1},...reset,...changes}});
   const counter=await tx.museumFinalReviewRevision.findUniqueOrThrow({where:{museumId}});
   // Take the source-revision barrier only after the review counter lock, so
   // unrelated planning commits cannot deadlock a flag waiting for that counter.
   await tx.$queryRaw`SELECT "revision" FROM "MuseumDataRevision" WHERE "id"=1 FOR SHARE`;
   const projected=input.action==="proposal.set"?{...entry,destination:input.vitrine,destinationShelf:input.shelf||"",destinationBasis:"final_review" as const}:reviewedPhysical;
   const record=projectFinalReviewRecord(projected,state,description,priorDecision);
   const result:FinalReviewMutationResult={record,receipt:{id:`${museumId}:${input.clientRequestId}`},replayed:false,revision:`${snapshot.revision}:${counter.revision}`};
   const inventoryRevisionBumped=physicalChanged||input.action==="review.confirm"&&effectiveFinalReviewDecision(rebound?null:before,priorDecision)!=="pending"||input.action==="proposal.set"||Boolean(rebound)||input.action==="decision.set"&&(before?.decision!==input.decision||before?.decisionAt?.getTime()!==now.getTime()||(before?.decisionNote??null)!==(input.note||null));
   const [transaction]=await tx.$queryRaw<{id:string}[]>`SELECT pg_current_xact_id()::text AS id`;
   await tx.museumFinalReviewReceipt.create({data:{transactionId:BigInt(transaction.id),inventoryRevisionBumped,sourceEvidenceUnchanged:!physicalChanged,museumId,clientRequestId:input.clientRequestId,sourceId:input.sourceId,fingerprint,revision:counter.revision,result:json(result),createdById:actorId}});
   return result;
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:30000,maxWait:10000}),{maxRetries:10,maxDelayMs:300});if(result.replayed)return currentReplay(result);
   if(input.action==="review.confirm"||input.action==="review.clear")return {...result,revision:(await readFinalReviewHead()).revision};
   return result;}
  catch(error){
   if(error instanceof SnapshotChanged)continue;
   if(error&&typeof error==="object"&&"code" in error&&error.code==="P2002"){
    const receipt=await db.museumFinalReviewReceipt.findUnique({where:{museumId_clientRequestId:{museumId,clientRequestId:input.clientRequestId}}});
    if(receipt&&receipt.fingerprint===fingerprint)return currentReplay(receipt.result as unknown as FinalReviewMutationResult);
    throw new MuseumMoveSessionError(409,"This review changed while saving. Reload the record before trying again.");
   }
   throw error;
  }
 }
 throw new MuseumMoveSessionError(409,"Museum records changed while saving. Reload this record and try again.");
}
