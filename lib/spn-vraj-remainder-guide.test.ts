import test from "node:test";
import assert from "node:assert/strict";
import packet from "../data/museum/spn-vraj-remainder-guide-v1.json";
import shelves from "../data/museum/spn-vraj-east-shelves-v1.json";
import {vrajRemainderMoveGuide as captured,vrajRemainderGuideContext,projectVrajRemainderGuide,assertVrajRemainderRecords} from "./spn-vraj-remainder-guide";
import {readStarterGuideDefinition,currentReceiverGuideDefinitions} from "./spn-starter-guide-registry";
import {vrajGuideContext} from "./spn-vraj-guide";
import {assertGuidePhysicalScope} from "./spn-datta-guide";
import {projectShelfPlanningContext} from "./museum-shelf-planning-context";
import type {MuseumSaintPlacement} from "./museum-proposals";
import type {PhysicalState} from "./spn-move-guide";
import type {ExplorerObservation} from "./spn-room-proposal";

function fixture(){
 const current={placements:packet.rows.flatMap(row=>row.baseline&&row.saintId?[{id:row.sourceId,sourceRecordId:row.sourceId,saintId:row.saintId,name:row.name,section:row.section,tier:row.baseline.tier,curatorialFamily:row.baseline.familyKey,familyId:row.baseline.familyKey,familySize:1,alternatives:[],confidence:"High",rationale:"",note:"",spiritualRegions:[],normalizedPlaces:[row.city],sampradaya:"",needsResearch:false,arrangement:{status:"Proposed",vitrine:"",shelf:"",familyKey:row.baseline.familyKey,revision:row.baseline.revision,proposalRevision:row.baseline.proposalRevision,confirmedAt:null,inventoryAcknowledged:false}} as MuseumSaintPlacement]:[]),membersById:new Map(packet.rows.map(row=>[row.sourceId,{SamadhiDate:"2000"}]))};
 const physical:PhysicalState={rows:packet.rows.map(row=>({sourceId:row.sourceId,saintId:row.saintId,name:row.name,original:{kind:"vitrine",code:"12",label:"Vitrine12"},current:{kind:"table",code:"staging-area",label:"Staging area"},currentBasis:"confirmed",currentVersion:1,currentRevision:"a".repeat(64),sourceRevision:row.sourceRevision!,fixedHousing:false,verifiedItemIds:[],identityChanged:false})),unmappedCurrentLocations:[]};
 const review={rows:packet.rows.map(row=>({...row,effectiveVitrine:row.destination})) as unknown as ExplorerObservation[],pendingPlacements:[]};
 const shelfPacket={...shelves,vitrines:shelves.vitrines.filter(v=>packet.vitrines.includes(v.code))};
 return {current,physical,review,shelfPacket};
}
function project(f:ReturnType<typeof fixture>){return projectVrajRemainderGuide(f.current.placements,f.physical,projectShelfPlanningContext(f.shelfPacket,f));}

test("remainder registers exactly98 reviewed sources and five independently cleared receivers",()=>{
 const definition=readStarterGuideDefinition(vrajRemainderGuideContext.guideVersion);
 assert.equal(captured.entries.length,98);
 assert.deepEqual(captured.vitrines.map(v=>v.code),["32","33","34","35","38"]);
 assert.equal(definition.physicalScope?.clearancePerDestination,true);
 assert.deepEqual(definition.physicalScope?.clearanceRequiredDestinations,packet.vitrines);
 assert.equal(readStarterGuideDefinition(vrajGuideContext.guideVersion).suggestions.filter(s=>s.kind==="row").length,40);
 assert.equal(definition.readOnly,true);
 assert.ok(!currentReceiverGuideDefinitions("32").some(d=>d.context.guideVersion===captured.version));
 assert.ok(!currentReceiverGuideDefinitions("79").some(d=>d.context.guideVersion===captured.version));
 assert.throws(()=>assertGuidePhysicalScope(definition,[],["79"]),/Clear only/);
 assert.throws(()=>assertGuidePhysicalScope(definition,[{sourceId:captured.entries[0].sourceId,to:{kind:"vitrine",code:"79"}}]),/locked phase/);
});

test("unchanged approved sources stay actionable without converting null identities or captured shelves into physical facts",()=>{
 const f=fixture(),before=structuredClone(f.physical),guide=project(f);
 assert.equal(guide.entries.length,98);
 assert.equal(guide.entries.filter(e=>e.saintId===null).length,2);
 assert.ok(guide.entries.every(e=>!e.movementBlockedReason));
 for(const e of guide.entries)assert.doesNotThrow(()=>assertVrajRemainderRecords([{sourceId:e.sourceId,to:{kind:"vitrine",code:e.destination}}],guide));
 assert.deepEqual(f.physical,before);
 assert.match(guide.vitrines.find(v=>v.code==="33")!.summary,/unknown footprint/);
 assert.match(guide.vitrines.find(v=>v.code==="35")!.summary,/exceeds/);
});

test("newer destinations leave the old checklist, while stale source evidence is visibly held and server-rejected",()=>{
 const f=fixture(),entry=captured.entries[0];
 const context=projectShelfPlanningContext(f.shelfPacket,{...f,additions:[{sourceId:entry.sourceId,saintId:entry.saintId,sourceRevision:f.physical.rows[0].sourceRevision,vitrine:"80",shelf:null}]});
 let guide=projectVrajRemainderGuide(f.current.placements,f.physical,context);
 assert.ok(!guide.entries.some(e=>e.sourceId===entry.sourceId));
 assert.equal(guide.outgoingDependencies?.[0].proposedDestination,"80");
 assert.throws(()=>assertVrajRemainderRecords([{sourceId:entry.sourceId,to:{kind:"vitrine",code:entry.destination}}],guide),/changed/);
 f.physical.rows[0].sourceRevision="b".repeat(64);guide=project(f);
 assert.match(guide.entries[0].movementBlockedReason!,/Source data changed/);
 assert.throws(()=>assertVrajRemainderRecords([{sourceId:entry.sourceId,to:{kind:"vitrine",code:entry.destination}}],guide),/changed/);
});

test("identity changes, verified items and newly living top suggestions retain independent holds",()=>{
 const f=fixture(),entry=captured.entries[0];f.physical.rows[0].identityChanged=true;
 assert.match(project(f).entries[0].movementBlockedReason!,/identity/i);
 f.physical.rows[0].identityChanged=false;f.physical.rows[0].verifiedItemIds=["verified-item"];
 assert.match(project(f).entries[0].movementBlockedReason!,/verified inventory/);
 f.physical.rows[0].verifiedItemIds=[];f.current.membersById.set(entry.sourceId,{SamadhiDate:"still alive"});
 assert.match(project(f).entries[0].movementBlockedReason!,/living-status/);
});
