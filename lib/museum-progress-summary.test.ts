import test from "node:test";
import assert from "node:assert/strict";
import {museumProgressSummary} from "./museum-progress-summary";
import type {StarterMoveGuide,CompanionRow,GuideDecision} from "./spn-move-guide";
import type {CompanionPhase} from "./museum-companion-navigation";
function guide(version:string,code:string,ids:string[]){return {version,entries:ids.map(sourceId=>({sourceId,destination:code})),vitrines:[{code,families:[{id:"family",sourceIds:ids}],cityGroups:[{id:"city",sourceIds:ids.slice(0,1)}]}]} as StarterMoveGuide;}
test("progress weights regions by records, deduplicates overlapping guides and keeps deferrals separate",()=>{
 const guides={starter:guide("a","2",["a","b","c"]),east2:guide("b","24",["d"]),north:guide("c","2",["a","b","c"])} as Record<CompanionPhase,StarterMoveGuide>;
 const rows=[{sourceId:"a",currentBasis:"confirmed",current:{kind:"vitrine",code:"2"}}] as CompanionRow[];
 const decisions={a:[{suggestionId:"row:b",decision:"declined",note:null,version:1},{suggestionId:"row:c",decision:"deferred",note:null,version:1}],b:[{suggestionId:"row:d",decision:"not_on_display",note:null,version:1}]} as Record<string,GuideDecision[]>;
 const result=museumProgressSummary(guides,rows,decisions);
 assert.equal(result.total,4);assert.equal(result.addressed,3);assert.equal(result.deferred,1);
 assert.deepEqual(result.regions.map(r=>[r.label,r.total,r.addressed]),[["Gaudiya East",3,2],["East",1,1]]);
 assert.equal(result.regions[0].vitrines[0].owner,"starter");
});
test("empty guides and restored decisions do not imply completion",()=>{
 const guides={starter:guide("a","2",["a"])} as Record<CompanionPhase,StarterMoveGuide>;
 assert.equal(museumProgressSummary(guides,[],{a:[{suggestionId:"row:a",decision:"pending",note:null,version:1}] as GuideDecision[]}).addressed,0);
 assert.equal(museumProgressSummary({} as Record<CompanionPhase,StarterMoveGuide>,[],{}).total,0);
});

import {confirmedEmptyProgressSources} from "./spn-progress-exclusions";
import {vitrineProgress} from "./museum-vitrine-progress";
test("omitted empty, private and duplicate observations never count, but restored unknown collection does",()=>{
 const omitted=[...confirmedEmptyProgressSources,"rechBZw1LyW9TTX9L","rec419YldTnqJc6lM"];
 const restored="recaTTfjinlSVDk4n";
 const g=guide("a","2",[...omitted,restored]);
 const rows=omitted.map(sourceId=>({sourceId,currentBasis:"confirmed",current:{kind:"vitrine",code:"2"}})) as CompanionRow[];
 const result=museumProgressSummary({starter:g} as Record<CompanionPhase,StarterMoveGuide>,rows,{});
 assert.equal(result.total,1);assert.equal(result.addressed,0);
 assert.deepEqual(vitrineProgress("2",g.vitrines[0].families,rows,[]),{total:1,addressed:0,deferred:0});
 assert.equal(g.entries.length,omitted.length+1);
});
test("stale group references do not consume the source before its current destination",()=>{
 const old=guide("a","2",["moved","missing"]);old.entries=[{sourceId:"moved",destination:"24"}] as StarterMoveGuide["entries"];
 const target=guide("b","24",["moved"]);
 const result=museumProgressSummary({starter:old,east2:target} as Record<CompanionPhase,StarterMoveGuide>,[{sourceId:"moved",currentBasis:"confirmed",current:{kind:"vitrine",code:"24"}}] as CompanionRow[],{});
 assert.equal(result.total,1);assert.equal(result.addressed,1);
 assert.equal(result.regions[0].total,0);assert.equal(result.regions[1].total,1);
});
test("loading genuinely new proposal members increases the denominator once",()=>{
 const first=guide("a","2",["one"]),next=guide("a","2",["one","two"]);
 assert.equal(museumProgressSummary({starter:first} as Record<CompanionPhase,StarterMoveGuide>,[],{}).total,1);
 assert.equal(museumProgressSummary({starter:next} as Record<CompanionPhase,StarterMoveGuide>,[],{}).total,2);
});

import {finalReviewProgress} from "./museum-final-review-progress";
import type {FinalReviewRecord} from "./museum-final-review-view";
test("move and final review share ordered regional groups with Maharashtra in West",()=>{
 const guides={north:guide("n","19",["n"]),hinge:guide("h","38",["h"]),west45:guide("w","45",["w"]),maharashtra:guide("m","61",["m"]),starter:guide("s","2",["s"])} as Record<CompanionPhase,StarterMoveGuide>;
 const records=Object.values(guides).flatMap(g=>g.entries.map(e=>({sourceId:e.sourceId,destination:e.destination,finallyReviewed:true} as FinalReviewRecord)));
 const move=museumProgressSummary(guides,[],{}),review=finalReviewProgress(records,guides);
 assert.deepEqual(review.regions.map(r=>[r.label,r.total]),move.regions.map(r=>[r.label,r.total]));
 assert.deepEqual(review.regions.map(r=>r.label),["Gaudiya East","Central","North","West"]);
 assert.deepEqual(review.regions.find(r=>r.label==="West")!.vitrines.map(v=>v.code),["45","61"]);
 assert.equal(review.total,5);assert.equal(review.complete,5);
 const extra=finalReviewProgress([...records,{sourceId:"unknown",destination:"99"},{sourceId:"pending",destination:""}] as FinalReviewRecord[],guides);
 assert.deepEqual(extra.regions.slice(-2).map(r=>r.label),["No destination","Other vitrines"]);
});
