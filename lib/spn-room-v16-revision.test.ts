import test from 'node:test';
import assert from 'node:assert/strict';
import original from '../data/museum/spn-room-proposal-v16.json';
import revised from '../data/museum/spn-room-proposal-v16-r1.json';
import design from '../data/museum/spn-room-explorer-v16-r1-design.json';
import {proposalVersionLabel,vitrineNeighborhoods,vitrineConnectionPlaces} from './spn-room-explorer';
import {reconcileSpnRoomProposal} from './spn-room-proposal';
import type {MuseumSaintPlacement} from './museum-proposals';

const neemId='cms0w7jjj08x907qiyw8q9hae',source='recxjM8XNprzBWzuT';
test('revision changes only the approved source destination and retains all evidence',()=>{
 assert.equal(revised.rows.length,1423);assert.deepEqual(revised.namedOnly,original.namedOnly);
 assert.deepEqual(revised.rows.map(r=>r.sourceId===source?{...r,vitrine:'26'}:r),original.rows);
 assert.ok(revised.rows.filter(r=>r.saintId==='cms0w7d5x017b07qis69tnmlg').every(r=>r.vitrine==='5'));
 assert.equal(revised.rows.find(r=>r.sourceId===source)?.vitrine,'75');
 assert.equal(revised.indicators.find(i=>i.vitrine==='26')?.totalObservedShelfShares,4.5524);
 assert.equal(revised.indicators.find(i=>i.vitrine==='75')?.totalObservedShelfShares,1.3524);
 assert.deepEqual(revised.indicators.find(i=>i.vitrine==='75')?.unresolvedSourceRecordIds,original.indicators.find(i=>i.vitrine==='75')?.unresolvedSourceRecordIds);
 assert.ok(revised.provenance.some(p=>p.file==='spn-room-proposal-v16.json'));
});
test('Neem has local focus without prime-position or guru relationship claims',()=>{
 const option=design.options[0];
 assert.equal(option.assignments.find(a=>a.number==='75')?.prime,false);
 assert.match(option.primeAnchors['75'].people,/Neem/);
 assert.deepEqual(vitrineNeighborhoods(option,'75').map(p=>p.unitId),['neem_north_vraj']);
 assert.deepEqual(vitrineConnectionPlaces(option.drivers.find(d=>d.connection==='Core Kriya guru tree')!),[5]);
 const bridge=option.drivers.find(d=>d.connection==='North–Vraj lives')!;
 assert.equal(bridge.connectionKind,'thematic');assert.match(bridge.reason,/without implying a personal relationship/);
 assert.equal(proposalVersionLabel(revised.version),'v16 · revision 1');
});
test('newer curator destination still takes precedence over the approved revision',()=>{
 const row=revised.rows.find(r=>r.sourceId===source)!;
 const current={id:row.baseline!.placementId,saintId:neemId,name:row.name,tier:row.tier,section:row.section,
  curatorialFamily:row.baseline!.familyKey,spnRegionTags:row.baseline!.regionTags,
  arrangement:{status:'Planned',vitrine:'37',shelf:'A',proposalRevision:row.baseline!.proposalRevision}} as MuseumSaintPlacement;
 const before=JSON.stringify(current);
 const [result]=reconcileSpnRoomProposal([row],[current]);
 assert.equal(result.effectiveVitrine,'37');assert.match(result.reviewReason,/retained/);
 assert.equal(JSON.stringify(current),before);assert.equal(row.vitrine,'75');
});
