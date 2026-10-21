import {createHash} from "node:crypto";
import {db} from "./db";
import {Prisma} from "./generated/prisma/client";
import {hasCapability} from "./permissions";
import {MuseumConflict} from "./museum-service";
import {readVrindavanIdentityReview} from "./vrindavan-identity-review";
import {readVrindavanWorkingData} from "./vrindavan-working-data";
import {sectionDestinationContext,synchronizeSectionDestinations} from "./vrindavan-section-destination";
import {sectionDestination} from "./vrindavan-section-destination-domain";
import {stableCollectionJson} from "./museum-collection-domain";
import {BINDU_SOURCE_ID,BINDU_SOURCE_KEY,BINDU_SNAPSHOT,BINDU_DRAFT,BINDU_SECTION,BINDU_NOTE,possibleBinduDuplicates,binduPrivateRecordInput,type BinduPrivateMuseumPlan} from "./bindu-private-museum-record-domain";
export type {BinduPrivateMuseumPlan} from "./bindu-private-museum-record-domain";
const museumId="museum-vrindavan";
const json=(value:unknown):Prisma.InputJsonValue=>JSON.parse(JSON.stringify(value));
const hash=(value:unknown)=>createHash("sha256").update(stableCollectionJson(JSON.parse(JSON.stringify(value)))).digest("hex");
async function context(tx:Prisma.TransactionClient,id:string){
 if(id!==BINDU_SOURCE_ID)return null;
 const [review,saints,destinations]=await Promise.all([readVrindavanIdentityReview(tx),tx.saint.findMany({select:{id:true,displayName:true,canonicalName:true,slug:true,status:true,aliases:{select:{alias:true}}},orderBy:{id:"asc"}}),sectionDestinationContext(tx)]);
 const source=review.rows.find(p=>p.row.id===id);if(!source)return null;
 const latest=review.rows.find(p=>p.row.sourceKey===BINDU_SOURCE_KEY);
 const duplicates=possibleBinduDuplicates(saints);
 const area=destinations.areas.find(area=>area.section===BINDU_SECTION);
 const target=sectionDestination({id:"new-bindu",saintId:"new-bindu",name:BINDU_DRAFT.name,section:"Needs section proposal"},BINDU_SECTION,destinations.areas);
 const blockedReason=source.row.sourceKey!==BINDU_SOURCE_KEY||latest?.row.id!==id||source.data.sourceRow!==179||source.data.name!=="Mata Bindu (Guruji’s Mother)"||destinations.snapshotHash!==BINDU_SNAPSHOT?"The approved source identity or active inventory changed. Review it before creating a record.":source.row.itemId?"A physical item is already attached; review its identity through inventory.":!["pending","deferred"].includes(source.row.status)||source.data.saintIds.length?"This source already has a reviewed identity decision. Use its existing record.":duplicates.length?"Possible existing identities were found, including archived records. Review and reuse the correct record instead of creating another.":!destinations.working.sections.some(section=>section.name===BINDU_SECTION)?"The approved museum subsection is unavailable.":area?.needsReview?"The Bhakti Marga area has stale flexible allocations. Review its saved area first.":undefined;
 const revision=hash({rule:"bindu-private-museum-v1",sourceVersion:source.version,saints,areas:destinations.areas,target,snapshot:destinations.snapshotHash});
 const plan:BinduPrivateMuseumPlan={sourceId:id,sourceVersion:source.version,revision,canCreate:!blockedReason,...(blockedReason?{blockedReason}:{}),existingSaints:duplicates.map(s=>({id:s.id,name:s.displayName,slug:s.slug,status:s.status})),draft:BINDU_DRAFT,proposal:{section:BINDU_SECTION,tier:"Secondary",destination:{mode:target.mode,vitrines:target.vitrines,message:target.message}},linkedSaintIds:source.data.saintIds};
 return {source,destinations,plan};
}
// Protected source-review callers enforce source-data and full-catalogue access.
export async function readBinduPrivateMuseumPlan(sourceId:string):Promise<BinduPrivateMuseumPlan|null>{return (await context(db,sourceId))?.plan??null;}
export async function createBinduPrivateMuseumRecord(raw:unknown,actorId:string){
 const input=binduPrivateRecordInput.parse(raw);
 try{return await db.$transaction(async tx=>{
  // Same identity lock as existing reconciliation, then the museum edit lock.
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(8496233)`;
  await tx.$queryRaw(Prisma.sql`SELECT true FROM pg_advisory_xact_lock(hashtextextended(${"museum-curator:"+museumId},0))`);
  const actor=await tx.user.findUnique({where:{id:actorId},select:{active:true,roles:true}});
  if(!actor?.active||!hasCapability(actor.roles,"view_source_data")||!hasCapability(actor.roles,"view_full_saint_catalog")||!hasCapability(actor.roles,"resolve_reconciliation")||!hasCapability(actor.roles,"edit_structured_content")||!hasCapability(actor.roles,"access_museum")||!hasCapability(actor.roles,"manage_museum"))throw new MuseumConflict("Source reconciliation, catalogue editing and museum editing permissions are required.");
  const current=await context(tx,input.sourceId);
  if(!current||current.plan.sourceVersion!==input.sourceVersion||current.plan.revision!==input.revision)throw new MuseumConflict("The source, catalogue or section area changed. Reload before creating the private record.");
  if(!current.plan.canCreate)throw new MuseumConflict(current.plan.blockedReason||"Review this identity before creating a record.");
  const saint=await tx.saint.create({data:{canonicalName:BINDU_DRAFT.name,displayName:BINDU_DRAFT.name,slug:BINDU_DRAFT.slug,status:"draft",teamVisibility:"private",publicationStatus:"unpublished",workflowStatus:"needs_review",createdById:actorId,updatedById:actorId,aliases:{create:BINDU_DRAFT.aliases.map(alias=>({alias,source:"Curator-confirmed Vrindavan source row 179"}))}}});
  await tx.auditEvent.create({data:{userId:actorId,action:"museum.private_saint.created",entityType:"Saint",entityId:saint.id,afterJson:json({saintId:saint.id,name:saint.displayName,slug:saint.slug,status:saint.status,teamVisibility:saint.teamVisibility,publicationStatus:saint.publicationStatus,aliases:BINDU_DRAFT.aliases,sourceObservationId:input.sourceId,curatorConfirmation:BINDU_NOTE})}});
  const normalized={...current.source.data,saintIds:[saint.id],note:BINDU_NOTE};
  await tx.museumCollectionImport.update({where:{id:input.sourceId},data:{status:"identity_linked",normalizedJson:json(normalized),reviewedAt:new Date(),reviewedById:actorId}});
  await tx.auditEvent.create({data:{userId:actorId,action:"vrindavan.identity.link",entityType:"MuseumCollectionImport",entityId:input.sourceId,beforeJson:json({status:current.source.row.status,data:current.source.data}),afterJson:json({status:"identity_linked",data:normalized})}});
  const linked=(await readVrindavanWorkingData(tx)).placements.find(row=>row.saintId===saint.id);
  if(!linked)throw new MuseumConflict("The new source link could not be projected; no changes have been saved.");
  const proposal=await tx.museumCuratorProposal.create({data:{museumId,saintId:saint.id,section:BINDU_SECTION,tier:"Secondary",groupKey:"",groupLabel:"",updatedById:actorId}});
  await tx.auditEvent.create({data:{userId:actorId,action:"museum.curator_proposal.saved",entityType:"MuseumCuratorProposal",entityId:museumId+":"+saint.id,beforeJson:Prisma.JsonNull,afterJson:json(proposal)}});
  // Use only the current saved target area. Source Vitrine 11 is never a default.
  await synchronizeSectionDestinations(tx,[linked],BINDU_SECTION,actorId,current.destinations);
  return {saintId:saint.id,name:saint.displayName,section:BINDU_SECTION,tier:"Secondary",destination:current.plan.proposal.destination};
 },{isolationLevel:"Serializable",timeout:120000});}
 catch(error){if(error instanceof Prisma.PrismaClientKnownRequestError&&["P2034","P2002"].includes(error.code))throw new MuseumConflict("The catalogue or inventory changed while saving. Reload and review the existing record before retrying.");throw error;}
}