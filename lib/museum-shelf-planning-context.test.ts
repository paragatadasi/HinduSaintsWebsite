import test from "node:test";
import assert from "node:assert/strict";
import {projectShelfPlanningContext,bamanShelfContext,type ShelfPlanningPacket} from "./museum-shelf-planning-context";
import type {MuseumSaintPlacement} from "./museum-proposals";
import type {ExplorerObservation} from "./spn-room-proposal";
import type {PhysicalState} from "./spn-move-guide";

function fixture(sourceId="source",saintId="saint",code="38"){
 const placement:MuseumSaintPlacement={id:sourceId,sourceRecordId:sourceId,saintId,name:"Current name",tier:"Featured",section:"Gaudiya Vaishnava",curatorialFamily:"FAM-023",spnRegionTags:[],normalizedPlaces:["Vrindavan"],alternatives:[],confidence:"high",rationale:"",note:"",familyId:"FAM-023",familySize:1,spiritualRegions:[],sampradaya:"",needsResearch:false,arrangement:{revision:"base",proposalRevision:"proposal",status:"Planned",vitrine:"29",familyKey:"FAM-023",shelf:"",confirmedAt:null,inventoryAcknowledged:false}};
 const baseline={placementId:sourceId,section:placement.section,tier:"Featured",familyKey:"FAM-023",regionTags:[],revision:"base",proposalRevision:"proposal"};
 const packet:ShelfPlanningPacket={version:"shelves",vitrines:[{code,groups:[{id:"family",title:"Family",kind:"family"}],allocations:[{sourceId,saintId,name:"Captured name",tier:"Primary",groupId:"family",suggestedShelfIndex:1,reviewAlerts:[],capturedBaseline:baseline,sourceRevision:"source-v1"}],relationships:[],contextNodes:[{id:"context",label:"cms123 · context",physicalHolding:false}]}]};
 const current={placements:[placement],membersById:new Map([[sourceId,{SamadhiDate:"2001"}]])};
 const physical:PhysicalState={rows:[{sourceId,saintId,name:"Physical name",original:{kind:"vitrine",code:"20",label:"Vitrine20"},current:{kind:"table",code:"staging-area",label:"Staging area"},currentBasis:"confirmed",currentVersion:2,currentRevision:"current-v2",sourceRevision:"source-v1",fixedHousing:true,verifiedItemIds:[],identityChanged:false,movementBlockedReason:"Component hold"}],unmappedCurrentLocations:[]};
 const review={rows:[{sourceId,saintId,name:"Current name",tier:"Primary",section:placement.section,effectiveVitrine:code}] as ExplorerObservation[],pendingPlacements:[] as {sourceId:string;reason:string}[]};
 return {packet,input:{current,physical,review}};
}

