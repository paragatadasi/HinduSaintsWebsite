import type {Prisma} from "./generated/prisma/client";
import {MuseumMoveSessionError} from "./museum-move-session-domain";
export async function readFinalReviewPlans(tx:Prisma.TransactionClient){
 return tx.museumFinalReviewState.findMany({where:{museumId:"museum-spn",OR:[{planVersion:{gt:0}},{decision:{not:"pending"}}]},select:{sourceId:true,saintId:true,sourceRevision:true,planVersion:true,vitrine:true,shelf:true,plannedAt:true,decision:true,decisionAt:true,decisionNote:true}});
}
export async function lockFinalReviewSource(tx:Prisma.TransactionClient,sourceId:string){
 await tx.$queryRaw`SELECT true FROM pg_advisory_xact_lock(hashtextextended(${"museum-final-review:spn:"+sourceId},0))`;
}
export async function assertNoFinalReviewPlan(tx:Prisma.TransactionClient,sourceId:string){
 await lockFinalReviewSource(tx,sourceId);
 const state=await tx.museumFinalReviewState.findUnique({where:{museumId_sourceId:{museumId:"museum-spn",sourceId}},select:{vitrine:true,plannedAt:true,decision:true}});
 if(state&&(state.vitrine&&state.plannedAt||state.decision!=="pending"))throw new MuseumMoveSessionError(409,"This destination has a final-review decision. Update it in Final review.");
}
