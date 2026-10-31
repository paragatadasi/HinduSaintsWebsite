import test from "node:test";
import assert from "node:assert/strict";
import packet from "../data/museum/spn-east-remainder-guide-v1.json";
import {eastRemainderShelfPacket as shelves,operationalSpnShelfPacket} from "./spn-east-remainder-shelves";
import {paramanandObjectReview as arm} from "./spn-paramanand-reviewed-object";
import {eastRemainderMoveGuide as captured,eastRemainderGuideContext,projectEastRemainderGuide,assertEastRemainderRecords} from "./spn-east-remainder-guide";
import {readStarterGuideDefinition,currentReceiverGuideDefinitions} from "./spn-starter-guide-registry";
import {vrajGuideContext} from "./spn-vraj-guide";
import {assertGuidePhysicalScope} from "./spn-datta-guide";
import {projectShelfPlanningContext} from "./museum-shelf-planning-context";
import type {MuseumSaintPlacement} from "./museum-proposals";
import type {PhysicalState} from "./spn-move-guide";
import type {ExplorerObservation} from "./spn-room-proposal";

function fixture(){
 const current={placements:packet.rows.flatMap(row=>row.baseline&&row.saintId?[{id:row.sourceId,sourceRecordId:row.sourceId,saintId:row.saintId,name:row.name,section:row.section,tier:row.baseline.tier,curatorialFamily:row.baseline.familyKey,familyId:row.baseline.familyKey,familySize:1,alternatives:[],confidence:"High",rationale:"",note:"",spiritualRegions:[],normalizedPlaces:[row.city],sampradaya:"",needsResearch:false,sourceHousingEvidenceRevision:row.sourceId===arm.sourceId?arm.housingEvidenceRevision:undefined,arrangement:{status:"Proposed",vitrine:"",shelf:"",familyKey:row.baseline.familyKey,revision:row.baseline.revision,proposalRevision:row.baseline.proposalRevision,confirmedAt:null,inventoryAcknowledged:false}} as MuseumSaintPlacement]:[]),membersById:new Map(packet.rows.map(row=>[row.sourceId,{SamadhiDate:"2000"}]))};
 const physical:PhysicalState={rows:packet.rows.map(row=>({sourceId:row.sourceId,saintId:row.saintId,name:row.name,original:{kind:"vitrine",code:"12",label:"Vitrine12"},current:{kind:"table",code:"staging-area",label:"Staging area"},currentBasis:"confirmed",currentVersion:1,currentRevision:"a".repeat(64),sourceRevision:row.sourceRevision!,housingEvidenceRevision:row.sourceId===arm.sourceId?arm.housingEvidenceRevision:undefined,fixedHousing:false,verifiedItemIds:[],identityChanged:false})),unmappedCurrentLocations:[]};
 const review={rows:packet.rows.map(row=>({...row,effectiveVitrine:row.destination})) as unknown as ExplorerObservation[],pendingPlacements:[]};
 const shelfPacket={...shelves,vitrines:shelves.vitrines.filter(v=>packet.vitrines.includes(v.code))};
 return {current,physical,review,shelfPacket};
}
function project(f:ReturnType<typeof fixture>){return projectEastRemainderGuide(f.current.placements,f.physical,projectShelfPlanningContext(f.shelfPacket,f));}

test("remainder registers exactly42 reviewed sources and two independently cleared receivers",()=>{
 const definition=readStarterGuideDefinition(eastRemainderGuideContext.guideVersion);
 assert.equal(captured.entries.length,42);
 assert.deepEqual(captured.vitrines.map(v=>v.code),["26","24"]);
 assert.equal(definition.physicalScope?.clearancePerDestination,true);
 assert.deepEqual(definition.physicalScope?.clearanceRequiredDestinations,packet.vitrines);
 assert.equal(readStarterGuideDefinition(vrajGuideContext.guideVersion).suggestions.filter(s=>s.kind==="row").length,40);
 assert.ok(currentReceiverGuideDefinitions("26").some(d=>d.context.guideVersion===captured.version));
 assert.ok(!currentReceiverGuideDefinitions("79").some(d=>d.context.guideVersion===captured.version));
 assert.throws(()=>assertGuidePhysicalScope(definition,[],["79"]),/Clear only/);
 assert.throws(()=>assertGuidePhysicalScope(definition,[{sourceId:captured.entries[0].sourceId,to:{kind:"vitrine",code:"79"}}]),/locked phase/);
});

