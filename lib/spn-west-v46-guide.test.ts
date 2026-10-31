import test from "node:test";
import assert from "node:assert/strict";
import packet from "../data/museum/spn-west-v46-guide-v1.json";
import shelves from "../data/museum/spn-west-v46-shelves-v1.json";
import {westV46GuideContext,westV46GuideDefinition,westV46MoveGuide,projectWestV46Guide,assertWestV46Records} from "./spn-west-v46-guide";
import {readStarterGuideDefinition,currentReceiverGuideDefinitions} from "./spn-starter-guide-registry";
import {assertGuidePhysicalScope} from "./spn-datta-guide";
import {projectShelfPlanningContext} from "./museum-shelf-planning-context";
import type {CompanionRow,PhysicalState} from "./spn-move-guide";
import type {MuseumSaintPlacement} from "./museum-proposals";
function fixture(){
 const rows:CompanionRow[]=packet.rows.map(row=>({sourceId:row.sourceId,saintId:row.saintId,name:row.name,original:{kind:"vitrine",code:"49",label:"Vitrine 49",shelf:"C"},current:{kind:"table",code:"staging-area",label:"Staging area"},currentBasis:"confirmed",currentVersion:2,currentRevision:"live",sourceRevision:row.sourceRevision,fixedHousing:false,verifiedItemIds:[],identityChanged:false}));
 const physical:PhysicalState={rows,unmappedCurrentLocations:[]};
 const review={rows:rows.map(row=>({sourceId:row.sourceId,saintId:row.saintId,effectiveVitrine:"46",reviewReason:""})),proposal:{pendingPlacements:[] as {sourceId:string;reason:string}[]}};
 return {physical,review};
}
test("V46 registers only the approved 18 sources, excluding the Datta pair",()=>{
 assert.equal(westV46MoveGuide.entries.length,18);
 assert.equal(new Set(westV46MoveGuide.vitrines.flatMap(v=>[...v.families,...v.cityGroups].flatMap(g=>g.sourceIds))).size,18);
 assert.equal(readStarterGuideDefinition(westV46GuideContext.guideVersion),westV46GuideDefinition);
 assert.ok(currentReceiverGuideDefinitions("46").includes(westV46GuideDefinition));
 for(const id of ["rec6XzopLLlm06Rtt","recyokcxEvhxvtyPk"])assert.equal(westV46GuideDefinition.physicalScope?.destinations[id],undefined);
 assert.deepEqual(westV46GuideDefinition.physicalScope?.preparationVitrines,["46"]);
 assert.equal(westV46MoveGuide.optionalClearVitrines,undefined);
 assert.throws(()=>assertGuidePhysicalScope(westV46GuideDefinition,[],["46"]),/does not clear/);
 assert.deepEqual(westV46MoveGuide.reportedPlacements,[]);
});
test("live origins and later destinations supersede captured recommendations",()=>{
 const {physical,review}=fixture();physical.rows[0].current=null;physical.rows[0].currentBasis="unknown";
 const before=JSON.stringify(physical);let guide=projectWestV46Guide([],physical,review);
 assert.equal(guide.entries[0].currentLocation,null);assert.equal(guide.entries[1].currentLocation?.kind,"table");
 assertWestV46Records([{sourceId:guide.entries[1].sourceId,to:{kind:"vitrine",code:"46"}}],guide);
 assert.throws(()=>assertWestV46Records([{sourceId:guide.entries[1].sourceId,to:{kind:"vitrine",code:"46",shelf:"2"}}],guide),/shelf workflow/);
 review.rows[0].effectiveVitrine="3";guide=projectWestV46Guide([],physical,review);
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
 const guide=projectWestV46Guide([],physical,review);
 assert.throws(()=>assertWestV46Records([{sourceId:row.sourceId,to:{kind:"vitrine",code:"46"}}],guide));
 }
});
test("V46 shelf projection keeps approved living shelf2, live tiers and qualified family edges",()=>{
 const {physical}=fixture();
 const placements:MuseumSaintPlacement[]=packet.rows.map(r=>({id:r.sourceId,sourceRecordId:r.sourceId,saintId:r.saintId,name:r.name,tier:r.tier==="Primary"?"Featured":r.tier==="Secondary"?"Secondary":"Tertiary",section:r.section,familyId:r.family,curatorialFamily:r.family,familySize:1,alternatives:[],confidence:"high",rationale:"",note:"",spiritualRegions:[],normalizedPlaces:[r.city],sampradaya:"",needsResearch:false}));
 const current={placements,membersById:new Map(packet.rows.map(r=>[r.sourceId,{SamadhiDate:r.lifeStatus.tag?"Living":""}]))};
 const review:NonNullable<Parameters<typeof projectShelfPlanningContext>[1]["review"]>={rows:packet.rows.map(r=>({...r,vitrine:"46",sourceVitrine:"49",sourceShelf:"C",unresolved:false,allocationKind:"Approved",share:null,state:"proposed",baseline:null,currentVitrine:"",currentShelf:"",currentStatus:"Proposed",regions:[],effectiveVitrine:"46",reviewReason:""})),pendingPlacements:[]};
 const context=projectShelfPlanningContext(shelves,{current,physical,review});
 assert.equal(context.cases[0].allocations.length,18);
 for(const r of packet.rows.filter(r=>r.lifeStatus.tag))assert.equal(context.cases[0].allocations.find(a=>a.sourceId===r.sourceId)?.suggestedShelfIndex,2);
 assert.ok(context.cases[0].relationships.every(e=>e.uncertain));
 assert.equal(context.cases[0].entries.find(e=>e.sourceId==="recW5CJHvadVzJNYy")?.tier,"Tertiary");
 physical.rows[0].sourceRevision="changed";
 const changed=projectShelfPlanningContext(shelves,{current,physical,review});
 assert.equal(changed.cases[0].allocations.length,17);
 assert.match(changed.reviewedChanges[0].reason,/Source data changed/);
});
