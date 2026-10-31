import test from "node:test";
import assert from "node:assert/strict";
import packet from "../data/museum/spn-approved-regional-pending-transfers-v1.json";
import {regionalPendingTransfer} from "./spn-regional-pending-transfers";
import {buildLatestSpnReview} from "./spn-reviewed-proposal";
import type {MuseumSaintPlacement} from "./museum-proposals";

const placement:MuseumSaintPlacement={id:packet.sourceId,sourceRecordId:packet.sourceId,saintId:packet.saintId,normalizedPlaces:[],
 name:packet.name,section:"Datta Tradition",alternatives:[],tier:"Tertiary",confidence:"high",rationale:"",note:"",familyId:"",curatorialFamily:"",familySize:1,spiritualRegions:[],sampradaya:"",needsResearch:false,
 arrangement:{revision:packet.arrangementRevision,proposalRevision:packet.proposalRevision,status:"Proposed",vitrine:"",shelf:"",familyKey:"",confirmedAt:null,inventoryAcknowledged:false}};
const source={sourceId:packet.sourceId,saintId:packet.saintId,sourceRevision:packet.sourceRevision,identityChanged:false};

test("exact approved binding becomes regional pending without mutating evidence",()=>{
 const before=JSON.stringify({placement,source});
 const result=regionalPendingTransfer([placement],[source],[],"82");
 assert.equal(result?.label,packet.label);
 assert.equal(result?.supersededDestination,"82");
 assert.equal(JSON.stringify({placement,source}),before);
});

test("missing, ambiguous, changed identity or changed source cannot hide a proposal",()=>{
 assert.equal(regionalPendingTransfer([], [source],[],"82"),null);
 assert.equal(regionalPendingTransfer([placement,placement],[source],[],"82"),null);
 for(const change of [{saintId:"other"},{sourceRevision:"new"},{identityChanged:true}])
  assert.equal(regionalPendingTransfer([placement],[{...source,...change}],[],"82"),null);
 assert.equal(regionalPendingTransfer([placement],[],[],"82"),null);
 assert.equal(regionalPendingTransfer([{...placement,saintId:"other"}],[source],[],"82"),null);
});

test("later curator arrangements and explicit destinations always win",()=>{
 for(const field of ["revision","proposalRevision"] as const){
  const changed={...placement,arrangement:{...placement.arrangement!,[field]:"new"}};
  assert.equal(regionalPendingTransfer([changed],[source],[],"82"),null);
 }
 for(const vitrine of ["82","54"])
  assert.equal(regionalPendingTransfer([placement],[source],[{sourceId:source.sourceId,vitrine}],"82"),null);
 assert.equal(regionalPendingTransfer([placement],[source],[],"54"),null);
});

test("review withholds only the captured regional transfer and preserves baseline",()=>{
 const before=buildLatestSpnReview([]);
 assert.equal(before.rows.find(row=>row.sourceId===source.sourceId)?.effectiveVitrine,"82");
 const after=buildLatestSpnReview([placement],[],[source]);
 assert.equal(after.rows.some(row=>row.sourceId===source.sourceId),false);
 assert.match(after.proposal.pendingPlacements.find(row=>row.sourceId===source.sourceId)?.reason??"",/South.*Andhra/);
 assert.deepEqual(after.rows.map(row=>row.sourceId),before.rows.filter(row=>row.sourceId!==source.sourceId).map(row=>row.sourceId));
 const overridden=buildLatestSpnReview([placement],[{sourceId:source.sourceId,vitrine:"54",shelf:null}],[source]);
 assert.equal(overridden.rows.find(row=>row.sourceId===source.sourceId)?.effectiveVitrine,"54");
});
