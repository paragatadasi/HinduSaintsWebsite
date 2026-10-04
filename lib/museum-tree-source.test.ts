import {test} from "node:test";
import assert from "node:assert/strict";
import {sourceTreeReference} from "./museum-tree-source";
import {getMuseumProposalData} from "./museum-proposals";
import {layoutMuseumTree,type TreePerson} from "./museum-tree-layout";
const rows=[{RecordId:"recA",Name:"Teacher",Disciples:"recB",Masters:""},{RecordId:"recB",Name:"Disciple",Disciples:"",Masters:"recA"}];
const links=[{id:"1",externalId:"appBase:Saints:recA",entityId:"a"},{id:"2",externalId:"appBase:Saints:recB",entityId:"b"}];
const people:TreePerson[]=[{id:"a",name:"Current teacher",birthYear:null,samadhiYear:null},{id:"b",name:"Current disciple",birthYear:null,samadhiYear:null}];
test("preserved source gives all four Gaudiya comparison families real connected graphs",()=>{
 const data=getMuseumProposalData();const section=data.sections.find(s=>s.name==="Gaudiya Vaishnava")!;
 const families=section.families.filter(f=>f.treeFile);assert.ok(families.length>=4);
 for(const family of families){const rows=family.rows.map(r=>data.membersById.get(r.id)!);const reference=sourceTreeReference(rows,[],[],[]);const layout=layoutMuseumTree(reference.nodes,reference.claims);assert.equal(layout.nodes.length,rows.length);assert.ok(layout.edges.length>1,family.label);assert.ok(layout.nodes.some(n=>n.row>0),family.label);if(family.key==="FAM-001"){assert.equal(layout.nodes.length,16);assert.ok(layout.edges.length>=15);}}
});
test("unique website identity uses current name; unresolved source keeps explicit identity gap",()=>{const r=sourceTreeReference(rows,links.slice(0,1),people,[]);assert.equal(r.nodes.find(n=>n.id==="a")!.name,"Current teacher");assert.equal(r.nodes.find(n=>n.id==="source:recB")!.sourceOnly,true);assert.equal(r.claims[0].status,"source reference");});
test("archived, corrected direction and changed relationship kinds suppress source claim",()=>{for(const relationshipType of ["guru","associated"]){const r=sourceTreeReference(rows,links,people,[{id:"1",fromSaintId:"a",toSaintId:"b",relationshipType,status:"archived",evidenceStatus:"certain",confidence:"high"}]);assert.equal(r.claims.length,0);}});
test("archived identities cannot return as unresolved source nodes",()=>{const r=sourceTreeReference(rows,links,people.slice(0,1),[]);assert.equal(r.nodes.length,1);assert.equal(r.claims.length,0);});
test("ambiguous identities are not merged by name",()=>{const r=sourceTreeReference(rows,[...links,{...links[0],id:"extra",entityId:"b"}],people,[]);assert.ok(r.nodes.some(n=>n.id==="source:recA"&&n.sourceOnly));});
