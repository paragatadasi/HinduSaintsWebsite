import test from "node:test";
import assert from "node:assert/strict";
import {projectCompanionAdditions} from "./museum-companion-addition-projection";
import type {StarterMoveGuide,GuideEntry} from "./spn-move-guide";
const entry:GuideEntry={sourceId:"extra",saintId:"saint",name:"Extra saint",tier:"Secondary",city:"City",relicDescription:"Relic",destination:"",section:"Section",family:"",rationale:""};
const base=(code:string):StarterMoveGuide=>({version:"v1",contentDigest:"digest",proposalVersion:"proposal",assignmentDigest:"assignments",title:"Guide",entries:[],vitrines:[{code,summary:"",families:[],cityGroups:[]}],alternatives:[],reportedPlacements:[]});
const addition={sourceId:"extra",saintId:"saint",sourceRevision:"revision",vitrine:"73",shelf:null,version:1,updatedAt:"2026-10-29T12:00:00Z",clientRequestId:"id"};

test("regional case pending removes stale guide membership while preserving physical reports",()=>{
 const guide=base("82");
 const other={...entry,sourceId:"other"};
 guide.entries=[entry,other];
 const group={id:"group",title:"Group",sourceIds:["extra","other"],rationale:"",suggestedVitrines:["82"]};
 guide.vitrines[0].families=[group];guide.vitrines[0].cityGroups=[group];guide.alternatives=[group];
 guide.reportedPlacements=[{sourceId:"extra",destination:"82",date:"2026-10-31"}];
 const before=JSON.stringify(guide);
 const proposalTransfer={version:"v1",sourceId:"extra",state:"approved_case_pending" as const,region:"South",cohort:"Andhra",label:"South / Andhra · case pending",reason:"Approved",approvedDate:"2026-10-31",supersededDestination:"82"};
 const result=projectCompanionAdditions({starter:guide},[],[{...entry,proposalTransfer},other]).starter;
 assert.deepEqual(result.entries.map(e=>e.sourceId),["other"]);
 for(const retained of [result.vitrines[0].families[0],result.vitrines[0].cityGroups[0],result.alternatives[0]])assert.deepEqual(retained.sourceIds,["other"]);
 assert.deepEqual(result.reportedPlacements,guide.reportedPlacements);
 assert.equal(result.contentDigest,guide.contentDigest);
 assert.equal(JSON.stringify(guide),before);
});
test("outside-phase source joins only its receiving guide without mutating frozen data",()=>{
 const guides={starter:base("2"),east:base("73")};const result=projectCompanionAdditions(guides,[addition],[entry]);
 assert.deepEqual(result.east.vitrines[0].cityGroups[0].sourceIds,["extra"]);assert.equal(result.east.entries[0].destination,"73");assert.equal(result.starter.entries.length,0);assert.equal(guides.east.entries.length,0);assert.equal(result.east.contentDigest,"digest");
});
test("a new destination removes prior guide membership and repeats do not duplicate",()=>{
 const old=base("2");old.entries=[entry];old.vitrines[0].families=[{id:"family",title:"Family",sourceIds:["extra"],rationale:"",suggestedVitrines:["2"]}];
 const result=projectCompanionAdditions({starter:old,east:base("73")},[addition],[entry]);assert.equal(result.starter.vitrines[0].families.length,0);
 const again=projectCompanionAdditions(result,[addition],[entry]);assert.deepEqual(again.east.vitrines[0].cityGroups[0].sourceIds,["extra"]);
});
test("destination with no ready phase does not invent a guide",()=>{
 const result=projectCompanionAdditions({starter:base("2")},[addition],[entry]);assert.equal(result.starter.vitrines.length,1);assert.equal(result.starter.entries.length,0);
});

