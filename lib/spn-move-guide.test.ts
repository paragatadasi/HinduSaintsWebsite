import test from "node:test";
import assert from "node:assert/strict";
import {starterMoveGuide as guide} from "./spn-starter-move-guide";
import {cityFitsStarterCase,isPlaced,type CompanionRow,type GuideGroup} from "./spn-move-guide";

test("starter guide covers each row once in family or city phase",()=>{
 assert.deepEqual(guide.vitrines.map(v=>v.code),["2","78","36","29","76","28","27"]);
 const ids=guide.vitrines.flatMap(v=>[...v.families,...v.cityGroups].flatMap(g=>g.sourceIds));
 assert.ok(ids.length>0);assert.equal(new Set(ids).size,ids.length);
 for(const v of guide.vitrines)for(const g of [...v.families,...v.cityGroups])for(const id of g.sourceIds){
  assert.equal(guide.entries.find(e=>e.sourceId===id)?.destination,v.code);
 }
});
test("city alternatives require explicit versioned target eligibility",()=>{
 const group:GuideGroup={id:"puri",title:"Puri",sourceIds:["source"],rationale:"Reviewed locality",suggestedVitrines:["26"]};
 assert.equal(cityFitsStarterCase(group,"28"),false);
 assert.equal(cityFitsStarterCase(group,"26"),false);
 assert.equal(cityFitsStarterCase({...group,allowedTargetVitrines:["26"]},"26"),true);
 assert.equal(cityFitsStarterCase({...group,allowedTargetVitrines:["26"]},"28"),false);
});
test("city candidates retain known and unknown space evidence and complete display metadata",()=>{
 for(const group of guide.alternatives){
  assert.ok(group.spaceEstimate?.basis);assert.ok(group.suggestedVitrines.length);
  for(const id of group.sourceIds)assert.ok(guide.entries.some(row=>row.sourceId===id));
 }
});
test("reported placements are exact23 with18 in27 and5 in28",()=>{
 assert.equal(guide.reportedPlacements.length,23);
 assert.equal(new Set(guide.reportedPlacements.map(r=>r.sourceId)).size,23);
 assert.equal(guide.reportedPlacements.filter(r=>r.destination==="27").length,18);
 assert.equal(guide.reportedPlacements.filter(r=>r.destination==="28").length,5);
});
test("source location in target is not a confirmed move",()=>{
 const row:CompanionRow={sourceId:"source",saintId:null,name:"Test",original:null,current:{kind:"vitrine",code:"27",label:"Vitrine27"},currentBasis:"source",currentVersion:0,currentRevision:"revision",sourceRevision:"source",fixedHousing:false,verifiedItemIds:[],identityChanged:false};
 assert.equal(isPlaced(row,"27"),false);
 assert.equal(isPlaced({...row,currentBasis:"confirmed"},"27"),true);
 assert.equal(isPlaced({...row,currentBasis:"confirmed"},"28"),false);
});
import {reportedPlacementsRecorded} from "./spn-move-guide";
test("reported placement receipts remain recognized after a later move",()=>{
 const reported=[{sourceId:"a",destination:"27",date:"2026-10-27"}];
 const state={rows:[],unmappedCurrentLocations:[],confirmationHistory:[{afterJson:{moves:[{sourceId:"a",location:{kind:"vitrine",code:"28"}}]}},{afterJson:{moves:[{sourceId:"a",location:{kind:"vitrine",code:"27"}}]}}]};
 assert.equal(reportedPlacementsRecorded(state,reported),true);
 assert.equal(reportedPlacementsRecorded({...state,confirmationHistory:state.confirmationHistory.slice(0,1)},reported),false);
});
