import test from "node:test";
import assert from "node:assert/strict";
import { readPhysicalLocationView, readMuseumPhaseClearances } from "./museum-physical-locations";
import { v20ComponentSourceIds } from "./museum-component-clearance-domain";

test("component receipt projects staged parts without a whole-source ledger row; correcting it revokes clearance",async()=>{
 const sourceId=v20ComponentSourceIds[0],origin={kind:"vitrine" as const,code:"20",label:"Vitrine 20",shelf:"A"};
 const snapshot={proposalVersion:"test",title:"test",vitrineCodes:["20"],guidance:{version:"test",reviewStatus:"test"},
   rows:[{sourceId,sourceKey:"source:key",name:"Held display",saintId:"saint",sourceReported:origin,destination:null,holdReason:"",fixedHousing:false}]};
 let events: {id:string;createdAt:Date;afterJson:unknown}[]=[],corrections: {afterJson:unknown}[]=[];
 const tx={museumMoveCurrentLocation:{findMany:async()=>[]},externalRecord:{findMany:async()=>[{externalId:"source:key",entityType:"Saint",entityId:"saint"}]},
   auditEvent:{findMany:async(args:{where:{action:string}})=>args.where.action==="museum.physical_location.check_undone"?corrections:events}};
 const loader=async()=>snapshot;
 const initial=await readPhysicalLocationView(loader,tx as never,[sourceId],false);
 const before=initial.rows[0];assert.equal(before.current?.code,"20");
 events=[{id:"receipt",createdAt:new Date("2026-10-30T12:00:00Z"),afterJson:{museumId:"museum-spn",scope:"source_observation_with_components",
   guideContext:{guideVersion:"guide"},clearedVitrines:["20"],componentMoves:[{sourceId,scope:"vitrine_20_contents_only",origin,
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
 corrections=[{afterJson:{museumId:"museum-spn",sourceId,targetReceiptId:"receipt",scope:"vitrine_20_contents_only"}}];
 const restored=await readPhysicalLocationView(loader,tx as never,[sourceId],false);
 assert.equal(restored.rows[0].componentPlacement,null);assert.equal(restored.rows[0].current?.code,"20");
 assert.equal((await readMuseumPhaseClearances(tx as never,loader)).length,0);
});

