import test from "node:test";
import assert from "node:assert/strict";
import packet from "../data/museum/spn-west40-44-guide-v2.json";
import {west40To44GuideContext,west40To44GuideDefinition,west40To44MoveGuide,projectWest40To44Guide,assertWest40To44Records} from "./spn-west40-44-guide";
import {readStarterGuideDefinition,currentReceiverGuideDefinitions} from "./spn-starter-guide-registry";
import {assertGuidePhysicalScope} from "./spn-datta-guide";
import type {CompanionRow,PhysicalState} from "./spn-move-guide";
function fixture(){
 const rows:CompanionRow[]=packet.rows.map(row=>({sourceId:row.sourceId,saintId:row.saintId,name:row.name,original:{kind:"vitrine",code:"49",label:"Vitrine 49",shelf:"C"},current:{kind:"table",code:"staging-area",label:"Staging area"},currentBasis:"confirmed",currentVersion:2,currentRevision:"live",sourceRevision:row.sourceRevision,fixedHousing:false,verifiedItemIds:[],identityChanged:false}));
 const physical:PhysicalState={rows,unmappedCurrentLocations:[]};
 const review={rows:rows.map(row=>({sourceId:row.sourceId,saintId:row.saintId,effectiveVitrine:packet.rows.find(r=>r.sourceId===row.sourceId)!.destination,reviewReason:""})),proposal:{pendingPlacements:[] as {sourceId:string;reason:string}[]}};
 return {physical,review};
}
test("the approved 112 sources register all five receivers with full clearing",()=>{
 assert.equal(west40To44MoveGuide.entries.length,112);
 assert.deepEqual(west40To44MoveGuide.vitrines.map(v=>v.code),["40","41","42","43","44"]);
 assert.deepEqual(["40","41","42","43","44"].map(code=>packet.rows.filter(r=>r.destination===code).length),[21,26,21,24,20]);
 assert.equal(new Set(packet.groups.flatMap(g=>g.sourceIds)).size,112);
 assert.equal(readStarterGuideDefinition(west40To44GuideContext.guideVersion),west40To44GuideDefinition);
 for(const code of ["40","41","42","43","44"]){
  assert.ok(currentReceiverGuideDefinitions(code).includes(west40To44GuideDefinition));
  assertGuidePhysicalScope(west40To44GuideDefinition,[],[code]);
 }
 assert.equal(west40To44MoveGuide.optionalClearVitrines,undefined);
 assert.deepEqual(west40To44MoveGuide.reportedPlacements,[]);
 assert.throws(()=>assertGuidePhysicalScope(west40To44GuideDefinition,[],["47"]));
 assert.ok(packet.rows.some(r=>r.sourceId==="receCbIjIoMadEX8E"&&r.movementBlockedReason));
});
test("live origins and later destinations supersede captured recommendations",()=>{
 const {physical,review}=fixture();physical.rows[0].current=null;physical.rows[0].currentBasis="unknown";
 const before=JSON.stringify(physical);let guide=projectWest40To44Guide([],physical,review);
 assert.equal(guide.entries[0].currentLocation,null);assert.equal(guide.entries[1].currentLocation?.kind,"table");
 assertWest40To44Records([{sourceId:guide.entries[1].sourceId,to:{kind:"vitrine",code:"43"}}],guide);
 assert.throws(()=>assertWest40To44Records([{sourceId:guide.entries[1].sourceId,to:{kind:"vitrine",code:"43",shelf:"2"}}],guide),/shelf workflow/);
 review.rows[0].effectiveVitrine="3";guide=projectWest40To44Guide([],physical,review);
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
 const guide=projectWest40To44Guide([],physical,review);
 assert.throws(()=>assertWest40To44Records([{sourceId:row.sourceId,to:{kind:"vitrine",code:"43"}}],guide));
 }
});


