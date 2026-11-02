import test from "node:test";
import assert from "node:assert/strict";
import captured from "../data/museum/spn-vraj-east-shelves-v1.json";
import {applyCohort27Shelves} from "./spn-cohort27-shelves";
import {gaudiyaMayapurRebalance} from "./spn-gaudiya-mayapur-presentation";
import {allOperationalSpnShelves} from "./spn-operational-shelves";
import {spnDisplayTones,spnDisplayMatches} from "./spn-display-regions";

test("all twenty recommendations move to27 without modifying source, physical, tier or shelf evidence",()=>{
 const original=structuredClone(captured);
 const result=applyCohort27Shelves(captured);
 const before=captured.vitrines.find(v=>v.code==="28")!;
 const after=result.vitrines.find(v=>v.code==="27")!;
 assert.equal(after.allocations.length,20);
 assert.equal(result.vitrines.some(v=>v.code==="28"),false);
 for(const row of before.allocations){
  const actual=after.allocations.find(a=>a.sourceId===row.sourceId)!;
  assert.deepEqual({...actual,groupId:row.groupId,columnKey:row.columnKey},row);
 }
 assert.deepEqual(captured,original);
 assert.deepEqual(after.relationships,before.relationships);
 assert.deepEqual(result.vitrines.find(v=>v.code==="76"),captured.vitrines.find(v=>v.code==="76"));
});
test("operational shelves and room colors agree on the current case numbers",()=>{
 assert.equal(allOperationalSpnShelves.vitrines.find(v=>v.code==="27")?.allocations.length,20);
 const mayapur=allOperationalSpnShelves.vitrines.find(v=>v.code==="28")!;
 assert.deepEqual(mayapur.allocations.map(a=>a.sourceId).sort(),gaudiyaMayapurRebalance.changes.map(a=>a.sourceId).sort());
 assert.ok(mayapur.allocations.every(a=>a.suggestedShelfIndex===null));
 const cohort=new Set(allOperationalSpnShelves.vitrines.find(v=>v.code==="27")!.allocations.map(a=>a.sourceId));
 assert.ok(mayapur.allocations.every(a=>!cohort.has(a.sourceId)));
 assert.equal(spnDisplayMatches("27","E"),true);
 assert.equal(spnDisplayTones["28"],"R");
});
test("unexpected shelf membership requires review instead of discarding recommendations",()=>{
 const changed=structuredClone(captured);changed.vitrines.find(v=>v.code==="28")!.allocations.pop();
 assert.throws(()=>applyCohort27Shelves(changed),/reconciliation/);
});
test("Baman recommendation joins Vaman without moving the recorded object or merging identities",()=>{
 const baman=allOperationalSpnShelves.vitrines.find(v=>v.code==="78")!.allocations.find(a=>a.sourceId==="recF52jndG5wSaY9c")!;
 assert.equal(baman.suggestedShelfIndex,null);
 assert.equal((baman as typeof baman&{currentPhysical:{code:string}}).currentPhysical.code,"29");
 assert.ok(allOperationalSpnShelves.vitrines.find(v=>v.code==="78")!.allocations.some(a=>a.sourceId==="rec5Fk0gFRU0FohDv"&&a.saintId!==baman.saintId));
 const branch=allOperationalSpnShelves.vitrines.find(v=>v.code==="29")!;
 assert.equal(branch.allocations.some(a=>a.sourceId===baman.sourceId),false);
 assert.equal(branch.groups.filter(g=>/Keshava/.test(g.title)).length,1);
 assert.ok(branch.allocations.some(a=>a.sourceId==="rec5R2rIVB6cYMOxN"));
 assert.ok(branch.allocations.some(a=>a.sourceId==="recv7456zY968qEFJ"));
});
