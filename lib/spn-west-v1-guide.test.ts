import test from "node:test";
import assert from "node:assert/strict";
import packet from "../data/museum/spn-west-v1-guide-v1.json";
import {westV1GuideContext,westV1GuideDefinition,westV1MoveGuide,westV1LayoutGuidance,projectWestV1Guide,assertWestV1Records} from "./spn-west-v1-guide";
import {readStarterGuideDefinition,currentReceiverGuideDefinitions} from "./spn-starter-guide-registry";
import {assertGuidePhysicalScope} from "./spn-datta-guide";
import type {CompanionRow,PhysicalState} from "./spn-move-guide";

function fixture(){
 const rows:CompanionRow[]=packet.rows.map(row=>({sourceId:row.sourceId,saintId:row.saintId,name:row.name,original:{kind:"vitrine",code:"54",label:"Vitrine 54",shelf:"B"},current:{kind:"table",code:"staging-area",label:"Staging area"},currentBasis:"confirmed",currentVersion:2,currentRevision:"live",sourceRevision:row.sourceRevision,fixedHousing:false,verifiedItemIds:[],identityChanged:false}));
 const physical:PhysicalState={rows,unmappedCurrentLocations:[]};
 const review={rows:rows.map(row=>({sourceId:row.sourceId,saintId:row.saintId,effectiveVitrine:"1",reviewReason:""})),proposal:{pendingPlacements:[] as {sourceId:string;reason:string}[]}};
 return {physical,review};
}
test("V1 locks the approved4BAPS,8Gondal,7Amreli source partition",()=>{
 const vitrine=westV1MoveGuide.vitrines[0];assert.equal(westV1MoveGuide.entries.length,19);
 assert.equal(westV1MoveGuide.entries.filter(row=>row.saintId).length,18);
 assert.deepEqual(vitrine.families.map(g=>g.sourceIds.length),[4]);assert.deepEqual(vitrine.cityGroups.map(g=>g.sourceIds.length),[8,7]);
 assert.ok([...vitrine.families,...vitrine.cityGroups].every(g=>g.edges?.length===0));
 assert.equal(readStarterGuideDefinition(westV1GuideContext.guideVersion),westV1GuideDefinition);
 assert.ok(currentReceiverGuideDefinitions("1").includes(westV1GuideDefinition));
});
test("Mahant shelf2 exception is explicit guidance without fabricated shelf assignments",()=>{
 assert.deepEqual(westV1LayoutGuidance.bapsShelves,[1,2]);assert.equal(westV1LayoutGuidance.mahantShelf,2);
 assert.deepEqual(westV1LayoutGuidance.geographicShelves,[3,4,5]);assert.equal(westV1LayoutGuidance.physicalShelfWrites,false);
 const mahant=westV1MoveGuide.entries.find(e=>e.sourceId===westV1LayoutGuidance.mahantSourceId)!;
 assert.equal(mahant.lifeStatus?.tag,"Living");assert.equal(mahant.tier,"Tertiary");assert.match(mahant.reviewNotes?.join(" ")??"",/never the top shelf/);
 const {physical,review}=fixture();const guide=projectWestV1Guide([],physical,review);
 assert.equal(guide.entries.find(e=>e.sourceId===mahant.sourceId)?.currentLocation?.shelf,undefined);
 assert.throws(()=>assertWestV1Records([{sourceId:mahant.sourceId,to:{kind:"vitrine",code:"1",shelf:"1"}}],guide),/shelf workflow/);
});
test("V1 requires available space without a whole-case clear",()=>{
 assert.equal(westV1GuideDefinition.physicalScope?.allowClear,false);assert.deepEqual(westV1GuideDefinition.physicalScope?.preparationVitrines,["1"]);
 assert.throws(()=>assertGuidePhysicalScope(westV1GuideDefinition,[],["1"]),/does not clear/);
 assert.equal(westV1MoveGuide.reportedPlacements.length,0);
});
test("eight retained60 observations and BrahmaKumaris remain outside V1 actions",()=>{
 assert.equal(packet.excludedCohorts.retained60SourceIds.length,8);
 for(const sourceId of packet.excludedCohorts.retained60SourceIds){assert.equal(westV1GuideDefinition.physicalScope?.destinations[sourceId],undefined);assert.ok(!westV1MoveGuide.entries.some(e=>e.sourceId===sourceId));}
 assert.match(packet.excludedCohorts.brahmaKumaris,/exact vitrine pending/);
 assert.deepEqual(Object.values(westV1GuideDefinition.physicalScope!.destinations),Array(19).fill("1"));
});
test("projection uses current physical ledger and preserves later curator destinations",()=>{
 const {physical,review}=fixture(),source=physical.rows[0],before=JSON.stringify(physical);
 let guide=projectWestV1Guide([],physical,review);assert.equal(guide.entries[0].currentLocation?.code,"staging-area");assert.equal(guide.entries[0].currentLocationBasis,"confirmed");assert.equal(JSON.stringify(physical),before);
 assertWestV1Records([{sourceId:source.sourceId,to:{kind:"vitrine",code:"1"}}],guide);
 review.rows[0].effectiveVitrine="60";guide=projectWestV1Guide([],physical,review);
 assert.ok(!guide.entries.some(e=>e.sourceId===source.sourceId));assert.equal(guide.outgoingDependencies?.[0].proposedDestination,"60");
 assert.throws(()=>assertWestV1Records([{sourceId:source.sourceId,to:{kind:"vitrine",code:"1"}}],guide));
});
test("changed identity, revision, pending arrangement, fixed display or verified item blocks execution",()=>{
 for(const change of ["identity","revision","pending","fixed","item","review"]){
  const {physical,review}=fixture(),source=physical.rows[0];
  if(change==="identity")source.saintId="different";
  if(change==="revision")source.sourceRevision="changed";
  if(change==="pending")review.proposal.pendingPlacements.push({sourceId:source.sourceId,reason:"Research needed"});
  if(change==="fixed")source.fixedHousing=true;
  if(change==="item")source.verifiedItemIds=["item"];
  if(change==="review")review.rows[0].reviewReason="Saved arrangement needs review";
  const guide=projectWestV1Guide([],physical,review);assert.ok(guide.entries.find(e=>e.sourceId===source.sourceId)?.movementBlockedReason);
  assert.throws(()=>assertWestV1Records([{sourceId:source.sourceId,to:{kind:"vitrine",code:"1"}}],guide));
 }
});
test("unlinked Gondal scope retains possible overlap without inventing canonical identity",()=>{
 const {physical,review}=fixture(),id="recGMV4dvSAGu429G",row=review.rows.find(r=>r.sourceId===id)!;row.effectiveVitrine="62";
 let guide=projectWestV1Guide([],physical,review);assert.equal(guide.entries.find(e=>e.sourceId===id)?.saintId,null);
 assert.match(guide.entries.find(e=>e.sourceId===id)?.reviewNotes?.join(" ")??"",/do not establish an additional object/);
 assertWestV1Records([{sourceId:id,to:{kind:"vitrine",code:"1"}}],guide);
 row.reviewReason="Curator alternative destination";guide=projectWestV1Guide([],physical,review);assert.ok(!guide.entries.some(e=>e.sourceId===id));
});
test("4.97comparison is retained without certifying fit or merging possible observations",()=>{
 assert.ok(Math.abs(packet.fit.knownShelfProxy-4.966666666666667)<1e-10);assert.equal(packet.fit.fitCertified,false);
 assert.match(packet.fit.basis,/not counted as verified separate objects/);
 for(const id of ["recGmhLN8uiqGdeGT","recUAtOOXXZARwgGC"]){assert.match(westV1MoveGuide.entries.find(e=>e.sourceId===id)?.reviewNotes?.join(" ")??"",/overlap remains for review/);}
});
