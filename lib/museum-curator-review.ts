import {createHash} from "node:crypto";
import {db} from "./db";
import {Prisma} from "./generated/prisma/client";
import {hasCapability} from "./permissions";
import {MuseumConflict} from "./museum-service";
import {readVrindavanWorkingData} from "./vrindavan-working-data";
import {identityObservationSchema} from "./vrindavan-identity-domain";
import {curatorReviewInput,type CuratorReviewQueue} from "./museum-curator-review-domain";
import {buildCuratorReviewCase,museumCuratorReviewManifest,type MuseumCuratorCaseState} from "./museum-curator-review-manifest";
import {writeMuseumArrangement} from "./museum-arrangement";
import {arrangementInput} from "./museum-arrangement-domain";
import {stableCollectionJson} from "./museum-collection-domain";

import {sectionDestinationContext,previewSectionDestinations,synchronizeSectionDestinations} from "./vrindavan-section-destination";
const museumId="museum-vrindavan";
const entityType="MuseumCuratorReview";
const json=(value:unknown):Prisma.InputJsonValue=>JSON.parse(JSON.stringify(value));
const hash=(value:unknown)=>createHash("sha256").update(stableCollectionJson(JSON.parse(JSON.stringify(value)))).digest("hex");
const object=(value:unknown):Record<string,unknown>=>value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};

// Private projection. Route callers enforce museum and full catalogue access.
async function context(tx:Prisma.TransactionClient){
 const destinations=await sectionDestinationContext(tx);
 const cases=museumCuratorReviewManifest.cases;
 const ids=cases.flatMap(c=>c.saintId?[c.saintId]:[]);
 const [working,saints,observations,overrides,arrangements,reviews]=await Promise.all([
  readVrindavanWorkingData(tx),
  tx.saint.findMany({where:{id:{in:ids}},select:{id:true,version:true,status:true,displayName:true}}),
  tx.museumCollectionImport.findMany({where:{museumId,sourceKey:{startsWith:"vrindavan-workbook:"}},orderBy:[{observedAt:"desc"},{id:"desc"}]}),
  tx.museumCuratorProposal.findMany({where:{museumId}}),
  tx.museumArrangement.findMany({where:{museumId}}),
  tx.auditEvent.findMany({where:{entityType,entityId:{in:cases.map(c=>museumId+":"+c.caseId)}},orderBy:[{createdAt:"desc"},{id:"desc"}]})
 ]);
 const latestSources=new Map<string,typeof observations[number]>();
 for(const row of observations)if(!latestSources.has(row.sourceKey))latestSources.set(row.sourceKey,row);
 const projected=cases.map(c=>{
  const row=working.placements.find(p=>p.saintId===c.saintId);
  const saint=saints.find(s=>s.id===c.saintId);
  const override=overrides.find(p=>p.saintId===c.saintId)??null;
  const arrangement=arrangements.find(p=>p.placementId===row?.id)??null;
  const sources=c.sourceRows.map(n=>latestSources.get(`vrindavan-workbook:${c.sourceSnapshotHash}:Sheet1:${n}`));
  const sourceValid=sources.length>0&&sources.every(source=>{
   if(!source||source.status!=="identity_linked")return false;
   if(c.sourceObservationIds.length&&!c.sourceObservationIds.includes(source.id))return false;
   const parsed=identityObservationSchema.safeParse(source.normalizedJson);
   return parsed.success&&parsed.data.saintIds.length===1&&parsed.data.saintIds[0]===c.saintId;
  });
  const audit=reviews.find(r=>r.entityId===museumId+":"+c.caseId);
  const saved=object(audit?.afterJson);
  // A later proposal edit reopens the case; an old confirmation is not a blanket approval.
  const evidenceHash=hash({sources,saint:saint??null});
  const resolved=saved.decision==="confirm_supported"&&saved.resultingProposalHash===hash(override)&&saved.evidenceHash===evidenceHash&&sourceValid&&saint?.status!=="archived";
  const decision=resolved?"confirm_supported":saved.decision==="unsure"||saved.decision==="different"?saved.decision:undefined;
  const latestReview:MuseumCuratorCaseState["latestReview"]=decision?{decision,note:typeof saved.note==="string"?saved.note:undefined}:null;
  const state={baseline:row&&saint&&saint.status!=="archived"&&sourceValid?{
   saintId:saint.id,saintVersion:saint.version,section:row.section,familyKey:row.familyId||"",
   sourceSnapshotHash:working.audit.snapshotHash,sourceRows:c.sourceRows,hasCuratorOverride:!!override
  }:null,revisionInput:{sources,saint,override,arrangement,proposalRevision:row?.curatorProposalRevision,audit,destinationAreas:destinations.areas,destinationShared:destinations.shared,destinationRows:destinations.working.placements.map(p=>[p.id,p.section,p.familyId,p.arrangement?.revision])},latestReview};
  const projection=buildCuratorReviewCase(c,state);
  for(const [optionId,plan] of Object.entries(projection.allowedPlans)){
   if(!working.sections.some(s=>s.name===plan.section&&s.slug!=="needs-section-proposal")){
    delete projection.allowedPlans[optionId];
    const option=projection.reviewCase.options.find(o=>o.id===optionId)!;
    option.unavailableReason="This subsection is not available yet. Keep this case for review.";
   }
  }
  for(const [optionId,plan] of Object.entries(projection.allowedPlans)){if(!row||row.section===plan.section)continue;const preview=previewSectionDestinations(destinations,[row],plan.section);const option=projection.reviewCase.options.find(o=>o.id===optionId)!;if(preview.blockedReason){delete projection.allowedPlans[optionId];option.unavailableReason=preview.blockedReason;}else option.changes.push({field:"Planned destination",before:row.arrangement?.vitrine?"Vitrine "+row.arrangement.vitrine:"Unassigned",after:preview.rows[0]?.message||"Unchanged"});}
  if(!resolved&&!Object.keys(projection.allowedPlans).length){
   if(projection.reviewCase.status==="pending")projection.reviewCase.status="blocked";
   projection.reviewCase.blockedReason??="This case needs further record review before its proposal can change.";
  }
  return {manifest:c,...projection,row,override,evidenceHash};
 });
 return {working,projected,destinations};
}

