import "dotenv/config";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {readdir,readFile} from "node:fs/promises";
import pg from "pg";
import type {MoveSnapshot,MoveLocation} from "../lib/museum-move-session-domain";
import type {MuseumSaintPlacement} from "../lib/museum-proposals";

const configured=new URL(process.env.DATABASE_URL??"postgresql://invalid/invalid");
if(!["localhost","127.0.0.1","[::1]"].includes(configured.hostname))throw Error("Use a localhost development PostgreSQL server.");
const databaseName=`museum_case_hold_test_${randomUUID().replaceAll("-","")}`;
assert.match(databaseName,/^museum_case_hold_test_[a-f0-9]{32}$/);
const adminUrl=new URL(configured);adminUrl.pathname="/postgres";
const testUrl=new URL(configured);testUrl.pathname=`/${databaseName}`;
const admin=new pg.Client({connectionString:adminUrl.href,connectionTimeoutMillis:5000});
await admin.connect();await admin.query(`CREATE DATABASE "${databaseName}"`);
const sql=new pg.Client({connectionString:testUrl.href});
let app:typeof import("../lib/db")|undefined;
try{
 await sql.connect();
 for(const name of(await readdir("prisma/migrations")).filter(n=>/^\d/.test(n)).sort())await sql.query(await readFile(`prisma/migrations/${name}/migration.sql`,"utf8"));
 process.env.DATABASE_URL=testUrl.href;app=await import("../lib/db");
 const service=await import("../lib/museum-physical-locations");
 const sessions=await import("../lib/museum-move-session-service");
 const {writeMuseumArrangement}=await import("../lib/museum-arrangement");
 const {arrangementInput}=await import("../lib/museum-arrangement-domain");
 const curator={id:"local-case-hold-curator",canManage:true};
 const vitrine=(code:string):MoveLocation=>({kind:"vitrine",code,label:`Vitrine ${code}`});
 const staging:MoveLocation={kind:"table",code:"staging-area",label:"Staging area"};
 const snapshot:MoveSnapshot={proposalVersion:"local-case-hold",title:"Local hold regression",vitrineCodes:["5","64","65","66","67","68","77"],guidance:{version:"local",reviewStatus:"Synthetic local fixture"},rows:[
  ["free","5"],["held64","64"],["held68","68"],["old-check","64"],["old-clear","64"]
 ].map(([sourceId,code])=>({sourceId,name:sourceId,saintId:null,sourceReported:vitrine(code),destination:vitrine("77"),holdReason:"",fixedHousing:false}))};
 const loader=async()=>snapshot;
 const view=()=>service.readPhysicalLocationView(loader,app!.db);
 const record=(row:Awaited<ReturnType<typeof view>>["rows"][number],to:MoveLocation)=>({sourceId:row.sourceId,saintId:row.saintId,expectedCurrentRevision:row.currentRevision,expectedSourceRevision:row.sourceRevision,expectedLocationVersion:row.currentVersion,to});
 const confirmation=(records:ReturnType<typeof record>[],extra:Record<string,unknown>={})=>({museumId:"museum-spn",clientRequestId:randomUUID(),confirmedDate:"2026-10-31",datePrecision:"date",evidence:"Synthetic isolated regression",physicalConfirmation:true,inventoryAcknowledged:true,records,...extra});
 const blocked=(promise:Promise<unknown>)=>assert.rejects(promise,/Sikh display retained here/);
 let rows=(await view()).rows;
 const free=rows.find(r=>r.sourceId==="free")!,held=rows.find(r=>r.sourceId==="held64")!;
 await blocked(service.confirmMuseumPhysicalLocations(confirmation([record(held,staging)]),curator,loader));
 await blocked(service.confirmMuseumPhysicalLocations(confirmation([record(free,vitrine("68"))]),curator,loader));
 await blocked(service.confirmMuseumPhysicalLocations(confirmation([record(held,vitrine("64"))]),curator,loader));
 await blocked(service.confirmMuseumPhysicalLocations(confirmation([record(free,vitrine("77")),record(held,staging)]),curator,loader));
 await blocked(service.confirmMuseumPhysicalLocations(confirmation([],{clearedVitrines:["68"]}),curator,loader));
 for(const code of["64","65","66","67","68"])for(const prepared of[true,false])await blocked(service.saveMuseumPreparation({action:"preparation.update",museumId:"museum-spn",clientRequestId:randomUUID(),vitrine:code,prepared,expectedVersion:0},curator,loader));
 assert.equal(await app.db.museumMoveCurrentLocation.count(),0);assert.equal(await app.db.auditEvent.count(),0);
 const request=confirmation([record(free,vitrine("77"))]);
 const saved=await service.confirmMuseumPhysicalLocations(request,curator,loader);
 const replay=await service.confirmMuseumPhysicalLocations(request,curator,loader);
 assert.equal(replay.replayed,true);assert.equal(replay.receipt.id,saved.receipt.id);
 await service.saveMuseumPreparation({action:"preparation.update",museumId:"museum-spn",clientRequestId:randomUUID(),vitrine:"5",prepared:true,expectedVersion:0},curator,loader);
 const session=await sessions.startMuseumMoveSession({museumId:"museum-spn",proposalVersion:snapshot.proposalVersion,clientRequestId:randomUUID()},curator,async()=>snapshot);
 const heldSession=session.session.rows.find(r=>r.sourceId==="held64")!;
 await blocked(sessions.updateMuseumMoveSession({sessionId:session.session.id,expectedSessionVersion:session.session.version,clientRequestId:randomUUID(),action:"move",physicalConfirmation:true,inventoryAcknowledged:true,moves:[{sourceId:heldSession.sourceId,expectedCurrentRevision:heldSession.currentRevision,expectedLocationVersion:heldSession.currentVersion,to:staging}]},curator));
 await blocked(sessions.updateMuseumMoveSession({sessionId:session.session.id,expectedSessionVersion:session.session.version,clientRequestId:randomUUID(),action:"move",physicalConfirmation:true,inventoryAcknowledged:true,moves:[],clearedVitrines:["68"]},curator));
 const seedHistory=async(sourceId:string,location:MoveLocation,cleared:boolean)=>{
  const at=new Date();const before={kind:"vitrine" as const,code:"64",label:"Vitrine 64"};
  await app!.db.museumMoveCurrentLocation.create({data:{museumId:"museum-spn",sourceId,location,version:1,confirmedAt:at,confirmedById:curator.id}});
  return app!.db.auditEvent.create({data:{action:"museum.physical_location.confirmed",entityType:"MuseumPhysicalConfirmation",entityId:`museum-spn:${randomUUID()}`,afterJson:{museumId:"museum-spn",recordedAt:at.toISOString(),clearedVitrines:cleared?["64"]:[],moves:[{sourceId,sourceKey:null,saintId:null,original:before,previous:before,previousState:{basis:cleared?"confirmed":"source",location:before,effectiveConfirmedAt:cleared?"2026-10-01T00:00:00.000Z":null},location,version:1}]}}});
 };
 const oldCheck=await seedHistory("old-check",vitrine("77"),false);
 rows=(await view()).rows;const checked=rows.find(r=>r.sourceId==="old-check")!;assert.equal(checked.undo.available,true);
 const guardedSource={sourceId:checked.sourceId,saintId:checked.saintId,expectedCurrentRevision:checked.currentRevision,expectedSourceRevision:checked.sourceRevision,expectedLocationVersion:checked.currentVersion};
 await blocked(service.undoMuseumPhysicalCheck({action:"undo",museumId:"museum-spn",clientRequestId:randomUUID(),receiptId:oldCheck.id,...guardedSource,mistakenCheckAcknowledged:true},curator,loader));
 const oldClear=await seedHistory("old-clear",staging,true);
 rows=(await view()).rows;const cleared=rows.find(r=>r.sourceId==="old-clear")!;
 await blocked(service.correctMuseumClear({action:"clear.correct",museumId:"museum-spn",clientRequestId:randomUUID(),receiptId:oldClear.id,records:[{sourceId:cleared.sourceId,saintId:null,expectedCurrentRevision:cleared.currentRevision,expectedSourceRevision:cleared.sourceRevision,expectedLocationVersion:cleared.currentVersion}],mistakenClearAcknowledged:true},curator,loader));
 const final=(await view()).rows;
 assert.deepEqual(final.find(r=>r.sourceId==="held64")!.current,vitrine("64"));assert.equal(final.find(r=>r.sourceId==="held64")!.currentVersion,0);
 assert.equal(final.find(r=>r.sourceId==="old-check")!.currentVersion,1);assert.equal(final.find(r=>r.sourceId==="old-clear")!.currentVersion,1);
 const placement: MuseumSaintPlacement={id:"local-arrangement",sourceRecordId:"held64",name:"Local retained display",section:"Needs Research",alternatives:[],tier:"Tertiary",confidence:"",rationale:"",note:"",familyId:"",curatorialFamily:"",familySize:1,spiritualRegions:[],sampradaya:"",normalizedPlaces:[],needsResearch:false,arrangement:{status:"Proposed",revision:"a".repeat(64),proposalRevision:"b".repeat(64),familyKey:"",vitrine:"",shelf:"",confirmedAt:null,inventoryAcknowledged:false}};
 const implementation=arrangementInput.parse({placementId:placement.id,revision:placement.arrangement!.revision,familyKey:"",status:"Implemented",vitrine:"77",physicalConfirmation:"yes",inventoryAcknowledged:"yes"});
 await blocked(app.db.$transaction(tx=>writeMuseumArrangement(tx,"museum-spn",placement,implementation,curator.id,final)));
 await blocked(app.db.$transaction(async tx=>{
  await writeMuseumArrangement(tx,"museum-spn",{...placement,id:"local-free",sourceRecordId:"free"},{...implementation,vitrine:"5"},curator.id,final);
  await writeMuseumArrangement(tx,"museum-spn",placement,implementation,curator.id,final);
 }));
 assert.equal(await app.db.museumArrangement.count(),0,"A rejected family implementation must roll back its earlier member.");
 await app.db.$transaction(tx=>writeMuseumArrangement(tx,"museum-spn",placement,{...implementation,status:"Planned",vitrine:"68"},curator.id));
 await app.db.$transaction(tx=>writeMuseumArrangement(tx,"museum-vrindavan",placement,{...implementation,vitrine:"68"},curator.id));
 assert.equal(await app.db.museumMoveCurrentLocation.count(),3);assert.equal(await app.db.museumArrangement.count(),2);assert.equal(await app.db.museumItemPlacement.count(),0);
 console.log(JSON.stringify({heldIncoming:true,heldOutgoing:true,sameCase:true,mixedBatchAtomic:true,emptyCaseClear:true,allPreparationsBlocked:true,unrelatedMoveAndPreparation:true,retryIdempotent:true,legacySessionBlocked:true,undoIntoHeldBlocked:true,clearCorrectionIntoHeldBlocked:true,legacyImplementationBlocked:true,familyImplementationAtomic:true,futurePlanAllowed:true,vrindavanUnaffected:true,historyAndVersionsPreserved:true,isolatedDatabase:true}));
}finally{
 await app?.db.$disconnect();await sql.end();await admin.query(`DROP DATABASE "${databaseName}"`);await admin.end();
}
