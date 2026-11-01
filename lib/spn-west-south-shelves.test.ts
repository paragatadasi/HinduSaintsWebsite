import receiving from "../data/museum/spn-missing-receivers-shelves-v1.json";
import test from "node:test";
import assert from "node:assert/strict";
import packet from "../data/museum/spn-west-south-shelves-v1.json";
import {allOperationalSpnShelves} from "./spn-operational-shelves";

test("reviewed West and South shelves replace old cases without duplicate sources or cases",()=>{
 assert.equal(packet.vitrines.length,21);
 const rows=packet.vitrines.flatMap<(typeof packet.vitrines)[number]["allocations"][number]>(v=>v.allocations);
 assert.equal(rows.length,416);assert.equal(new Set(rows.map(r=>r.sourceId)).size,416);
 assert.equal(new Set(allOperationalSpnShelves.vitrines.map(v=>v.code)).size,allOperationalSpnShelves.vitrines.length);
 for(const code of ["47","58","60","61"])assert.ok(!packet.vitrines.some(v=>v.code===code));
 for(const v of packet.vitrines){
  const loaded=allOperationalSpnShelves.vitrines.find(c=>c.code===v.code)!;
  const transferred=new Set(receiving.vitrines.flatMap(c=>c.allocations.map(a=>a.sourceId)));
  assert.deepEqual(loaded.allocations.map(a=>a.sourceId),v.allocations.filter(a=>!transferred.has(a.sourceId)).map(a=>a.sourceId));
  assert.ok(v.allocations.every(a=>v.groups.some(g=>g.id===a.groupId)));
 }
});

test("living reserves and recorded shelf notes remain qualified recommendations",()=>{
 const rows=packet.vitrines.flatMap<(typeof packet.vitrines)[number]["allocations"][number]>(v=>v.allocations);
 assert.equal(rows.filter(r=>r.confirmedShelfToProtect).length,13);
 assert.equal(rows.find(r=>r.sourceId==="rec1WWN7Xb1ZRGGhA")?.suggestedShelfIndex,5);
 const bottom=packet.vitrines.find(v=>v.code==="44")!.allocations.filter(a=>a.suggestedShelfIndex===5);
 assert.equal(bottom.length,4);
 assert.ok(bottom.every(a=>a.projectedLifeStatus?.tag));
 assert.equal(packet.physicalWrites,false);assert.equal(packet.nativeDestinationWrites,false);
 assert.ok(packet.vitrines.every(v=>v.geometryVerified===false&&v.shelfLabelsVerified===false));
});

