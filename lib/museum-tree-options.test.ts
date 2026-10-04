import {test} from "node:test";
import assert from "node:assert/strict";
import {getMuseumProposalData} from "./museum-proposals";
import {museumTreeOptions} from "./museum-tree-options";
test("Gaudiya defaults to its four original trees with other section members optional",()=>{
 const data=getMuseumProposalData(),section=data.sections.find(s=>s.name==="Gaudiya Vaishnava")!;
 const result=museumTreeOptions(section);assert.equal(result.main.length,4);assert.ok(result.main.every(o=>section.families.some(f=>f.key===o.key&&f.treeFile)));assert.ok(result.additional.length>0);
 const foreign=data.sections.find(s=>s.slug!==section.slug&&s.families.length)!;
 const mixed=museumTreeOptions({...section,families:[...section.families,...foreign.families]});
 assert.deepEqual(mixed,result);
});
