import test from "node:test";
import assert from "node:assert/strict";
import graph from "../data/museum/spn-connected-traditions.json";
test("SPN connections reference existing unique sections and sources",()=>{
 const sections=graph.regions.flatMap(r=>r.subsections),names=new Set(sections.map(s=>s.name));
 assert.equal(new Set(sections.map(s=>s.existingSlug)).size,sections.length);
 for(const e of graph.edges){assert.ok(names.has(e.source));assert.ok(names.has(e.target));for(const key of e.sourceKeys)assert.ok(graph.sources.some(s=>s.key===key));}
 for(const f of graph.families){for(const name of f.sections)assert.ok(names.has(name)||name==="Needs Research");assert.notEqual(f.from.saintId,f.to.saintId);}
});
test("guidance and visits retain precise types without inventing guru relationships",()=>{
 const guidance=graph.families.find(f=>f.from.name.includes("Gupta")&&f.to.name.includes("Yogananda"));
 assert.ok(guidance);assert.equal(guidance.to.saintId,"cms0w7fr004ld07qidykpxgm1");assert.equal(guidance.type,"influence");
 const visits=graph.families.filter(f=>f.from.name.includes("Vaswani")&&f.to.name.includes("Ramana"));
 assert.equal(visits.length,2);assert.ok(visits.every(f=>f.type==="encountered"&&f.evidenceNote?.includes("1939")));
 const household=graph.families.find(f=>f.from.name.includes("Namdev")&&f.to.name.includes("Janabai"));
 assert.equal(household?.type,"household");assert.match(household?.evidenceNote??"",/no biological relationship/);
});
