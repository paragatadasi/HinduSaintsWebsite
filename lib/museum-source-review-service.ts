import { db } from "./db";
import { Prisma } from "./generated/prisma/client";
import { reviewMuseumSources } from "./museum-update-domain";
import { SPN_WEBSITE_AIRTABLE_BASE_ID as base } from "./museum-vitrine-source";
import { museumSourceDecisionSchema, type MuseumReviewDecision } from "./museum-source-review-domain";
export type { MuseumReviewDecision } from "./museum-source-review-domain";
// Callers must enforce Source Data and reconciliation capabilities.
export async function decideMuseumSource(actorId:string, input:MuseumReviewDecision) {
    input = museumSourceDecisionSchema.parse(input);
    await db.$transaction(async tx=>{
      await tx.$queryRaw`SELECT id FROM "MuseumSourceReview" WHERE id=${input.id} FOR UPDATE`;
      const review=await tx.museumSourceReview.findUniqueOrThrow({where:{id:input.id}});
      if(review.sourceKey!==`${base}:Saints:${review.recordId}`)throw Error("Unexpected source scope");
      if(review.updatedAt.toISOString()!==input.version)throw Error("stale");
      let outcome=input.action==="defer"?"deferred":"pending";
      if(input.action==="link") {
        if(!input.saintId)throw Error("Choose a saint");
        const target=await tx.saint.findFirst({where:{id:input.saintId,status:{not:"archived"}},select:{id:true}});
        if(!target)throw Error("Invalid saint");
        const source=await tx.externalRecord.findUnique({where:{sourceType_externalId:{sourceType:"airtable",externalId:review.sourceKey}}});
        // Never reassign an existing canonical link or replace another entity type.
        if(!source || source.entityId || source.entityType!=="airtable:Saints")throw Error("Existing link changed; use domain merge review");
        const mirror=await tx.airtableMirrorRecord.findMany({where:{baseId:base,tableIdOrName:"Saints"},select:{recordId:true,rawFieldsJson:true}});
        const links=await tx.externalRecord.findMany({where:{sourceType:"airtable",externalId:{startsWith:base+":Saints:"}},select:{externalId:true,entityType:true,entityId:true}});
        const saints=await tx.saint.findMany({where:{status:{not:"archived"}},select:{id:true}});
        const current=reviewMuseumSources(mirror.map(r=>({id:r.recordId,fields:r.rawFieldsJson as Record<string,unknown>})),links,new Set(saints.map(s=>s.id)));
        if(current.reviews.find(r=>r.sourceKey===review.sourceKey)?.sourceHash!==review.sourceHash)throw Error("stale source");
        await tx.externalRecord.update({where:{id:source.id},data:{entityType:"Saint",entityId:target.id}});
        outcome="resolved";
        await tx.auditEvent.create({data:{userId:actorId,action:"museum.source.linked",entityType:"ExternalRecord",entityId:source.id,beforeJson:{entityType:source.entityType,entityId:null},afterJson:{entityType:"Saint",entityId:target.id,note:input.note}}});
      }
      await tx.museumSourceReview.update({where:{id:review.id},data:{status:outcome,note:input.note || null,reviewedById:actorId}});
      await tx.auditEvent.create({data:{userId:actorId,action:"museum.source.reviewed",entityType:"MuseumSourceReview",entityId:review.id,beforeJson:{status:review.status,note:review.note},afterJson:{status:outcome,note:input.note}}});
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
}
