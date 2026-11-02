import test from "node:test";
import assert from "node:assert/strict";
import {westMountAbu,applyWestMountAbuShelves,applyWestMountAbuGuide,registerWestReceiver} from "./spn-west-mount-abu";
import type {StarterMoveGuide} from "./spn-move-guide";
import type {ShelfPlanningPacket} from "./museum-shelf-planning-context";
const guide:StarterMoveGuide={version:"test",title:"West",contentDigest:"",assignmentDigest:"",proposalVersion:"",entries:[],vitrines:[{code:"40",summary:"old",families:[],cityGroups:[]}],alternatives:[],reportedPlacements:[]};
test("West packet contains unique pinned sources and preserves protected cases",()=>{
 const sources=westMountAbu.vitrines.flatMap(v=>v.groups.flatMap(g=>g.sources));
 assert.equal(new Set(sources.map(s=>s.sourceId)).size,sources.length);
 assert.equal(sources.length,180);assert.equal(westMountAbu.pending.length,6);
 assert.ok(sources.every(s=>/^[a-f0-9]{64}$/.test(s.sourceRevision)));
 assert.ok(westMountAbu.vitrines.every(v=>!westMountAbu.protectedVitrines.includes(v.code)));
 assert.equal(westMountAbu.vitrines.find(v=>v.code==="83")!.groups.flatMap(g=>g.sources).length,21);
});
test("register receiver once, without changing existing guide records",()=>{
 const result=registerWestReceiver({west:guide});assert.equal(result.west.vitrines.length,2);
 assert.equal(registerWestReceiver(result).west.vitrines.length,2);assert.equal(guide.vitrines.length,1);
});
test("new shelves retain out-of-scope holdings and do not invent transferred shelf positions",()=>{
 const source=westMountAbu.vitrines.find(v=>v.code==="83")!.groups[0].sources[0];
 const plan:ShelfPlanningPacket={version:"test",vitrines:[{code:"40",groups:[],relationships:[],allocations:[{sourceId:source.sourceId,name:source.name,groupId:"old",suggestedShelfIndex:2,reviewAlerts:[]},{sourceId:"outside",name:"Outside",groupId:"other",suggestedShelfIndex:3,reviewAlerts:[]}]}]};
 const result=applyWestMountAbuShelves(plan);assert.equal(result.vitrines.find(v=>v.code==="83")!.allocations.find(a=>a.sourceId===source.sourceId)!.suggestedShelfIndex,null);
 assert.equal(result.vitrines.find(v=>v.code==="40")!.allocations.find(a=>a.sourceId==="outside")!.suggestedShelfIndex,3);
 assert.equal(plan.vitrines[0].allocations.length,2);
});
test("grouping does not pull a saint back from a newer destination",()=>{
 const source=westMountAbu.vitrines.find(v=>v.code==="40")!.groups[0].sources[0];
 const input={...guide,entries:[{sourceId:source.sourceId,saintId:source.saintId,name:source.name,tier:"Primary",city:"",relicDescription:"",destination:"45",section:"",family:"",rationale:""}]};
 const result=applyWestMountAbuGuide(input);assert.equal(result.entries[0].destination,"45");assert.equal(result.vitrines[0].cityGroups.length,0);
});

import {projectAuditedPendingAllocations} from "./spn-audited-pending-allocation";
import type {ExplorerObservation} from "./spn-room-proposal";
test("optional pending decision supersedes only the reviewed old addition",()=>{
 const source=westMountAbu.pending[0];
 const row={sourceId:source.sourceId,saintId:source.saintId,name:"Optional",effectiveVitrine:"39"} as ExplorerObservation;
 const physical={...source,identityChanged:false};
 const old={sourceId:source.sourceId,vitrine:"39",version:source.additionVersion};
 assert.equal(projectAuditedPendingAllocations([row],[],[old],[physical]).length,1);
 assert.equal(projectAuditedPendingAllocations([row],[],[{...old,version:old.version+1}],[physical]).length,0);
 assert.equal(projectAuditedPendingAllocations([row],[],[old],[{...physical,sourceRevision:"changed"}]).length,0);
});

