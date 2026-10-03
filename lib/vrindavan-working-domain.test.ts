import test from "node:test";
import assert from "node:assert/strict";
import {buildVrindavanWorkingView} from "./vrindavan-working-domain";
import type {MuseumSaintPlacement} from "./museum-proposals";
const base={id:"source",saintId:"s",name:"Saint",section:"A",tier:"Featured",familyId:"suggested:f",groupLabel:"Family",curatorialFamily:"",note:"Source row 2",alternatives:[],needsResearch:false} as unknown as MuseumSaintPlacement;
test("museum override survives later SPN proposal changes and remains independent",()=>{
 const override={saintId:"s",section:"B",tier:"Secondary",groupKey:"",groupLabel:"",version:1};
 const first=buildVrindavanWorkingView([base],[override],[],"snapshot");
 const next=buildVrindavanWorkingView([{...base,section:"C",familyId:"suggested:g"}],[override],[],"snapshot");
 assert.equal(next.placements[0].section,"B");assert.equal(next.placements[0].familyId,"");assert.equal(next.placements[0].curatorProposalRevision,first.placements[0].curatorProposalRevision);assert.equal(next.families.length,0);
});
test("conflicting inherited proposals require explicit section choice",()=>{const result=buildVrindavanWorkingView([base,{...base,id:"other",section:"B"}],[],[],"snapshot");assert.equal(result.placements.length,1);assert.equal(result.placements[0].section,"Needs section proposal");assert.deepEqual(result.placements[0].alternatives,["A","B"]);});
test("changed inventory coverage or curator version invalidates stale arrangements",()=>{
 const first=buildVrindavanWorkingView([base],[],[],"snapshot").placements[0];
 const saved={placementId:first.id,proposalRevision:first.arrangement!.proposalRevision,status:"Implemented",version:1,vitrine:"1",shelf:null,confirmedAt:new Date(),inventoryAcknowledged:true};
 assert.equal(buildVrindavanWorkingView([base],[],[saved],"snapshot").placements[0].arrangement!.status,"Implemented");
 assert.equal(buildVrindavanWorkingView([{...base,note:"Source rows 2, 3"}],[],[saved],"snapshot").placements[0].arrangement!.status,"Proposed");
 assert.equal(buildVrindavanWorkingView([base],[],[saved],"newSnapshot").placements[0].arrangement!.status,"Proposed");
});