test("approved sources retain two housing holds, source-only identity and provisional shelf precision",()=>{
 const f=fixture(),before=structuredClone(f.physical),guide=project(f);
 assert.equal(guide.entries.length,42);
 assert.equal(guide.entries.filter(e=>e.saintId===null).length,1);
 assert.equal(guide.entries.filter(e=>e.movementBlockedReason).length,2);
 for(const e of guide.entries.filter(e=>!e.movementBlockedReason))assert.doesNotThrow(()=>assertEastRemainderRecords([{sourceId:e.sourceId,to:{kind:"vitrine",code:e.destination}}],guide));
 assert.deepEqual(f.physical,before);
 assert.equal(operationalSpnShelfPacket.vitrines.flatMap(v=>v.allocations).length,350);
 const allocation=projectShelfPlanningContext(f.shelfPacket,f).cases.find(c=>c.code==="26")!.allocations.find(a=>a.sourceId===arm.sourceId)!;
 assert.equal(allocation.suggestedShelfIndex,5);
 assert.match(allocation.reviewAlerts[0].message,/unknown footprint/);
 assert.equal(packet.supplementalShelfAllocations[0].knownFootprint,null);
});

test("later destinations leave the old checklist; changed source evidence stays disabled",()=>{
 const f=fixture(),entry=packet.rows.find(e=>!e.movementBlockedReason&&e.sourceId!==arm.sourceId)!;
 const physical=f.physical.rows.find(r=>r.sourceId===entry.sourceId)!;
 const context=projectShelfPlanningContext(f.shelfPacket,{...f,additions:[{sourceId:entry.sourceId,saintId:entry.saintId,sourceRevision:physical.sourceRevision,vitrine:"80",shelf:null}]});
 const changed=projectEastRemainderGuide(f.current.placements,f.physical,context);
 assert.ok(!changed.entries.some(e=>e.sourceId===entry.sourceId));
 assert.equal(changed.outgoingDependencies?.find(e=>e.sourceId===entry.sourceId)?.proposedDestination,"80");
 physical.sourceRevision="b".repeat(64);
 const held=project(f).entries.find(e=>e.sourceId===entry.sourceId)!;
 assert.match(held.movementBlockedReason!,/Source data changed/);
 assert.throws(()=>assertEastRemainderRecords([{sourceId:entry.sourceId,to:{kind:"vitrine",code:entry.destination}}],project(f)),/changed/);
});

test("identity, verified-item and positive living-status conflicts remain independent holds",()=>{
 const f=fixture(),entry=packet.rows.find(e=>!e.movementBlockedReason&&e.sourceId!==arm.sourceId&&e.suggestedShelfIndex===1)!;
 const physical=f.physical.rows.find(r=>r.sourceId===entry.sourceId)!;
 const reason=()=>project(f).entries.find(e=>e.sourceId===entry.sourceId)!.movementBlockedReason;
 physical.identityChanged=true;assert.match(reason()!,/identity/i);
 physical.identityChanged=false;physical.verifiedItemIds=["verified-item"];assert.match(reason()!,/verified inventory/);
 physical.verifiedItemIds=[];f.current.membersById.set(entry.sourceId,{SamadhiDate:"still alive"});assert.match(reason()!,/living-status/);
});

test("complete arm-support requires fresh housing evidence even when the physical source fingerprint is unchanged",()=>{
 const f=fixture(),physical=f.physical.rows.find(r=>r.sourceId===arm.sourceId)!;
 assert.doesNotThrow(()=>assertEastRemainderRecords([{sourceId:arm.sourceId,to:{kind:"vitrine",code:"26"}}],project(f)));
 physical.housingEvidenceRevision="changed";
 let guide=project(f);
 assert.ok(guide.entries.find(e=>e.sourceId===arm.sourceId)?.movementBlockedReason);
 assert.throws(()=>assertEastRemainderRecords([{sourceId:arm.sourceId,to:{kind:"vitrine",code:"26"}}],guide),/changed/);
 // An invalidated housing interpretation must not resurrect historical37 as a newer curator decision.
 const context=projectShelfPlanningContext(f.shelfPacket,{...f,review:{...f.review,rows:f.review.rows.map(r=>r.sourceId===arm.sourceId?{...r,effectiveVitrine:"37"}:r)}});
 guide=projectEastRemainderGuide(f.current.placements,f.physical,context);
 assert.ok(guide.entries.some(e=>e.sourceId===arm.sourceId&&e.movementBlockedReason));
 assert.ok(!guide.outgoingDependencies?.some(e=>e.sourceId===arm.sourceId));
});

