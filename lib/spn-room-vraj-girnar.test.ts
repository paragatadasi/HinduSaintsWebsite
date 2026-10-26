import test from 'node:test';
import assert from 'node:assert/strict';
import previous from '../data/museum/spn-room-proposal-east-v2.json';
import proposal from '../data/museum/spn-room-proposal-vraj-girnar-v1.json';
import design from '../data/museum/spn-room-explorer-vraj-girnar-v1-design.json';
import {vitrineNeighborhoods} from './spn-room-explorer';

test('Vraj and Girnar changes only reviewed destinations, retaining source evidence and tiers',()=>{
 const permutation:Record<string,string>={'2':'79','79':'77','77':'38','38':'2','18':'50','50':'18','17':'47','47':'17','16':'46','46':'16'};
 const overrides:Record<string,string>={cms0w7gly05na07qiaokme7v0:'2',cms0w7dih01nm07qijrrpvmfh:'38',cms0w7d0y011p07qi7nkexcob:'38',cms0w7d29013907qigdnksqab:'77',cms0w7jdz08rk07qiiy0vbbpm:'77'};
 const oldRows=new Map(previous.rows.map(r=>[r.sourceId,r]));
 assert.equal(proposal.rows.length,1423);assert.equal(new Set(proposal.rows.map(r=>r.sourceId)).size,1423);
 assert.deepEqual(proposal.namedOnly,previous.namedOnly);
 for(const row of proposal.rows){
  const old=oldRows.get(row.sourceId)!;
  assert.equal(row.vitrine,overrides[row.saintId!]??permutation[old.vitrine]??old.vitrine);
  for(const field of ['saintId','share','sourceVitrine','sourceShelf','tier'] as const)assert.equal(row[field],old[field]);
 }
 assert.equal(Math.round(proposal.rows.reduce((n,r)=>n+(r.share??0),0)),303);
});

test('Keshava candidates remain separate and visibly qualified at 38',()=>{
 const hold=design.heldCases.find(c=>c.case==='Keshava candidate records')!;
 assert.equal(hold.saintIds.length,2);assert.match(hold.reason,/1878 versus1898/);
 for(const id of hold.saintIds){
  const rows=proposal.rows.filter(r=>r.saintId===id);
  assert.ok(rows.length);assert.ok(rows.every(r=>r.vitrine==='38'));
 }
 assert.match(hold.status,/merge.*held/);
 assert.equal(proposal.indicators.find(i=>i.vitrine==='38')?.totalObservedShelfShares,4.9381);
});

test('review context and actual neighborhoods stay distinct',()=>{
 const option=design.options[0];
 assert.match(proposal.reviewNote,/79.*refinement/);
 assert.ok(vitrineNeighborhoods(option,'18').some(p=>p.unitId==='girnar_north_boundary'));
 assert.deepEqual(vitrineNeighborhoods(option,'68'),[]);
 assert.ok(!vitrineNeighborhoods(option,'18').some(p=>p.unitId==='unresolved'));
 assert.equal(option.assignments.find(a=>a.number==='38')?.prime,false);
 assert.match(option.primeAnchors['38'].people,/Bhaktivinoda.*Bhaktisiddhanta.*Prabhupada/);
});
