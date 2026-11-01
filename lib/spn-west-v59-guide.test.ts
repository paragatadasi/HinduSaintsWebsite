import test from "node:test";
import assert from "node:assert/strict";
import packet from "../data/museum/spn-west-v59-guide-v1.json";
import {westV59GuideContext,westV59GuideDefinition,westV59MoveGuide,projectWestV59Guide,assertWestV59Records} from "./spn-west-v59-guide";
import {readStarterGuideDefinition,currentReceiverGuideDefinitions} from "./spn-starter-guide-registry";
import {assertGuidePhysicalScope} from "./spn-datta-guide";
import type {CompanionRow,PhysicalState} from "./spn-move-guide";
function fixture(){
 const rows:CompanionRow[]=packet.rows.map(row=>({sourceId:row.sourceId,saintId:row.saintId,name:row.name,original:{kind:"vitrine",code:"49",label:"Vitrine 49",shelf:"C"},current:{kind:"table",code:"staging-area",label:"Staging area"},currentBasis:"confirmed",currentVersion:2,currentRevision:"live",sourceRevision:row.sourceRevision,fixedHousing:false,verifiedItemIds:[],identityChanged:false}));
 const physical:PhysicalState={rows,unmappedCurrentLocations:[]};
 const review={rows:rows.map(row=>({sourceId:row.sourceId,saintId:row.saintId,effectiveVitrine:"59",reviewReason:""})),proposal:{pendingPlacements:[] as {sourceId:string;reason:string}[]}};
 return {physical,review};
}
test("V59 registers only the approved 19 Gujarat sources and scoped clearing",()=>{
 assert.equal(westV59MoveGuide.entries.length,19);
 assert.equal(new Set(westV59MoveGuide.vitrines.flatMap(v=>[...v.families,...v.cityGroups].flatMap(g=>g.sourceIds))).size,19);
 assert.equal(readStarterGuideDefinition(westV59GuideContext.guideVersion),westV59GuideDefinition);
 assert.ok(currentReceiverGuideDefinitions("59").includes(westV59GuideDefinition));
 assert.equal(westV59MoveGuide.optionalClearVitrines,undefined);
 assert.deepEqual(westV59MoveGuide.reportedPlacements,[]);
 assert.equal(westV59MoveGuide.vitrines[0].cityGroups.length,6);
 assert.equal(westV59MoveGuide.vitrines[0].families.length,0);
 assert.ok(packet.groups.every(g=>g.edges.length===0));
 assert.equal(packet.rows.filter(r=>r.lifeStatus.tag).length,5);
 assertGuidePhysicalScope(westV59GuideDefinition,[],["59"]);
 assert.throws(()=>assertGuidePhysicalScope(westV59GuideDefinition,[],["48"]));
});
test("live origins and later destinations supersede captured recommendations",()=>{
 const {physical,review}=fixture();physical.rows[0].current=null;physical.rows[0].currentBasis="unknown";
 const before=JSON.stringify(physical);let guide=projectWestV59Guide([],physical,review);
 assert.equal(guide.entries[0].currentLocation,null);assert.equal(guide.entries[1].currentLocation?.kind,"table");
 assertWestV59Records([{sourceId:guide.entries[1].sourceId,to:{kind:"vitrine",code:"59"}}],guide);
 assert.throws(()=>assertWestV59Records([{sourceId:guide.entries[1].sourceId,to:{kind:"vitrine",code:"59",shelf:"2"}}],guide),/shelf workflow/);
 review.rows[0].effectiveVitrine="3";guide=projectWestV59Guide([],physical,review);
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
 const guide=projectWestV59Guide([],physical,review);
 assert.throws(()=>assertWestV59Records([{sourceId:row.sourceId,to:{kind:"vitrine",code:"59"}}],guide));
 }
});
