import test from "node:test";
import assert from "node:assert/strict";
import {arrangementControl,arrangementInput} from "./museum-arrangement-domain";
import type {MuseumSaintPlacement} from "./museum-proposals";
const row={id:"a",saintId:"s",section:"A",tier:"Featured",familyId:"F",curatorialFamily:""} as MuseumSaintPlacement;
const base={placementId:"a",revision:"a".repeat(64),familyKey:"F",status:"Planned"};
test("Planned requires a vitrine, permits no shelf and preserves textual identifiers",()=>{
 assert.equal(arrangementInput.safeParse(base).success,false);
 assert.equal(arrangementInput.safeParse({...base,vitrine:"  "}).success,false);
 assert.equal(arrangementInput.parse({...base,vitrine:"3.4"}).vitrine,"3.4");
 assert.equal(arrangementInput.safeParse({...base,status:"Proposed",shelf:"2"}).success,false);
});
test("Implemented requires physical confirmation and inventory acknowledgement",()=>{
 assert.equal(arrangementInput.safeParse({...base,status:"Implemented"}).success,false);
 assert.equal(arrangementInput.safeParse({...base,status:"Implemented",physicalConfirmation:"yes",inventoryAcknowledged:"yes"}).success,true);
});
test("Legacy confirmation is Proposed until explicit physical confirmation",()=>{
 assert.equal(arrangementControl({...row,placementState:"Confirmed"},undefined,0).status,"Proposed");
});
test("Proposal revisions invalidate implementation; biography changes do not",()=>{
 const initial=arrangementControl(row,undefined,1);
 const saved={proposalRevision:initial.proposalRevision,status:"Implemented",version:1,vitrine:"4",shelf:null,confirmedAt:new Date(),inventoryAcknowledged:true};
 assert.equal(arrangementControl(row,saved,1).status,"Implemented");
 assert.equal(arrangementControl({...row,section:"B"},saved,1).status,"Proposed");
 assert.equal(arrangementControl(row,saved,2).status,"Proposed");
 assert.equal(arrangementControl({...row,name:"Updated spelling"},saved,1).status,"Implemented");
 assert.notEqual(arrangementControl(row,{...saved,version:2},1).revision,arrangementControl(row,saved,1).revision);
});
