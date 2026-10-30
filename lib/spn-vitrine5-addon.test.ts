import test from 'node:test';
import assert from 'node:assert/strict';
import {northernMoveGuide,northernGuideDefinition,projectNorthernGuide,removeSupersededNorthernSuggestions} from './spn-northern-guide';
import {northernMoveGuide as previous} from './spn-northern-guide-v1';
import {readStarterGuideDefinition} from './spn-starter-guide-registry';
import {buildLatestSpnReview} from './spn-reviewed-proposal';
import addon from '../data/museum/spn-vitrine5-addon-v1.json';
import shelf from '../data/museum/spn-vitrine5-shelves-v1.json';
import {assertGuidePhysicalScope} from './spn-datta-guide';
import type {MuseumSaintPlacement} from './museum-proposals';
test('V5 extends Northern without changing original scope or losing prior clearances',()=>{
 for(const row of previous.entries)assert.equal(northernMoveGuide.entries.find(e=>e.sourceId===row.sourceId)?.destination,row.destination);
 assert.equal(northernMoveGuide.entries.length,126);
 assert.ok(!removeSupersededNorthernSuggestions(northernMoveGuide).entries.some(e=>addon.rows.some(a=>a.sourceId===e.sourceId)));
 assert.ok(northernGuideDefinition.previousVersions?.includes(previous.version));
 assert.ok(northernMoveGuide.previousClearanceVersions?.includes(previous.version));
 assert.equal(readStarterGuideDefinition(previous.version).readOnly,true);
 assert.ok(northernGuideDefinition.physicalScope?.clearVitrines?.includes('5'));
 assert.ok(northernGuideDefinition.physicalScope?.preparationVitrines?.includes('5'));
 for(const code of ['52','53','56','57','63'])assert.throws(()=>assertGuidePhysicalScope(northernGuideDefinition,[{sourceId:addon.rows[0].sourceId,to:{kind:'vitrine',code}}]));
 assert.doesNotThrow(()=>assertGuidePhysicalScope(northernGuideDefinition,[{sourceId:'outgoing',to:{kind:'table',code:'staging-area'}}],['5']));
});
test('all15 current destinations are projected and later curator edits preserved',()=>{
 const review=buildLatestSpnReview([]);for(const row of addon.rows)assert.equal(review.rows.find(r=>r.sourceId===row.sourceId)?.effectiveVitrine,'5',row.sourceId);
 const row=addon.rows[0];
 const current={id:row.capturedBaseline.placementId,sourceRecordId:row.sourceId,saintId:row.saintId,name:row.name,tier:row.capturedTier,section:row.capturedBaseline.section,normalizedPlaces:[],alternatives:[],confidence:"",rationale:"",note:"",curatorialFamily:"",familySize:1,spiritualRegions:[],sampradaya:"",needsResearch:false,spnRegionTags:[],familyId:"",arrangement:{familyKey:'',confirmedAt:null,inventoryAcknowledged:false,status:'Planned',vitrine:'12',shelf:'',revision:'newer',proposalRevision:row.capturedBaseline.proposalRevision}} as MuseumSaintPlacement;
 const guide=projectNorthernGuide([current],{rows:[],unmappedCurrentLocations:[]});
 assert.ok(!guide.vitrines.find(v=>v.code==='5')?.families.some(g=>g.sourceIds.includes(row.sourceId)));
 assert.equal(buildLatestSpnReview([current]).rows.find(r=>r.sourceId===row.sourceId)?.effectiveVitrine,'12');
});
test('V5 shelf guidance retains exact15, contextual affiliation and refreshed fit warning',()=>{
 const plan=shelf.vitrines[0];assert.deepEqual(plan.allocations.map(a=>a.sourceId).sort(),addon.rows.map(a=>a.sourceId).sort());
 assert.equal(plan.allocations.find(a=>a.sourceId==='recoRltXupeZas8zP')?.knownFootprint,1.25);
 assert.ok(plan.allocations.find(a=>a.sourceId==='recoRltXupeZas8zP')?.reviewAlerts.length);
 for(const a of plan.allocations){assert.equal(a.actualShelfId,null);assert.ok(a.suggestedShelfIndex>=1&&a.suggestedShelfIndex<=5);}
 assert.ok(plan.relationships.some(e=>e.fromSourceId==='context:kriya-tradition'&&e.direction==='none'));
});
