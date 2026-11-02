import test from "node:test";
import assert from "node:assert/strict";
import {projectConfirmedRosters,registerManualBhaktiMarga} from "./museum-confirmed-rosters";
import {projectCompanionAdditions} from "./museum-companion-addition-projection";
import {museumProgressSummary} from "./museum-progress-summary";
import type {CompanionPhase} from "./museum-companion-navigation";
import type {GuideEntry,CompanionRow,StarterMoveGuide} from "./spn-move-guide";
const entry:GuideEntry={sourceId:"a",saintId:"sa",name:"Saint",destination:"49",tier:"Primary",city:"",section:"",family:"",rationale:"",relicDescription:""};
const row={sourceId:"a",saintId:"sa",currentBasis:"confirmed",current:{kind:"vitrine",code:"49"},identityChanged:false} as CompanionRow;
function fixture(){return {west45:{version:"test",contentDigest:"digest",assignmentDigest:"assignment",proposalVersion:"p",title:"West",entries:[{...entry,destination:"50"}],vitrines:[{code:"50",summary:"",families:[],cityGroups:[{id:"old",title:"Old",sourceIds:["a"],rationale:"",suggestedVitrines:["50"]}]}],alternatives:[],reportedPlacements:[]}} as unknown as Record<CompanionPhase,StarterMoveGuide>;}
test("confirmed destination receives exactly one roster entry and addressed progress without changing input or guide identity",()=>{
 const input=fixture(),before=JSON.stringify(input);
 const result=projectConfirmedRosters(input,[entry],[row]);
 assert.equal(result.west45.vitrines[0].cityGroups[0].sourceIds.length,0);
 assert.deepEqual(result.west45.vitrines[1].cityGroups[0].sourceIds,["a"]);
 assert.equal(result.west45.contentDigest,"digest");assert.equal(JSON.stringify(input),before);
 const summary=museumProgressSummary(result,[row],{});
 assert.equal(summary.total,1);assert.equal(summary.addressed,1);
 assert.deepEqual(projectConfirmedRosters(result,[entry],[row]),result);
});
test("source locations, staging, changed identities, excluded sources and newer proposed destinations do not create confirmed rosters",()=>{
 for(const change of [{currentBasis:"source"},{current:{kind:"table",code:"staging-area"}},{identityChanged:true},{saintId:"other"}]){
  const input=fixture();assert.deepEqual(projectConfirmedRosters(input,[entry],[{...row,...change} as CompanionRow]),input);
 }
 const input=fixture();assert.deepEqual(projectConfirmedRosters(input,[{...entry,destination:"51"}],[row]),input);
 const empty="recq8jg20kMAD2Erc";assert.deepEqual(projectConfirmedRosters(input,[{...entry,sourceId:empty}],[{...row,sourceId:empty}]),input);
});
test("manual Bhakti Marga receivers open14 and15 without assigning or confirming records",()=>{
 const input={hinge:fixture().west45};const result=registerManualBhaktiMarga(input);
 assert.deepEqual(result.hinge.vitrines.map(v=>v.code),["50","14","15"]);
 assert.deepEqual(result.hinge.entries,input.hinge.entries);
 assert.ok(result.hinge.vitrines.slice(1).every(v=>!v.families.length&&!v.cityGroups.length));
 assert.deepEqual(registerManualBhaktiMarga(result),result);
});
test("confirmed component placement counts only the selected pieces and retains their other location",()=>{
 const component={...row,sourceRevision:"rev",current:{kind:"vitrine",code:"64"},currentBasis:"source",componentPlacement:{sourceId:"a",expectedSourceRevision:"rev",scope:"vitrine_64_contents_only",location:{kind:"vitrine",code:"49"}}} as CompanionRow;
 const before=JSON.stringify(component),result=projectConfirmedRosters(fixture(),[entry],[component]);
 assert.equal(museumProgressSummary(result,[component],{}).addressed,1);
 assert.equal(JSON.stringify(component),before);
 const stale={...component,sourceRevision:"changed"};assert.deepEqual(projectConfirmedRosters(fixture(),[entry],[stale]),fixture());
});
test("a manual saved destination joins14 or15 without remapping the other Bhakti Marga entries",()=>{
 for(const vitrine of ["14","15"]){
  const input=registerManualBhaktiMarga({hinge:fixture().west45});
  const result=projectCompanionAdditions(input,[{sourceId:"a",saintId:"sa",sourceRevision:"rev",vitrine,shelf:null,version:1,updatedAt:"2026-11-02T10:00:00Z",clientRequestId:"request"}],[{...entry,destination:vitrine}]);
  assert.ok(result.hinge.vitrines.find(v=>v.code===vitrine)!.cityGroups.some(g=>g.sourceIds.includes("a")));
  assert.ok(result.hinge.vitrines.find(v=>v.code===(vitrine==="14"?"15":"14"))!.cityGroups.every(g=>!g.sourceIds.includes("a")));
 }
});
