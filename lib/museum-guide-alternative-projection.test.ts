import test from "node:test";
import assert from "node:assert/strict";
import {projectGuideAlternatives} from "./museum-guide-alternative-projection";
import {activeSpnGuide,isActiveSpnObservation} from "./spn-observation-suppression";
import type {StarterMoveGuide} from "./spn-move-guide";
const guide:StarterMoveGuide={version:"v",contentDigest:"frozen",proposalVersion:"p",assignmentDigest:"frozen",title:"Test",entries:[
{sourceId:"a",saintId:"sa",name:"A",tier:"Primary",city:"X",relicDescription:"",destination:"2",section:"S",family:"F",rationale:""},
{sourceId:"b",saintId:"sb",name:"B",tier:"Secondary",city:"X",relicDescription:"",destination:"2",section:"S",family:"F",rationale:""}],
vitrines:[{code:"2",summary:"",families:[{id:"f",title:"Family",sourceIds:["a","b"],rationale:"",suggestedVitrines:["2"],saintCount:2,edges:[{fromSourceId:"a",toSourceId:"b",label:"teacher"}]}],cityGroups:[]}],alternatives:[],reportedPlacements:[]};
test("an alternative moves guide membership and preserves the frozen guide",()=>{
const before=JSON.stringify(guide);
const next=projectGuideAlternatives(guide,[{sourceId:"a",vitrine:"78",shelf:"B"}]);
assert.equal(JSON.stringify(guide),before);
assert.deepEqual(next.vitrines[0].families[0].sourceIds,["b"]);
assert.deepEqual(next.vitrines[0].families[0].edges,[]);
assert.equal(next.vitrines[0].families[0].saintCount,undefined);
assert.deepEqual(next.vitrines[1].cityGroups[0].sourceIds,["a"]);
assert.equal(next.entries[0].destination,"78");
assert.equal(next.contentDigest,guide.contentDigest);
});
test("same-destination alternatives never duplicate members; removing alternatives restores original",()=>{
const next=projectGuideAlternatives(guide,[{sourceId:"a",vitrine:"2",shelf:"B"}]);
assert.equal(next.vitrines.length,1);
assert.equal(next.vitrines[0].cityGroups.length,0);
assert.deepEqual(projectGuideAlternatives(guide,[]),guide);
});
test("duplicate observation suppression retains original evidence and other observations",()=>{
const duplicate="rec419YldTnqJc6lM",retained="recL5wb5a9ffIoqO9";
const source={...guide,entries:[{...guide.entries[0],sourceId:duplicate},{...guide.entries[1],sourceId:retained}],
vitrines:[{...guide.vitrines[0],families:[{...guide.vitrines[0].families[0],sourceIds:[duplicate,retained]}]}]};
const result=activeSpnGuide(source);
assert.equal(source.entries.length,2);
assert.deepEqual(result.entries.map(e=>e.sourceId),[retained]);
assert.deepEqual(result.vitrines[0].families[0].sourceIds,[retained]);
assert.equal(isActiveSpnObservation(duplicate),false);
assert.equal(isActiveSpnObservation(retained),true);
});
