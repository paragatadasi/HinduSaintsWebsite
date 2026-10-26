import test from 'node:test';
import assert from 'node:assert/strict';
import previous from '../data/museum/spn-room-proposal-east-v2.json';
import proposal from '../data/museum/spn-room-proposal-vraj-girnar-v1.json';
import design from '../data/museum/spn-room-explorer-vraj-girnar-v1-design.json';
import {vitrineNeighborhoods} from './spn-room-explorer';

test('Vraj and Girnar changes only reviewed destinations, retaining source evidence and tiers',()=>{
 const permutation:Record<string,string>={'70':'22','26':'37','37':'26','2':'79','79':'77','77':'38','38':'2','18':'50','50':'18','17':'47','47':'17','16':'46','46':'16'};
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

test('approved East–North exchange retains complete families, physical evidence and indicator totals',()=>{
 const old=previous.rows.filter(r=>['26','37'].includes(r.vitrine));
 assert.equal(old.length,34);
 for(const row of old){
  const moved=proposal.rows.find(r=>r.sourceId===row.sourceId)!;
  assert.deepEqual({...moved,vitrine:row.vitrine},row);
  assert.equal(moved.vitrine,row.vitrine==='26'?'37':'26');
 }
 for(const n of ['26','37']){
  const indicator=proposal.indicators.find(i=>i.vitrine===n)!;
  assert.equal(indicator.totalObservedShelfShares,Number(proposal.rows.filter(r=>r.vitrine===n).reduce((sum,r)=>sum+(r.share??0),0).toFixed(4)));
 }
 const option=design.options[0];
 assert.match(option.assignments.find(a=>a.number==='37')!.subsection,/Gosaiji/);
 assert.match(option.assignments.find(a=>a.number==='26')!.subsection,/Puri/);
 assert.deepEqual(vitrineNeighborhoods(option,'37').map(p=>p.unitId),['puri']);
 const connection=option.drivers.find(d=>d.connection==='Gaudiya / Vraj → Gosaiji and Yogmaya → Puri')!;
 assert.deepEqual(connection.places,[38,37,26]);
 assert.match(connection.reason,/does not create a new guru relationship/);
 for(const placement of design.placements.filter(p=>['26','37'].includes(String(p.vitrine)))){
  const rows=proposal.rows.filter(r=>r.saintId===placement.saintId);
  assert.ok(rows.length);assert.ok(rows.every(r=>r.vitrine===String(placement.vitrine)));
 }
 assert.equal(proposal.amendments[0].changedSourceObservations,34);
});

test('Haidakhan joins the North while provisional 70 stays empty and 23 retains its clearance guard',()=>{
 const moved=previous.rows.filter(r=>r.vitrine==='70');
 assert.equal(moved.length,23);
 for(const row of moved){
  const now=proposal.rows.find(r=>r.sourceId===row.sourceId)!;
  assert.deepEqual({...now,vitrine:row.vitrine},row);assert.equal(now.vitrine,'22');
 }
 assert.equal(proposal.rows.filter(r=>r.vitrine==='70').length,0);
 assert.deepEqual(proposal.layout,previous.layout);
 const option=design.options[0];
 assert.match(option.assignments.find(a=>a.number==='22')!.subsection,/Haidakhan/);
 assert.match(option.assignments.find(a=>a.number==='70')!.subsection,/spillover.*no planned family/);
 assert.ok(vitrineNeighborhoods(option,'22').some(p=>p.unitId==='north_other'));
 assert.deepEqual(vitrineNeighborhoods(option,'70'),[]);
 assert.equal(option.primaryPackets['22'].dependency,null);
 assert.equal(option.primaryPackets['70'].dependency,null);
 assert.match(option.primaryPackets['23'].dependency!,/case23.*64.*69/);
 assert.equal(proposal.indicators.find(i=>i.vitrine==='22')!.totalObservedShelfShares,4.9167);
 assert.equal(proposal.indicators.find(i=>i.vitrine==='70')!.totalObservedShelfShares,0);
 assert.equal(proposal.indicators.find(i=>i.vitrine==='23')!.potentialFlexibleSpace,false);
 assert.match(proposal.indicators.find(i=>i.vitrine==='23')!.specialFitNote!,/23.*64 and 69/);
 for(const n of ['22','70'])assert.equal(proposal.indicators.find(i=>i.vitrine===n)!.fitConfirmed,false);
});
