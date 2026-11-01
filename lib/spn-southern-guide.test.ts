import previousPacket from "../data/museum/spn-southern-guide-v1.json";
import test from "node:test";
import assert from "node:assert/strict";
import packet from "../data/museum/spn-southern-guide-v2.json";
import {southernGuideContext,southernGuideDefinition,southernMoveGuide,projectSouthernGuide,assertSouthernRecords,applySouthernLivingReview} from "./spn-southern-guide";
import {readStarterGuideDefinition,currentReceiverGuideDefinitions} from "./spn-starter-guide-registry";
import {assertGuidePhysicalScope} from "./spn-datta-guide";
import {projectCompanionAdditions} from "./museum-companion-addition-projection";
import type {CompanionRow,PhysicalState} from "./spn-move-guide";
import {assertSpnMovementAllowed} from "./spn-movement-holds";

function fixture(){
 const rows:CompanionRow[]=packet.rows.map(row=>({sourceId:row.sourceId,saintId:row.saintId,name:row.name,original:{kind:"vitrine",code:"33",label:"Vitrine 33",shelf:"A"},current:{kind:"table",code:"staging-area",label:"Staging area"},currentBasis:"confirmed",currentVersion:2,currentRevision:"live",sourceRevision:row.sourceRevision,fixedHousing:false,verifiedItemIds:[],identityChanged:false}));
 const physical:PhysicalState={rows,unmappedCurrentLocations:[]};
 const review={rows:packet.rows.map(row=>({sourceId:row.sourceId,saintId:row.saintId,effectiveVitrine:row.capturedProposalDestination,reviewReason:""})),proposal:{pendingPlacements:[] as {sourceId:string;reason:string}[]}};
 return {physical,review};
}

test("Southern guide registers only the eight approved receiving cases",()=>{
 assert.equal(southernMoveGuide.entries.length,146);
 assert.deepEqual(southernMoveGuide.vitrines.map(v=>v.code),["56","55","54","53","52","51","62","57"]);
 assert.deepEqual(["51","52","53","54","55","56","57","62"].map(code=>packet.rows.filter(r=>r.destination===code).length),[27,20,16,11,14,16,17,25]);
 assert.equal(readStarterGuideDefinition(southernGuideContext.guideVersion),southernGuideDefinition);
 for(const v of southernMoveGuide.vitrines){
  assert.ok(currentReceiverGuideDefinitions(v.code).includes(southernGuideDefinition));
  assertGuidePhysicalScope(southernGuideDefinition,[],[v.code]);
 }
 for(const code of ["61","73","46"])assert.throws(()=>assertGuidePhysicalScope(southernGuideDefinition,[],[code]));
 assert.equal(packet.reserveSourceIds.length,13);
 for(const id of packet.reserveSourceIds)assert.equal(southernGuideDefinition.physicalScope?.destinations[id],undefined);
 assert.deepEqual(southernMoveGuide.reportedPlacements,[]);
 assert.ok(packet.groups.every(g=>g.edges.length===0));
 assert.ok(!southernMoveGuide.entries.some(e=>e.sourceId==="recXXBTDJy7Tp8LoG"));
});

test("current locations and newer curator destinations supersede the captured guide",()=>{
 const {physical,review}=fixture();const before=JSON.stringify(physical);
 let guide=projectSouthernGuide([],physical,review);const first=guide.entries[0];
 assert.equal(first.currentLocation?.kind,"table");
 assertSouthernRecords([{sourceId:first.sourceId,to:{kind:"vitrine",code:"57"}}],guide);
 assert.throws(()=>assertSouthernRecords([{sourceId:first.sourceId,to:{kind:"vitrine",code:"57",shelf:"2"}}],guide));
 review.rows[0].effectiveVitrine="3";guide=projectSouthernGuide([],physical,review);
 assert.ok(!guide.entries.some(e=>e.sourceId===first.sourceId));
 assert.equal(guide.outgoingDependencies?.[0].proposedDestination,"3");
 assert.equal(JSON.stringify(physical),before);
});

test("unlinked Nanna stays visible at candidate51 without overwriting native67 or allowing movement",()=>{
 const {physical,review}=fixture();const id="recwoqG8uSC9Va2Vj";
 const guide=projectSouthernGuide([],physical,review);
 const additions=[{sourceId:id,vitrine:"67"}] as Parameters<typeof projectCompanionAdditions>[1];
 const projected=projectCompanionAdditions({south:guide},additions,guide.entries).south;
 const entry=projected.entries.find(e=>e.sourceId===id)!;
 assert.equal(entry.destination,"51");assert.equal(entry.reviewOnly,true);
 assert.ok(entry.reviewNotes?.some(n=>n.includes("67")));
 assert.throws(()=>assertSouthernRecords([{sourceId:id,to:{kind:"vitrine",code:"51"}}],projected));
 assert.ok(projected.vitrines.find(v=>v.code==="51")?.families.some(g=>g.sourceIds.includes(id)));
});

