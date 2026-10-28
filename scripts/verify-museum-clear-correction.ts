import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {db} from "../lib/db";
import {correctMuseumClear,readPhysicalLocationView,saveMuseumPreparation,readMuseumPreparations} from "../lib/museum-physical-locations";
import {clearCorrectionOffers} from "../lib/museum-clear-correction-domain";
import type {MoveSnapshot} from "../lib/museum-move-session-domain";
async function main(){
 const url=new URL(process.env.DATABASE_URL??"");
 assert.equal(url.hostname,"127.0.0.1");assert.equal(url.port,"55438");assert.equal(url.pathname,"/museum_test");
 // Only this disposable test database is allowed; never load a project database URL.
 for(const sql of [
  'CREATE TABLE "AuditEvent" (id text PRIMARY KEY,"userId" text,action text NOT NULL,"entityType" text NOT NULL,"entityId" text NOT NULL,"beforeJson" jsonb,"afterJson" jsonb,"createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)',
  'CREATE TABLE "ExternalRecord" (id text PRIMARY KEY,"sourceType" text,"externalId" text,"entityType" text,"entityId" text)',
  'CREATE TABLE "MuseumMoveCurrentLocation" ("museumId" text,"sourceId" text,location jsonb,version int,"confirmedAt" timestamp(3),"confirmedById" text,PRIMARY KEY("museumId","sourceId"))',
  'CREATE TABLE "MuseumCompanionShelf" ("museumId" text,"sourceId" text,"saintId" text,vitrine text,shelf text,"physicalVersion" int,version int,"updatedAt" timestamp(3),"updatedById" text,PRIMARY KEY("museumId","sourceId"))'
 ])await db.$executeRawUnsafe(sql);
 const at="2026-10-28T16:32:25.061Z",priorAt="2026-10-28T10:17:05.761Z",stage={kind:"table" as const,code:"staging-area",label:"Staging area"};
 const rows=Array.from({length:18},(_,i)=>({sourceId:`test-source-${i}`,sourceKey:`test-base:Saints:${i}`,saintId:`test-saint-${i}`,name:`Test Saint ${i}`,
   sourceReported:{kind:"vitrine" as const,code:i<13?"53":"2",label:"Source",shelf:"A"},destination:{kind:"vitrine" as const,code:"2",label:"Vitrine 2"},holdReason:"",fixedHousing:false}));
 const loader=async()=>({proposalVersion:"test",title:"Test",vitrineCodes:["2","53","80"],guidance:{version:"test",reviewStatus:"test"},rows}) satisfies MoveSnapshot;
 const moves=rows.map((row,i)=>({sourceId:row.sourceId,sourceKey:row.sourceKey,saintId:row.saintId,name:row.name,original:row.sourceReported,
   previous:i<13?{kind:"vitrine",code:"2",label:"Vitrine 2"}:row.sourceReported,location:stage,version:i<13?2:1,
   previousState:i<13?{basis:"confirmed",location:{kind:"vitrine",code:"2",label:"Vitrine 2"},effectiveConfirmedAt:priorAt}:{basis:"source",location:row.sourceReported,effectiveConfirmedAt:null}}));
 for(const [i,row] of rows.entries()){
  await db.$executeRaw`INSERT INTO "ExternalRecord" VALUES (${`external-${i}`},'airtable',${row.sourceKey},'Saint',${row.saintId})`;
  await db.museumMoveCurrentLocation.create({data:{museumId:"museum-spn",sourceId:row.sourceId,location:stage,version:i<13?2:1,confirmedAt:new Date(at),confirmedById:"actor"}});
 }
 await db.museumCompanionShelf.create({data:{museumId:"museum-spn",sourceId:rows[0].sourceId,saintId:rows[0].saintId,vitrine:"2",shelf:"3.10",physicalVersion:1,version:1,updatedById:"actor"}});
 const target=await db.auditEvent.create({data:{action:"museum.physical_location.confirmed",entityType:"MuseumPhysicalConfirmation",entityId:"museum-spn:original",afterJson:JSON.parse(JSON.stringify({museumId:"museum-spn",recordedAt:at,clearedVitrines:["2"],moves}))}});
 const state=await readPhysicalLocationView(loader,db,undefined,false),offer=clearCorrectionOffers(state.rows,[target])[0];
 assert.equal(offer.records.length,13);assert.equal(offer.excludedCount,5);
 const records=offer.records.map(({sourceId,saintId,expectedCurrentRevision,expectedSourceRevision,expectedLocationVersion})=>({sourceId,saintId,expectedCurrentRevision,expectedSourceRevision,expectedLocationVersion}));
 const input={action:"clear.correct",museumId:"museum-spn",clientRequestId:randomUUID(),receiptId:target.id,records,mistakenClearAcknowledged:true};
 await assert.rejects(correctMuseumClear({...input,records:records.map((r,i)=>i===12?{...r,expectedLocationVersion:99}:r)},{id:"actor",canManage:true},loader));
 assert.equal((await db.museumMoveCurrentLocation.findMany()).filter(r=>(r.location as {code?:string}).code==="staging-area").length,18);
 const result=await correctMuseumClear(input,{id:"actor",canManage:true},loader);
 assert.equal(result.rows.filter(r=>r.current?.code==="2").length,13);
 assert.equal(result.rows.filter(r=>r.current?.code==="staging-area").length,5);
 for(const row of result.rows.slice(0,13)){assert.equal(row.currentConfirmed?.confirmedAt,priorAt);assert.equal(row.currentVersion,3);}
 const note=await db.museumCompanionShelf.findUniqueOrThrow({where:{museumId_sourceId:{museumId:"museum-spn",sourceId:rows[0].sourceId}}});
 assert.equal(note.shelf,"3.10");assert.equal(note.physicalVersion,3);assert.equal(note.version,2);
 assert.equal(await db.auditEvent.count({where:{action:"museum.physical_location.check_undone"}}),13);
 assert.equal((await correctMuseumClear(input,{id:"actor",canManage:true},loader)).replayed,true);
 await assert.rejects(correctMuseumClear({...input,clientRequestId:randomUUID()},{id:"actor",canManage:true},loader));
 await assert.rejects(correctMuseumClear({...input,records:records.slice(0,1)},{id:"actor",canManage:true},loader));
 const prep={action:"preparation.update",museumId:"museum-spn",clientRequestId:randomUUID(),vitrine:"80",prepared:true,expectedVersion:0};
 await saveMuseumPreparation(prep,{id:"actor",canManage:true},loader);
 assert.equal((await saveMuseumPreparation(prep,{id:"actor",canManage:true},loader)).replayed,true);
 await assert.rejects(saveMuseumPreparation({...prep,clientRequestId:randomUUID()},{id:"actor",canManage:true},loader));
 assert.equal((await readMuseumPreparations()).find(p=>p.vitrine==="80")?.prepared,true);
 assert.equal((await readMuseumPreparations()).find(p=>p.vitrine==="2")?.prepared,true);
 console.log("PASS: atomic13 correction,5 untouched, timestamps/shelf, retry/stale CAS, durable preparation");
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>db.$disconnect());
