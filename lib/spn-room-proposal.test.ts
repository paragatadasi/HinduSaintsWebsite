import test from 'node:test';
import assert from 'node:assert/strict';
import data from '../data/museum/spn-room-proposal-v15.json';
import {reconcileSpnRoomProposal,showFlexibleSpace,type ProposalObservation} from './spn-room-proposal';
import type {MuseumSaintPlacement} from './museum-proposals';
const proposal=data.rows.find(r=>r.baseline&&r.saintId)! as ProposalObservation;
function live():MuseumSaintPlacement{return {id:proposal.baseline!.placementId,saintId:proposal.saintId!,name:proposal.name,section:proposal.section,
 tier:proposal.baseline!.tier==='Primary'?'Featured':proposal.baseline!.tier as MuseumSaintPlacement['tier'],familyId:proposal.baseline!.familyKey,curatorialFamily:proposal.baseline!.familyKey,
 spnRegionTags:proposal.baseline!.regionTags,arrangement:{revision:proposal.baseline!.revision,proposalRevision:proposal.baseline!.proposalRevision,status:'Proposed',vitrine:'',shelf:'',familyKey:'',confirmedAt:null,inventoryAcknowledged:false},
 alternatives:[],confidence:'',rationale:'',note:'',familySize:0,spiritualRegions:[],sampradaya:'',normalizedPlaces:[],needsResearch:false};}
test('v15 preserves every source observation and protected-space exclusions',()=>{
 assert.equal(data.rows.length,1423);assert.equal(new Set(data.rows.map(r=>r.sourceId)).size,1423);
 assert.equal(data.indicators.length,82);
 for(const number of ['23','30','31','64','68','69','83','84','85'])assert.equal(showFlexibleSpace(number,true,false),false);
 assert.equal(data.indicators.filter(i=>i.hasUnresolvedHoldings).length,27);
 assert.equal(data.indicators.filter(i=>i.potentialFlexibleSpace).length,30);
 const named=[...data.rows,...data.namedOnly];
 assert.equal(new Set(named.filter(r=>r.saintId&&['Primary','Featured'].includes(r.tier)).map(r=>r.saintId)).size,90);
 assert.equal(new Set(named.filter(r=>r.saintId&&r.tier==='Secondary').map(r=>r.saintId)).size,191);
 assert.equal(data.namedOnly.length,3);assert.ok(data.namedOnly.every(r=>r.sourceId===''&&r.share===null));
 assert.ok(Math.abs(data.rows.reduce((sum,r)=>sum+(r.share??0),0)-303)<1e-8);
 for(const i of data.indicators)assert.deepEqual(data.rows.filter(r=>r.vitrine===i.vitrine&&r.unresolved).map(r=>r.sourceId).sort(),[...i.unresolvedSourceRecordIds].sort());
});
test('unchanged baseline does not invent a current destination',()=>{
 const [result]=reconcileSpnRoomProposal([proposal],[live()]);assert.equal(result.reviewReason,'');assert.equal(result.currentVitrine,'');assert.equal(result.effectiveVitrine,proposal.vitrine);
});
test('current curator destination wins and neither source nor live record is mutated',()=>{
 const row=live();row.arrangement={...row.arrangement!,status:'Planned',vitrine:'99',revision:'new'};
 const before=JSON.stringify(row),base=JSON.stringify(proposal);
 const [result]=reconcileSpnRoomProposal([proposal],[row]);assert.equal(result.effectiveVitrine,'99');assert.match(result.reviewReason,/retained/);
 assert.equal(JSON.stringify(row),before);assert.equal(JSON.stringify(proposal),base);
 assert.equal(showFlexibleSpace(proposal.vitrine,true,true),false);
});
test('new region overrides and tier changes remain live and flagged',()=>{
 const row=live();row.spnRegionTags=['The South'];row.tier='Featured';row.section='Changed section';
 const [result]=reconcileSpnRoomProposal([proposal],[row]);assert.deepEqual(result.regions,['The South']);assert.equal(result.tier,'Primary');assert.equal(result.section,'Changed section');assert.match(result.reviewReason,/changed/);
});
test('missing canonical records remain visible for review without identity reassignment',()=>{
 const [result]=reconcileSpnRoomProposal([proposal],[]);assert.match(result.reviewReason,/reconciliation/);assert.equal(result.sourceId,proposal.sourceId);
});
