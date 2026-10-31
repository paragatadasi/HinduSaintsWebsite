import test from "node:test";
import assert from "node:assert/strict";
import packet from "../data/museum/spn-junagadh-saurashtra-guide-v1.json";
import {junagadhGuideContext,junagadhGuideDefinition,junagadhMoveGuide,projectJunagadhGuide,assertJunagadhRecords} from "./spn-junagadh-guide";
import {readStarterGuideDefinition,currentReceiverGuideDefinitions} from "./spn-starter-guide-registry";
import {assertGuidePhysicalScope} from "./spn-datta-guide";
import type {CompanionRow,PhysicalState} from "./spn-move-guide";
function fixture(){
 const rows:CompanionRow[]=packet.rows.map(row=>({sourceId:row.sourceId,saintId:row.saintId,name:row.name,original:{kind:"vitrine",code:"49",label:"Vitrine 49",shelf:"C"},current:{kind:"table",code:"staging-area",label:"Staging area"},currentBasis:"confirmed",currentVersion:2,currentRevision:"live",sourceRevision:row.sourceRevision,fixedHousing:false,verifiedItemIds:[],identityChanged:false}));
 const physical:PhysicalState={rows,unmappedCurrentLocations:[]};
 const review={rows:rows.map(row=>({sourceId:row.sourceId,saintId:row.saintId,effectiveVitrine:packet.rows.find(r=>r.sourceId===row.sourceId)!.destination,reviewReason:""})),proposal:{pendingPlacements:[] as {sourceId:string;reason:string}[]}};
 return {physical,review};
}
test("the approved 70 sources register all four receivers with full clearing",()=>{
 assert.equal(junagadhMoveGuide.entries.length,70);
 assert.deepEqual(junagadhMoveGuide.vitrines.map(v=>v.code),["48","49","50","39"]);
 assert.deepEqual(["48","49","50","39"].map(code=>packet.rows.filter(r=>r.destination===code).length),[18,22,17,13]);
 assert.equal(new Set(packet.groups.flatMap(g=>g.sourceIds)).size,70);
 assert.equal(readStarterGuideDefinition(junagadhGuideContext.guideVersion),junagadhGuideDefinition);
 for(const code of ["48","49","50","39"]){
  assert.ok(currentReceiverGuideDefinitions(code).includes(junagadhGuideDefinition));
  assertGuidePhysicalScope(junagadhGuideDefinition,[],[code]);
 }
 assert.equal(junagadhMoveGuide.optionalClearVitrines,undefined);
 assert.deepEqual(junagadhMoveGuide.reportedPlacements,[]);
 assert.throws(()=>assertGuidePhysicalScope(junagadhGuideDefinition,[],["47"]));
 assert.equal(packet.rows.filter(r=>r.movementBlockedReason).length,2);
});
test("live origins and later destinations supersede captured recommendations",()=>{
 const {physical,review}=fixture();physical.rows[0].current=null;physical.rows[0].currentBasis="unknown";
 const before=JSON.stringify(physical);let guide=projectJunagadhGuide([],physical,review);
 assert.equal(guide.entries[0].currentLocation,null);assert.equal(guide.entries[1].currentLocation?.kind,"table");
 assertJunagadhRecords([{sourceId:guide.entries[1].sourceId,to:{kind:"vitrine",code:"48"}}],guide);
 assert.throws(()=>assertJunagadhRecords([{sourceId:guide.entries[1].sourceId,to:{kind:"vitrine",code:"48",shelf:"2"}}],guide),/shelf workflow/);
 review.rows[0].effectiveVitrine="3";guide=projectJunagadhGuide([],physical,review);
 assert.ok(!guide.entries.some(e=>e.sourceId===physical.rows[0].sourceId));assert.equal(guide.outgoingDependencies?.[0].proposedDestination,"3");
 assert.equal(JSON.stringify(physical),before);
});
test("changed evidence, identity, pending review and item restrictions block stale actions",()=>{
 for(const change of ["revision","identity","pending","fixed","item","review"]){
 const {physical,review}=fixture();const row=physical.rows[0];
 if(change==="revision")row.sourceRevision="changed";
 if(change==="identity")row.saintId="different";
 if(change==="pending")review.proposal.pendingPlacements.push({sourceId:row.sourceId,reason:"Review needed"});
 if(change==="fixed")row.fixedHousing=true;
 if(change==="item")row.verifiedItemIds=["item"];
 if(change==="review")review.rows[0].reviewReason="Review needed";
 const guide=projectJunagadhGuide([],physical,review);
 assert.throws(()=>assertJunagadhRecords([{sourceId:row.sourceId,to:{kind:"vitrine",code:"48"}}],guide));
 }
});

test("V64 collection holds remain visible but cannot record a physical move",()=>{
 const {physical,review}=fixture();const guide=projectJunagadhGuide([],physical,review);
 for(const sourceId of ["recxuracQJPPryYKc","recBtymRccp1iFneW"]){
  assert.equal(guide.entries.find(e=>e.sourceId===sourceId)?.destination,"50");
  assert.match(guide.entries.find(e=>e.sourceId===sourceId)?.movementBlockedReason??"",/scoped object check/);
  assert.throws(()=>assertJunagadhRecords([{sourceId,to:{kind:"vitrine",code:"50"}}],guide));
 }
});

import shelves from "../data/museum/spn-junagadh-saurashtra-shelves-v1.json";
import {allOperationalSpnShelves} from "./spn-operational-shelves";
test("reviewed five-shelf guidance preserves identities, living positions and unknown size",()=>{
 const allocations=shelves.vitrines.flatMap(v=>v.allocations);
 assert.equal(allocations.length,70);
 assert.equal(new Set(allocations.map(a=>a.sourceId)).size,70);
 for(const vitrine of shelves.vitrines){
  assert.ok(allOperationalSpnShelves.vitrines.some(v=>v.code===vitrine.code));
  for(const allocation of vitrine.allocations){
   const entry=packet.rows.find(r=>r.sourceId===allocation.sourceId)!;
   assert.equal(entry.destination,vitrine.code);
   assert.equal(entry.saintId,allocation.saintId);
   assert.equal(entry.sourceRevision,allocation.sourceRevision);
   assert.ok(allocation.suggestedShelfIndex>=1&&allocation.suggestedShelfIndex<=5);
   if(entry.lifeStatus.tag)assert.ok(allocation.suggestedShelfIndex>=4);
  }
 }
 assert.equal(allocations.find(a=>a.sourceId==="recDTjEtD0aOMIAcd")?.knownFootprint,null);
 assert.equal(packet.rows.find(r=>r.sourceId==="recs0TaB50MQxIRlc")?.tier,"Tertiary");
 const shared=packet.groups.find(g=>g.title.includes("Godariya"))!;
 assert.equal(shared.sourceIds.length,5);
 assert.match(shared.rationale,/shared mala/);
 assert.equal(shared.edges.length,0);
 assert.equal(packet.groups.find(g=>g.title.includes("Bharti Ashram"))?.sourceIds.length,2);
 assert.equal(shelves.physicalWrites,false);
});
