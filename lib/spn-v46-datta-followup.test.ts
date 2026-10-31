import test from "node:test";
import assert from "node:assert/strict";
import {projectVitthalVedanandaFamily,vitthalVedanandaRelationship as pair} from "./spn-source-family-reunion";
import type {StarterMoveGuide} from "./spn-move-guide";
test("Datta pair becomes a qualified family only for exact identities together in3",()=>{
 const sourceIds=[pair.teacher.sourceId,pair.disciple.sourceId];
 const guide:StarterMoveGuide={version:"fixture",contentDigest:"",assignmentDigest:"",proposalVersion:"",title:"Datta",alternatives:[],reportedPlacements:[],entries:[pair.teacher,pair.disciple].map(m=>({...m,name:m.sourceId,tier:"Tertiary",city:"",relicDescription:"",destination:"3",section:"",family:"",rationale:"",currentLocation:{kind:"vitrine",code:"22",label:"Vitrine 22"}})),vitrines:[{code:"3",summary:"",families:[],cityGroups:[{id:"added",title:"Added",sourceIds,rationale:"",suggestedVitrines:["3"]}]}]};
 const before=JSON.stringify(guide);const next=projectVitthalVedanandaFamily(guide);
 assert.equal(next.vitrines[0].families.length,1);assert.equal(next.vitrines[0].cityGroups.length,0);
 assert.equal(next.vitrines[0].families[0].edges?.[0].basis,"source");assert.match(next.vitrines[0].families[0].rationale,/below the top/);
 assert.equal(next.entries[1].currentLocation?.code,"22");assert.equal(JSON.stringify(guide),before);
 assert.deepEqual(projectVitthalVedanandaFamily(next),next);
 guide.entries[1].destination="82";assert.equal(projectVitthalVedanandaFamily(guide),guide);
 guide.entries[1].destination="3";guide.entries[1].saintId="changed";assert.equal(projectVitthalVedanandaFamily(guide),guide);
});
