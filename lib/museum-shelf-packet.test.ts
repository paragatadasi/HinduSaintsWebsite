import {test} from "node:test";
import assert from "node:assert/strict";
import packet from "@/data/museum/spn-vraj-east-shelves-v1.json";
import northern from "@/data/museum/spn-northern-shelves-v1.json";

test("reviewed Vraj/East packet accounts for every source once without replacing Northern/V5",()=>{
 const cases=["2","28","78","36","29","76","37","26","24","23","75","79","32","33","77","34","35","38"];
 assert.deepEqual(packet.vitrines.map(v=>v.code),cases);
 const allocations=packet.vitrines.flatMap(v=>v.allocations);
 assert.equal(allocations.length,347);
 assert.equal(new Set(allocations.map(a=>a.sourceId)).size,347);
 assert.equal(packet.physicalWrites,false);
 const original=northern.vitrines.find(v=>v.code==="36")!.allocations;
 for(const allocation of original)assert.deepEqual(packet.vitrines.find(v=>v.code==="36")!.allocations.find(a=>a.sourceId===allocation.sourceId),allocation);
 assert.ok(!cases.includes("5")&&!cases.includes("74")&&!cases.includes("73"));
});

test("living and fit uncertainty remain explicit in shelf recommendations",()=>{
 const allocations=packet.vitrines.flatMap(v=>v.allocations);
 for(const allocation of allocations){if(allocation.projectedLifeStatus?.tag)assert.notEqual(allocation.suggestedShelfIndex,1,allocation.name);}
 assert.ok(packet.exceptions.length>0);
 assert.ok(packet.exceptions.every(item=>item.code==="35"));
 assert.ok(packet.vitrines.find(v=>v.code==="35")!.notes.some(note=>note.includes("0.49")));
 assert.ok(packet.vitrines.find(v=>v.code==="33")!.notes.some(note=>note.includes("Unknown-size")));
});