test("stale identities, evidence and item restrictions cannot confirm a move",()=>{
 for(const change of ["revision","identity","pending","fixed","item","review"]){
  const {physical,review}=fixture();const row=physical.rows[0];
  if(change==="revision")row.sourceRevision="changed";
  if(change==="identity")row.saintId="different";
  if(change==="pending")review.proposal.pendingPlacements.push({sourceId:row.sourceId,reason:"Review needed"});
  if(change==="fixed")row.fixedHousing=true;
  if(change==="item")row.verifiedItemIds=["item"];
  if(change==="review")review.rows[0].reviewReason="Review needed";
  assert.throws(()=>assertSouthernRecords([{sourceId:row.sourceId,to:{kind:"vitrine",code:"57"}}],projectSouthernGuide([],physical,review)));
 }
});

test("Manick holding verification applies even outside the Southern guide",()=>{
 const {physical,review}=fixture();const id="recI0X02xdySqEQru";
 assert.ok(projectSouthernGuide([],physical,review).entries.find(e=>e.sourceId===id)?.movementBlockedReason);
 assert.throws(()=>assertSpnMovementAllowed(id,null,{kind:"vitrine",code:"55",label:"Vitrine 55"}),/museum holding/);
 assert.equal(packet.rows.find(r=>r.sourceId==="recPoRUcHgwzVLQaQ")?.city,"Thailand?");
 assert.equal(packet.rows.find(r=>r.sourceId==="recQtg0xeQPQa16wA")?.city,"Country under review");
});


test("Southern refresh preserves prior clearances and makes the old guide read-only",()=>{
 assert.equal(readStarterGuideDefinition("spn-southern-2026-11-01-v1").readOnly,true);
 assert.deepEqual(southernGuideDefinition.physicalScope?.previousClearanceVersions,["spn-southern-2026-11-01-v1"]);
 assert.ok(southernMoveGuide.vitrines.every(v=>v.placementGuidance&&v.fitGuidance));
});

test("Chandra living review survives general life-status projection without changing physical state",()=>{
 const {physical,review}=fixture();const before=JSON.stringify(physical);
 const guide=projectSouthernGuide([],physical,review);
 guide.entries.find(e=>e.sourceId==="rec1WWN7Xb1ZRGGhA")!.lifeStatus={tag:null,basis:"Unknown"};
 const updated=applySouthernLivingReview(guide);
 assert.equal(updated.entries.find(e=>e.sourceId==="rec1WWN7Xb1ZRGGhA")?.lifeStatus?.tag,"Still alive");
 assert.equal(guide.entries.find(e=>e.sourceId==="rec1WWN7Xb1ZRGGhA")?.lifeStatus?.tag,null);
 assert.equal(JSON.stringify(physical),before);
 assert.equal(updated.entries.find(e=>e.sourceId==="rec2YQrUqUzdITsHZ")?.currentLocation?.kind,"table");
});


test("only the approved sixteen proposal changes alter the Southern roster",()=>{
 const before=new Map(previousPacket.rows.map(row=>[row.sourceId,row]));
 const changed=packet.rows.filter(row=>before.get(row.sourceId)?.destination!==row.destination);
 assert.equal(changed.length,16);
 assert.deepEqual(["54","57","53","56"].map(code=>changed.filter(row=>row.destination===code).length),[4,9,2,1]);
 assert.deepEqual(packet.rows.filter(row=>!before.has(row.sourceId)).map(row=>row.sourceId),["rec2YQrUqUzdITsHZ"]);
 for(const row of previousPacket.rows){
  const updated=packet.rows.find(candidate=>candidate.sourceId===row.sourceId)!;
  assert.equal(updated.saintId,row.saintId);
  assert.equal(updated.sourceRevision,row.sourceRevision);
  assert.equal(updated.movementBlockedReason,row.movementBlockedReason);
  if(row.destination==="57")assert.equal(updated.destination,"57");
 }
});


test("unlocated holdings cannot be checked off until their presence is verified",()=>{
 const {physical,review}=fixture();
 for(const id of ["recxP4lgXzCTsJ95J","recOFEIOFhdTwZXa1"]){
  physical.rows.find(r=>r.sourceId===id)!.current=null;
  const guide=projectSouthernGuide([],physical,review);
  assert.match(guide.entries.find(e=>e.sourceId===id)!.movementBlockedReason!,/Locate and verify/);
 }
});
