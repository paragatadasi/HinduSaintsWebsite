import {db} from "@/lib/db";
import {Prisma} from "@/lib/generated/prisma/client";
import {arrangementInput,familyArrangementControl} from "@/lib/museum-arrangement-domain";
import {readMuseumData} from "@/lib/museum-working-data";
import type {MuseumSaintPlacement} from "@/lib/museum-proposals";
import {MuseumConflict} from "@/lib/museum-service";
export async function saveMuseumArrangement(raw:unknown,actorId:string) {
 const input=arrangementInput.parse(raw);
 try {return await db.$transaction(async tx=>{
  if(input.familyKey)await tx.$queryRaw(Prisma.sql`SELECT true FROM pg_advisory_xact_lock(hashtextextended(${"museum-family:"+input.familyKey},0))`);
  await tx.$queryRaw(Prisma.sql`SELECT true FROM pg_advisory_xact_lock(hashtextextended(${"museum-arrangement:spn:"+input.placementId},0))`);
  const first=(await readMuseumData(tx)).placements.find(p=>p.id===input.placementId);
  if(first?.saintId)await tx.$queryRaw(Prisma.sql`SELECT id FROM "Saint" WHERE id=${first.saintId} FOR UPDATE`);
  const row=(await readMuseumData(tx)).placements.find(p=>p.id===input.placementId);
  if(!row?.arrangement||row.arrangement.revision!==input.revision||row.arrangement.familyKey!==input.familyKey)throw new MuseumConflict("This proposal or arrangement changed. Reload the saint before saving.");
  if(!row.saintId || row.placementState?.startsWith("Conflicting"))throw new MuseumConflict("Resolve the saint identity or conflicting placements before planning this arrangement.");
  await writeArrangement(tx,row,input,actorId);
  return row.name;
 },{isolationLevel:"Serializable",timeout:30000});}catch(error){if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==="P2034")throw new MuseumConflict("This proposal changed while saving. Reload and try again.");throw error;}
}

async function writeArrangement(tx:Prisma.TransactionClient,row:MuseumSaintPlacement,input:ReturnType<typeof arrangementInput.parse>,actorId:string) {
  const before=await tx.museumArrangement.findUnique({where:{museumId_placementId:{museumId:"museum-spn",placementId:row.id}}});
  const values={proposalRevision:row.arrangement!.proposalRevision,status:input.status,vitrine:input.status==="Proposed"?null:input.vitrine||null,shelf:input.status==="Proposed"?null:input.shelf||null,
   confirmedAt:input.status==="Implemented"?new Date():null,confirmedById:input.status==="Implemented"?actorId:null,inventoryAcknowledged:input.status==="Implemented",updatedById:actorId};
  const after=await tx.museumArrangement.upsert({where:{museumId_placementId:{museumId:"museum-spn",placementId:row.id}},create:{museumId:"museum-spn",placementId:row.id,...values},update:{...values,version:{increment:1}}});
  await tx.auditEvent.create({data:{userId:actorId,action:"museum.arrangement.updated",entityType:"MuseumArrangement",entityId:row.id,beforeJson:before?JSON.parse(JSON.stringify(before)):Prisma.JsonNull,afterJson:JSON.parse(JSON.stringify(after))}});
}
export async function saveMuseumFamilyArrangement(raw:unknown,actorId:string) {
 const input=arrangementInput.parse(raw);
 if(!input.familyKey)throw new MuseumConflict("Choose a display family.");
 try{return await db.$transaction(async tx=>{
  await tx.$queryRaw(Prisma.sql`SELECT true FROM pg_advisory_xact_lock(hashtextextended(${"museum-family:"+input.familyKey},0))`);
  const members=(data:Awaited<ReturnType<typeof readMuseumData>>)=>data.placements.filter(row=>(row.curatorialFamily||row.familyId)===input.familyKey);
  const initial=members(await readMuseumData(tx));
  for(const row of [...initial].sort((a,b)=>a.id.localeCompare(b.id)))await tx.$queryRaw(Prisma.sql`SELECT true FROM pg_advisory_xact_lock(hashtextextended(${"museum-arrangement:spn:"+row.id},0))`);
  for(const saintId of [...new Set(initial.flatMap(r=>r.saintId?[r.saintId]:[]))].sort())await tx.$queryRaw(Prisma.sql`SELECT id FROM "Saint" WHERE id=${saintId} FOR UPDATE`);
  const rows=members(await readMuseumData(tx));const control=familyArrangementControl(rows);
  if(control.revision!==input.revision)throw new MuseumConflict("This family's membership, proposal or arrangement changed. Reload before saving.");
  if(!control.eligible)throw new MuseumConflict("Resolve missing saint links or competing placements before updating the whole family. Linked saints can still be updated individually.");
  for(const row of rows)await writeArrangement(tx,row,input,actorId);
  return {name:rows[0].name,count:rows.length};
 },{isolationLevel:"Serializable",timeout:30000});}catch(error){if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==="P2034")throw new MuseumConflict("The family changed while saving. Reload and try again.");throw error;}
}
