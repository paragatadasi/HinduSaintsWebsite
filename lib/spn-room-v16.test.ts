import test from 'node:test';
import assert from 'node:assert/strict';
import previous from '../data/museum/spn-room-proposal-v15.json';
import current from '../data/museum/spn-room-proposal-v16.json';
import design from '../data/museum/spn-room-explorer-v16-design.json';
import questions from '../data/museum/spn-curator-questions.json';

test('v16 conserves source observations, named-only guards and fixed objects',()=>{
 assert.deepEqual(current.rows.map(r=>r.sourceId).sort(),previous.rows.map(r=>r.sourceId).sort());
 assert.equal(current.rows.length,1423);
 assert.deepEqual(current.namedOnly,previous.namedOnly);
 assert.ok(Math.abs(current.rows.reduce((n,r)=>n+(r.share??0),0)-303)<1e-8);
 for(const old of previous.rows.filter(r=>['30','31','64','69'].includes(r.vitrine))) {
  assert.equal(current.rows.find(r=>r.sourceId===old.sourceId)?.vitrine,old.vitrine);
 }
 assert.ok(current.rows.every(r=>!['83','84','85'].includes(r.vitrine)));
});

test('versioned proposals retain distinct allocations and reviewed identity holds',()=>{
 const ramaiah=['cms0w7c7v002x07qisdxohvxv','cms0w7eec02tx07qike1mkz5q'];
 for(const id of ramaiah)assert.ok(current.rows.filter(r=>r.saintId===id).every(r=>r.vitrine==='5'));
 assert.equal(design.heldCases.length,4);
 assert.ok(current.rows.some(r=>previous.rows.find(p=>p.sourceId===r.sourceId)?.vitrine!==r.vitrine));
 assert.ok(!('75' in design.options[0].primeAnchors));
 for(const i of current.indicators)assert.deepEqual(current.rows.filter(r=>r.vitrine===i.vitrine&&r.unresolved).map(r=>r.sourceId).sort(),[...i.unresolvedSourceRecordIds].sort());
});

test('Nar Hari question preserves source evidence without suggesting an identity merge',()=>{
 const q=questions.cases.find(q=>q.sourceRecordId==='rec5kC0WPXiXYelqp')!;
 assert.equal(q.reviewGroup,'optional');assert.equal(q.sourceLocationClue.vitrine,'45');
 assert.equal(q.sourceLocationClue.shelf,'E');assert.deepEqual(q.candidateSlugs,[]);
 assert.match(q.context,/Narahari Sonar is a separate record/);
});
