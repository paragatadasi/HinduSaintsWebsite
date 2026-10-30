import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { Client } from "pg";

const adminUrl=new URL(process.env.DATABASE_URL??"http://invalid");
if(!["localhost","127.0.0.1","::1"].includes(adminUrl.hostname))throw new Error("This check requires local PostgreSQL only.");
const name="museum_component_test_"+randomUUID().replaceAll("-","");
if(!/^museum_component_test_[a-f0-9]{32}$/.test(name))throw new Error("Invalid disposable database name.");
const admin=new Client({connectionString:adminUrl.toString()});
await admin.connect();
let disconnect:(()=>Promise<void>)|undefined;
let created=false;
try{
 await admin.query(`CREATE DATABASE "${name}"`);created=true;
 const testUrl=new URL(adminUrl);testUrl.pathname="/"+name;process.env.DATABASE_URL=testUrl.toString();
 const setup=spawnSync(process.execPath,["node_modules/prisma/build/index.js","db","push","--accept-data-loss"],{env:process.env,encoding:"utf8",timeout:120000});
 if(setup.status!==0)throw new Error("Disposable local schema setup failed.");
 const {db}=await import("../lib/db");disconnect=()=>db.$disconnect();
 const {confirmMuseumPhysicalLocations,readMuseumPhysicalLocations,undoMuseumPhysicalCheck}=await import("../lib/museum-physical-locations");
 const {northernGuideContext}=await import("../lib/spn-northern-guide");
 const {v20ComponentSourceIds}=await import("../lib/museum-component-clearance-domain");
 const actor=await db.user.create({data:{email:"component-test@example.invalid",roles:["curator"]}});
 const rows=[...v20ComponentSourceIds,...Array.from({length:14},(_,n)=>"local-component-test-"+n)].map(sourceId=>({
   sourceId,name:sourceId,saintId:null,sourceReported:{kind:"vitrine" as const,code:"20",label:"Vitrine 20",shelf:"A"},
   destination:null,holdReason:"",fixedHousing:false}));
 const loader=async()=>({proposalVersion:"local-component-test",title:"Local test",vitrineCodes:["20"],
   guidance:{version:"local-test",reviewStatus:"disposable"},rows});
 const before=await readMuseumPhysicalLocations(loader);
 const body={museumId:"museum-spn",clientRequestId:randomUUID(),confirmedDate:"2026-10-30",datePrecision:"date",
   evidence:"Disposable local database component-clearance verification",physicalConfirmation:true,inventoryAcknowledged:true,
   initialCaseClearAcknowledged:true,clearedVitrines:["20"],guideContext:northernGuideContext,
   records:before.rows.map(row=>({sourceId:row.sourceId,saintId:row.saintId,expectedCurrentRevision:row.currentRevision,
     expectedSourceRevision:row.sourceRevision,expectedLocationVersion:row.currentVersion,to:{kind:"table",code:"staging-area",label:"Staging area"}}))};
 await assert.rejects(confirmMuseumPhysicalLocations(body,{id:actor.id,canManage:true},loader),/stick housing/);
 assert.equal(await db.museumMoveCurrentLocation.count(),0);assert.equal(await db.auditEvent.count(),0);
 const accepted={...body,componentStagingAcknowledgements:v20ComponentSourceIds.map(sourceId=>({sourceId,
   scope:"vitrine_20_contents_only",allOriginPiecesStaged:true,walkingSticksNotInVitrine:true}))};
 const result=await confirmMuseumPhysicalLocations(accepted,{id:actor.id,canManage:true},loader);
 assert.equal(await db.museumMoveCurrentLocation.count(),14);
 assert.equal(await db.museumMoveCurrentLocation.count({where:{sourceId:{in:[...v20ComponentSourceIds]}}}),0);
 const receipt=result.receipt?.afterJson as {moves:unknown[];componentMoves:unknown[]};
 assert.equal(receipt.moves.length,14);assert.equal(receipt.componentMoves.length,2);
 assert.equal(result.rows.filter(row=>row.current?.code==="staging-area").length,14);
 assert.equal(result.rows.filter(row=>row.componentPlacement?.location.code==="staging-area").length,2);
 assert.equal(result.phaseClearances.filter(row=>row.vitrine==="20").length,1);
 const replay=await confirmMuseumPhysicalLocations(accepted,{id:actor.id,canManage:true},loader);assert.equal(replay.replayed,true);
 assert.equal(await db.auditEvent.count(),1);
 const partial=result.rows.find(row=>row.sourceId===v20ComponentSourceIds[0])!;
 const record={sourceId:partial.sourceId,saintId:partial.saintId,expectedCurrentRevision:partial.currentRevision,
   expectedSourceRevision:partial.sourceRevision,expectedLocationVersion:partial.currentVersion};
 await assert.rejects(confirmMuseumPhysicalLocations({...body,clientRequestId:randomUUID(),guideContext:undefined,
   clearedVitrines:undefined,records:[{...record,to:{kind:"vitrine",code:"20",label:"Vitrine 20"}}]},
   {id:actor.id,canManage:true},loader),/stick housing/);
 const corrected=await undoMuseumPhysicalCheck({action:"undo",museumId:"museum-spn",clientRequestId:randomUUID(),
   receiptId:partial.componentPlacement!.receiptId,...record,mistakenCheckAcknowledged:true},{id:actor.id,canManage:true},loader);
 assert.equal(corrected.phaseClearances.filter(row=>row.vitrine==="20").length,0);
 assert.equal(corrected.rows.find(row=>row.sourceId===partial.sourceId)?.current?.code,"20");
 assert.equal(await db.museumMoveCurrentLocation.count(),14);
 console.log("PASS: real local PostgreSQL atomic rollback, 14 whole-source + 2 component records, unchanged held ledgers, replay, display hold, and audited correction.");
}finally{
 await disconnect?.();
 if(created)await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);
 await admin.end();
}
