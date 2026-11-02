import test from 'node:test';
import assert from 'node:assert/strict';
import {activeSearchRoster,resolveSearchRoster} from './museum-search-roster';
const guide=(code:string,sourceId:string)=>({entries:[{sourceId,destination:code}],vitrines:[{code,families:[{sourceIds:[sourceId]}],cityGroups:[]}]});
test('search only offers destinations present in the current roster',()=>{
 const roster=activeSearchRoster([guide('47','assigned')]);
 assert.equal(resolveSearchRoster('assigned','61',roster).destination,'47');
 for(const [id,old] of [['rec22myGeXtFWce1G','48'],['recPNwVtp8N539swc','61']]){
  const result=resolveSearchRoster(id,old,roster);assert.equal(result.destination,'');assert.equal(result.state,'unallocated');assert.equal(result.historicalDestination,old);
 }
});
test('loading and conflicting rosters cannot route to a frozen target',()=>{
 assert.equal(resolveSearchRoster('a','68',undefined).state,'loading');
 const roster=activeSearchRoster([guide('47','a'),guide('61','a')]);
 assert.equal(resolveSearchRoster('a','68',roster).state,'conflict');
 assert.equal(resolveSearchRoster('a','68',roster).destination,'');
});
test('entries outside groups and obsolete group membership are not active roster assignments',()=>{
 const g=guide('47','a');g.entries[0].destination='61';
 assert.equal(activeSearchRoster([g]).size,0);
 const h=guide('47','a');h.vitrines[0].families=[];
 assert.equal(activeSearchRoster([h]).size,0);
});
