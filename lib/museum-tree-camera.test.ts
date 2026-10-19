import {test} from "node:test";
import assert from "node:assert/strict";
import {treePinchCamera,treeZoomScroll} from "./museum-tree-camera";
test("zoom preserves the diagram point beneath the finger",()=>{
 assert.deepEqual(treeZoomScroll({x:200,y:300},{x:100,y:80},1,2),{x:500,y:680});
});
test("pinch tracks midpoint translation as well as scale",()=>{
 const result=treePinchCamera({a:{x:50,y:100},b:{x:150,y:100},scroll:{x:200,y:300},zoom:1},{x:30,y:120},{x:230,y:120});
 assert.equal(result.zoom,2);assert.deepEqual(result.scroll,{x:470,y:680});
});
test("zoom boundaries preserve midpoint panning and coincident fingers stay finite",()=>{
 const start={a:{x:0,y:0},b:{x:100,y:0},scroll:{x:100,y:100},zoom:2.5};
 const result=treePinchCamera(start,{x:10,y:20},{x:210,y:20});
 assert.equal(result.zoom,2.5);assert.deepEqual(result.scroll,{x:40,y:80});
 assert.ok(Number.isFinite(treePinchCamera({...start,b:start.a},start.a,start.b).zoom));
});

import {layoutMuseumTree,treeNameLines,TREE_MOBILE_GEOMETRY} from "./museum-tree-layout";
test("mobile cards preserve sibling generations and fit long names without smaller type",()=>{
 const nodes=["a","b","c"].map(id=>({id,name:id,birthYear:null,samadhiYear:null}));
 const claims=["b","c"].map(to=>({id:to,from:"a",to,kind:"guru" as const,status:"published",evidence:"certain",confidence:"high"}));
 const mobile=layoutMuseumTree(nodes,claims,{mobile:true});
 assert.equal(mobile.nodes.find(n=>n.id==="b")!.y,mobile.nodes.find(n=>n.id==="c")!.y);
 const lines=treeNameLines("Om Vishnupad Tridandi Swami 108 Sri Srimat Bhakti Sravan Tirtha Goswami Maharaj",TREE_MOBILE_GEOMETRY);
 assert.ok(lines.every(line=>line.length<=TREE_MOBILE_GEOMETRY.nameChars));
 assert.ok(lines.length<=TREE_MOBILE_GEOMETRY.nameLines);
 assert.ok(TREE_MOBILE_GEOMETRY.nameY+(lines.length-1)*TREE_MOBILE_GEOMETRY.nameLineHeight<TREE_MOBILE_GEOMETRY.metaY);
});
