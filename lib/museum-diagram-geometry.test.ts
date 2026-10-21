import test from "node:test";
import assert from "node:assert/strict";
import {vitrineCenter,proposalDiagramPositions,moveDiagramGroup} from "./museum-diagram-geometry";
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
