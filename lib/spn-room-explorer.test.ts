import test from 'node:test';
import assert from 'node:assert/strict';
import {explorerSaints,vitrineConnectionPlaces,vitrineNeighborhoods} from './spn-room-explorer';
import {reconcileSpnRoomProposal} from './spn-room-proposal';
import data from '../data/museum/spn-room-proposal-v15.json';
import design from '../data/museum/spn-room-explorer-design.json';
import v16 from '../data/museum/spn-room-explorer-v16-design.json';

test('operational collections never become neighborhoods or family navigation',()=>{
 const option=v16.options[0];
 for(const n of ['24','75','30','31','64','68','69'])assert.deepEqual(vitrineNeighborhoods(option,n),[]);
 assert.deepEqual(vitrineNeighborhoods(option,'6').map(p=>p.unitId),['braj']);
 assert.deepEqual(vitrineNeighborhoods(option,'5').map(p=>p.unitId),['kriya']);
 assert.deepEqual(vitrineNeighborhoods(option,'3').map(p=>p.unitId),['datta']);
 assert.deepEqual(vitrineNeighborhoods(design.options[0],'75').map(p=>p.unitId),['kriya']);
 const forward=vitrineNeighborhoods(option,'78').map(p=>p.unitId).sort();
 assert.ok(forward.length>1);
 assert.deepEqual(vitrineNeighborhoods({...option,displayPackets:[...option.displayPackets].reverse()},'78').map(p=>p.unitId).sort(),forward);
 assert.deepEqual(vitrineNeighborhoods({...option,displayPackets:[{label:'Unclassified collection',group:'N',cases:[75]}]},'75'),[]);
});

test('Kriya continuation context is not represented as actual holdings at75',()=>{
 const driver=v16.options[0].drivers.find(d=>d.connection==='Core Kriya guru tree')!;
 assert.deepEqual(driver.contextPlaces,[75]);assert.deepEqual(vitrineConnectionPlaces(driver),[5]);
});

test('explorer keeps source coverage and exact primary and secondary placements',()=>{
 const rows=reconcileSpnRoomProposal([...data.rows,...data.namedOnly],[]);
 const saints=explorerSaints(rows);
 assert.equal(saints.flatMap(s=>s.observations).length,1426);
 assert.equal(new Set(saints.filter(s=>s.tier==='Primary').map(s=>s.saintId)).size,90);
 assert.equal(new Set(saints.filter(s=>s.tier==='Secondary').map(s=>s.saintId)).size,191);
 const yogananda=saints.find(s=>s.name==='Sri Paramahamsa Yogananda')!;
 assert.deepEqual(yogananda.caseEnvelope,['5']);
 const live={...rows.find(r=>r.name==='Sri Paramahamsa Yogananda')!,effectiveVitrine:'14',name:'Curator name',tier:'Secondary',reviewReason:'Current curator destination retained'};
 const retained=explorerSaints([live])[0];
 assert.deepEqual(retained.caseEnvelope,['14']);assert.equal(retained.name,'Curator name');assert.equal(retained.tier,'Secondary');
});
test('review cohorts stay separate even when a canonical saint is shared',()=>{
 const row=reconcileSpnRoomProposal([data.rows[0]],[])[0];
 const saints=explorerSaints([row,{...row,sourceId:'review-record',unresolved:true}]);
 assert.equal(saints.length,2);assert.equal(saints.filter(s=>s.sourceAttributionHold).length,1);
});
test('vitrine 5 shows its Kriya rationale, not general policy or a passing visitor route',()=>{
 const drivers=design.options[0].drivers.filter(d=>vitrineConnectionPlaces(d).includes(5));
 assert.deepEqual(drivers.map(d=>d.connection),['Kriya together; Himalayan masters toward the cave']);
 assert.ok(design.options[0].drivers.some(d=>d.connection==='Upper family displays with labelled lower review cohorts'));
});
