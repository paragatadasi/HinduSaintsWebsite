import test from "node:test";
import assert from "node:assert/strict";
import {starterMoveGuide} from "./spn-starter-move-guide";
import base from "../data/museum/spn-starter-move-guide-v3.json";
import current from "../data/museum/spn-starter-move-guide-v4.json";
import overlay from "../data/museum/spn-vitrine-two-tree-v1.json";
test("Vitrine 2 presentation tree preserves roster and distinct relationships",()=>{
 const v=starterMoveGuide.vitrines.find(v=>v.code==="2")!;
 const ids=[...v.families,...v.cityGroups].flatMap(g=>g.sourceIds);
 assert.equal(ids.length,13);assert.deepEqual([...ids].sort(),[...overlay.sourceIds].sort());
 const edges=v.families.flatMap(g=>g.edges??[]);assert.equal(edges.length,11);
 assert.ok(edges.some(e=>e.label==="wife"));assert.ok(edges.some(e=>e.label.includes("founding seva")));
 assert.ok(edges.some(e=>e.label.includes("dialogue")));
 assert.ok(!edges.some(e=>e.fromSourceId==="recmarxKCZnFGzlo0"||e.toSourceId==="recmarxKCZnFGzlo0"));
 assert.equal(base.contentDigest,overlay.baseContentDigest);
 assert.equal(starterMoveGuide.contentDigest,current.contentDigest);
 assert.deepEqual(current.vitrines.find(v=>v.code==="2"),base.vitrines.find(v=>v.code==="2"));
 assert.deepEqual(current.rows.filter(r=>r.vitrine==="2"),base.rows.filter(r=>r.vitrine==="2"));
 assert.equal(base.version,overlay.baseGuideVersion);
 assert.equal(starterMoveGuide.version,current.version);
 for(const edge of edges){assert.ok(ids.includes(edge.fromSourceId));assert.ok(ids.includes(edge.toSourceId));}
});
