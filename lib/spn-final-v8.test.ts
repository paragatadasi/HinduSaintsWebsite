import test from 'node:test';
import assert from 'node:assert/strict';
import proposal from '../data/museum/spn-room-proposal-final-v8.json';
import design from '../data/museum/spn-room-explorer-final-v8-design.json';
import {sourceContextFit,reconcileSpnRoomProposal} from './spn-room-proposal';
import {correctSpnProposal} from './spn-proposal-corrections';

test('v8 preserves source evidence and separates planning estimates',()=>{
 assert.equal(proposal.rows.length,1423);assert.equal(new Set(proposal.rows.map(r=>r.sourceId)).size,1423);
 assert.ok(Math.abs(proposal.rows.reduce((n,r)=>n+(r.share??0),0)-303)<.001);
 assert.ok(Math.abs(proposal.rows.reduce((n,r)=>n+(r.planningShelfEstimate??0),0)-318.5)<.001);
 assert.equal(proposal.validation.unknownOrdinaryFootprints,58);
 assert.equal(proposal.rows.find(r=>r.sourceId==='rec6IqZR7ahPTDfEI')?.vitrine,'70');
 assert.equal(proposal.rows.find(r=>r.sourceId==='recMo8X6ehasAq0cW')?.vitrine,'18');
 const v=proposal.rows.find(r=>r.sourceId==='rec7uMJLec4SDErel')!;assert.equal(v.tier,'Primary');assert.equal(v.vitrine,'8');assert.equal(v.baseline?.proposalRevision,'26f42c31b82637bf29361bea241640a17c99d8217115350676c6e6380477994d');
});
test('unknown sizes and curator changes never imply flexible capacity',()=>{
 const base={estimatedRequiredShelfShares:2,potentialFlexibleSpace:true,unknownPlanningFootprintSourceIds:['unknown']};
 assert.equal(sourceContextFit(base,false)?.flexible,false);assert.equal(sourceContextFit(base,true),null);
 assert.equal(sourceContextFit({...base,estimatedRequiredShelfShares:null},false),null);
 assert.equal(sourceContextFit({...base,unknownPlanningFootprintSourceIds:[],namedOnlyUnknownFootprintCount:1},false)?.flexible,false);
});
test('already incorporated correction leaves v8 fit ledger intact',()=>{
 const result=correctSpnProposal({proposal,designData:design});assert.deepEqual(result.proposal.indicators,proposal.indicators);
});
test('v8 keeps all source-context totals within the comparison reference without hiding uncertainty',()=>{
 for(const i of proposal.indicators){assert.ok(i.estimatedRequiredShelfShares<=5);const raw=proposal.rows.filter(r=>r.vitrine===i.vitrine).reduce((n,r)=>n+(r.share??0),0);assert.ok(Math.abs(raw-i.totalObservedShelfShares)<.001)}
 assert.equal(proposal.cityReview.filter(c=>c.remainingSplit).length,37);
 assert.equal(proposal.reviewedRelationshipPairs,99);
});

test('per-case source summaries follow final destinations',()=>{
 for(const i of proposal.indicators){
  const rows=proposal.rows.filter(r=>r.vitrine===i.vitrine);
  assert.deepEqual(i.unresolvedSourceRecordIds,rows.filter(r=>r.unresolved).map(r=>r.sourceId));
  assert.deepEqual(i.unknownShelfSourceRecordIds,rows.filter(r=>r.state==='unknown_shelf').map(r=>r.sourceId));
  assert.equal(i.namedOnlyUnknownFootprintCount,proposal.namedOnly.filter(r=>r.vitrine===i.vitrine).length);
 }
});
