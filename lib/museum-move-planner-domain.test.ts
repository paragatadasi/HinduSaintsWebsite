import assert from "node:assert/strict";
import test from "node:test";
import {photoSaintsInVitrines,plannerAssignmentInput,plannerPhotoInput,plannerCompletionInput,plannerConfirmation,vitrineNumber,plannerCounts,plannerMoveNeedsAttention,plannerAreasNeedingReview,plannerAreaInput,flexibleDestinations,plannerFamilies,type PlannerRow} from "./museum-move-planner-domain";
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
test("move completion requires physical and inventory acknowledgements",()=>{
 const input={placementId:"saint",revision:"a".repeat(64),checkedSourceIds:["entry"],physicalConfirmation:true,inventoryAcknowledged:true};
 assert.equal(plannerCompletionInput.safeParse(input).success,true);
 assert.equal(plannerCompletionInput.safeParse({...input,physicalConfirmation:false}).success,false);
 assert.equal(plannerCompletionInput.safeParse({...input,inventoryAcknowledged:false}).success,false);
});
test("current-location evidence must be an explicit Vrindavan implementation with a location",()=>{
 const input={museumId:"museum-vrindavan",status:"Implemented",vitrine:"0",shelf:null,confirmedAt:"2026-10-20T10:00:00.000Z"};
 assert.deepEqual(plannerConfirmation(input),{vitrine:"0",shelf:"",confirmedAt:input.confirmedAt});
 assert.equal(plannerConfirmation({...input,museumId:"museum-spn"}),null);
 assert.equal(plannerConfirmation({...input,vitrine:""}),null);
 assert.equal(plannerConfirmation({...input,status:"Planned"}),null);
});

test("flexible areas only apply to matching current proposals, never exact or implemented placements",()=>{
 const row={id:"a",section:"Gaudiya",status:"Proposed",revision:"v1"};
 const areas=[{section:"Gaudiya",vitrines:["6","7","8"],placements:[{id:"a",revision:"v1"}]}];
 assert.deepEqual(flexibleDestinations(row,areas),["6","7","8"]);
 for(const changed of [{status:"Implemented"},{status:"Planned"},{revision:"v2"},{section:"Other"}])assert.deepEqual(flexibleDestinations({...row,...changed},areas),[]);
 assert.equal(plannerAreaInput.safeParse({revision:"a".repeat(64),section:"Gaudiya",areaVersion:0,vitrines:["25"]}).success,false);
});
test("family grouping uses stable group IDs, keeps same-named groups distinct and leaves unaffiliated saints separate",()=>{
 const rows=[{id:"1",familyKey:"a",family:"Shared name",name:"One"},{id:"2",familyKey:"a",family:"Shared name",name:"Two"},{id:"3",familyKey:"b",family:"Shared name",name:"Three"},{id:"4",family:"",name:"Four"}] as PlannerRow[];
 const groups=plannerFamilies(rows);
 assert.equal(groups.length,3);assert.deepEqual(groups.find(g=>g.key==="a")!.rows.map(r=>r.id),["1","2"]);
 assert.equal(groups.find(g=>g.key==="saint:4")!.rows.length,1);
});

test("earlier areas remain visible when sections disappear or flexible proposals change",()=>{
 const area={section:"Old section",vitrines:["6","7"],placements:[{id:"a",revision:"v1"}]};
 const row={id:"a",name:"Saint A",section:"Old section",status:"Proposed",revision:"v1"} as PlannerRow;
 assert.deepEqual(plannerAreasNeedingReview([area],[row]),[]);
 const renamed=plannerAreasNeedingReview([area],[{...row,section:"New section"}]);
 assert.equal(renamed[0].inactiveSection,true);
 assert.equal(renamed[0].affected[0].currentSection,"New section");
 assert.equal(plannerAreasNeedingReview([area],[{...row,revision:"v2"}])[0].affected.length,1);
 assert.equal(plannerAreasNeedingReview([area],[])[0].affected[0].name,null);
 assert.equal(plannerAreasNeedingReview([{...area,placements:[]}],[]).length,1);
 assert.deepEqual(plannerAreasNeedingReview([{...area,vitrines:[]}],[]),[]);
});
test("exact destinations supersede earlier flexible assignments without a false warning",()=>{
 const area={section:"Section",vitrines:["6"],placements:[{id:"a",revision:"v1"}]};
 for(const status of ["Planned","Implemented"] as const){
  const row={id:"a",section:"Section",status,revision:"v2"} as PlannerRow;
  assert.deepEqual(plannerAreasNeedingReview([area],[row]),[]);
  const moved=plannerAreasNeedingReview([area],[{...row,section:"Other"}]);
  assert.equal(moved[0].inactiveSection,true);
  assert.deepEqual(moved[0].affected,[]);
 }
});

test("implemented arrangements requiring proposal review stay in the move-day attention list",()=>{
 const row={status:"Implemented"} as PlannerRow;
 assert.equal(plannerMoveNeedsAttention(row),false);
 assert.equal(plannerMoveNeedsAttention({...row,arrangementNeedsReview:true}),true);
 assert.equal(plannerMoveNeedsAttention({...row,status:"Planned"}),true);
 assert.equal(plannerMoveNeedsAttention({...row,status:"Proposed"}),false);
 assert.equal(plannerMoveNeedsAttention({...row,status:"Proposed",flexibleVitrines:["6"]}),true);
});

test("planning families sort largest first with stable alphabetical ties",()=>{
 const rows=[{id:"1",familyKey:"a",family:"Alpha",name:"One"},{id:"2",familyKey:"z",family:"Zeta",name:"Two"},{id:"3",familyKey:"z",family:"Zeta",name:"Three"},{id:"4",familyKey:"b",family:"Beta",name:"Four"}] as PlannerRow[];
 assert.deepEqual(plannerFamilies(rows).map(group=>group.key),["z","a","b"]);
});
