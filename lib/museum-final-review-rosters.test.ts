import test from "node:test";
import assert from "node:assert/strict";
import {projectFinalReviewRosters} from "./museum-final-review-rosters";
import {vitrineProgress} from "./museum-vitrine-progress";
import type {FinalReviewProposal} from "./museum-final-review-domain";
import type {CompanionRow,GuideEntry,StarterMoveGuide} from "./spn-move-guide";
const entry={sourceId:"a",saintId:"sa",destination:"50",name:"Saint",tier:"Primary",city:"",section:"",family:"",rationale:"",relicDescription:""} as GuideEntry;
const row={sourceId:"a",saintId:"sa",sourceRevision:"revision",currentBasis:"source",current:{kind:"vitrine",code:"9"}} as CompanionRow;
const proposal={sourceId:"a",saintId:"sa",sourceRevision:"revision",vitrine:"14",shelf:null,version:1,reviewVersion:1} as FinalReviewProposal;
function guide(code:string,ids:string[]):StarterMoveGuide{return {version:code,contentDigest:"digest",assignmentDigest:"assignment",proposalVersion:"test",title:code,alternatives:[],reportedPlacements:[],entries:ids.length?[entry]:[],vitrines:[{code,summary:"",families:[],cityGroups:[{id:code,title:code,sourceIds:ids,rationale:"",suggestedVitrines:[code]}]}]} as StarterMoveGuide;}
test("final destination moves membership across guides once without mutating physical history",()=>{
 const input={west:guide("50",["a"]),hinge:guide("14",[])};const before=JSON.stringify({input,row});
 const output=projectFinalReviewRosters(input,[proposal],[entry],[row]);
 assert.deepEqual(output.west.vitrines[0].cityGroups[0].sourceIds,[]);
 assert.deepEqual(output.hinge.vitrines[0].cityGroups.flatMap(g=>g.sourceIds),["a"]);
 assert.equal(output.hinge.entries[0].destination,"14");
 assert.equal(JSON.stringify({input,row}),before);
 assert.deepEqual(projectFinalReviewRosters(output,[proposal],[entry],[row]),output);
});
test("stale source or identity proof cannot reassign the roster",()=>{
 const input={west:guide("50",["a"])};
 for(const change of [{sourceRevision:"old"},{saintId:"other"}])assert.deepEqual(projectFinalReviewRosters(input,[{...proposal,...change}],[entry],[row]),input);
});
test("source-level final decisions supersede inherited group decisions for progress",()=>{
 const groups=guide("50",["a"]).vitrines[0].cityGroups;
 const old=[{suggestionId:"50",decision:"declined"}] as Parameters<typeof vitrineProgress>[3];
 assert.deepEqual(vitrineProgress("50",groups,[row],old,[{sourceId:"a",decision:"pending"}]),{total:1,addressed:0,deferred:0});
 assert.deepEqual(vitrineProgress("50",groups,[row],[],[{sourceId:"a",decision:"not_on_display"}]),{total:1,addressed:1,deferred:0});
});
