import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
async function main(){
 const url=new URL(process.env.DATABASE_URL??"");assert.equal(url.hostname,"127.0.0.1");assert.equal(url.port,"55438");assert.equal(url.pathname,"/museum_test");
 const {db}=await import("../lib/db");
 const {confirmMuseumPhysicalLocations:confirm,readPhysicalLocationView,saveMuseumPreparation,undoMuseumPhysicalCheck:undo}=await import("../lib/museum-physical-locations");
 const {ramakrishnaGuideContext:guideContext,ramakrishnaMoveGuide:guide}=await import("../lib/spn-ramakrishna-guide");
 try{
 for(const sql of [
  'CREATE TABLE "AuditEvent" (id text PRIMARY KEY,"userId" text,action text NOT NULL,"entityType" text NOT NULL,"entityId" text NOT NULL,"beforeJson" jsonb,"afterJson" jsonb,"createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)',
  'CREATE TABLE "ExternalRecord" (id text PRIMARY KEY,"sourceType" text,"externalId" text,"entityType" text,"entityId" text)',
  'CREATE TABLE "MuseumMoveCurrentLocation" ("museumId" text,"sourceId" text,location jsonb,version int,"confirmedAt" timestamp(3),"confirmedById" text,PRIMARY KEY("museumId","sourceId"))'
 ])await db.$executeRawUnsafe(sql);
 const location=(code:string)=>({kind:"vitrine" as const,code,label:`Vitrine ${code}`});
 const incoming=guide.entries.find(r=>r.destination==="23")!;
 const transfers=guide.preparatoryTransfers!;
 const rows=[...transfers.map(t=>({sourceId:t.sourceId,sourceKey:`test:${t.sourceId}`,saintId:`person-${t.sourceId}`,name:t.name,sourceReported:location("23"),destination:location(t.finalDestination),holdReason:"",fixedHousing:true})),{sourceId:incoming.sourceId,sourceKey:`test:${incoming.sourceId}`,saintId:incoming.saintId,name:incoming.name,sourceReported:location("22"),destination:location("23"),holdReason:"",fixedHousing:false}];
 const loader=async()=>({proposalVersion:"test",title:"Test",vitrineCodes:["18","22","23","70","73","75"],guidance:{version:"test",reviewStatus:"test"},rows});
 for(const [i,row] of rows.entries())await db.$executeRaw`INSERT INTO "ExternalRecord" VALUES (${`external-${i}`},'airtable',${row.sourceKey},'Saint',${row.saintId})`;
 const actor={id:"actor",canManage:true};
 const read=()=>readPhysicalLocationView(loader,db,undefined,false);
 const input=async(sourceId:string,to:string)=>{const row=(await read()).rows.find(r=>r.sourceId===sourceId)!;return {museumId:"museum-spn",clientRequestId:randomUUID(),confirmedDate:"2026-10-28",datePrecision:"date",evidence:"Disposable local test",physicalConfirmation:true,inventoryAcknowledged:true,guideContext,records:[{sourceId,saintId:row.saintId,expectedCurrentRevision:row.currentRevision,expectedSourceRevision:row.sourceRevision,expectedLocationVersion:row.currentVersion,to:location(to)}]};};
 const prepare=async(vitrine:string)=>saveMuseumPreparation({action:"preparation.update",museumId:"museum-spn",clientRequestId:randomUUID(),vitrine,prepared:true,expectedVersion:0},actor,loader);
 await prepare("23");
 await assert.rejects(confirm(await input(incoming.sourceId,"23"),actor,loader),/outgoing objects/);
 await assert.rejects(confirm(await input(transfers[0].sourceId,"70"),actor,loader),/available and prepared/);
 await prepare("70");
 await confirm(await input(transfers[0].sourceId,"70"),actor,loader);
 await assert.rejects(confirm(await input(incoming.sourceId,"23"),actor,loader),/outgoing objects/);
 const uniform=await input(transfers[1].sourceId,"70");
 const saved=await confirm(uniform,actor,loader);
 assert.equal((await confirm(uniform,actor,loader)).replayed,true);
 assert.equal(rows[1].destination.code,"18");
 let current=(await read()).rows.find(r=>r.sourceId===transfers[1].sourceId)!;
 await undo({action:"undo",museumId:"museum-spn",clientRequestId:randomUUID(),receiptId:saved.receipt.id,sourceId:current.sourceId,saintId:current.saintId,expectedCurrentRevision:current.currentRevision,expectedSourceRevision:current.sourceRevision,expectedLocationVersion:current.currentVersion,mistakenCheckAcknowledged:true},actor,loader);
 await assert.rejects(confirm(await input(incoming.sourceId,"23"),actor,loader),/outgoing objects/);
 await confirm(await input(transfers[1].sourceId,"70"),actor,loader);
 const placed=await confirm(await input(incoming.sourceId,"23"),actor,loader);
 assert.equal(placed.rows[0].current?.code,"23");
 assert.equal((saved.receipt.afterJson as {proposalChanged:boolean}).proposalChanged,false);
 console.log("PASS: fixed source23 transfers require70 readiness; both prerequisites required; retry safe; undo relocks23; incoming placement succeeds; planned18 unchanged.");
 }finally{await db.$disconnect();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
