import {test} from "node:test";
import assert from "node:assert/strict";
import {getMuseumProposalData} from "./museum-proposals";
import {museumTreeOptions,inventoryTreeContexts} from "./museum-tree-options";
test("Gaudiya defaults to its four original trees with other section members optional",()=>{
 const data=getMuseumProposalData(),section=data.sections.find(s=>s.name==="Gaudiya Vaishnava")!;
 const result=museumTreeOptions(section);assert.equal(result.main.length,4);assert.ok(result.main.every(o=>section.families.some(f=>f.key===o.key&&f.treeFile)));assert.ok(result.additional.length>0);assert.ok([...result.main,...result.additional].every(o=>o.count>1&&o.familyKey));
 const foreign=data.sections.find(s=>s.slug!==section.slug&&s.families.length)!;
 const mixed=museumTreeOptions({...section,families:[...section.families,...foreign.families]});
 assert.deepEqual(mixed,result);
});

test("inventory uses exact reviewed identities and retains separate family contexts",()=>{
 const base=getMuseumProposalData().sections.flatMap(s=>s.rows)[0];
 const rows=[{...base,saintId:"a",familyId:"suggested:FAM-001",curatorialFamily:"",sourceRecordId:"r1"},{...base,saintId:"a",familyId:"suggested:FAM-001",curatorialFamily:"",sourceRecordId:"r1"},{...base,saintId:"a",familyId:"FAM-002",curatorialFamily:"FAM-003",sourceRecordId:"r2"}];
 const contexts=inventoryTreeContexts(rows,["a","b","a"]);
 assert.deepEqual(contexts.a,[{familyKey:"suggested:FAM-001",sourceId:"r1"},{familyKey:"FAM-003",sourceId:"r2"}]);
 assert.deepEqual(contexts.b,[{}]);assert.deepEqual(Object.keys(contexts),["a","b"]);
});
