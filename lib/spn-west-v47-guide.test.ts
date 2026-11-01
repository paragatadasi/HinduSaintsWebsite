import test from "node:test";
import assert from "node:assert/strict";
import packet from "../data/museum/spn-west-v47-guide-v1.json";
import {westV47GuideContext,westV47GuideDefinition,westV47MoveGuide,projectWestV47Guide,assertWestV47Records} from "./spn-west-v47-guide";
import {readStarterGuideDefinition,currentReceiverGuideDefinitions} from "./spn-starter-guide-registry";
import {assertGuidePhysicalScope} from "./spn-datta-guide";
import type {CompanionRow,PhysicalState} from "./spn-move-guide";
function fixture(){
 const rows:CompanionRow[]=packet.rows.map(row=>({sourceId:row.sourceId,saintId:row.saintId,name:row.name,original:{kind:"vitrine",code:"49",label:"Vitrine 49",shelf:"C"},current:{kind:"table",code:"staging-area",label:"Staging area"},currentBasis:"confirmed",currentVersion:2,currentRevision:"live",sourceRevision:row.sourceRevision,fixedHousing:false,verifiedItemIds:[],identityChanged:false}));
 const physical:PhysicalState={rows,unmappedCurrentLocations:[]};
 const review={rows:rows.map(row=>({sourceId:row.sourceId,saintId:row.saintId,effectiveVitrine:"47",reviewReason:""})),proposal:{pendingPlacements:[] as {sourceId:string;reason:string}[]}};
 return {physical,review};
}
test("V47 registers only the approved 19 Gujarat sources and scoped clearing",()=>{
 assert.equal(westV47MoveGuide.entries.length,19);
 assert.equal(new Set(westV47MoveGuide.vitrines.flatMap(v=>[...v.families,...v.cityGroups].flatMap(g=>g.sourceIds))).size,19);
 assert.equal(readStarterGuideDefinition(westV47GuideContext.guideVersion).readOnly,true);
 assert.ok(!currentReceiverGuideDefinitions("47").some(g=>g.context.guideVersion===westV47GuideContext.guideVersion));
 assert.equal(westV47MoveGuide.optionalClearVitrines,undefined);
 assert.deepEqual(westV47MoveGuide.reportedPlacements,[]);
 assert.equal(westV47MoveGuide.vitrines[0].cityGroups.length,6);
 assert.equal(westV47MoveGuide.vitrines[0].families.length,0);
 assert.ok(packet.groups.every(g=>g.edges.length===0));
 assert.equal(packet.rows.filter(r=>r.lifeStatus.tag).length,5);
 assertGuidePhysicalScope(westV47GuideDefinition,[],["47"]);
 assert.throws(()=>assertGuidePhysicalScope(westV47GuideDefinition,[],["48"]));
});
test("live origins and later destinations supersede captured recommendations",()=>{
 const {physical,review}=fixture();physical.rows[0].current=null;physical.rows[0].currentBasis="unknown";
 const before=JSON.stringify(physical);let guide=projectWestV47Guide([],physical,review);
 assert.equal(guide.entries[0].currentLocation,null);assert.equal(guide.entries[1].currentLocation?.kind,"table");
 assertWestV47Records([{sourceId:guide.entries[1].sourceId,to:{kind:"vitrine",code:"47"}}],guide);
 assert.throws(()=>assertWestV47Records([{sourceId:guide.entries[1].sourceId,to:{kind:"vitrine",code:"47",shelf:"2"}}],guide),/shelf workflow/);
 review.rows[0].effectiveVitrine="3";guide=projectWestV47Guide([],physical,review);
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
 const guide=projectWestV47Guide([],physical,review);
 assert.throws(()=>assertWestV47Records([{sourceId:row.sourceId,to:{kind:"vitrine",code:"47"}}],guide));
 }
});
