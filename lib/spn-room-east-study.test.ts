import test from 'node:test';
import assert from 'node:assert/strict';
import baseline from '../data/museum/spn-room-proposal-v16-r1.json';
import study from '../data/museum/spn-room-proposal-east-v2.json';
import design from '../data/museum/spn-room-explorer-east-v2-design.json';
import {vitrineNeighborhoods} from './spn-room-explorer';
import {reconcileSpnRoomProposal,showFlexibleSpace} from './spn-room-proposal';
import type {MuseumSaintPlacement} from './museum-proposals';

test('East comparison preserves source identities, weights and protected housings',()=>{
 const original=new Map(baseline.rows.map(r=>[r.sourceId,r]));
 assert.equal(study.rows.length,1423);assert.equal(new Set(study.rows.map(r=>r.sourceId)).size,1423);
 assert.deepEqual(study.namedOnly,baseline.namedOnly);
 for(const row of study.rows){
  const before=original.get(row.sourceId)!;
  assert.equal(row.saintId,before.saintId);assert.equal(row.share,before.share);
  assert.equal(row.sourceVitrine,before.sourceVitrine);assert.equal(row.sourceShelf,before.sourceShelf);
  if(['30','31','64','68','69'].includes(before.vitrine))assert.equal(row.vitrine,before.vitrine);
 }
 assert.equal(Math.round(study.rows.reduce((n,r)=>n+(r.share??0),0)),303);
 assert.equal(study.rows.find(r=>r.sourceId==='recmarxKCZnFGzlo0')?.vitrine,'2');
 assert.equal(study.rows.find(r=>r.sourceId==='recQTaLJGkfBoAU2w')?.vitrine,'36');
 assert.equal(showFlexibleSpace('23',true,false),false);
});

test('study labels and navigation keep local families separate from operational groups',()=>{
 const option=design.options[0];
 assert.equal(study.reviewStatus,'comparison-study');assert.match(study.reviewNote,/still under review/);
 assert.deepEqual(vitrineNeighborhoods(option,'75').map(p=>p.unitId),['ramakrishna']);
 assert.deepEqual(vitrineNeighborhoods(option,'68'),[]);
 assert.equal(option.assignments.find(a=>a.number==='77')?.prime,false);
 assert.match(option.primeAnchors['77'].people,/Bhaktisiddhanta.*Prabhupada/);
 for(const id of ['cms0w7cw800w707qip4vr4swx','cms0w7en7035g07qiz6rl1u9d']){
  const rows=study.rows.filter(r=>r.saintId===id);
  assert.ok(rows.length);assert.ok(rows.every(r=>['Primary','Featured'].includes(r.tier)&&r.vitrine==='77'));
 }
});

test('exploring the alternative retains a newer curator destination without writes',()=>{
 const row=study.rows.find(r=>r.sourceId==='recmarxKCZnFGzlo0')!;
 const current={id:row.baseline!.placementId,saintId:row.saintId,name:row.name,tier:'Featured',section:row.section,
  curatorialFamily:row.baseline!.familyKey,spnRegionTags:row.baseline!.regionTags,
  arrangement:{status:'Planned',vitrine:'27',shelf:'B',proposalRevision:row.baseline!.proposalRevision}} as MuseumSaintPlacement;
 const before=JSON.stringify(current);
 const [result]=reconcileSpnRoomProposal([row],[current]);
 assert.equal(result.effectiveVitrine,'27');assert.match(result.reviewReason,/retained/);
 assert.equal(JSON.stringify(current),before);assert.equal(row.vitrine,'2');
});
