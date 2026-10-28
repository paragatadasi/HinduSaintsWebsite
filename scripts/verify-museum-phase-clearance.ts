import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {pathToFileURL} from "node:url";
import {join,resolve} from "node:path";
async function main(){
 const url=new URL(process.env.DATABASE_URL??"");assert.equal(url.hostname,"127.0.0.1");assert.equal(url.port,"55438");assert.equal(url.pathname,"/museum_test");
 const root=resolve(process.env.MUSEUM_PHASE_TEST_WORKTREE??process.cwd());
 const {db}=await import(pathToFileURL(join(root,"lib/db.ts")).href);
 const {confirmMuseumPhysicalLocations,readPhysicalLocationView,readMuseumPhaseClearances}=await import(pathToFileURL(join(root,"lib/museum-physical-locations.ts")).href);
 const {gosaijiSaiGuideContext:guideContext,gosaijiSaiMoveGuide:guide}=await import(pathToFileURL(join(root,"lib/spn-gosaiji-sai-guide.ts")).href);
 try{
 for(const sql of [
  'CREATE TABLE "AuditEvent" (id text PRIMARY KEY,"userId" text,action text NOT NULL,"entityType" text NOT NULL,"entityId" text NOT NULL,"beforeJson" jsonb,"afterJson" jsonb,"createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)',
  'CREATE TABLE "ExternalRecord" (id text PRIMARY KEY,"sourceType" text,"externalId" text,"entityType" text,"entityId" text)',
  'CREATE TABLE "MuseumMoveCurrentLocation" ("museumId" text,"sourceId" text,location jsonb,version int,"confirmedAt" timestamp(3),"confirmedById" text,PRIMARY KEY("museumId","sourceId"))'
 ])await db.$executeRawUnsafe(sql);
 const core37=guide.entries.find((r:{destination:string})=>r.destination==="37"),core4=guide.entries.find((r:{destination:string})=>r.destination==="4");
 const outgoing=Array.from({length:22},(_,i)=>({sourceId:`outgoing-${i}`,sourceKey:`test:outgoing:${i}`,saintId:`person-${i}`,name:`Outgoing ${i}`,sourceReported:{kind:"vitrine",code:"37",label:"Vitrine 37",shelf:"A"},destination:{kind:"vitrine",code:"62",label:"Vitrine 62"},holdReason:"",fixedHousing:false}));
 const incoming=[core37,core4].map((r:{sourceId:string;saintId:string|null;name:string;destination:string})=>({sourceId:r.sourceId,sourceKey:`test:${r.sourceId}`,saintId:r.saintId,name:r.name,sourceReported:{kind:"vitrine",code:"26",label:"Vitrine 26",shelf:"B"},destination:{kind:"vitrine",code:r.destination,label:`Vitrine ${r.destination}`},holdReason:"",fixedHousing:false}));
 const rows=[...outgoing,...incoming];
 const loader=async()=>({proposalVersion:"test",title:"Test",vitrineCodes:["37","4","26","62"],guidance:{version:"test",reviewStatus:"test"},rows});
 for(const [i,row] of rows.entries())await db.$executeRaw`INSERT INTO "ExternalRecord" VALUES (${`external-${i}`},'airtable',${row.sourceKey},'Saint',${row.saintId})`;
 // A confirmed returnee must be included, not accidentally protected from this explicit first clear.
 await db.museumMoveCurrentLocation.create({data:{museumId:"museum-spn",sourceId:outgoing[0].sourceId,location:outgoing[0].sourceReported,version:1,confirmedAt:new Date("2026-10-27T10:00:00Z"),confirmedById:"actor"}});
 const read=()=>readPhysicalLocationView(loader,db,undefined,false);
 const record=(row:any,to:any)=>({sourceId:row.sourceId,saintId:row.saintId,expectedCurrentRevision:row.currentRevision,expectedSourceRevision:row.sourceRevision,expectedLocationVersion:row.currentVersion,to});
 const common={museumId:"museum-spn",confirmedDate:"2026-10-28",datePrecision:"date",evidence:"Disposable local test",physicalConfirmation:true,inventoryAcknowledged:true,guideContext};
 let state=await read();
 for(const incomingRow of incoming)await assert.rejects(confirmMuseumPhysicalLocations({...common,clientRequestId:randomUUID(),records:[record(state.rows.find((r:any)=>r.sourceId===incomingRow.sourceId),incomingRow.destination)]},{id:"actor",canManage:true},loader),/initial vitrine clearing/);
 const stage={kind:"table",code:"staging-area",label:"Staging area"};
 const clear={...common,clientRequestId:randomUUID(),initialCaseClearAcknowledged:true,clearedVitrines:["37"],records:state.rows.filter((r:any)=>r.current?.code==="37").map((r:any)=>record(r,stage))};
 await assert.rejects(confirmMuseumPhysicalLocations({...clear,records:clear.records.slice(1)},{id:"actor",canManage:true},loader),/whole-vitrine clear/);
 assert.equal((await read()).rows.filter((r:any)=>r.current?.code==="37").length,22);
 await assert.rejects(confirmMuseumPhysicalLocations({...clear,records:[...clear.records,record(state.rows.find((r:any)=>r.sourceId===incoming[0].sourceId),stage)]},{id:"actor",canManage:true},loader),/only the current occupants/);
 const saved=await confirmMuseumPhysicalLocations(clear,{id:"actor",canManage:true},loader);
 assert.equal(saved.rows.filter((r:any)=>r.current?.code==="staging-area").length,22);
 assert.equal((await readMuseumPhaseClearances()).filter((r:any)=>r.guideVersion===guideContext.guideVersion&&r.vitrine==="37").length,1);
 assert.equal((await confirmMuseumPhysicalLocations(clear,{id:"actor",canManage:true},loader)).replayed,true);
 state=await read();
 const next=incoming[0];const placed=await confirmMuseumPhysicalLocations({...common,clientRequestId:randomUUID(),records:[record(state.rows.find((r:any)=>r.sourceId===next.sourceId),next.destination)]},{id:"actor",canManage:true},loader);
 assert.equal(placed.rows[0].current.code,"37");
 await assert.rejects(confirmMuseumPhysicalLocations({...clear,clientRequestId:randomUUID()},{id:"actor",canManage:true},loader),/already recorded its initial clearing/);
 assert.equal((await read()).rows.filter((r:any)=>r.current?.code==="staging-area").length,22);
 console.log("PASS: both-case preclear gate, incomplete22 rollback, extra-source reject, confirmed returnee clear, UUID retry, postclear placement and repeatclear rejection");
 }finally{await db.$disconnect();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