test("read-only context exposes a case without an executable move guide and retains current physical state",()=>{
 const {packet,input}=fixture();const before=structuredClone(input.physical);
 const result=projectShelfPlanningContext(packet,input);
 assert.equal(result.mode,"recommendations_only");assert.equal(result.physicalActionsEnabled,false);
 assert.equal(result.cases[0].allocations[0].sourceRevision,input.physical.rows[0].sourceRevision);
 assert.equal(result.cases[0].allocations.length,1);assert.equal(result.cases[0].entries[0].name,"Current name");
 assert.equal(result.cases[0].entries[0].currentLocation?.code,"staging-area");
 assert.equal(result.cases[0].entries[0].movementBlockedReason,"Component hold");
 assert.equal(result.cases[0].contextNodes?.[0].label,"Related figure · name to confirm");
 assert.deepEqual(input.physical,before);
});
test("changed destinations and pending sources stay visible for review instead of disappearing",()=>{
 const {packet,input}=fixture();input.review.rows[0].effectiveVitrine="29";
 let result=projectShelfPlanningContext(packet,input);assert.equal(result.cases[0].allocations.length,0);assert.equal(result.reviewedChanges[0].visibility,"changed");
 input.review.rows=[];input.review.pendingPlacements=[{sourceId:"source",reason:"Privately held"}];
 result=projectShelfPlanningContext(packet,input);assert.match(result.reviewedChanges[0].reason,/Privately held/);
});
test("source changes and mismatched identities never activate a captured recommendation",()=>{
 const {packet,input}=fixture();input.physical.rows[0].sourceRevision="source-v2";
 assert.match(projectShelfPlanningContext(packet,input).reviewedChanges[0].reason,/Source data changed/);
 input.physical.rows[0].sourceRevision="source-v1";input.physical.rows[0].saintId="different";
 assert.match(projectShelfPlanningContext(packet,input).reviewedChanges[0].reason,/identity/);
});
test("a newer curator tier change is retained and the old shelf position held",()=>{
 const {packet,input}=fixture();input.current.placements[0].tier="Secondary";
 const result=projectShelfPlanningContext(packet,input);
 assert.equal(result.cases[0].allocations.length,0);assert.match(result.reviewedChanges[0].reason,/Curator record changed/);
});
test("current positive living evidence holds a stale top suggestion; missing death invents no label",()=>{
 const {packet,input}=fixture();input.current.membersById.set("source",{SamadhiDate:"Still alive"});
 assert.match(projectShelfPlanningContext(packet,input).reviewedChanges[0].reason,/living-status/);
 input.current.membersById.set("source",{SamadhiDate:""});
 assert.equal(projectShelfPlanningContext(packet,input).cases[0].entries[0].lifeStatus?.tag,undefined);
});
test("the exact Baman approved co-location is guarded by canonical identity and captured baseline",()=>{
 const {packet,input}=fixture(bamanShelfContext.sourceId,bamanShelfContext.saintId,"78");
 const p=input.current.placements[0],a=packet.vitrines[0].allocations[0];
 a.capturedBaseline!.revision=bamanShelfContext.baselineRevision;a.capturedBaseline!.proposalRevision=bamanShelfContext.proposalRevision;
 p.arrangement!.revision=bamanShelfContext.baselineRevision;p.arrangement!.proposalRevision=bamanShelfContext.proposalRevision;
 input.review.rows[0].effectiveVitrine="29";
 assert.equal(projectShelfPlanningContext(packet,input).cases[0].allocations.length,1);
 p.arrangement!.revision="newer-curator-decision";
 assert.equal(projectShelfPlanningContext(packet,input).reviewedChanges[0].effectiveDestination,"29");
});
test("validated manual additions override a captured destination but stale additions do not",()=>{
 const {packet,input}=fixture();
 const addition={sourceId:"source",saintId:"saint",sourceRevision:"source-v1",vitrine:"32",shelf:null};
 assert.equal(projectShelfPlanningContext(packet,{...input,additions:[addition]}).reviewedChanges[0].effectiveDestination,"32");
 assert.equal(projectShelfPlanningContext(packet,{...input,additions:[{...addition,sourceRevision:"stale"}]}).cases[0].allocations.length,1);
});
test("duplicate packet source rows fail explicitly",()=>{
 const {packet,input}=fixture();packet.vitrines.push(packet.vitrines[0]);
 assert.throws(()=>projectShelfPlanningContext(packet,input),/more than once/);
});


test("an approved lower-two exception accepts living shelves 4–5 and holds higher shelves",()=>{
 const {packet,input}=fixture("source","saint","77");
 packet.vitrines[0].livingAllowedBands=[4,5];
 input.current.membersById.set("source",{SamadhiDate:"Still alive"});
 for(const band of [4,5]){
  packet.vitrines[0].allocations[0].suggestedShelfIndex=band;
  assert.equal(projectShelfPlanningContext(packet,input).cases[0].allocations.length,1);
 }
 packet.vitrines[0].allocations[0].suggestedShelfIndex=3;
 assert.equal(projectShelfPlanningContext(packet,input).cases[0].allocations.length,0);
 assert.match(projectShelfPlanningContext(packet,input).reviewedChanges[0].reason,/approved lower shelves/);
});