import {projectCompanionAdditions} from "./museum-companion-addition-projection";
test("saved 83 additions appear in West once and optional pending holdings disappear",()=>{
 const source=westMountAbu.vitrines.find(v=>v.code==="83")!.groups[0].sources[0];
 const entry={sourceId:source.sourceId,saintId:source.saintId,name:source.name,tier:"Secondary",city:"",relicDescription:"",destination:"83",section:"",family:"",rationale:""};
 const addition={sourceId:source.sourceId,saintId:source.saintId,sourceRevision:source.sourceRevision,vitrine:"83",shelf:null,version:2,updatedAt:"2026-11-02T10:00:00Z",clientRequestId:"test"};
 const result=projectCompanionAdditions({west:guide},[addition],[entry]);
 const receiver=result.west.vitrines.find(v=>v.code==="83")!;
 assert.deepEqual([...receiver.families,...receiver.cityGroups].flatMap(g=>g.sourceIds),[source.sourceId]);
 assert.match(receiver.fitGuidance!,/actual fit/);
 const pending={...entry,allocationPending:{reason:"Deferred"},destination:""};
 const deferred=projectCompanionAdditions(result,[addition],[pending]);
 assert.ok(!deferred.west.entries.some(e=>e.sourceId===source.sourceId));
 assert.equal(result.west.reportedPlacements.length,0);
});

import {currentSpnProposalRelease} from "./spn-current-proposal";
import {spnMuseumLayout} from "./spn-museum-layout";
test("installed 83 is available in room and physical-route layout while 84/85 remain future",()=>{
 for(const layout of [spnMuseumLayout,currentSpnProposalRelease.proposal.layout]){
  assert.equal(layout.vitrines.find(v=>v.number==="83")!.availability,"new");
  assert.equal(layout.vitrines.find(v=>v.number==="83")!.provisional,true);
  for(const code of ["84","85"])assert.equal(layout.vitrines.find(v=>v.number===code)!.availability,"future");
 }
});

import {beforeWestShelves, allOperationalSpnShelves} from "./spn-operational-shelves";
test("final West composition relocates exactly the reviewed sources and preserves other recommendations",()=>{
 const targets=new Map([...westMountAbu.vitrines,...westMountAbu.transfers].flatMap(v=>v.groups.flatMap(g=>g.sources.map(s=>[s.sourceId,{...s,code:v.code}] as const))));
 const final=allOperationalSpnShelves.vitrines.flatMap(v=>v.allocations.map(a=>({code:v.code,a})));
 assert.equal(new Set(final.map(r=>r.a.sourceId)).size,final.length);
 assert.equal(new Set(allOperationalSpnShelves.vitrines.map(v=>v.code)).size,allOperationalSpnShelves.vitrines.length);
 for(const [id,target] of targets){
  const rows=final.filter(r=>r.a.sourceId===id);assert.equal(rows.length,1,id);
  assert.equal(rows[0].code,target.code,id);assert.equal(rows[0].a.saintId,target.saintId,id);assert.equal(rows[0].a.sourceRevision,target.sourceRevision,id);
 }
 for(const vitrine of beforeWestShelves.vitrines)for(const old of vitrine.allocations){
  const row=final.find(r=>r.a.sourceId===old.sourceId)!;
  if(!targets.has(old.sourceId)){assert.equal(row.code,vitrine.code,old.sourceId);assert.deepEqual(row.a,old);}
  else if(row.code===vitrine.code){assert.equal(row.a.suggestedShelfIndex,old.suggestedShelfIndex,old.sourceId);assert.deepEqual(row.a.projectedLifeStatus,old.projectedLifeStatus);}
  else assert.equal(row.a.suggestedShelfIndex,null,old.sourceId);
 }
 for(const code of westMountAbu.protectedVitrines)assert.deepEqual(allOperationalSpnShelves.vitrines.find(v=>v.code===code),beforeWestShelves.vitrines.find(v=>v.code===code));
});
