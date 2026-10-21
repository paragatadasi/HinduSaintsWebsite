import {test} from "node:test";
import assert from "node:assert/strict";
import reference from "../data/museum/reviewed-sikh-guru-context.json";
import {buildSikhContext,sikhContextSeeds} from "./museum-sikh-context";
import {layoutMuseumTree,type TreePerson,type TreeClaim} from "./museum-tree-layout";
const people:TreePerson[]=reference.nodes.flatMap(n=>n.canonicalSaintId?[{id:n.canonicalSaintId,name:n.name,birthYear:null,samadhiYear:null,presence:"source" as const}]:[]);
const id=(value:string)=>reference.nodes.find(n=>n.id===value)!.canonicalSaintId!;
const saved:TreeClaim[]=reference.edges.filter(e=>e.canonicalRelationshipSaved).map(e=>({id:e.id,from:id(e.from),to:id(e.to),kind:e.type as TreeClaim["kind"],status:"published",evidence:e.evidence,confidence:"high"}));
test("reviewed context completes nine immediate successions without inventing holdings or personal affiliation",()=>{
 const graph=buildSikhContext(people,saved);
 assert.equal(sikhContextSeeds().length,8);
 assert.equal(graph.claims.filter(c=>c.kind==="successor").length,9);
 assert.equal(graph.nodes.filter(n=>n.contextOnly).length,5);
 assert.ok(graph.nodes.filter(n=>n.contextOnly).every(n=>n.presence==="none"));
 assert.equal(graph.nodes.length,13); // affiliation is explanatory text, not a saint
 const piara=reference.nodes.find(n=>n.name.includes("Piara"))!.canonicalSaintId;
 assert.ok(graph.claims.every(c=>c.from!==piara&&c.to!==piara));
 const layout=layoutMuseumTree(graph.nodes,graph.claims);
 const gurus=reference.nodes.filter(n=>n.role==="Sikh Guru");
 assert.deepEqual(gurus.map(n=>layout.nodes.find(p=>p.id===(n.canonicalSaintId||n.id))!.row),Array.from({length:10},(_,i)=>i));
});
test("canonical removals are not resurrected from a reviewed snapshot",()=>{
 const graph=buildSikhContext(people,[]);
 for(const c of saved)assert.ok(graph.claims.every(e=>!(e.from===c.from&&e.to===c.to&&e.kind===c.kind)));
 const absent=people[0].id;
 const filtered=buildSikhContext(people.filter(n=>n.id!==absent),saved);
 assert.ok(filtered.nodes.every(n=>n.id!==absent));
 assert.ok(filtered.claims.every(c=>c.from!==absent&&c.to!==absent));
});
test("context evidence has resolvable endpoints and source keys",()=>{
 const ids=new Set(reference.nodes.map(n=>n.id)),sources=new Set(reference.sources.map(s=>s.key));
 assert.equal(ids.size,reference.nodes.length);
 for(const e of reference.edges){assert.ok(ids.has(e.from)&&ids.has(e.to));assert.ok(e.sources.every(s=>sources.has(s)));}
 assert.ok(reference.sources.every(s=>new URL(s.url).protocol==="https:"));
});
