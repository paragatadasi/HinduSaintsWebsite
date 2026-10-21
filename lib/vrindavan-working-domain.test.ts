import test from "node:test";
import assert from "node:assert/strict";
import {buildVrindavanWorkingView} from "./vrindavan-working-domain";
import type {MuseumSaintPlacement} from "./museum-proposals";
import {vrindavanDisplayFamilyCatalogue} from "./vrindavan-display-family-catalogue";
const base={id:"source",saintId:"s",name:"Saint",section:"A",tier:"Featured",familyId:"suggested:f",groupLabel:"Family",curatorialFamily:"",note:"Source row 2",alternatives:[],needsResearch:false} as unknown as MuseumSaintPlacement;
test("configured family is selectable without assigning saints or invalidating their plans",()=>{
 const first=buildVrindavanWorkingView([base],[],[],"snapshot").placements[0];
 const saved={placementId:first.id,proposalRevision:first.arrangement!.proposalRevision,status:"Planned",version:1,vitrine:"17",shelf:"",confirmedAt:null,inventoryAcknowledged:false};
 const result=buildVrindavanWorkingView([base],[],[saved],"snapshot");
 assert.ok(result.groupOptions.some(g=>g.key==="curator:tinkodi-baba-family"&&g.label==="Tinkodi Baba Family"));
 assert.equal(result.placements[0].familyId,base.familyId);
 assert.equal(result.placements[0].arrangement!.status,"Planned");
 assert.equal(result.placements[0].arrangement!.vitrine,"17");
 assert.equal(result.placements[0].curatorProposalRevision,first.curatorProposalRevision);
 assert.ok(!result.families.some(g=>g.key==="curator:tinkodi-baba-family"));
});
test("explicit curator overrides form the configured family without changing tiers or sections",()=>{
 const group=vrindavanDisplayFamilyCatalogue[0];
 const rows=[{...base,saintId:"teacher",tier:"Featured" as const},{...base,id:"other",saintId:"disciple",tier:"Secondary" as const,familyId:""}];
 const overrides=rows.map(row=>({saintId:row.saintId!,section:row.section,tier:row.tier,groupKey:group.key,groupLabel:group.label,version:1}));
 const result=buildVrindavanWorkingView(rows,overrides,[],"snapshot");
 assert.equal(result.families.find(g=>g.key===group.key)?.count,2);
 assert.deepEqual(result.placements.map(p=>[p.tier,p.section,p.familyId]),[["Featured","A",group.key],["Secondary","A",group.key]]);
 assert.equal(rows[0].familyId,"suggested:f");
});
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
