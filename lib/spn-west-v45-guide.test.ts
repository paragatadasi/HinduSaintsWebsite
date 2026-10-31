import test from "node:test";
import assert from "node:assert/strict";
import packet from "../data/museum/spn-west-v45-guide-v1.json";
import {westV45GuideContext,westV45GuideDefinition,westV45MoveGuide,projectWestV45Guide,assertWestV45Records,westV45ContextAnchors} from "./spn-west-v45-guide";
import {readStarterGuideDefinition,currentReceiverGuideDefinitions} from "./spn-starter-guide-registry";
import {assertGuidePhysicalScope} from "./spn-datta-guide";
import type {CompanionRow,PhysicalState} from "./spn-move-guide";

function fixture(){
 const rows:CompanionRow[]=packet.rows.filter(row=>!row.anchorOnly).map(row=>({sourceId:row.sourceId,saintId:row.saintId,name:row.name,original:null,current:{kind:"table",code:"staging-area",label:"Staging area"},currentBasis:"confirmed",currentVersion:2,currentRevision:"live",sourceRevision:row.sourceRevision,fixedHousing:false,verifiedItemIds:[],identityChanged:false}));
 const physical:PhysicalState={rows,unmappedCurrentLocations:[]};
 const review={rows:rows.map(row=>({sourceId:row.sourceId,saintId:row.saintId,effectiveVitrine:"45",reviewReason:""})),proposal:{pendingPlacements:[] as {sourceId:string;reason:string}[]}};
 return {physical,review};
}
test("V45 registers the exact21holdings and a separate non-actionable anchor",()=>{
 assert.equal(packet.rows.length,22);assert.equal(westV45MoveGuide.entries.length,21);
 assert.equal(westV45MoveGuide.entries.filter(row=>row.saintId).length,19);
 const anchor=westV45ContextAnchors[0];assert.equal(anchor.sourceId,"recf7vlRhEe9AnHT8");assert.equal(westV45ContextAnchors.length,1);
 assert.ok(westV45GuideDefinition.suggestions.every(g=>!g.sourceIds.includes(anchor.sourceId)));
 assert.ok(westV45MoveGuide.vitrines.every(v=>[...v.families,...v.cityGroups].every(g=>!g.sourceIds.includes(anchor.sourceId))));
 assert.equal(westV45GuideDefinition.physicalScope?.destinations[anchor.sourceId],undefined);
 assert.equal(readStarterGuideDefinition(westV45GuideContext.guideVersion),westV45GuideDefinition);
 assert.ok(currentReceiverGuideDefinitions("45").includes(westV45GuideDefinition));
});
test("availability preparation does not authorize whole-case clearing or other destinations",()=>{
 assert.equal(westV45GuideDefinition.physicalScope?.allowClear,false);assert.deepEqual(westV45GuideDefinition.physicalScope?.preparationVitrines,["45"]);
 assert.throws(()=>assertGuidePhysicalScope(westV45GuideDefinition,[],["45"]),/does not clear/);
 assert.throws(()=>assertGuidePhysicalScope(westV45GuideDefinition,[{sourceId:westV45MoveGuide.entries[0].sourceId,to:{kind:"vitrine",code:"44"}}]),/locked phase/);
 assert.equal(westV45MoveGuide.reportedPlacements.length,0);
});
test("live physical origins and confirmations replace captured evidence without source mutations",()=>{
 const {physical,review}=fixture();const before=JSON.stringify(physical);
 const guide=projectWestV45Guide([],physical,review);
 assert.equal(guide.entries[0].currentLocation?.code,"staging-area");assert.equal(guide.entries[0].currentLocationBasis,"confirmed");
 assert.equal(JSON.stringify(physical),before);assert.equal(guide.contextAnchors.length,1);
 assertWestV45Records([{sourceId:guide.entries[0].sourceId,to:{kind:"vitrine",code:"45"}}],guide);
 assert.throws(()=>assertWestV45Records([{sourceId:westV45ContextAnchors[0].sourceId,to:{kind:"vitrine",code:"45"}}],guide),/changed/);
});
test("later curator destinations are retained and removed from V45 execution",()=>{
 const {physical,review}=fixture();const id=review.rows[0].sourceId;review.rows[0].effectiveVitrine="44";
 const guide=projectWestV45Guide([],physical,review);
 assert.ok(!guide.entries.some(row=>row.sourceId===id));assert.equal(guide.outgoingDependencies?.[0].proposedDestination,"44");
 assert.ok(guide.vitrines.every(v=>[...v.families,...v.cityGroups].every(g=>!g.sourceIds.includes(id))));
 assert.throws(()=>assertWestV45Records([{sourceId:id,to:{kind:"vitrine",code:"45"}}],guide),/changed/);
});
test("identity, source revision, pending proposal and verified items fail closed",()=>{
 for(const change of ["identity","revision","pending","item"]){
  const {physical,review}=fixture(),source=physical.rows[0];
  if(change==="identity")source.saintId="different";
  if(change==="revision")source.sourceRevision="changed";
  if(change==="pending")review.proposal.pendingPlacements.push({sourceId:source.sourceId,reason:"Research needed"});
  if(change==="item")source.verifiedItemIds=["item"];
  const guide=projectWestV45Guide([],physical,review);
  assert.ok(guide.entries.find(row=>row.sourceId===source.sourceId)?.movementBlockedReason);
  assert.throws(()=>assertWestV45Records([{sourceId:source.sourceId,to:{kind:"vitrine",code:"45"}}],guide));
 }
});
test("source-only approval retains Dhunda null identity and rejects a newer alternative",()=>{
 const {physical,review}=fixture(),id="recoGHUjw3ejyIp10",row=review.rows.find(row=>row.sourceId===id)!;
 row.effectiveVitrine="41";
 let guide=projectWestV45Guide([],physical,review);assert.equal(guide.entries.find(row=>row.sourceId===id)?.saintId,null);
 assertWestV45Records([{sourceId:id,to:{kind:"vitrine",code:"45"}}],guide);
 row.reviewReason="Curator alternative destination";
 guide=projectWestV45Guide([],physical,review);assert.ok(!guide.entries.some(row=>row.sourceId===id));
});
test("optional infill, living restriction, unknown footprints and qualified relationships remain explicit",()=>{
 assert.equal(packet.fit.optionalAdditionIds.length,3);assert.equal(packet.fit.unmeasuredHoldingIds.length,2);
 assert.ok(Math.abs(packet.fit.knownShelfProxy-5.366666666666666)<1e-10);
 assert.match(westV45MoveGuide.vitrines[0].summary,/5\.37 of 5/);
 assert.equal(westV45MoveGuide.entries.find(row=>row.sourceId==="recY3qLwMZxTLFh4x")?.lifeStatus?.tag,"Living");
 const dhunda=westV45MoveGuide.vitrines[0].families.flatMap(g=>g.edges??[]).find(e=>e.toSourceId==="recoGHUjw3ejyIp10");
 assert.match(dhunda?.label??"",/lineage association/);assert.match(dhunda?.basis??"",/not a direct/);
});
