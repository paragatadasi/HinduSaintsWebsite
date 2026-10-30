import test from 'node:test';
import assert from 'node:assert/strict';
import {vitrineProgress} from './museum-vitrine-progress';
import type {CompanionRow,GuideGroup,GuideDecision} from './spn-move-guide';
import packet from '../data/museum/spn-northern-shelves-v1.json';
test('progress deduplicates membership and prioritizes confirmed placement then row decisions',()=>{
 const groups=[{id:'family',sourceIds:['a','b','c','d']},{id:'city',sourceIds:['a']}] as GuideGroup[];
 const rows=[{sourceId:'a',currentBasis:'confirmed',current:{kind:'vitrine',code:'72'}}] as CompanionRow[];
 const decisions=[{suggestionId:'family',decision:'deferred'},{suggestionId:'row:b',decision:'declined'},{suggestionId:'row:c',decision:'pending'},{suggestionId:'row:a',decision:'deferred'}] as GuideDecision[];
 assert.deepEqual(vitrineProgress('72',groups,rows,decisions),{total:4,addressed:2,deferred:1});
 assert.deepEqual(vitrineProgress('72',[],rows,decisions),{total:0,addressed:0,deferred:0});
});
test('Northern draft preserves provisional precision and exact source coverage',()=>{
 const allocations=packet.vitrines.flatMap<(typeof packet.vitrines)[number]["allocations"][number]>(v=>v.allocations);
 assert.equal(allocations.length,111);assert.equal(new Set(allocations.map(a=>a.sourceId)).size,111);
 for(const a of allocations){assert.ok(a.suggestedShelfIndex>=1&&a.suggestedShelfIndex<=5);assert.equal(a.actualShelfId,null);assert.equal(a.provisional,true);}
 for(const v of packet.vitrines){const ids=new Set(v.allocations.map(a=>a.sourceId));for(const e of v.relationships){assert.ok(ids.has(e.fromSourceId)&&ids.has(e.toSourceId));}}
});

test('not on display counts as addressed and restoring reopens the assignment',()=>{
 const groups=[{id:'family',sourceIds:['a']}] as GuideGroup[];
 const decision={suggestionId:'row:a',decision:'not_on_display',note:null,version:1} as GuideDecision;
 assert.deepEqual(vitrineProgress('20',groups,[],[decision]),{total:1,addressed:1,deferred:0});
 assert.deepEqual(vitrineProgress('20',groups,[],[{...decision,decision:'pending'}]),{total:1,addressed:0,deferred:0});
});
