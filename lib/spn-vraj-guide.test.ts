import test from "node:test";
import assert from "node:assert/strict";
import {vrajMoveGuide as guide,vrajGuideDefinition as definition,projectVrajGuide} from "./spn-vraj-guide";
import {ramakrishnaMoveGuide,ramakrishnaGuideDefinition} from "./spn-ramakrishna-guide";
import {assertPhasePreparation} from "./museum-preparation-domain";
import {assertGuidePhysicalScope} from "./spn-datta-guide";
import {buildLatestSpnReview} from "./spn-reviewed-proposal";
import approved from "../data/museum/spn-vraj-approved-v17.json";
import type {MuseumSaintPlacement} from "./museum-proposals";
test("Vraj has exactly40 holdings, qualified family edges and independent readiness gates",()=>{
 assert.deepEqual(guide.vitrines.map(v=>[v.code,guide.entries.filter(e=>e.destination===v.code).length]),[["79",17],["77",23]]);
 assert.equal(new Set(guide.entries.map(e=>e.sourceId)).size,40);
 assert.equal(guide.reportedPlacements.length,0);
 assert.equal(definition.physicalScope?.allowClear,false);
 assert.deepEqual(definition.physicalScope?.preparationVitrines,["79","77"]);
 assert.throws(()=>assertPhasePreparation([{to:{kind:"vitrine",code:"77"}}],["79","77"],[{vitrine:"79",prepared:true}]));
 assert.throws(()=>assertGuidePhysicalScope(definition,[],["77"]));
 assert.equal(guide.vitrines[1].families[0].edges?.length,0);
 assert.equal(guide.vitrines[0].families[0].edges?.length,1);
 assert.equal(projectVrajGuide([],{rows:[],unmappedCurrentLocations:[]}).entries[0].currentLocation,null);
});
test("expanded Ramakrishna phase includes23/73 and preserves old clearance provenance",()=>{
 assert.deepEqual(ramakrishnaMoveGuide.vitrines.map(v=>v.code),["75","23","73","37","4"]);
 assert.equal(ramakrishnaMoveGuide.entries.length,75);
 assert.equal(ramakrishnaGuideDefinition.physicalScope?.preparatoryTransfers?.length,2);
 assert.equal(ramakrishnaGuideDefinition.physicalScope?.previousClearanceVersions?.length,1);
});
test("latest reviewer covers167 approved IDs and preserves later curator edits",()=>{
 const view=buildLatestSpnReview([]);
 for(const a of approved.assignments)assert.equal(view.rows.find(r=>r.sourceId===a.sourceId)?.effectiveVitrine,a.destination);
 const a=approved.assignments.find(a=>a.capturedBaseline&&a.destination==="77")!;const b=a.capturedBaseline!;
 const live={alternatives:[],confidence:"high",rationale:"",note:"",curatorialFamily:"",familySize:1,spiritualRegions:[],sampradaya:"",needsResearch:false,id:b.placementId,sourceRecordId:a.sourceId,saintId:a.saintId,name:a.name,section:b.section,tier:b.tier,familyId:b.familyKey,spnRegionTags:b.regionTags,normalizedPlaces:[],arrangement:{familyKey:b.familyKey,confirmedAt:null,inventoryAcknowledged:false,status:"Planned",vitrine:"12",shelf:"C",revision:"later-human-choice",proposalRevision:b.proposalRevision}} as MuseumSaintPlacement;
 assert.equal(buildLatestSpnReview([live]).rows.find(r=>r.sourceId===a.sourceId)?.effectiveVitrine,"12");
 assert.equal(view.rows.filter(r=>r.effectiveVitrine==="5").length,15);
 assert.equal(view.proposal.topPlacement["38"].sourceIds.length,4);
});