import {projectCompanionAdditions} from "./museum-companion-addition-projection";
import {bimalAssemblyReview} from "./spn-bimal-reviewed-assembly";
test("held candidates remain visible across native additions without overwriting actual destinations",()=>{
 const {physical,review}=fixture();
 const sukhdev="receCbIjIoMadEX8E",bimal=bimalAssemblyReview.sourceId;
 review.rows.find(r=>r.sourceId===sukhdev)!.effectiveVitrine="39";
 review.rows.find(r=>r.sourceId===bimal)!.effectiveVitrine="81";
 const before=JSON.stringify(physical);
 const guide=projectWest40To44Guide([],physical,review);
 for(const id of [sukhdev,bimal]){
  const entry=guide.entries.find(e=>e.sourceId===id)!;
  assert.equal(entry.reviewOnly,true);assert.ok(entry.movementBlockedReason);
  assert.throws(()=>assertWest40To44Records([{sourceId:id,to:{kind:"vitrine",code:entry.destination}}],guide));
 }
 const additions=[{sourceId:sukhdev,vitrine:"39"},{sourceId:bimal,vitrine:"81"}] as Parameters<typeof projectCompanionAdditions>[1];
 const projected=projectCompanionAdditions({"west40-44":guide},additions,guide.entries)["west40-44"];
 for(const id of [sukhdev,bimal]){
  const entry=projected.entries.find(e=>e.sourceId===id)!;assert.equal(entry.reviewOnly,true);
  assert.equal(entry.destination,id===sukhdev?"44":"40");
  assert.ok(projected.vitrines.flatMap(v=>[...v.families,...v.cityGroups]).some(g=>g.sourceIds.includes(id)));
 }
 assert.equal(JSON.stringify(physical),before);
});
test("Bimal requires reviewed housing and saved40 before becoming actionable",()=>{
 const {physical,review}=fixture();const row=physical.rows.find(r=>r.sourceId===bimalAssemblyReview.sourceId)!;
 row.housingEvidenceRevision=bimalAssemblyReview.housingEvidenceRevision;
 const guide=projectWest40To44Guide([],physical,review);
 const entry=guide.entries.find(e=>e.sourceId===row.sourceId)!;
 assert.equal(entry.reviewOnly,undefined);assert.equal(entry.movementBlockedReason,undefined);
 assertWest40To44Records([{sourceId:row.sourceId,to:{kind:"vitrine",code:"40"}}],guide);
 row.housingEvidenceRevision="changed";
 assert.ok(projectWest40To44Guide([],physical,review).entries.find(e=>e.sourceId===row.sourceId)?.reviewOnly);
});
test("headline groups preserve exact source membership and do not invent tree edges",()=>{
 assert.equal(packet.groups.find(g=>g.title.includes("Mekan Dada"))?.sourceIds.length,2);
 assert.equal(packet.groups.find(g=>g.title.includes("Brahma Kumaris"))?.sourceIds.length,10);
 assert.equal(packet.groups.find(g=>g.title.includes("Dadu Dayal"))?.sourceIds.length,2);
 assert.equal(packet.groups.find(g=>g.title.includes("Ramdev Pir"))?.sourceIds.length,2);
 assert.ok(packet.groups.every(g=>g.edges.length===0));
});


test("updated receivers preserve the original 42 cohort and historical clearing",async()=>{
 const old=(await import("../data/museum/spn-west40-44-guide-v1.json")).default;
 const original42=old.rows.filter(row=>row.destination==="42").map(row=>row.sourceId);
 const current42=packet.rows.filter(row=>row.destination==="42").map(row=>row.sourceId);
 assert.deepEqual([...current42].sort(),[...original42,"recrC9U16Vn5vP9Fn","recmGHWXiRWRyqNCz"].sort());
 for(const target of ["43","44"]){assert.deepEqual(packet.rows.filter(r=>r.destination===target).map(r=>r.sourceId).sort(),old.rows.filter(r=>r.destination===(target==="43"?"44":"43")).map(r=>r.sourceId).sort());}
 assert.equal(readStarterGuideDefinition(old.version).readOnly,true);
 assert.ok(west40To44GuideDefinition.physicalScope?.previousClearanceVersions?.includes(old.version));
});
