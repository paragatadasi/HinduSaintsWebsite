import {test} from "node:test";
import assert from "node:assert/strict";
import {createMuseumTreeTouch} from "./museum-tree-touch";
function setup(){let scroll={x:500,y:500},zoom=1;const gesture=createMuseumTreeTouch({read:()=>({scroll,zoom}),pan:p=>{scroll=p;},pinch:(z,p)=>{zoom=z;scroll=p;}});return {gesture,read:()=>({scroll,zoom})};}
test("swipe continues after implicit SVG capture transfers to viewport",()=>{
 const {gesture:g,read}=setup();g.down(1,{x:250,y:250});g.move(1,{x:240,y:240});
 g.lostCapture(1,false);g.move(1,{x:150,y:150});g.move(1,{x:50,y:50});
 assert.deepEqual(read().scroll,{x:700,y:700});g.end(1);assert.equal(g.suppressClick(),true);
});
test("actual capture loss stops panning and the next tap remains a tap",()=>{
 const {gesture:g,read}=setup();g.down(1,{x:100,y:100});g.move(1,{x:80,y:80});g.lostCapture(1,true);g.move(1,{x:0,y:0});
 assert.deepEqual(read().scroll,{x:520,y:520});g.down(2,{x:100,y:100});g.end(2);assert.equal(g.suppressClick(),false);
});
test("capture transfer preserves pinch and lifting one finger continues as pan",()=>{
 const {gesture:g,read}=setup();g.down(1,{x:50,y:100});g.down(2,{x:150,y:100});g.move(2,{x:250,y:100});g.lostCapture(2,false);
 assert.equal(read().zoom,2);g.end(2);const before=read().scroll;g.move(1,{x:30,y:90});assert.deepEqual(read().scroll,{x:before.x+20,y:before.y+10});
 g.reset();assert.equal(g.move(1,{x:0,y:0}),false);
});
