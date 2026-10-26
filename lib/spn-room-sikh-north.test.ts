import test from 'node:test';
import assert from 'node:assert/strict';
import previous from '../data/museum/spn-room-proposal-vraj-girnar-v1.json';
import proposal from '../data/museum/spn-room-proposal-sikh-north-v1.json';
import design from '../data/museum/spn-room-explorer-sikh-north-v1-design.json';
import {correctSpnProposal} from './spn-proposal-corrections';
import {reconcileSpnRoomProposal,showFlexibleSpace} from './spn-room-proposal';
import {vitrineNeighborhoods} from './spn-room-explorer';
import type {MuseumSaintPlacement} from './museum-proposals';

test('Sikh review candidate preserves every source observation and current evidence',()=>{
 const old=new Map(previous.rows.map(r=>[r.sourceId,r]));
 assert.equal(proposal.rows.length,1423);assert.equal(new Set(proposal.rows.map(r=>r.sourceId)).size,1423);
 for(const row of proposal.rows){const base=old.get(row.sourceId)!;assert.ok(base);assert.deepEqual({...row,vitrine:base.vitrine,allocationKind:base.allocationKind},base);}
 assert.equal(Math.round(proposal.rows.reduce((n,r)=>n+(r.share??0),0)),303);assert.equal(proposal.namedOnly.length,3);
 assert.deepEqual(proposal.layout,previous.layout);assert.equal(proposal.reviewedRelationshipPairs,99);assert.ok(proposal.recordPreflightAt);
});

test('uniform and spade remain separate full-height observations, with no physical confirmation',()=>{
 const uniform=proposal.rows.find(r=>r.sourceId==='recMo8X6ehasAq0cW')!,spade=proposal.rows.find(r=>r.sourceId==='rec6IqZR7ahPTDfEI')!;
 assert.equal(uniform.vitrine,'18');assert.equal(spade.vitrine,'64');assert.notEqual(uniform.saintId,spade.saintId);
 for(const row of [uniform,spade]){assert.equal(row.state,'full_height');assert.equal(row.share,null);assert.equal(row.sourceVitrine,'23');assert.equal(row.sourceShelf,'A');}
 assert.equal(proposal.rows.filter(r=>r.vitrine==='69').length,0);
 const option=design.options[0];assert.equal(option.largeObjects.uniform,'18');assert.equal(option.largeObjects.plow,'64');
 assert.deepEqual(option.displayPackets.find(p=>p.unitId==='uniform')!.cases,[18]);
 assert.equal(option.displayPackets.some(p=>p.unitId==='buddhist'),false);
 assert.ok(vitrineNeighborhoods(option,'25').some(p=>p.unitId==='buddhist_east'));
 assert.ok(!vitrineNeighborhoods(option,'18').some(p=>p.group==='E'));
});

test('all indicators are rebuilt from actual allocations and protected cases stay excluded',()=>{
 for(const i of proposal.indicators){const rows=proposal.rows.filter(r=>r.vitrine===i.vitrine);assert.equal(i.totalObservedShelfShares,Number(rows.reduce((n,r)=>n+(r.share??0),0).toFixed(4)));assert.equal(i.unresolvedSourceObservationCount,rows.filter(r=>r.unresolved).length);assert.equal(i.fitConfirmed,false);}
 for(const number of ['17','18','23','30','31','64','68','69','70']){const i=proposal.indicators.find(i=>i.vitrine===number)!;assert.equal(i.potentialFlexibleSpace,false);assert.ok(i.flexibleSpaceExclusion);assert.equal(showFlexibleSpace(number,i.potentialFlexibleSpace,false),false);}
 assert.match(proposal.indicators.find(i=>i.vitrine==='69')!.specialFitNote!,/No physical vacancy/);
 assert.match(proposal.indicators.find(i=>i.vitrine==='68')!.specialFitNote!,/replacement housing/);
});

test('current curator destination wins and Sankaranya remains with Radharaman',()=>{
 const fixed=correctSpnProposal({proposal,designData:design});
 const sankaranya=fixed.proposal.rows.find(r=>r.sourceId==='rec7cV8OOW6dYau1K')!;
 assert.equal(sankaranya.vitrine,fixed.proposal.rows.find(r=>r.saintId==='cms0w7h3c068907qi1ajzanag')!.vitrine);
 const row=proposal.rows.find(r=>r.sourceId==='recMo8X6ehasAq0cW')!;
 const live={id:row.baseline!.placementId,saintId:row.saintId,name:row.name,section:row.section,tier:'Featured',curatorialFamily:row.baseline!.familyKey,spnRegionTags:row.baseline!.regionTags,arrangement:{status:'Implemented',vitrine:'23',shelf:'A',proposalRevision:row.baseline!.proposalRevision}} as MuseumSaintPlacement;
 const before=JSON.stringify(live),[result]=reconcileSpnRoomProposal([row],[live]);assert.equal(result.effectiveVitrine,'23');assert.equal(result.vitrine,'18');assert.equal(result.currentStatus,'Implemented');assert.equal(JSON.stringify(live),before);
});
