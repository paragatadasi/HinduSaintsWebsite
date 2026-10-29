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