export async function readMuseumCuratorReview(id:typeof museumId):Promise<CuratorReviewQueue>{
 if(id!==museumId)throw new MuseumConflict("This review list is only available for Vrindavan.");
 const {projected}=await context(db);
 const cases=projected.map(p=>p.reviewCase);
 return {version:hash(cases.map(c=>[c.caseId,c.revision])),cases,resolvedCount:cases.filter(c=>c.status==="resolved").length};
}

export async function saveMuseumCuratorReview(raw:unknown,actorId:string){
 const input=curatorReviewInput.parse(raw);
 try{return await db.$transaction(async tx=>{
  await tx.$queryRaw(Prisma.sql`SELECT true FROM pg_advisory_xact_lock(hashtextextended(${"museum-curator:"+museumId},0))`);
  const actor=await tx.user.findUnique({where:{id:actorId},select:{active:true,roles:true}});
  if(!actor?.active||!["access_museum","manage_museum","view_full_saint_catalog"].every(cap=>hasCapability(actor.roles,cap as "access_museum"|"manage_museum"|"view_full_saint_catalog")))throw new MuseumConflict("Museum editing permission is required.");
  const {projected,destinations}=await context(tx);
  const item=projected.find(p=>p.reviewCase.caseId===input.caseId);
  if(!item||item.reviewCase.revision!==input.revision)throw new MuseumConflict("This research case or museum record changed. Reload before deciding.");
  if(item.reviewCase.status==="resolved")throw new MuseumConflict("This case has already been confirmed. Reload the review list.");
  let resultingProposalHash:string|null=null;
  if(input.decision==="confirm_supported"){
   const plan=Object.hasOwn(item.allowedPlans,input.explicitChoiceId!)?item.allowedPlans[input.explicitChoiceId!]:undefined;
   if(!plan||!item.row)throw new MuseumConflict("This choice needs further review before the proposal can change.");
   // Confirmation updates the museum section and its previewed destination plan.
   // Source identity linking remains in the dedicated reconciliation workflow.
   const before=item.override;
   const values={section:plan.section,tier:item.row.tier,groupKey:item.row.familyId||"",groupLabel:item.row.groupLabel||"",updatedById:actorId};
   const after=await tx.museumCuratorProposal.upsert({where:{museumId_saintId:{museumId,saintId:plan.saintId}},create:{museumId,saintId:plan.saintId,...values},update:{...values,version:{increment:1}}});
   resultingProposalHash=hash(after);
   await tx.auditEvent.create({data:{userId:actorId,action:"museum.curator_proposal.saved",entityType:"MuseumCuratorProposal",entityId:museumId+":"+plan.saintId,beforeJson:before?json(before):Prisma.JsonNull,afterJson:json(after)}});
   if(item.row.section!==plan.section)await synchronizeSectionDestinations(tx,[item.row],plan.section,actorId,destinations);
   else if(item.row.arrangement?.status==="Planned"){
    const refreshed=(await readVrindavanWorkingData(tx)).placements.find(p=>p.id===item.row!.id)!;
    await writeMuseumArrangement(tx,museumId,refreshed,arrangementInput.parse({placementId:refreshed.id,revision:refreshed.arrangement!.revision,familyKey:refreshed.familyId,status:"Planned",vitrine:item.row.arrangement.vitrine,shelf:item.row.arrangement.shelf}),actorId);
   }
  }
  await tx.auditEvent.create({data:{userId:actorId,action:"museum.curator_review."+input.decision,entityType,entityId:museumId+":"+input.caseId,beforeJson:json(item.reviewCase),afterJson:json({caseId:input.caseId,caseVersion:item.manifest.caseVersion,manifestVersion:museumCuratorReviewManifest.manifestVersion,decision:input.decision,optionId:input.explicitChoiceId??null,note:input.note??null,resultingProposalHash,evidenceHash:item.evidenceHash})}});
  return {caseId:input.caseId,status:input.decision==="confirm_supported"?"resolved":input.decision,message:input.decision==="confirm_supported"?"Identity confirmed and museum proposal updated. Physical locations have not changed.":"Your note is saved; this case remains open for review."};
 },{isolationLevel:"Serializable",timeout:60000});}
 catch(error){if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==="P2034")throw new MuseumConflict("The records changed while saving. Reload and review the current case.");throw error;}
}
