import test from "node:test";
import assert from "node:assert/strict";
import {filterMoveRows,startingVitrines,type MoveFilters} from "./museum-move-companion";
import type {PlannerRow} from "./museum-move-planner-domain";
const row=(id:string,extra:Partial<PlannerRow>={}):PlannerRow=>({id,saintId:id,name:id,section:"Gaudiya Vaishnava",family:"",tier:"Tertiary",needsResearch:false,photo:false,status:"Planned",vitrine:"11",shelf:"",revision:"r",lastConfirmed:null,sources:[{id:"source-"+id,vitrine:"2",shelf:"",relics:"",quantity:"3",shared:false,packagingText:"Box/Frame"}],...extra});
const filters:MoveFilters={query:"",source:"",destination:"",region:"",section:"",status:"all",sort:"destination"};
test("starting and destination filters intersect, including flexible destinations",()=>{
 const rows=[row("exact"),row("flex",{status:"Proposed",vitrine:"",flexibleVitrines:["11","12"]}),row("other",{vitrine:"12"})];
 assert.deepEqual(filterMoveRows(rows,{...filters,source:"2",destination:"11"}).map(r=>r.id),["exact","flex"]);
 assert.equal(filterMoveRows(rows,{...filters,source:"3",destination:"11"}).length,0);
 assert.equal(filterMoveRows(rows,{...filters,region:"The South"}).length,0);
});
test("last confirmed location takes precedence and unassigned entries stay discoverable",()=>{
 const moved=row("moved",{lastConfirmed:{vitrine:"4",shelf:"",confirmedAt:"2026-10-21"}}),unknown=row("unknown",{status:"Proposed",vitrine:"",sources:[]});
 assert.deepEqual(startingVitrines(moved),["4"]);
 assert.equal(filterMoveRows([moved],{...filters,source:"2"}).length,0);
 assert.deepEqual(filterMoveRows([moved,unknown],{...filters,source:"unknown",destination:"unknown",status:"unassigned"}).map(r=>r.id),["unknown"]);
});
test("implemented needing review stays in remaining and review, not completed",()=>{
 const rows=[row("review",{status:"Implemented",arrangementNeedsReview:true}),row("done",{status:"Implemented"})];
 assert.deepEqual(filterMoveRows(rows,{...filters,status:"remaining"}).map(r=>r.id),["review"]);
 assert.deepEqual(filterMoveRows(rows,{...filters,status:"implemented"}).map(r=>r.id),["done"]);
});
