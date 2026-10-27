
import test from "node:test";
import assert from "node:assert/strict";
import {buildRoomMoveDisplays,starterRowSummary,displayMoveStatus,filterRoomMoveDisplays,emptyMoveFilters,vitrineLocation} from "./spn-room-move-domain";
import type {ExplorerObservation} from "./spn-room-proposal";
const row:ExplorerObservation={sourceId:"source-a",saintId:"saint-a",name:"A",vitrine:"5",tier:"Primary",section:"Kriya",sourceVitrine:"4",sourceShelf:"A",unresolved:false,allocationKind:"",share:null,state:"",baseline:null,currentVitrine:"5",currentShelf:"",currentStatus:"Planned",regions:["North"],reviewReason:"",effectiveVitrine:"5"};
test("a planned destination never becomes a current physical location",()=>{
 const [display]=buildRoomMoveDisplays([row],[]);
 assert.equal(display.current?.code,"4");assert.equal(display.currentBasis,"source");assert.equal(displayMoveStatus(display),"Still to bring");
});
test("physical history survives changed proposals, with original shelf preserved",()=>{
 const [display]=buildRoomMoveDisplays([{...row,effectiveVitrine:"9"}],[{sourceId:"source-a",location:vitrineLocation("6")!,at:"2026-10-26"},{sourceId:"source-a",location:{kind:"table",code:"table-a",label:"Table A"},at:"2026-10-27"}]);
 assert.equal(display.original?.shelf,"A");assert.equal(display.current?.code,"table-a");assert.equal(display.history.length,2);
 assert.equal(filterRoomMoveDisplays([display],{...emptyMoveFilters,current:"table-a",destination:"9"}).length,1);
});
test("separate source records for one saint keep distinct locations; unknown is not empty",()=>{
 const displays=buildRoomMoveDisplays([row,{...row,sourceId:"source-b",sourceVitrine:""}],[]);
 assert.equal(displays.length,2);assert.equal(displays[1].current,null);assert.equal(displays[1].currentBasis,"unknown");
 const [already]=buildRoomMoveDisplays([{...row,sourceVitrine:"5"}],[]);
 assert.equal(displayMoveStatus(already),"Recorded here");
});


test("starter row counts distinguish staying, outgoing and incoming displays",()=>{
 const displays=buildRoomMoveDisplays([
 {...row,sourceId:"stay",sourceVitrine:"2",effectiveVitrine:"2"},
 {...row,sourceId:"out",sourceVitrine:"2",effectiveVitrine:"50"},
 {...row,sourceId:"in",sourceVitrine:"4",effectiveVitrine:"2"}
 ],[]);
 const first=starterRowSummary(displays)[0];
 assert.deepEqual(first,{vitrine:"2",recorded:2,incoming:2,staying:1,toBring:1,outgoing:1,needsReview:0});
 assert.deepEqual(starterRowSummary(displays).map(r=>r.vitrine),["2","78","36","29","76","28","27"]);
});
