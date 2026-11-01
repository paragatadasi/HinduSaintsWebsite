import test from "node:test";
import assert from "node:assert/strict";
import {allOperationalSpnShelves} from "./spn-operational-shelves";
import {applyJamnagarGuideRefinement,jamnagarReceiver} from "./spn-jamnagar-receiver";
import type {StarterMoveGuide} from "./spn-move-guide";
const additions=jamnagarReceiver.allocations.map(a=>({sourceId:a.sourceId,saintId:a.saintId,sourceRevision:a.sourceRevision,vitrine:"49",shelf:null,version:1,updatedAt:"2026-11-01T12:14:00Z",clientRequestId:"test"}));
function guide():StarterMoveGuide{return {version:"test",contentDigest:"digest",proposalVersion:"test",assignmentDigest:"assignment",title:"Test",entries:jamnagarReceiver.allocations.map(a=>({...a,destination:"49",city:"Jamnagar",relicDescription:"",section:"",family:"",rationale:""})),vitrines:[{code:"49",summary:"",families:[],cityGroups:[{id:"existing",title:"Existing",sourceIds:["other",...additions.map(a=>a.sourceId)],rationale:"",suggestedVitrines:["49"]}]}],alternatives:[],reportedPlacements:[]};}
test("Jamnagar pair has exactly one operational recommendation, together at the bottom of 49",()=>{
 for(const a of additions){const cases=allOperationalSpnShelves.vitrines.filter(v=>v.allocations.some(r=>r.sourceId===a.sourceId));assert.deepEqual(cases.map(v=>v.code),["49"]);assert.equal(cases[0].allocations.find(r=>r.sourceId===a.sourceId)?.suggestedShelfIndex,5);}
 const receiver=allOperationalSpnShelves.vitrines.find(v=>v.code==="49")!;
 assert.equal(receiver.allocations.length,24);
 assert.equal(receiver.groups.find(g=>g.id===jamnagarReceiver.group.id)?.kind,"city");
 assert.ok(!receiver.relationships.some(r=>additions.some(a=>a.sourceId===r.fromSourceId||a.sourceId===r.toSourceId)));
});
test("guide refinement preserves unrelated membership and physical reports without mutating input",()=>{
 const input=guide();input.reportedPlacements=[{sourceId:additions[0].sourceId,destination:"64",date:"2026-10-31"}];const before=JSON.stringify(input);
 const result=applyJamnagarGuideRefinement(input,additions);
 assert.deepEqual(result.vitrines[0].cityGroups[0].sourceIds,["other"]);
 assert.deepEqual(result.vitrines[0].cityGroups[1].sourceIds,additions.map(a=>a.sourceId));
 assert.deepEqual(result.vitrines[0].cityGroups[1].edges,[]);
 assert.deepEqual(result.reportedPlacements,input.reportedPlacements);
 assert.equal(JSON.stringify(input),before);
 assert.deepEqual(applyJamnagarGuideRefinement(result,additions),result);
});
test("stale identity, revision or a newer destination cannot receive the named Jamnagar block",()=>{
 for(const patch of [{saintId:"changed"},{sourceRevision:"changed"},{vitrine:"50"}]){const input=guide();assert.equal(applyJamnagarGuideRefinement(input,additions.map(a=>({...a,...patch}))),input);}
 const input=guide();input.entries=input.entries.map(e=>({...e,destination:"50"}));assert.equal(applyJamnagarGuideRefinement(input,additions),input);
});
