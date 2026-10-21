import test from "node:test";
import assert from "node:assert/strict";
import {packProposalColumns,vitrineCenter,proposalDiagramPositions,moveDiagramGroup} from "./museum-diagram-geometry";
import type {WebNode} from "./museum-connected-layout";
test("room geometry respects entrance and central vitrine positions",()=>{
 assert.ok(vitrineCenter("11")!.x>vitrineCenter("1")!.x);
 assert.ok(vitrineCenter("19")!.y<vitrineCenter("14")!.y);
 assert.ok(vitrineCenter("0")!.y>vitrineCenter("1")!.y);
 assert.equal(vitrineCenter("unknown"),null);
});
test("proposal uses unique saved area centroids and separates unassigned sections",()=>{
 const nodes=[{id:"a",name:"A"},{id:"b",name:"B"}];
 const result=proposalDiagramPositions(nodes,[{section:"A",vitrines:["17","19","17"]}]);
 assert.equal(result[0].x,(vitrineCenter("17")!.x+vitrineCenter("19")!.x)/2);
 assert.equal(result[0].y,(vitrineCenter("17")!.y+vitrineCenter("19")!.y)/2*.82);
 assert.equal(result[1].y,.96);
 assert.deepEqual(proposalDiagramPositions(nodes,[{section:"A",vitrines:["unknown"]}]).map(p=>p.y),[.96,.96]);
});
const node=(id:string,x:number,y:number):WebNode=>({id,name:id,region:"r",regionIndex:0,w:20,h:20,x,y,vx:0,vy:0});
test("group movement clamps the shared delta without distorting selected offsets",()=>{
 const input=[node("a",20,30),node("b",70,60),node("c",40,70)];
 const result=moveDiagramGroup(input,new Set(["a","b"]),100,-100,100,100);
 assert.equal(result[0].x-input[0].x,20);assert.equal(result[1].x-input[1].x,20);
 assert.equal(result[0].y-input[0].y,-20);assert.equal(result[1].y-input[1].y,-20);
 assert.deepEqual(result[2],input[2]);assert.equal(input[0].x,20);
});

test("proposal packing preserves four physical columns, vertical order and non-overlap",()=>{
 const names=["19","18","17","20","21","5","4","11","12"];
 const nodes=names.map(id=>({...node(id,0,0),w:140,h:130}));
 const positions=proposalDiagramPositions(nodes,names.map(id=>({section:id,vitrines:[id]})));
 const packed=packProposalColumns(nodes,positions,640,150);
 for(const n of packed.nodes){assert.equal(n.x,(Math.floor(vitrineCenter(n.id)!.x*4)+.5)*160);assert.ok(n.y+n.h/2<=packed.height);}
 for(const a of packed.nodes)for(const b of packed.nodes)if(a.id!==b.id&&a.x===b.x)assert.ok(Math.abs(a.y-b.y)>=150);
 assert.ok(packed.nodes.find(n=>n.id==="19")!.y<packed.nodes.find(n=>n.id==="17")!.y);
});
test("unassigned sections stay below the room without changing assigned columns",()=>{
 const input=[node("a",0,0),node("b",0,0)];
 const positions=proposalDiagramPositions(input,[{section:"a",vitrines:["11"]}]);
 const packed=packProposalColumns(input,positions,640,150);
 assert.equal(packed.nodes[0].x,560);assert.ok(packed.nodes[1].y>packed.roomBottom);
 assert.ok(packed.nodes[1].y+10<=packed.height);
});
