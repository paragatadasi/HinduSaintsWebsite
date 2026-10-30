import test from "node:test";
import assert from "node:assert/strict";
import {buildLatestSpnReview} from "./spn-reviewed-proposal";
import {northernVoyage} from "./spn-northern-voyage";
import east from "../data/museum/spn-east-fill-reviewed-baseline-v1.json";
import {northernMoveGuide,northernGuideDefinition,projectNorthernGuide} from "./spn-northern-guide";
import type {MuseumSaintPlacement} from "./museum-proposals";
test("reviewer combines confirmed East cohort and Nepal without obsolete Bengal or held sources",()=>{
 const review=buildLatestSpnReview([]);
 const ids=review.rows.filter(r=>r.effectiveVitrine==="74").map(r=>r.sourceId).sort();
 assert.deepEqual(ids,northernVoyage.assignments.filter(r=>r.destination==="74").map(r=>r.sourceId).sort());
 for(const row of east.outgoingStale73)assert.equal(review.rows.find(r=>r.sourceId===row.sourceId)?.effectiveVitrine,"23");
 for(const id of northernVoyage.pendingReceiverSourceIds){assert.ok(!review.rows.some(r=>r.sourceId===id));assert.ok(review.proposal.pendingPlacements.some(r=>r.sourceId===id));}
});
test("Northern guide preserves story coverage, excludes holds and never asserts physical moves",()=>{
 assert.deepEqual(northernMoveGuide.vitrines.map(v=>v.code),["74","72","68","36","11","21","22","19","20","5"]);
 const ids=northernMoveGuide.vitrines.flatMap(v=>[...v.families,...v.cityGroups].flatMap(g=>g.sourceIds));
 assert.equal(ids.length,126);assert.equal(new Set(ids).size,126);
 assert.equal(northernMoveGuide.entries.filter(r=>r.destination==="74").length,23);
 assert.deepEqual(northernMoveGuide.reportedPlacements,[]);assert.equal(northernGuideDefinition.physicalScope?.allowClear,true);
 for(const id of northernVoyage.pendingReceiverSourceIds)assert.ok(!northernGuideDefinition.suggestions.some(s=>s.sourceIds.includes(id)));
});
test("later curator destination remains in reviewer and leaves the old guide action",()=>{
 const source=northernVoyage.assignments.find(r=>r.destination==="74")!;
 const live={id:source.capturedBaseline.placementId,sourceRecordId:source.sourceId,saintId:source.saintId??undefined,name:source.name,tier:source.capturedTier,section:source.capturedBaseline.section,familyId:"",alternatives:[],confidence:"",rationale:"",note:"",curatorialFamily:"",familySize:1,spiritualRegions:[],sampradaya:"",normalizedPlaces:[],needsResearch:false,spnRegionTags:[],arrangement:{familyKey:"",confirmedAt:null,inventoryAcknowledged:false,status:"Planned",vitrine:"12",shelf:"B",revision:"newer",proposalRevision:source.capturedBaseline.proposalRevision}} as MuseumSaintPlacement;
 const review=buildLatestSpnReview([live]);assert.equal(review.rows.find(r=>r.sourceId===source.sourceId)?.effectiveVitrine,"12");
 const guide=projectNorthernGuide([live],{rows:[],unmappedCurrentLocations:[]});
 assert.ok(!guide.vitrines.flatMap(v=>[...v.families,...v.cityGroups]).some(g=>g.sourceIds.includes(source.sourceId)));
 assert.equal(guide.outgoingDependencies.find(d=>d.sourceId===source.sourceId)?.proposedDestination,"12");
 const override=buildLatestSpnReview([live],[{sourceId:source.sourceId,vitrine:"13",shelf:null}]);assert.equal(override.rows.find(r=>r.sourceId===source.sourceId)?.effectiveVitrine,"13");
});

test("all approved Northern destinations reach the overall proposal and pending never returns to an old case",()=>{
 const result=buildLatestSpnReview([]);
 for(const source of northernVoyage.assignments){
  const row=result.rows.find(r=>r.sourceId===source.sourceId);
  if(source.destination)assert.equal(row?.effectiveVitrine,source.destination,source.sourceId);
  else {assert.equal(row,undefined);assert.ok(result.proposal.pendingPlacements.some(p=>p.sourceId===source.sourceId));}
 }
});

test("previous East review holds stay pending while Northern approvals remain scoped",()=>{
 const result=buildLatestSpnReview([]);
 for(const id of east.heldSourceIds){assert.ok(!result.rows.some(r=>r.sourceId===id));assert.ok(result.proposal.pendingPlacements.some(r=>r.sourceId===id));}
});

test("every Northern receiving card has its own summary and preparation scope",()=>{
 for(const v of northernMoveGuide.vitrines){assert.ok(v.summary&&!v.summary.startsWith("undefined"));assert.ok(northernMoveGuide.preparationVitrines?.includes(v.code));}
 assert.deepEqual(northernMoveGuide.requiredClearVitrines,["19","20","21","22","5"]);
 assert.equal(northernMoveGuide.clearancePerDestination,true);
 assert.equal(northernGuideDefinition.physicalScope?.clearancePerDestination,true);
 for(const code of ["11","36","68","73"])assert.ok(!northernGuideDefinition.physicalScope?.clearVitrines?.includes(code));
});
