import assert from "node:assert/strict";
import test from "node:test";
import {buildSuggestedPlan} from "./museum-suggested-plan";
import {classifyRelicPackaging} from "./museum-relic-packaging";
import type {PlannerData,PlannerRow} from "./museum-move-planner-domain";
const row=(id:string,extra:Partial<PlannerRow>={}):PlannerRow=>({id,saintId:id,name:id,section:"A",family:"",tier:"Tertiary",needsResearch:false,photo:false,status:"Proposed",vitrine:"",shelf:"",revision:id,lastConfirmed:null,sources:[],...extra});
const data=(rows:PlannerRow[],extra:Partial<PlannerData>={}):PlannerData=>({rows,revision:"r",areas:[],sections:[{name:"A",slug:"a",idea:""},{name:"B",slug:"b",idea:""}],photoVitrines:[],photosConfigured:false,photoUpdatedAt:null,awaitingIdentityReview:0,unmappedLocations:[],...extra});
const guide={version:"v",areas:{A:["1","2"],B:["3"]}};
test("keeps display groups together while balancing whole groups",()=>{
 const result=buildSuggestedPlan(data([row("a",{familyKey:"f"}),row("b",{familyKey:"f"}),row("c")]),guide);
 assert.equal(result.assignments[0].vitrine,result.assignments[1].vitrine);
 assert.notEqual(result.assignments[0].vitrine,result.assignments[2].vitrine);
});
test("preserves saved areas and skips existing, flexible, confirmed and stale groups",()=>{
 const rows=[row("a"),row("b",{status:"Planned",vitrine:"7"}),row("c",{flexibleVitrines:["8"]}),row("d",{lastConfirmed:{vitrine:"4",shelf:"",confirmedAt:"today"}}),row("e",{arrangementNeedsReview:true})];
 const result=buildSuggestedPlan(data(rows,{areas:[{section:"A",vitrines:["9"],placements:[]}]}),guide);
 assert.deepEqual(result.assignments,[{id:"a",vitrine:"9"}]);assert.equal(result.held.length,4);
 assert.equal(result.areas[0].preserved,true);
});
test("shared inventory records stay together across sections or are held together",()=>{
 const source={id:"shared",vitrine:"2",shelf:"",relics:"",quantity:"",shared:true};
 const rows=[row("a",{sources:[source]}),row("b",{section:"B",sources:[source]})];
 assert.equal(buildSuggestedPlan(data(rows),guide).assignments.length,0);
 const result=buildSuggestedPlan(data(rows),{...guide,areas:{A:["1","2"],B:["2","3"]}});
 assert.deepEqual(result.assignments.map(a=>a.vitrine),["2","2"]);
});
test("context hold does not force a mistaken family; unresolved context and temple are excluded",()=>{
 const result=buildSuggestedPlan(data([row("a",{familyKey:"f"}),row("b",{familyKey:"f"}),row("c",{section:"Needs Research"})]),{...guide,holds:[{saintId:"a",reason:"Review affiliation"}]});
 assert.deepEqual(result.assignments.map(a=>a.id),["b"]);
 assert.equal(buildSuggestedPlan(data([row("a")]),{...guide,areas:{A:["0"]}}).assignments.length,0);
});
test("balances frame entries separately and never duplicates source quantities",()=>{
 const source={id:"frame",vitrine:"1",shelf:"",relics:"",quantity:"99",shared:false,packaging:classifyRelicPackaging("Frame")};
 const result=buildSuggestedPlan(data([row("a",{sources:[source]}),row("b",{sources:[{...source,id:"other"}]})]),guide);
 assert.notEqual(result.assignments[0].vitrine,result.assignments[1].vitrine);
 assert.deepEqual(result.groups.map(g=>g.frames),[1,1]);
});
test("only explicitly allowed within-section affiliations affect placement; inputs are unchanged",()=>{
 const input=data([row("a",{traditionIds:["specific"]}),row("b",{traditionIds:["specific"]}),row("c",{section:"B",traditionIds:["specific"]})]);
 const before=JSON.stringify(input);
 const result=buildSuggestedPlan(input,{...guide,affinities:[{section:"A",traditionId:"specific"}]});
 assert.equal(result.assignments[0].vitrine,result.assignments[1].vitrine);
 assert.equal(result.assignments[2].vitrine,"3");assert.equal(JSON.stringify(input),before);
});
test("source ordering cannot change the destinations shown by a preview",()=>{
 const rows=[row("a",{familyKey:"f"}),row("b"),row("c",{familyKey:"f"}),row("d")];
 assert.deepEqual(buildSuggestedPlan(data(rows),guide).assignments,buildSuggestedPlan(data([...rows].reverse()),guide).assignments);
});
test("new section suggestions do not occupy another section's saved reservation",()=>{
 const result=buildSuggestedPlan(data([row("a"),row("b",{section:"B"})],{areas:[{section:"B",vitrines:["1"],placements:[]}]}),guide);
 assert.equal(result.assignments.find(a=>a.id==="a")!.vitrine,"2");
 assert.equal(result.assignments.find(a=>a.id==="b")!.vitrine,"1");
});
