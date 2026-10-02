import { z } from "zod";
import { db } from "./db";
import { Prisma } from "./generated/prisma/client";
export const planItemMoveSchema=z.object({
  itemId:z.string().cuid(), version:z.coerce.number().int().min(0),
  vitrine:z.string().trim().regex(/^[1-9][0-9]{0,5}$/), shelf:z.string().trim().toUpperCase().regex(/^[A-Z0-9]{0,8}$/),
  reason:z.string().trim().min(1).max(2000)
});
export const resolveItemMoveSchema=z.object({
  itemId:z.string().cuid(), planId:z.string().cuid(), action:z.enum(["complete","cancel"]),
  note:z.string().trim().min(1).max(2000), confirm:z.literal("on").optional()
});
// Caller enforces manage_museum. Initial UI is SPN-only; museum identity is explicit.
export async function planItemMove(actorId:string,input:z.infer<typeof planItemMoveSchema>) {
  input=planItemMoveSchema.parse(input);
  return db.$transaction(async tx=>{
    await tx.$queryRaw`SELECT id FROM "MuseumCollectionItem" WHERE id=${input.itemId} FOR UPDATE`;
    const item=await tx.museumCollectionItem.findUniqueOrThrow({where:{id:input.itemId},include:{catalogMuseum:true,placements:{where:{endedAt:null},include:{location:true}}}});
    if(item.version!==input.version || item.status==="archived" || item.catalogMuseum.archivedAt || item.catalogMuseumId!=="museum-spn") throw Error("Item changed or is unavailable");
    if(item.placements[0] && (item.placements[0].location.museumId!=="museum-spn" || item.placements[0].location.archivedAt)) throw Error("Review current museum/location first");
    if(await tx.museumItemMovePlan.findFirst({where:{itemId:item.id,status:"planned"}})) throw Error("Resolve the existing plan first");
    const code=input.vitrine+(input.shelf?"/"+input.shelf:"");
    const target=await tx.museumLocation.upsert({where:{museumId_code:{museumId:"museum-spn",code}},create:{museumId:"museum-spn",code,label:"Vitrine "+input.vitrine+(input.shelf?" / Shelf "+input.shelf:""),kind:input.shelf?"shelf":"vitrine"},update:{}});
    const from=item.placements[0]?.locationId ?? null;
    if(target.archivedAt || from===target.id) throw Error("Choose a different active location");
    const plan=await tx.museumItemMovePlan.create({data:{itemId:item.id,fromLocationId:from,targetLocationId:target.id,expectedItemVersion:item.version,reason:input.reason,createdById:actorId}});
    await tx.auditEvent.create({data:{userId:actorId,action:"museum.item.move.planned",entityType:"MuseumItemMovePlan",entityId:plan.id,afterJson:{itemId:item.id,fromLocationId:from,targetLocationId:target.id,reason:input.reason}}});
    return plan;
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
}
export async function resolveItemMove(actorId:string,input:z.infer<typeof resolveItemMoveSchema>) {
  input=resolveItemMoveSchema.parse(input);
  return db.$transaction(async tx=>{
    await tx.$queryRaw`SELECT id FROM "MuseumCollectionItem" WHERE id=${input.itemId} FOR UPDATE`;
    const plan=await tx.museumItemMovePlan.findUniqueOrThrow({where:{id:input.planId}});
    if(plan.itemId!==input.itemId || plan.status!=="planned") throw Error("Plan already resolved or belongs to another item");
    if(input.action==="complete") {
      if(input.confirm!=="on") throw Error("Confirm the physical move first");
      const item=await tx.museumCollectionItem.findUniqueOrThrow({where:{id:input.itemId},include:{catalogMuseum:true,placements:{where:{endedAt:null},include:{location:true}}}});
      const current=item.placements[0];
      const target=await tx.museumLocation.findUniqueOrThrow({where:{id:plan.targetLocationId},include:{museum:true}});
      if(item.version!==plan.expectedItemVersion || (current?.locationId ?? null)!==plan.fromLocationId || item.status==="archived" || item.catalogMuseumId!=="museum-spn" || item.catalogMuseum.archivedAt || target.museumId!=="museum-spn" || target.archivedAt || target.museum.archivedAt || (current && (current.location.archivedAt || current.location.museumId!=="museum-spn"))) throw Error("Item or location changed; cancel and replan");
      const now=new Date();
      if(current) await tx.museumItemPlacement.update({where:{id:current.id},data:{endedAt:now}});
      await tx.museumItemPlacement.create({data:{itemId:item.id,locationId:target.id,startedAt:now,note:input.note}});
      await tx.museumCollectionItem.update({where:{id:item.id,version:plan.expectedItemVersion},data:{version:{increment:1}}});
    }
    const status=input.action==="complete"?"completed":"cancelled";
    await tx.museumItemMovePlan.update({where:{id:plan.id},data:{status,resolvedAt:new Date(),resolvedById:actorId,resolutionNote:input.note}});
    await tx.auditEvent.create({data:{userId:actorId,action:"museum.item.move."+status,entityType:"MuseumItemMovePlan",entityId:plan.id,beforeJson:{status:plan.status},afterJson:{status,itemId:input.itemId,fromLocationId:plan.fromLocationId,targetLocationId:plan.targetLocationId,note:input.note}}});
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
}
