import assert from 'node:assert/strict';
import test from 'node:test';
import {Script} from 'node:vm';
import before from '../data/museum/spn-room-proposal-final-v9.json';
import proposal from '../data/museum/spn-room-proposal-final-v10.json';
import design from '../data/museum/spn-room-explorer-final-v10-design.json';
import companion from '../data/museum/spn-pilgrimage-final-v10.json';
import validation from '../data/museum/spn-final-v10-validation.json';
import {reconcileSpnRoomProposal} from './spn-room-proposal';
import type {MuseumSaintPlacement} from './museum-proposals';

test('approved city release preserves every source field, tier, identity and fixed object',()=>{
 assert.equal(proposal.rows.length,1423);assert.equal(new Set(proposal.rows.map(r=>r.sourceId)).size,1423);
 proposal.rows.forEach((row,i)=>{assert.deepEqual({...row,vitrine:before.rows[i].vitrine},before.rows[i]);if(row.tier!=='Tertiary'||['fixed_stick_case','full_height'].includes(row.state))assert.equal(row.vitrine,before.rows[i].vitrine);});
 assert.deepEqual(proposal.namedOnly,before.namedOnly);assert.equal(validation.reviewedRelationshipPairsChecked,99);
 assert.equal(validation.reviewedCandidateSha256,'629e0355ce29fc7362fbc0c9c42ca6cc91ec77a411cb36de97c86b5e7e9ff95c');
 assert.equal(proposal.rows.find(r=>r.sourceId==='recjA6M4REhXbtb1Z')?.vitrine,'9');assert.equal(proposal.rows.find(r=>r.sourceId==='recYIE2g8p2NxItsz')?.vitrine,'10');
 assert.ok(Math.abs(proposal.rows.reduce((n,r)=>n+(r.share??0),0)-303)<1e-8);assert.ok(Math.abs(proposal.rows.reduce((n,r)=>n+(r.planningShelfEstimate??0),0)-318.5)<1e-8);
});
test('all case summaries retain unknown footprints and agree with the design ledger',()=>{
 for(const indicator of proposal.indicators){
  const rows=proposal.rows.filter(r=>r.vitrine===indicator.vitrine),ledger=design.options[0].caseSpaceLedger.find(l=>String(l.vitrine)===indicator.vitrine)!;
  assert.equal(indicator.estimatedRequiredShelfShares,Number(rows.reduce((n,r)=>n+(r.planningShelfEstimate??0),0).toFixed(4)));assert.equal(ledger.estimatedRequiredShelfShares,indicator.estimatedRequiredShelfShares);assert.equal(ledger.sourceObservationCount,rows.length);
  if(indicator.unknownPlanningFootprintCount)assert.equal(indicator.potentialFlexibleSpace,false);
 }
 assert.equal(proposal.indicators.find(i=>i.vitrine==='78')?.unknownPlanningFootprintCount,2);assert.equal(proposal.indicators.find(i=>i.vitrine==='28')?.unknownPlanningFootprintCount,1);assert.match(proposal.reviewNote,/physical|Physical/);
 assert.ok(proposal.rows.some(r=>r.vitrine==='64'));assert.doesNotMatch(proposal.assignments.find(a=>a.number==='64')!.subsection,/Unallocated/);assert.equal(proposal.indicators.find(i=>i.vitrine==='64')!.potentialFlexibleSpace,false);
});
test('accepted default applies only to the captured baseline and never changes recorded physical facts',()=>{
 const row=proposal.rows.find(r=>r.sourceId==='recjA6M4REhXbtb1Z')!;
 const live={id:row.baseline!.placementId,saintId:row.saintId!,name:row.name,section:row.section,tier:'Tertiary',familyId:'',curatorialFamily:'',spnRegionTags:[],arrangement:{revision:row.baseline!.revision,proposalRevision:row.baseline!.proposalRevision,status:'Implemented',vitrine:'79',shelf:'C',familyKey:'',confirmedAt:'2026-10-27T00:00:00Z',inventoryAcknowledged:true},alternatives:[],confidence:'',rationale:'',note:'',familySize:0,spiritualRegions:[],sampradaya:'',normalizedPlaces:[],needsResearch:false} as MuseumSaintPlacement;
 const [accepted]=reconcileSpnRoomProposal([row],[live],{acceptedBaseline:true});assert.equal(accepted.effectiveVitrine,'9');assert.equal(accepted.currentVitrine,'79');assert.equal(accepted.currentStatus,'Implemented');
 live.arrangement!.revision='newer-curator-revision';live.arrangement!.vitrine='11';const [newer]=reconcileSpnRoomProposal([row],[live],{acceptedBaseline:true});assert.equal(newer.effectiveVitrine,'11');assert.match(newer.reviewReason,/retained/);
 assert.equal(row.vitrine,'9');
});
test('static route companion uses the same city membership and has valid script syntax',()=>{
 const decoded=companion.html.match(/srcdoc="([^"]*)"/)![1].replaceAll('&quot;','"').replaceAll('&#x27;',"'").replaceAll('&#39;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
 const route=JSON.parse(decoded.match(/const DATA=(.*);[\r\n]/)![1]);assert.equal(route.baseline,proposal.version);
 const script=[...decoded.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('const DATA='));assert.ok(script);assert.doesNotThrow(()=>new Script(script));
 assert.deepEqual(design.options[0].tertiaryCityClusters,proposal.tertiaryCityClusters);
});
