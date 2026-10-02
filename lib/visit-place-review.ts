import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { normalizeVisitPlace, visitPlaceSchema, visitPlaceDecisionSchema, researchBundleSchema } from "@/lib/visit-place-domain";

type Bundle = {sourceName: string; sourceSheet: string; sha256: string; rows: Record<string, unknown>[]};
const json=(value:unknown):Prisma.InputJsonValue=>JSON.parse(JSON.stringify(value));
export async function stageVisitPlaceResearch(actorId:string, input:Bundle) {
  const bundle=researchBundleSchema.parse(input);
  if (!bundle.rows.length || bundle.rows.length > 2000 || !/^[a-f0-9]{64}$/.test(bundle.sha256)) throw Error("Invalid research bundle.");
  const seen = new Set<string>();
  const plans=bundle.rows.map(raw => {
    const normalized=normalizeVisitPlace(raw);
    const sourceRow=Number(raw.excel_row);
    if (!Number.isInteger(sourceRow) || sourceRow < 2 || seen.has(normalized.slug)) throw Error("Duplicate or invalid research row.");
    seen.add(normalized.slug);
    return {raw, normalized, sourceRow, sourceKey:`visit-research:${bundle.sourceSheet}:${normalized.slug}`,fingerprint:createHash("sha256").update(JSON.stringify(raw)).digest("hex")};
  });
  return db.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(8496221)`;
    let staged=0, unchanged=0, unmatched=0;
    for (const plan of plans) {
      const exists=await tx.visitPlaceProposal.findUnique({where:{sourceKey_fingerprint:{sourceKey:plan.sourceKey,fingerprint:plan.fingerprint}}});
      if(exists){unchanged++;continue;}
      const saint=await tx.saint.findUnique({where:{slug:plan.normalized.slug},select:{id:true,status:true}});
      const saintId=saint && saint.status!=="archived" ? saint.id : null;
      if(!saintId) unmatched++;
      await tx.visitPlaceProposal.updateMany({where:{sourceKey:plan.sourceKey,status:{in:["pending","deferred"]}},data:{status:"superseded",version:{increment:1}}});
      const proposal=await tx.visitPlaceProposal.create({data:{sourceKey:plan.sourceKey,fingerprint:plan.fingerprint,sourceName:bundle.sourceName,sourceSheet:bundle.sourceSheet,sourceRow:plan.sourceRow,sourceFileHash:bundle.sha256,saintId,rawJson:json(plan.raw),normalizedJson:json(plan.normalized)}});
      await tx.auditEvent.create({data:{userId:actorId,entityType:"VisitPlaceProposal",entityId:proposal.id,action:"research_staged",afterJson:{sourceKey:plan.sourceKey,saintId}}});
      staged++;
    }
    return {staged,unchanged,unmatched};
  },{isolationLevel:"Serializable",timeout:120000});
}
export async function decideVisitPlaceResearch(actorId:string,input:unknown,edited:unknown) {
  const decision=visitPlaceDecisionSchema.parse(input);
  const normalized=visitPlaceSchema.parse(edited);
  if(decision.action === "approve") {
    if(normalized.coordinatePrecision === "unverified") throw Error("Review coordinate precision before approval.");
    if(normalized.latitude == null && normalized.coordinatePrecision !== "unknown") throw Error("Missing coordinates must have unknown precision.");
    if(normalized.latitude != null && normalized.coordinatePrecision === "unknown") throw Error("Remove unverified coordinates or choose their reviewed precision.");
  }
  return db.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(8496221)`;
    const row=await tx.visitPlaceProposal.findUniqueOrThrow({where:{id:decision.id},include:{saint:true}});
    const latest=await tx.visitPlaceProposal.findFirst({where:{sourceKey:row.sourceKey},orderBy:[{observedAt:"desc"},{id:"desc"}]});
    if(row.version!==decision.version || latest?.id!==row.id || row.status==="superseded") throw Error("Research changed. Reload before reviewing.");
    if(normalized.slug!==normalizeVisitPlace(row.rawJson as Record<string,unknown>).slug) throw Error("The research saint identity cannot be changed.");
    if(decision.action==="approve" && (!row.saint || row.saint.status==="archived")) throw Error("An existing active website saint is required.");
    if(decision.action!=="reopen" && !["pending","deferred"].includes(row.status)) throw Error("Reopen the existing decision before changing it.");
    if(decision.action==="reopen" && !["approved","rejected","deferred"].includes(row.status)) throw Error("This row does not have a completed decision to reopen.");
    const status={approve:"approved",defer:"deferred",reject:"rejected",reopen:"pending"}[decision.action];
    const saved=await tx.visitPlaceProposal.update({where:{id:row.id},data:{status,normalizedJson:json(normalized),catalogDecision:decision.catalogDecision,catalogNote:decision.catalogNote||null,evidence:decision.evidence||null,decisionNote:decision.note||null,reviewedBy:actorId,reviewedAt:new Date(),version:{increment:1}}});
    await tx.auditEvent.create({data:{userId:actorId,entityType:"VisitPlaceProposal",entityId:row.id,action:`research_${decision.action}`,beforeJson:json(row),afterJson:json(saved)}});
    return saved;
  },{isolationLevel:"Serializable"});
}
