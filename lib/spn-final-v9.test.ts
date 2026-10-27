import assert from 'node:assert/strict';
import test from 'node:test';
import {Script} from 'node:vm';
import before from '../data/museum/spn-room-proposal-final-v8.json';
import proposal from '../data/museum/spn-room-proposal-final-v9.json';
import design from '../data/museum/spn-room-explorer-final-v9-design.json';
import companion from '../data/museum/spn-pilgrimage-final-v9.json';
import validation from '../data/museum/spn-final-v9-validation.json';
import {reconcileSpnRoomProposal} from './spn-room-proposal';
import type {MuseumSaintPlacement} from './museum-proposals';

test('v9 changes exactly two destinations without changing identities, source evidence or review flags',()=>{
 const changed=proposal.rows.filter((row,index)=>row.vitrine!==before.rows[index].vitrine);
 assert.deepEqual(changed.map(r=>[r.sourceId,r.vitrine]).sort(),[['rec0GbpMjM14oN5G2','22'],['rec3HT7rDR1erZTnh','19']]);
 proposal.rows.forEach((row,index)=>assert.deepEqual({...row,vitrine:before.rows[index].vitrine},before.rows[index]));
 assert.deepEqual(proposal.namedOnly,before.namedOnly);
 assert.equal(proposal.rows.find(r=>r.sourceId==='rec3HT7rDR1erZTnh')?.section,'Needs Research');
 assert.equal(new Set(proposal.rows.map(r=>r.sourceId)).size,1423);
 assert.ok(Math.abs(proposal.rows.reduce((n,r)=>n+(r.share??0),0)-303)<1e-8);
 assert.ok(Math.abs(proposal.rows.reduce((n,r)=>n+(r.planningShelfEstimate??0),0)-318.5)<1e-8);
 assert.equal(validation.reviewedRelationshipPairsChecked,99);
});
test('case indicators and design ledger agree with the new source destinations',()=>{
 for(const vitrine of ['19','22','46']){
  const rows=proposal.rows.filter(r=>r.vitrine===vitrine),indicator=proposal.indicators.find(i=>i.vitrine===vitrine)!;
  const ledger=design.options[0].caseSpaceLedger.find(i=>String(i.vitrine)===vitrine)!;
  const raw=Number(rows.reduce((n,r)=>n+(r.share??0),0).toFixed(4));
  const planning=Number(rows.reduce((n,r)=>n+(r.planningShelfEstimate??0),0).toFixed(4));
  assert.equal(indicator.totalObservedShelfShares,raw);assert.equal(indicator.estimatedRequiredShelfShares,planning);
  assert.equal(ledger.rebalancedObservedShelfShares,raw);assert.equal(ledger.estimatedRequiredShelfShares,planning);
  assert.equal(ledger.sourceObservationCount,rows.length);
  assert.equal(indicator.potentialFlexibleSpace,false);
 }
 assert.ok(proposal.indicators.every(i=>i.estimatedRequiredShelfShares<=5));
 assert.equal(proposal.indicators.find(i=>i.vitrine==='19')?.estimatedRequiredShelfShares,4.9929);
});
test('Haridwar membership follows Panchand in the proposal, design and static companion',()=>{
 const id='cms0w7c7l002l07qieffb7lzl';
 const city=proposal.cityReview.find(c=>c.city==='Haridwar')!;
 assert.equal(city.remainingSplit,false);assert.equal(city.members.find(m=>m.saintId===id)?.vitrine,22);
 assert.equal(proposal.validation.cityCohortsStillSplit,36);
 assert.deepEqual(design.options[0].tertiaryCityClusters,proposal.tertiaryCityClusters);
 const decoded=companion.html.match(/srcdoc="([^"]*)"/)![1].replaceAll('&quot;','"').replaceAll('&#x27;',"'").replaceAll('&#39;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
 const route=JSON.parse(decoded.match(/const DATA=(.*);[\r\n]/)![1]) as {baseline:string;stops:{cases:number[];cityCohorts:typeof proposal.tertiaryCityClusters}[]};
 assert.equal(route.baseline,proposal.version);
 const matches=route.stops.flatMap(stop=>stop.cityCohorts).filter(c=>c.groups.some(g=>g.members.some(m=>m.saintId===id)));
 assert.equal(matches.length,1);assert.equal(matches[0].vitrine,22);
 const appScript=[...decoded.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(match=>match[1]).find(script=>script.includes('const DATA='));
 assert.ok(appScript);assert.doesNotThrow(()=>new Script(appScript));
});
test('a newer curator destination continues to override this packaged recommendation',()=>{
 const row=proposal.rows.find(r=>r.sourceId==='rec0GbpMjM14oN5G2')!;
 const live:MuseumSaintPlacement={id:row.baseline!.placementId,saintId:row.saintId!,name:row.name,section:row.section,tier:'Tertiary',familyId:'',curatorialFamily:'',spnRegionTags:[],
  arrangement:{revision:'newer',proposalRevision:row.baseline!.proposalRevision,status:'Planned',vitrine:'21',shelf:'B',familyKey:'',confirmedAt:null,inventoryAcknowledged:false},
  alternatives:[],confidence:'',rationale:'',note:'',familySize:0,spiritualRegions:[],sampradaya:'',normalizedPlaces:[],needsResearch:false};
 const [result]=reconcileSpnRoomProposal([row],[live]);
 assert.equal(result.effectiveVitrine,'21');assert.equal(result.currentShelf,'B');assert.match(result.reviewReason,/retained/);
 assert.equal(row.vitrine,'22');assert.equal(live.arrangement?.vitrine,'21');
});
