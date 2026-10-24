import test from 'node:test';
import assert from 'node:assert/strict';
import {explorerSaints,vitrineConnectionPlaces} from './spn-room-explorer';
import {reconcileSpnRoomProposal} from './spn-room-proposal';
import data from '../data/museum/spn-room-proposal-v15.json';
import design from '../data/museum/spn-room-explorer-design.json';

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
