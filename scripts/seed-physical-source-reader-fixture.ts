import {PrismaPg} from "@prisma/adapter-pg";
import {PrismaClient} from "../lib/generated/prisma/client";
import {readMuseumMoveSessionSource,registeredMoveProposal} from "../lib/museum-move-session-source";
const url=new URL(process.env.DATABASE_URL??"");
const name=decodeURIComponent(url.pathname.slice(1));
if(!["localhost","127.0.0.1","[::1]"].includes(url.hostname)||!/^codex_physical_reader_[a-f0-9]{16}$/.test(name)||process.env.PHYSICAL_READER_FIXTURE_DATABASE!==name)throw new Error("Fixture writes require an explicitly named isolated reader-verification database.");
const client=new PrismaClient({adapter:new PrismaPg({connectionString:url.href})});
try{
 await client.$transaction(async tx=>{
  const source=await readMuseumMoveSessionSource(registeredMoveProposal.version,tx);
  const row=source.rows.find(r=>r.saintId&&r.sourceKey&&!r.fixedHousing)!;
  if(!row)throw new Error("The test clone needs a named source observation.");
  const saint=await tx.saint.upsert({where:{id:row.saintId!},update:{},create:{id:row.saintId!,slug:"reader-fixture-"+row.sourceId.toLowerCase(),canonicalName:"Reader fixture",displayName:"Reader fixture"},select:{id:true}});
  await tx.externalRecord.upsert({where:{sourceType_externalId:{sourceType:"airtable",externalId:row.sourceKey!}},create:{sourceType:"airtable",externalId:row.sourceKey!,entityType:"Saint",entityId:saint.id,rawPayloadJson:{fixture:true}},update:{entityType:"Saint",entityId:saint.id}});
  for(const [museumId,slug,status] of [["museum-spn","spn","verified"],["museum-spn","spn","needs_review"],["museum-vrindavan","vrindavan","verified"]] as const){
   await tx.museum.upsert({where:{id:museumId},create:{id:museumId,slug,name:"Reader test fixture"},update:{}});
   const location=await tx.museumLocation.upsert({where:{museumId_code:{museumId,code:"reader-fixture"}},create:{museumId,code:"reader-fixture",label:"Reader fixture only",kind:"vitrine"},update:{}});
   const item=await tx.museumCollectionItem.create({data:{catalogMuseumId:museumId,label:"Reader equivalence fixture",status,saints:{create:{saintId:saint.id}},placements:{create:{locationId:location.id}}}});
   await tx.museumCollectionImport.create({data:{museumId,sourceKey:row.sourceKey!,fingerprint:`reader-fixture-${museumId}-${status}`,itemId:item.id,rawJson:{fixture:true},normalizedJson:{fixture:true},status:"linked"}});
  }
 },{timeout:60000});
 console.log("Created three display-card fixtures; only the verified SPN binding may protect the SPN source.");
}finally{await client.$disconnect();}
