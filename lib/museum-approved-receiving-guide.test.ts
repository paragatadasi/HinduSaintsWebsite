import test from "node:test";
import assert from "node:assert/strict";
import {approvedReceivingDigests,createApprovedReceivingGuide,type ApprovedReceivingPacket,type ApprovedReceivingReview} from "./museum-approved-receiving-guide";
import type {PhysicalState} from "./spn-move-guide";
function fixture(){
 const content:Omit<ApprovedReceivingPacket,"contentDigest"|"assignmentDigest">={version:"test-v1",proposalVersion:"proposal-v1",title:"Receiving",proposalLabel:"Approved",phaseLabel:"West",allowClear:true,vitrines:[{code:"58",summary:"Story"}],groups:[{id:"family",kind:"family",title:"Family",vitrine:"58",sourceIds:["source"],rationale:"Reviewed",edges:[]}],rows:[{sourceId:"source",saintId:"saint",sourceRevision:"source-revision",capturedProposalDestination:"58",name:"Saint",tier:"Primary",city:"",relicDescription:"",destination:"58",section:"",family:"",rationale:"Reviewed"}]};
 const packet={...content,...approvedReceivingDigests(content)};
 const physical:PhysicalState={unmappedCurrentLocations:[],rows:[{sourceId:"source",saintId:"saint",name:"Saint",original:{kind:"vitrine",code:"1",label:"Vitrine 1"},current:{kind:"table",code:"staging-area",label:"Staging area"},currentBasis:"confirmed",currentVersion:2,currentRevision:"current",sourceRevision:"source-revision",fixedHousing:false,verifiedItemIds:[],identityChanged:false}]};
 const review:ApprovedReceivingReview={rows:[{sourceId:"source",saintId:"saint",effectiveVitrine:"58",reviewReason:""}],proposal:{pendingPlacements:[]}};
 return {packet,physical,review};
}
const records=[{sourceId:"source",to:{kind:"vitrine",code:"58"}}];
function seal(packet:ApprovedReceivingPacket){const {contentDigest,assignmentDigest,...content}=packet;return {...content,...approvedReceivingDigests(content)};}
test("derives scoped guide and reads current physical state without mutating it",()=>{
 const {packet,physical,review}=fixture(),before=JSON.stringify(physical),adapter=createApprovedReceivingGuide(packet,packet.contentDigest);
 const guide=adapter.project([],physical,review);
 assert.equal(guide.entries[0].currentLocation?.kind,"table");assert.equal(adapter.definition.physicalScope?.destinations.source,"58");
 adapter.assertRecords(records,guide);assert.equal(JSON.stringify(physical),before);
 packet.rows[0].destination="99";assert.equal(adapter.project([],physical,review).entries[0].destination,"58");
 assert.throws(()=>adapter.assertRecords([{sourceId:"source",to:{kind:"vitrine",code:"58",shelf:"2"}}],guide));
 assert.throws(()=>adapter.assertRecords([{sourceId:"source",to:{kind:"vitrine",code:"59"}}],guide));
});
test("rejects digest changes, duplicate membership, wrong-case groups and missing source evidence",()=>{
 for(const change of ["digest","duplicate","group","revision","edge"]){let {packet}=fixture();if(change==="digest")packet.title="Changed";if(change==="duplicate")packet.groups[0].sourceIds.push("source");if(change==="group")packet.groups[0].vitrine="59";if(change==="revision")packet.rows[0].sourceRevision="";if(change==="edge")packet.groups[0].edges=[{fromSourceId:"source",toSourceId:"other",label:"guru"}];if(change!=="digest")packet=seal(packet);assert.throws(()=>createApprovedReceivingGuide(packet,packet.contentDigest));}
 const {packet}=fixture();assert.throws(()=>createApprovedReceivingGuide(packet,"different-reviewed-digest"));
});
test("retains later destinations and removes departed group members",()=>{
 const {packet,physical,review}=fixture(),adapter=createApprovedReceivingGuide(packet,packet.contentDigest);review.rows[0].effectiveVitrine="61";
 const guide=adapter.project([],physical,review);assert.equal(guide.entries.length,0);assert.equal(guide.vitrines[0].families.length,0);assert.equal(guide.outgoingDependencies?.[0].proposedDestination,"61");assert.throws(()=>adapter.assertRecords(records,guide));
});
test("identity, evidence, item, housing and review holds fail closed",()=>{
 for(const change of ["revision","identity","duplicate-source","duplicate-review","missing-review","pending","fixed","item","review","physical-hold"]){
 const {packet,physical,review}=fixture(),adapter=createApprovedReceivingGuide(packet,packet.contentDigest),row=physical.rows[0];
 if(change==="revision")row.sourceRevision="changed";if(change==="identity")row.identityChanged=true;if(change==="duplicate-source")physical.rows.push({...row});if(change==="duplicate-review")review.rows.push({...review.rows[0]});if(change==="missing-review")review.rows=[];if(change==="pending")review.proposal.pendingPlacements.push({sourceId:"source",reason:"Pending"});if(change==="fixed")row.fixedHousing=true;if(change==="item")row.verifiedItemIds=["item"];if(change==="review")review.rows[0].reviewReason="Review";if(change==="physical-hold")row.movementBlockedReason="Hold";
 assert.throws(()=>adapter.assertRecords(records,adapter.project([],physical,review)),change);
 }
});
test("review-only and unlinked records remain visible, fit holds do not prohibit clearing",()=>{
 for(const change of ["unlinked","review-only","fit"]){let {packet,physical,review}=fixture();if(change==="unlinked")packet.rows[0].saintId=null;if(change==="review-only")packet.rows[0].reviewOnly=true;if(change==="fit")packet.vitrines[0].movementFitHold="Measure available space";packet=seal(packet);const adapter=createApprovedReceivingGuide(packet,packet.contentDigest);if(change!=="fit")review.rows[0].effectiveVitrine="61";const guide=adapter.project([],physical,review);assert.equal(guide.entries.length,1);assert.equal(guide.vitrines.length,1);if(change==="fit")assert.equal(guide.vitrines[0].fitGuidance,"Measure available space");assert.equal(adapter.definition.physicalScope?.allowClear,true);assert.deepEqual(adapter.definition.physicalScope?.clearVitrines,["58"]);assert.throws(()=>adapter.assertRecords(records,guide));}
});

