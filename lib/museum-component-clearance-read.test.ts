import test from "node:test";
import assert from "node:assert/strict";
import { readPhysicalLocationView, readMuseumPhaseClearances } from "./museum-physical-locations";
import { v20ComponentSourceIds,v19ComponentBinding,v42ComponentBinding,componentScopeForOrigin } from "./museum-component-clearance-domain";

for(const [sourceId,code] of [[v20ComponentSourceIds[0],"20"],[v19ComponentBinding.sourceId,"19"],[v42ComponentBinding.sourceId,"42"]])test(`V${code} component receipt projects staged parts without a whole-source ledger row; correcting it revokes clearance`,async()=>{
 const origin={kind:"vitrine" as const,code,label:`Vitrine ${code}`,shelf:"A"},scope=componentScopeForOrigin(code)!;
 const snapshot={proposalVersion:"test",title:"test",vitrineCodes:[code],guidance:{version:"test",reviewStatus:"test"},
   rows:[{sourceId,sourceKey:"source:key",name:"Held display",saintId:"saint",sourceReported:origin,destination:null,holdReason:"",fixedHousing:false}]};
 let events: {id:string;createdAt:Date;afterJson:unknown}[]=[],corrections: {afterJson:unknown}[]=[];
 const tx={museumMoveCurrentLocation:{findMany:async()=>[]},externalRecord:{findMany:async()=>[{externalId:"source:key",entityType:"Saint",entityId:"saint"}]},
   auditEvent:{findMany:async(args:{where:{action:string}})=>args.where.action==="museum.physical_location.check_undone"?corrections:events}};
 const loader=async()=>snapshot;
 const initial=await readPhysicalLocationView(loader,tx as never,[sourceId],false);
 const before=initial.rows[0];assert.equal(before.current?.code,code);
 events=[{id:"receipt",createdAt:new Date("2026-10-30T12:00:00Z"),afterJson:{museumId:"museum-spn",scope:"source_observation_with_components",
   guideContext:{guideVersion:"guide"},clearedVitrines:[code],componentMoves:[{sourceId,scope,origin,
     location:{kind:"table",code:"staging-area",label:"Staging area"},revision:"new-component-revision",expectedSourceRevision:before.sourceRevision,
     previousCurrentRevision:before.currentRevision,previousLocationVersion:0}]}}];
 const partial=await readPhysicalLocationView(loader,tx as never,[sourceId],false);
 const row=partial.rows[0];assert.equal(row.current,null);assert.equal(row.currentConfirmed,null);
 assert.deepEqual(row.original,origin);assert.equal(row.currentVersion,0);
 assert.equal(row.componentPlacement?.location.code,"staging-area");assert.equal(row.componentPlacement?.excludedWalkingSticks.location,null);
 assert.ok(row.movementBlockedReason);assert.equal(row.undo.available,true);
 assert.equal((await readMuseumPhaseClearances(tx as never,loader)).length,1);
 snapshot.rows[0].sourceReported={...origin,shelf:"B"};
 assert.equal((await readMuseumPhaseClearances(tx as never,loader)).length,0,"stale component evidence cannot keep a case ready");
 snapshot.rows[0].sourceReported=origin;
 corrections=[{afterJson:{museumId:"museum-spn",sourceId,targetReceiptId:"receipt",scope}}];
 const restored=await readPhysicalLocationView(loader,tx as never,[sourceId],false);
 assert.equal(restored.rows[0].componentPlacement,null);assert.equal(restored.rows[0].current?.code,code);
 assert.equal((await readMuseumPhaseClearances(tx as never,loader)).length,0);
});


test("ordinary selected sources skip unrelated component reads; full views retain them",async()=>{
 let reads=0;
 const tx={museumMoveCurrentLocation:{findMany:async()=>[]},externalRecord:{findMany:async()=>[]},auditEvent:{findMany:async()=>{reads++;return [];}}};
 const row=(sourceId:string)=>({sourceId,name:sourceId,saintId:null,sourceReported:null,destination:null,holdReason:"",fixedHousing:false});
 const loader=async()=>({proposalVersion:"test",title:"test",vitrineCodes:[],guidance:{version:"test",reviewStatus:"test"},rows:[row("ordinary"),row(v20ComponentSourceIds[0])]});
 const ordinary=await readPhysicalLocationView(loader,tx as never,["ordinary"],false);
 assert.equal(reads,0);assert.equal(ordinary.rows.length,1);assert.equal(ordinary.rows[0].componentPlacement,null);
 await readPhysicalLocationView(loader,tx as never,undefined,false);
 assert.equal(reads,2);
});

test("clearance reads share corrections within a call but fetch fresh corrections on the next call",async()=>{
 let corrections=0,receipts=0;
 const tx={auditEvent:{findMany:async(args:{where:{action:string}})=>{if(args.where.action==="museum.physical_location.check_undone")corrections++;else receipts++;return [];}}};
 await readMuseumPhaseClearances(tx as never);
 assert.equal(corrections,1);assert.equal(receipts,2);
 await readMuseumPhaseClearances(tx as never);
 assert.equal(corrections,2);assert.equal(receipts,4);
});
