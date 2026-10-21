import test from "node:test";
import assert from "node:assert/strict";
import plan from "../data/museum/vrindavan-minimal-move-plan.json";

// This reviewed core is deliberately limited to five complete, single-source boxes.
test("reviewed core preserves all five occupied slots and touches no frames or Sikh vitrine",()=>{
 assert.equal(plan.entries.length,5);
 const origins=plan.expectedSources.flatMap(row=>row.sources.map(source=>`${source.vitrine}/${source.shelf}`)).sort();
 const targets=plan.entries.map(row=>`${row.vitrine}/${row.shelf}`).sort();
 assert.deepEqual(targets,origins);
 assert.equal(new Set(plan.entries.map(e=>e.saintId)).size,5);
 for(const row of plan.expectedSources){assert.equal(row.sources.length,1);assert.equal(row.sources[0].packagingText,"Box");assert.equal(row.lastConfirmed,null);}
 assert.ok(plan.entries.every(row=>row.vitrine!=="11"));
});
test("seven-step handling sequence never places a box into an occupied slot and leaves no staging",()=>{
 const occupancy=new Map(plan.expectedSources.map(row=>[`${row.sources[0].vitrine}/${row.sources[0].shelf}`,row.saintId]));
 const staged=new Set<string>();
 for(const step of plan.steps){
  assert.equal(step.saintIds.length,1);const id=step.saintIds[0];const origin=[...occupancy].find(([,occupant])=>occupant===id)?.[0];
  if(step.operation==="stage"){assert.ok(origin);occupancy.delete(origin);staged.add(id);continue;}
  const target=plan.entries.find(e=>e.saintId===id)!;assert.ok(target);
  const slot=`${target.vitrine}/${target.shelf}`;assert.equal(occupancy.has(slot),false,`Step ${step.order} destination occupied`);
  assert.ok(origin||staged.has(id));if(origin)occupancy.delete(origin);staged.delete(id);occupancy.set(slot,id);
 }
 assert.equal(staged.size,0);assert.equal(occupancy.size,5);
 for(const row of plan.entries)assert.equal(occupancy.get(`${row.vitrine}/${row.shelf}`),row.saintId);
});