import overlay from "../data/museum/spn-approved-proposal-overlay-v1.json";
import {buildLatestSpnReview} from "./spn-reviewed-proposal";
test("curator addition appears in the overall proposal and removes the pending receiver hold",()=>{
 const before=buildLatestSpnReview([]);
 const pending=before.proposal.pendingPlacements.find(row=>overlay.pendingReceiverSourceIds.includes(row.sourceId));
 assert.ok(pending);
 const after=buildLatestSpnReview([],[{sourceId:pending.sourceId,vitrine:"73",shelf:null}]);
 assert.equal(after.rows.find(row=>row.sourceId===pending.sourceId)?.effectiveVitrine,"73");
 assert.equal(after.proposal.pendingPlacements.some(row=>row.sourceId===pending.sourceId),false);
});
test("a private holding remains excluded from the overall proposal",()=>{
 const held=overlay.excludedFromMuseumDisplay[0];assert.ok(held);
 const after=buildLatestSpnReview([],[{sourceId:held.sourceId,vitrine:"73",shelf:null}]);
 assert.equal(after.rows.some(row=>row.sourceId===held.sourceId),false);
});

import {currentCompanionAdditions} from "./museum-companion-addition-validation";
test("removed and changed source additions are ignored while current additions survive",()=>{
 const valid={sourceId:"extra",saintId:"saint",sourceRevision:"revision",identityChanged:false};
 const result=currentCompanionAdditions([addition,{...addition,sourceId:"removed"},{...addition,sourceId:"changed"}],[valid,{...valid,sourceId:"changed",sourceRevision:"new revision"}]);
 assert.deepEqual(result,[addition]);
});

test("starter destination wins over a northern receiving stub regardless of insertion order",()=>{
 const north=base("36");north.entries=[{...entry,destination:"36"}];north.vitrines[0].cityGroups=[{id:"transfer",title:"Transfer",sourceIds:[entry.sourceId],rationale:"",suggestedVitrines:["36"]}];
 const starter=base("36");
 const original=JSON.stringify(north);
 const result=projectCompanionAdditions({north,starter},[{...addition,vitrine:"36"}],[entry]);
 assert.deepEqual(result.starter.vitrines[0].cityGroups[0].sourceIds,[entry.sourceId]);
 assert.equal(result.north.vitrines.length,0);
 assert.equal(JSON.stringify(north),original);
 const again=projectCompanionAdditions(result,[{...addition,vitrine:"36"}],[entry]);
 assert.deepEqual(again.starter.vitrines[0].cityGroups[0].sourceIds,[entry.sourceId]);
});

test("catalog additions preserve explicit and deliberately suppressed life status",()=>{
 for(const tag of ["Still alive","May be alive",null]){
  const lifeStatus={tag,basis:"Current evidence"};
  const result=projectCompanionAdditions({starter:base("73")},[addition],[{...entry,lifeStatus}]);
  assert.deepEqual(result.starter.entries[0].lifeStatus,lifeStatus);
 }
});

test("Vraj remainder owns its cases without borrowing the original phase or a receiving stub",()=>{
 const guides={north:base("32"),vraj:base("79"),vraj2:base("32")};
 const result=projectCompanionAdditions(guides,[{...addition,vitrine:"32"}],[entry]);
 assert.deepEqual(result.vraj2.vitrines[0].cityGroups[0].sourceIds,[entry.sourceId]);
 assert.equal(result.north.entries.length,0);
 assert.equal(result.vraj.entries.length,0);
 assert.equal(result.vraj.contentDigest,guides.vraj.contentDigest);
 assert.equal(result.vraj2.entries[0].destination,"32");
});

test("East remainder receives additions without duplicating the existing Eastern phase",()=>{
 const guides={north:base("26"),"gosaiji-sai":base("37"),east2:base("26")};
 const result=projectCompanionAdditions(guides,[{...addition,vitrine:"26"}],[entry]);
 assert.deepEqual(result.east2.vitrines[0].cityGroups[0].sourceIds,[entry.sourceId]);
 assert.equal(result.north.entries.length,0);
 assert.equal(result["gosaiji-sai"].entries.length,0);
 assert.equal(result["gosaiji-sai"].contentDigest,guides["gosaiji-sai"].contentDigest);
});
