import test from "node:test";
import assert from "node:assert/strict";
import refinements from "../data/museum/spn-western-additions-v1.json";
import {applyWesternGuideRefinements} from "./spn-western-guide-refinements";
import type {StarterMoveGuide} from "./spn-move-guide";

test("Western annotations qualify locality without altering identity, destinations or physical locations",()=>{
 const guide:StarterMoveGuide={version:"test",proposalVersion:"test",contentDigest:"test",assignmentDigest:"test",title:"test",alternatives:[],reportedPlacements:[],vitrines:[{code:"39",summary:"Junagadh",families:[],cityGroups:[{id:"curator-additions:39",title:"Curator additions",sourceIds:refinements.filter(r=>r.destination==="39").map(r=>r.sourceId),rationale:"",suggestedVitrines:["39"]}]}],entries:refinements.map(r=>({sourceId:r.sourceId,saintId:r.saintId,name:r.title,tier:"Tertiary",city:"Old source locality",destination:r.destination,relicDescription:"",section:"",family:"",rationale:"",currentLocation:{kind:"table",code:"staging-area",label:"Staging area"}}))};
 const before=JSON.stringify(guide),result=applyWesternGuideRefinements(guide);
 assert.equal(result.entries.find(r=>r.sourceId==="recrnRwlcWV9vc8G4")?.city,"Bhavnagar");
 assert.match(result.entries.find(r=>r.sourceId==="recJxB8V6ELyj1f9A")?.reviewNotes?.join(" ")??"",/Optional.*qualification/);
 assert.deepEqual(result.entries.map(r=>[r.sourceId,r.saintId,r.destination,r.currentLocation]),guide.entries.map(r=>[r.sourceId,r.saintId,r.destination,r.currentLocation]));
 assert.equal(new Set(result.vitrines[0].cityGroups.flatMap(g=>g.sourceIds)).size,8);
 assert.equal(JSON.stringify(guide),before);
 guide.entries[0].saintId="different";
 assert.equal(applyWesternGuideRefinements(guide).entries[0].city,"Old source locality");
});
