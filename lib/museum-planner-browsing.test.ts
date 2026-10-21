import assert from "node:assert/strict";
import test from "node:test";
import {plannerDestination,plannerVitrineContents,type PlannerRow} from "./museum-move-planner-domain";
import {planningVitrineAllowed} from "./museum-planning-constraints";
test("one destination is preselected, stale selections are discarded and multiple choices stay explicit",()=>{
 assert.equal(plannerDestination(["11"],""),"11");
 assert.equal(plannerDestination(["11"],"6"),"11");
 assert.equal(plannerDestination(["1","2"],""),"");
 assert.equal(plannerDestination(["1","2"],"2"),"2");
 assert.equal(plannerDestination([],"2"),"");
});
test("vitrine browsing distinguishes exact placements, flexible possibilities and unassigned section members",()=>{
 const rows=[{id:"exact",section:"A",status:"Planned",vitrine:"11"},{id:"done",section:"B",status:"Implemented",vitrine:"11"},{id:"flex",section:"A",status:"Proposed",flexibleVitrines:["11","12"]},{id:"unassigned",section:"A",status:"Proposed"},{id:"elsewhere",section:"A",status:"Planned",vitrine:"12"},{id:"other",section:"B",status:"Proposed"}] as PlannerRow[];
 const result=plannerVitrineContents({rows,areas:[{section:"A",vitrines:["11","12"],placements:[]}]},"11");
 assert.deepEqual(result.exact.map(r=>r.id),["exact","done"]);
 assert.deepEqual(result.flexible.map(r=>r.id),["flex"]);
 assert.deepEqual(result.reserved.map(r=>r.id),["unassigned"]);
 assert.equal(plannerVitrineContents({rows,areas:[]},"0").exact.length,0);
});
test("Sikh fixed vitrine applies only to Vrindavan Sikh section, not Udasi or SPN",()=>{
 assert.equal(planningVitrineAllowed("museum-vrindavan","Sikh & Punjab Traditions","11"),true);
 for(const v of ["1","6","12",""])assert.equal(planningVitrineAllowed("museum-vrindavan","Sikh & Punjab Traditions",v),false);
 assert.equal(planningVitrineAllowed("museum-spn","Sikh & Punjab Traditions","6"),true);
 assert.equal(planningVitrineAllowed("museum-vrindavan","Udasin Saints","6"),true);
});
