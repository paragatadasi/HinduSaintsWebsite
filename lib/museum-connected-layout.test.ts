import assert from "node:assert/strict";
import test from "node:test";
import graph from "../data/museum/vrindavan-connected-traditions.json";
import {solveWebLayout,type WebNode} from "./museum-connected-layout";
import {VRINDAVAN_SUBSECTION_PARENTS} from "./vrindavan-lineage-catalogue";
test("companion preserves regional parents and exactly the two agreed priority connections",()=>{
 const names=new Set(graph.regions.flatMap(r=>r.subsections.map(s=>s.name)));
 for(const r of graph.regions)for(const s of r.subsections)assert.equal(VRINDAVAN_SUBSECTION_PARENTS[s.name],r.regionName);
 assert.equal(graph.edges.length,25);
 for(const e of graph.edges){assert.ok(names.has(e.source));assert.ok(names.has(e.target));for(const key of e.sourceKeys)assert.ok(graph.sources.some(source=>source.key===key));}
 assert.deepEqual(graph.edges.filter(e=>e.priorityBoundary).map(e=>[e.source,e.target]),[["Gaudiya Vaishnava","Jagannath-Puri & Odisha"],["Andhra Avadhuta & Datta-Advaita Lineages","Datta Tradition"]]);
});
test("graph cards remain finite and inside narrow and desktop stages",()=>{
 for(const width of [320,600,1100]){
  const nodes:WebNode[]=graph.regions.flatMap((r,i)=>r.subsections.map(s=>({id:s.existingSlug,name:s.name,region:r.regionSlug,regionIndex:i,w:132,h:110,x:0,y:0,vx:0,vy:0})));
  const height=Math.max(720,Math.ceil(nodes.length*132*110/(width*.43)));
  solveWebLayout(nodes,graph.edges,width,height);
  for(const n of nodes){assert.ok(Number.isFinite(n.x)&&Number.isFinite(n.y));assert.ok(n.x>=n.w/2&&n.x+n.w/2<=width);assert.ok(n.y>=n.h/2&&n.y+n.h/2<=height);}
 }
});
