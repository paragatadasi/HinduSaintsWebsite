import test from "node:test";
import assert from "node:assert/strict";
import {museumProgressSummary} from "./museum-progress-summary";
import type {StarterMoveGuide,CompanionRow,GuideDecision} from "./spn-move-guide";
import type {CompanionPhase} from "./museum-companion-navigation";
function guide(version:string,code:string,ids:string[]){return {version,vitrines:[{code,families:[{id:"family",sourceIds:ids}],cityGroups:[{id:"city",sourceIds:ids.slice(0,1)}]}]} as StarterMoveGuide;}
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
