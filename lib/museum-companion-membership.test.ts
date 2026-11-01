import test from "node:test";
import assert from "node:assert/strict";
import {reconcileCompanionMembership} from "./museum-companion-membership";
import {projectCompanionAdditions} from "./museum-companion-addition-projection";
import {starterMoveGuide} from "./spn-starter-move-guide";
import {vrajRemainderMoveGuide} from "./spn-vraj-remainder-guide";
import type {GuideEntry,StarterMoveGuide} from "./spn-move-guide";
const entry:GuideEntry={sourceId:"a",saintId:"sa",name:"Saint",tier:"Primary",city:"",relicDescription:"Relic",destination:"27",section:"",family:"",rationale:""};
function guide():StarterMoveGuide{return {version:"v",contentDigest:"content",assignmentDigest:"assignment",proposalVersion:"p",title:"Guide",entries:[entry],vitrines:[{code:"27",summary:"Story",families:[{id:"f",title:"Family",sourceIds:["a"],rationale:"",suggestedVitrines:["27"]}],cityGroups:[]}],alternatives:[],reportedPlacements:[{sourceId:"a",destination:"27",date:"2026-10-27"}],contextAnchors:[{sourceId:"outside",name:"Teacher",destination:"27",rationale:"Context",reviewNotes:[]}]};}
test("approved Vraj destinations remove the stale Devraha starter allocation without touching packet digests or reports",()=>{
 const old=starterMoveGuide.vitrines.find(v=>v.code==="27")!.families.find(g=>g.title.includes("Devraha"))!;
 assert.equal(old.sourceIds.length,5);
 const catalog=vrajRemainderMoveGuide.entries.filter(e=>old.sourceIds.includes(e.sourceId));
 assert.equal(catalog.length,5);assert.ok(catalog.every(e=>e.destination==="38"));
 const before=JSON.stringify(starterMoveGuide);
 const result=projectCompanionAdditions({starter:starterMoveGuide,vraj2:vrajRemainderMoveGuide},[],catalog);
 assert.ok(result.starter.vitrines.find(v=>v.code==="27")!.families.every(g=>g.sourceIds.every(id=>!old.sourceIds.includes(id))));
 for(const id of old.sourceIds)assert.equal(result.vraj2.vitrines.find(v=>v.code==="38")!.families.flatMap(g=>g.sourceIds).filter(value=>value===id).length,1);
 assert.equal(result.starter.assignmentDigest,starterMoveGuide.assignmentDigest);assert.deepEqual(result.starter.reportedPlacements,starterMoveGuide.reportedPlacements);assert.equal(JSON.stringify(starterMoveGuide),before);
 assert.deepEqual(projectCompanionAdditions(result,[],catalog),result);
});
test("missing receivers stay pending and catalog-only fallback records are not activated",()=>{
 const initial=guide();const result=reconcileCompanionMembership({starter:initial},[{...entry,destination:"38"},{...entry,sourceId:"pending",destination:"27"}]).starter;
 assert.equal(result.vitrines.length,1);assert.equal(result.vitrines[0].families.length,0);assert.equal(result.entries.length,1);assert.equal(result.entries[0].destination,"38");
 assert.deepEqual(result.contextAnchors,initial.contextAnchors);assert.deepEqual(result.reportedPlacements,initial.reportedPlacements);
});
test("changed identities, explicit review/component scope and unresolved destinations retain their protected context",()=>{
 for(const update of [{saintId:"new"},{identityChanged:true},{destination:""}])assert.deepEqual(reconcileCompanionMembership({starter:guide()},[{...entry,destination:"38",...update}]).starter,guide());
 for(const scope of [{reviewOnly:true},{componentScope:"vitrine_19_contents_only" as const}]){
  const initial=guide();initial.entries=[{...entry,...scope}];assert.deepEqual(reconcileCompanionMembership({starter:initial},[{...entry,destination:"38"}]).starter,initial);
 }
});
test("retained tree members keep external context edges; removed allocations lose stale counts and their edges",()=>{
 const initial=guide();initial.entries.push({...entry,sourceId:"b",saintId:"sb"});const group=initial.vitrines[0].families[0];group.sourceIds.push("b");group.saintCount=2;group.edges=[{fromSourceId:"outside",toSourceId:"b",label:"teacher"},{fromSourceId:"a",toSourceId:"b",label:"associate"}];
 const result=reconcileCompanionMembership({starter:initial},[{...entry,destination:"38"}]).starter.vitrines[0].families[0];assert.deepEqual(result.sourceIds,["b"]);assert.deepEqual(result.edges,[group.edges[0]]);assert.equal(result.saintCount,undefined);
});

test("full addition projection preserves unrelated external relationship context",()=>{
 const initial=guide();initial.vitrines[0].families[0].edges=[{fromSourceId:"outside",toSourceId:"a",label:"teacher"}];
 const result=projectCompanionAdditions({starter:initial},[],[entry]).starter;
 assert.deepEqual(result.vitrines[0].families[0].edges,initial.vitrines[0].families[0].edges);
});
