import test from 'node:test';
import assert from 'node:assert/strict';
import p15 from '../data/museum/spn-room-proposal-v15.json';
import d15 from '../data/museum/spn-room-explorer-design.json';
import p16 from '../data/museum/spn-room-proposal-v16.json';
import d16 from '../data/museum/spn-room-explorer-v16-design.json';
import pr1 from '../data/museum/spn-room-proposal-v16-r1.json';
import dr1 from '../data/museum/spn-room-explorer-v16-r1-design.json';
import pe from '../data/museum/spn-room-proposal-east-v2.json';
import de from '../data/museum/spn-room-explorer-east-v2-design.json';
import pv from '../data/museum/spn-room-proposal-vraj-girnar-v1.json';
import dv from '../data/museum/spn-room-explorer-vraj-girnar-v1-design.json';
import {correctSpnProposal,sankaranyaColocation as correction} from './spn-proposal-corrections';
import {reconcileSpnRoomProposal} from './spn-room-proposal';
import type {MuseumSaintPlacement} from './museum-proposals';
const releases=[{proposal:p15,designData:d15},{proposal:p16,designData:d16},{proposal:pr1,designData:dr1},{proposal:pe,designData:de},{proposal:pv,designData:dv}];

test('accepted correction updates all five versions without changing other source evidence',()=>{
 for(const release of releases){
  const before=JSON.stringify(release),fixed=correctSpnProposal(release);
  const moved=fixed.proposal.rows.find(r=>r.sourceId===correction.sourceId)!;
  const original=release.proposal.rows.find(r=>r.sourceId===correction.sourceId)!;
  assert.equal(moved.vitrine,fixed.proposal.rows.find(r=>r.saintId===correction.targetSaintId)?.vitrine);
  assert.deepEqual(fixed.proposal.rows.map(r=>r.sourceId===correction.sourceId?{...r,vitrine:original.vitrine}:r),release.proposal.rows);
  assert.equal(moved.tier,original.tier);assert.deepEqual(fixed.proposal.namedOnly,release.proposal.namedOnly);
  assert.equal(fixed.proposal.indicators.find(i=>i.vitrine===moved.vitrine)?.totalObservedShelfShares,3.5484);
  assert.equal(JSON.stringify(release),before);
  assert.deepEqual(correctSpnProposal(fixed),fixed);
 }
});

test('focus and rationale no longer place Sankaranya among the early Chaitanya group',()=>{
 for(const release of releases){
  const fixed=correctSpnProposal(release),row=fixed.proposal.rows.find(r=>r.sourceId===correction.sourceId)!;
  for(const option of fixed.designData.options){
   for(const [number,focus] of Object.entries(option.primeAnchors))if(number!==row.vitrine)assert.ok(!focus.people.includes(row.name));
   assert.match(Object.entries(option.primeAnchors).find(([number])=>number===row.vitrine)![1].reason,/distinct from.*Vishvarupa/);
  }
  assert.equal(String(fixed.designData.placements.find(p=>p.saintId===row.saintId)?.vitrine),row.vitrine);
 }
});

test('the correction follows the target in a different future option and rejects ambiguous targets',()=>{
 const draft=structuredClone(releases[0]);
 for(const row of draft.proposal.rows)if(row.saintId===correction.targetSaintId)row.vitrine='42';
 assert.equal(correctSpnProposal(draft).proposal.rows.find(r=>r.sourceId===correction.sourceId)?.vitrine,'42');
 const target=draft.proposal.rows.find(r=>r.saintId===correction.targetSaintId)!;
 draft.proposal.rows.push({...target,sourceId:'other-source',vitrine:'43'});
 assert.throws(()=>correctSpnProposal(draft),/one proposed destination/);
});

test('a later curator destination wins over the co-location correction without physical writes',()=>{
 const fixed=correctSpnProposal(releases[0]);
 const row=fixed.proposal.rows.find(r=>r.sourceId===correction.sourceId)!;
 const live={id:row.baseline!.placementId,saintId:row.saintId,name:row.name,section:row.section,tier:'Featured',
  curatorialFamily:row.baseline!.familyKey,spnRegionTags:row.baseline!.regionTags,
  arrangement:{status:'Planned',vitrine:'41',shelf:'A',proposalRevision:row.baseline!.proposalRevision}} as MuseumSaintPlacement;
 const before=JSON.stringify(live),[result]=reconcileSpnRoomProposal([row],[live]);
 assert.equal(result.vitrine,'32');assert.equal(result.effectiveVitrine,'41');assert.match(result.reviewReason,/retained/);
 assert.equal(JSON.stringify(live),before);assert.equal(result.tier,'Primary');
});

test('a saved curator destination still wins for a saint in the swapped groups',()=>{
 const fixed=correctSpnProposal(releases[4]);
 const row=fixed.proposal.rows.find(r=>r.vitrine==='37'&&r.baseline&&r.saintId)!;
 const live={id:row.baseline!.placementId,saintId:row.saintId,name:row.name,section:row.section,tier:row.tier==='Primary'?'Featured':row.tier,
  curatorialFamily:row.baseline!.familyKey,spnRegionTags:row.baseline!.regionTags,
  arrangement:{status:'Implemented',vitrine:'26',shelf:'B',proposalRevision:row.baseline!.proposalRevision}} as MuseumSaintPlacement;
 const before=JSON.stringify(live),[result]=reconcileSpnRoomProposal([row],[live]);
 assert.equal(result.vitrine,'37');assert.equal(result.effectiveVitrine,'26');assert.equal(result.currentShelf,'B');
 assert.equal(result.currentStatus,'Implemented');assert.match(result.reviewReason,/retained/);
 assert.equal(JSON.stringify(live),before);
});
