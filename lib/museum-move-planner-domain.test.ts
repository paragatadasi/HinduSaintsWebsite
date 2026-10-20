import assert from "node:assert/strict";
import test from "node:test";
import {photoSaintsInVitrines,plannerAssignmentInput,plannerPhotoInput,vitrineNumber,plannerCounts,type PlannerRow} from "./museum-move-planner-domain";
test("room numbers include temple hall zero without guessing compound locations",()=>{
 assert.equal(vitrineNumber("Vitrine 03"),"3");
 assert.equal(vitrineNumber("#0"),"0");
 for(const value of ["25","3.4","6 & 7","18?","temple"])assert.equal(vitrineNumber(value),null);
});
test("photo tagging includes every reviewed identity and counts a saint only once",()=>{
 const entries=[{displayText:"3",saintIds:["a","b"]},{displayText:"03",saintIds:["a"]},{displayText:"4",saintIds:["c"]},{displayText:"3 or 4",saintIds:["d"]}];
 assert.deepEqual(photoSaintsInVitrines(entries,["3"]),["a","b"]);
 assert.deepEqual(photoSaintsInVitrines(entries,[]),[]);
 assert.deepEqual(photoSaintsInVitrines(entries,["4"]),["c"]);
});
test("assignment requires selection and a numbered destination; shelf stays optional",()=>{
 const input={revision:"a".repeat(64),placementIds:["vrindavan:saint"],vitrine:"0"};
 assert.equal(plannerAssignmentInput.parse(input).shelf,"");
 assert.equal(plannerAssignmentInput.parse(input).replaceExisting,false);
 assert.equal(plannerAssignmentInput.safeParse({...input,vitrine:"25"}).success,false);
 assert.equal(plannerAssignmentInput.safeParse({...input,placementIds:[]}).success,false);
 assert.equal(plannerPhotoInput.safeParse({revision:input.revision,vitrines:["0","24"]}).success,true);
});
test("section counts count saints, not source entries or relic quantities",()=>{
 const a={saintId:"a",photo:true,status:"Planned"} as PlannerRow;
 const b={saintId:"b",photo:false,status:"Proposed"} as PlannerRow;
 assert.deepEqual(plannerCounts([a,a,b]),{total:2,photo:1,untagged:1,unplanned:1,planned:1,implemented:0});
});
