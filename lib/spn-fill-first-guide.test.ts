import test from 'node:test';
import assert from 'node:assert/strict';
import {fillFirstMoveGuide as guide,fillFirstGuideDefinition as definition} from './spn-fill-first-guide';
import {gosaijiSaiGuideDefinition as previous} from './spn-gosaiji-sai-guide';
import {inheritGuideDecisions} from './museum-guide-decision-inheritance';

test('fill-first guide contains the approved 11/23/16 distinct source records without whole-case clears',()=>{
  assert.deepEqual(guide.vitrines.map(v=>v.code),['75','23','73']);
  assert.deepEqual(guide.vitrines.map(v=>guide.entries.filter(r=>r.destination===v.code).length),[11,23,16]);
  assert.equal(new Set(guide.entries.map(r=>r.sourceId)).size,50);
  assert.equal(definition.physicalScope?.allowClear,false);
  assert.deepEqual(guide.reportedPlacements,[]);
});

test('unchanged Vitrine 75 decisions carry into the fill-first phase',()=>{
  const suggestion=previous.suggestions.find(s=>s.targetVitrine==='75'&&s.kind==='family')!;
  const decisions=inheritGuideDecisions(definition,[],[{guide:previous,decisions:[{suggestionId:suggestion.id,decision:'deferred',note:'Keep this together',version:2,updatedAt:new Date('2026-10-28T18:00:00Z')}]}]);
  assert.ok(definition.previousVersions?.includes(previous.context.guideVersion));
  assert.equal(decisions[0].decision,'deferred');
  assert.equal(decisions[0].note,'Keep this together');
});

test('Ma husband is source-specific and Srijivasharan has no invented family edge',()=>{
  const groups=guide.vitrines.flatMap(v=>[...v.families,...v.cityGroups]);
  const edges=groups.flatMap(g=>g.edges??[]);
  assert.ok(edges.some(e=>e.toSourceId==='recgWx4aYAekvRxg1'&&e.label==='husband'));
  assert.ok(!edges.some(e=>e.toSourceId==='recCIuQTzNZY1KNsQ'&&e.label==='husband'));
  assert.ok(!edges.some(e=>[e.toSourceId,e.fromSourceId].includes('recjfGeU4OqaBqtZ2')));
  assert.ok(guide.vitrines.find(v=>v.code==='23')?.cityGroups.some(g=>g.sourceIds.includes('recjfGeU4OqaBqtZ2')));
});
