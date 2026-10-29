import {readGuideAlternativeDestinations} from "./museum-guide-alternatives";
import {currentSpnProposalRelease} from "./spn-current-proposal";
import {z} from "zod";
import {db} from "./db";
import type {Prisma} from "./generated/prisma/client";
import {isActiveSpnObservation} from "./spn-observation-suppression";
const action="museum.companion.addition.planned";
const schema=z.object({sourceId:z.string().min(1).max(200),saintId:z.string().nullable(),sourceRevision:z.string(),vitrine:z.string().min(1).max(20),shelf:z.string().max(100).nullable(),version:z.number().int().positive(),updatedAt:z.string(),clientRequestId:z.string().uuid()});
export type CompanionAddition=z.infer<typeof schema>;
export async function readCompanionAdditions(tx:Prisma.TransactionClient=db){
 const events=await tx.auditEvent.findMany({where:{action,entityType:"MuseumCompanionAddition"},orderBy:[{createdAt:"desc"},{id:"desc"}],select:{afterJson:true}});
 const latest=new Map<string,CompanionAddition>();
 for(const event of events){const value=schema.parse(event.afterJson);if(!latest.has(value.sourceId)&&isActiveSpnObservation(value.sourceId))latest.set(value.sourceId,value);}
 return [...latest.values()];
}

export async function readEffectiveCompanionAdditions(tx:Prisma.TransactionClient=db){
 const [additions,alternatives]=await Promise.all([readCompanionAdditions(tx),readGuideAlternativeDestinations(tx)]);
 if(!additions.length)return [];
 const baseline=new Map([...currentSpnProposalRelease.proposal.rows,...currentSpnProposalRelease.proposal.namedOnly].map(row=>[row.sourceId,row.baseline?.placementId]));
 const events=await tx.auditEvent.findMany({where:{action:"museum.arrangement.updated",entityType:"MuseumArrangement",entityId:{in:additions.flatMap(a=>[a.sourceId,baseline.get(a.sourceId)].filter((id):id is string=>!!id))},afterJson:{path:["museumId"],equals:"museum-spn"}},select:{entityId:true,createdAt:true}});
 return additions.filter(a=>!alternatives.some(other=>other.sourceId===a.sourceId&&Date.parse(other.updatedAt)>=Date.parse(a.updatedAt))&&!events.some(event=>(event.entityId===a.sourceId||event.entityId===baseline.get(a.sourceId))&&event.createdAt.getTime()>=Date.parse(a.updatedAt)));
}
