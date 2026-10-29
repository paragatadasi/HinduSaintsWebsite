import test from "node:test";
import assert from "node:assert/strict";
import packet from "../data/museum/spn-northern-voyage-approved-v19.json";
import {projectNorthernPendingReview} from "./spn-pending-review-projection";
import {reconcileSpnRoomProposal,type ProposalObservation} from "./spn-room-proposal";
import type {MuseumSaintPlacement} from "./museum-proposals";
const source:ProposalObservation={sourceId:packet.pendingReceiverSourceIds[0],saintId:"saint",name:"Review holding",vitrine:"19",tier:"Tertiary",section:"Section",sourceVitrine:"34",sourceShelf:"B",unresolved:true,allocationKind:"review",share:null,state:"unknown",baseline:{placementId:"placement",section:"Section",tier:"Tertiary",familyKey:"",regionTags:[],revision:"captured",proposalRevision:"proposal"}};
source.baseline=packet.assignments.find(row=>row.sourceId===source.sourceId)!.capturedBaseline;
const rows=reconcileSpnRoomProposal([source],[],{acceptedBaseline:true});
test("all eleven review IDs are unique and pending is not a location write",()=>{
 assert.equal(packet.pendingReceiverSourceIds.length,11);assert.equal(new Set(packet.pendingReceiverSourceIds).size,11);
 const before=JSON.stringify(rows);const result=projectNorthernPendingReview(rows,[]);
 assert.equal(result.rows.length,0);assert.equal(result.pendingPlacements.length,1);
 assert.equal(JSON.stringify(rows),before);assert.equal(rows[0].sourceVitrine,"34");assert.equal(packet.physicalWrites,false);
});
test("an exact source alternative or addition releases the pending destination",()=>{
 const result=projectNorthernPendingReview(rows,[],[{sourceId:source.sourceId,vitrine:"68"}]);
 assert.equal(result.rows.length,1);assert.equal(result.pendingPlacements.length,0);assert.equal(result.rows[0].unresolved,true);
 assert.equal(projectNorthernPendingReview(rows,[],[{sourceId:"other-observation",vitrine:"68"}]).pendingPlacements.length,1);
});
test("newer explicit arrangement survives while captured or Proposed fallback does not",()=>{
 const current={id:source.baseline!.placementId,saintId:"saint",arrangement:{status:"Planned",vitrine:"68",revision:"newer"}} as MuseumSaintPlacement;
 assert.equal(projectNorthernPendingReview(rows,[current]).pendingPlacements.length,0);
 assert.equal(projectNorthernPendingReview(rows,[{...current,arrangement:{...current.arrangement!,revision:source.baseline!.revision}}]).pendingPlacements.length,1);
 assert.equal(projectNorthernPendingReview(rows,[{...current,arrangement:{...current.arrangement!,status:"Proposed"}}]).pendingPlacements.length,1);
});
