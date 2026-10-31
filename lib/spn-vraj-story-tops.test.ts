import test from "node:test";
import assert from "node:assert/strict";
import packet from "../data/museum/spn-vraj-story-tops-guide-v2.json";
import capturedShelves from "../data/museum/spn-vraj-story-tops-shelves-v2.json";
import previous from "../data/museum/spn-vraj-remainder-guide-v1.json";
import {vrajStoryTopsMoveGuide,vrajStoryTopsGuideDefinition} from "./spn-vraj-story-tops-guide";
import {projectVrajRemainderGuide,assertVrajRemainderRecords} from "./spn-vraj-remainder-guide";
import {projectShelfPlanningContext,type ShelfPlanningPacket} from "./museum-shelf-planning-context";
import {inheritGuideDecisions} from "./museum-guide-decision-inheritance";
import {readStarterGuideDefinition} from "./spn-starter-guide-registry";
import type {MuseumSaintPlacement} from "./museum-proposals";
import type {PhysicalState} from "./spn-move-guide";
import type {ExplorerObservation} from "./spn-room-proposal";
const shelves:ShelfPlanningPacket=capturedShelves;
function fixture(){
 const rows=packet.rows.filter(r=>r.destination!=="38");
 const placements:MuseumSaintPlacement[]=rows.flatMap(r=>r.saintId?[{id:r.sourceId,sourceRecordId:r.sourceId,saintId:r.saintId,name:r.name,tier:r.tier==="Primary"?"Featured":r.tier==="Secondary"?"Secondary":"Tertiary",section:r.section,familyId:"",curatorialFamily:"",familySize:1,alternatives:[],confidence:"",rationale:"",note:"",spiritualRegions:[],normalizedPlaces:[r.city],sampradaya:"",needsResearch:false}]:[]);
 const physical:PhysicalState={rows:rows.map(r=>({sourceId:r.sourceId,saintId:r.saintId,name:r.name,sourceRevision:r.sourceRevision!,original:{kind:"vitrine",code:"20",label:"Vitrine 20"},current:{kind:"table",code:"staging-area",label:"Staging area"},currentBasis:"confirmed",currentVersion:1,currentRevision:"current",fixedHousing:false,identityChanged:false,verifiedItemIds:[]})),unmappedCurrentLocations:[]};
 const review:{rows:ExplorerObservation[];pendingPlacements:{sourceId:string;reason:string}[]}={rows:rows.map(r=>({sourceId:r.sourceId,saintId:r.saintId,name:r.name,vitrine:r.destination,tier:r.tier,section:r.section,sourceVitrine:"20",sourceShelf:"",unresolved:!r.saintId,allocationKind:"Approved",share:null,state:"proposed",baseline:null,currentVitrine:"",currentShelf:"",currentStatus:"",regions:[],reviewReason:"",effectiveVitrine:r.sourceId==="recPWVPc3i5A0KH7h"?"35":r.destination})),pendingPlacements:[]};
 return {current:{placements,membersById:new Map<string,Record<string,string>>()},physical,review};
}
test("exact79 replacement retains unchanged V38 and previous clearance and decision scopes",()=>{
 assert.equal(packet.rows.length,99);assert.equal(new Set(packet.rows.map(r=>r.sourceId)).size,99);
 assert.deepEqual(packet.rows.filter(r=>r.destination==="38"),previous.rows.filter(r=>r.destination==="38"));
 assert.deepEqual(vrajStoryTopsGuideDefinition.physicalScope?.previousClearanceVersions,[previous.version]);
 assert.equal(readStarterGuideDefinition(previous.version).readOnly,true);
 const unchanged=packet.rows.find(r=>r.destination==="38")!;
 const decisions=inheritGuideDecisions(vrajStoryTopsGuideDefinition,[],[{guide:readStarterGuideDefinition(previous.version),decisions:[{suggestionId:`row:${unchanged.sourceId}`,decision:"deferred",note:"Keep",version:2,updatedAt:new Date()}]}]);
 assert.equal(decisions[0].decision,"deferred");assert.equal(decisions[0].inheritedFrom?.version,2);
});
test("source-only approved destination preserves null identity, live origins and later overrides",()=>{
 const f=fixture();const before=JSON.stringify(f.physical);const id="recPWVPc3i5A0KH7h";
 let context=projectShelfPlanningContext(shelves,f);assert.equal(context.cases.flatMap(c=>c.allocations).length,79);
 let guide=projectVrajRemainderGuide(f.current.placements,f.physical,context,vrajStoryTopsMoveGuide);
 const row=guide.entries.find(r=>r.sourceId===id)!;assert.equal(row.destination,"32");assert.equal(row.saintId,null);assert.equal(row.currentLocation?.kind,"table");assert.equal(row.movementBlockedReason,undefined);
 assertVrajRemainderRecords([{sourceId:id,to:{kind:"vitrine",code:"32"}}],guide);
 context=projectShelfPlanningContext(shelves,{...f,alternatives:[{sourceId:id,vitrine:"24",shelf:null}]});guide=projectVrajRemainderGuide(f.current.placements,f.physical,context,vrajStoryTopsMoveGuide);
 assert.ok(!guide.entries.some(r=>r.sourceId===id));assert.throws(()=>assertVrajRemainderRecords([{sourceId:id,to:{kind:"vitrine",code:"32"}}],guide));assert.equal(JSON.stringify(f.physical),before);
});
test("changed groups retain band-only positions and living saints never gain top recommendations",()=>{
 const radha=shelves.vitrines.find(v=>v.code==="35")!.groups.find(g=>g.title==="Radha Kund")!;
 const allocations=shelves.vitrines.find(v=>v.code==="35")!.allocations.filter(a=>a.groupId===radha.id);
 assert.equal(allocations.length,9);assert.ok(allocations.every(a=>a.suggestedShelfIndex===null));
 assert.equal(allocations.filter(a=>a.suggestedBand==="below-top").length,3);
 const object=shelves.vitrines.flatMap(v=>v.allocations).find(a=>a.sourceId==="recZDpbsnZYFhwjOp")!;assert.equal(object.suggestedBand,"lower");assert.match(object.reviewAlerts.map(a=>a.message).join(" "),/rejected/);
 const f=fixture();f.physical.rows.find(r=>r.sourceId==="recPWVPc3i5A0KH7h")!.sourceRevision="changed";
 const context=projectShelfPlanningContext(shelves,f);assert.ok(!context.cases.flatMap(c=>c.allocations).some(a=>a.sourceId==="recPWVPc3i5A0KH7h"));
});
