import {test} from "node:test";
import assert from "node:assert/strict";
import data from "../data/museum/layouts/spn-layout-2026-10-23.json";
import {destinationEligibility,layoutValidationErrors,provisionalNumberCollisions,type MuseumRoomLayout} from "./museum-room-layout";
const layout=data as MuseumRoomLayout;
const get=(n:number)=>layout.vitrines.find(v=>v.number===String(n))!;
test("SPN sketch preserves numbers 1–69 exactly once and adds 13 new and 3 future labels",()=>{
 assert.deepEqual(layoutValidationErrors(layout),[]);
 assert.equal(layout.vitrines.length,85);
 for(let n=1;n<=69;n++)assert.equal(layout.vitrines.filter(v=>v.number===String(n)).length,1);
 assert.equal(get(69).availability,"new");assert.equal(get(69).provisional,false);
 assert.equal(layout.vitrines.filter(v=>v.availability==="new"&&v.provisional).length,13);
 assert.deepEqual(layout.vitrines.filter(v=>v.availability==="future").map(v=>v.number),["83","84","85"]);
});
test("future vitrines are never eligible and walking-stick cases reject general/unknown items",()=>{
 for(const n of [83,84,85])for(const kind of ["general","walking_stick","unknown"] as const)assert.equal(destinationEligibility(get(n),kind).allowed,false);
 for(const n of [30,31]){
  assert.equal(destinationEligibility(get(n),"general").allowed,false);
  assert.equal(destinationEligibility(get(n)).allowed,false);
  assert.equal(destinationEligibility(get(n),"walking_stick").allowed,true);
 }
 assert.equal(destinationEligibility(get(70),"general").allowed,true);
});
test("confirmed new island and future spaces match the sketch",()=>{
 assert.equal(get(80).columnSpan,get(81).columnSpan+get(82).columnSpan);
 assert.equal(get(81).row,get(82).row);
 assert.equal(get(80).row+get(80).rowSpan,get(81).row);
 assert.equal(get(81).row+get(81).rowSpan,get(3).row);
 for(const [future,anchor] of [[83,1],[84,4]]){assert.equal(get(future).column,get(anchor).column);assert.equal(get(future).row+get(future).rowSpan,get(anchor).row);}
 assert.equal(get(85).column,get(30).column);assert.equal(get(85).row,get(30).row+get(30).rowSpan);
 assert.equal(get(85).restriction,"walking_sticks");
});
test("entrance-room islands retain the alternating row numbering",()=>{
 const at=(r:number)=>layout.vitrines.filter(v=>v.row===r&&v.column>=5&&v.column<20).sort((a,b)=>a.column-b.column).map(v=>v.number);
 assert.deepEqual(at(28),["40","41","42","43","44"]);
 assert.deepEqual(at(30),["50","49","48","47","46"]);
 assert.deepEqual(at(34),["62","61","60","59","58"]);
 assert.deepEqual(at(36),["52","53","54","55","56"]);
});
test("provisional collision checks include shelves without matching another museum implicitly",()=>{
 assert.deepEqual(provisionalNumberCollisions(layout,["69","70/A","Vitrine 82","85","not a number"]),["70","82","85"]);
 assert.deepEqual(provisionalNumberCollisions(layout,["1","68"]),[]);
});
