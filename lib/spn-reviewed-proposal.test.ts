import test from "node:test";
import assert from "node:assert/strict";
import {buildLatestSpnReview} from "./spn-reviewed-proposal";
import {currentSpnProposalRelease} from "./spn-current-proposal";
import type {MuseumSaintPlacement} from "./museum-proposals";
test("latest reviewer projects approved 4/37 rosters, fit and held records without changing the frozen proposal",()=>{
 const original=JSON.stringify(currentSpnProposalRelease);
 const view=buildLatestSpnReview([]);
 assert.equal(view.rows.filter(r=>r.effectiveVitrine==="4").length,15);
 assert.equal(view.rows.filter(r=>r.effectiveVitrine==="37").length,10);
 assert.ok(Math.abs(view.proposal.indicators.find(i=>i.vitrine==="4")!.estimatedRequiredShelfShares-5.4708333333)<0.000001);
 assert.equal(view.proposal.pendingPlacements.length,8);
 assert.equal(view.rows.filter(r=>r.effectiveVitrine==="75").length,11);
 assert.equal(view.rows.find(r=>r.sourceId==="rectvEBy833q3i4L6")?.effectiveVitrine,"75");
 assert.equal(view.rows.find(r=>r.sourceId==="rec1bOVrWmAFek7Tn")?.effectiveVitrine,"28");
 assert.ok(!view.rows.some(r=>r.sourceId==="rechBZw1LyW9TTX9L"));
 assert.equal(view.rows.find(r=>r.sourceId==="recc9hYwqqmB3Di2r")?.effectiveVitrine,"36");
 assert.equal(view.rows.find(r=>r.sourceId==="recJepdkXi90kdROh")?.effectiveVitrine,"2");
 assert.equal(view.rows.find(r=>r.sourceId==="recIv4yKRknjgONrZ")?.effectiveVitrine,"78");
 assert.equal(view.proposal.indicators.find(i=>i.vitrine==="38")!.specialFitNote,null);
 assert.match(currentSpnProposalRelease.proposal.indicators.find(i=>i.vitrine==="38")!.specialFitNote!,/1\.826\/2/);
 assert.equal(JSON.stringify(currentSpnProposalRelease),original);
});
test("newer curator destinations override approved overlay and move map anchors and fit together",()=>{
 const base=currentSpnProposalRelease.proposal.rows.find(r=>r.sourceId==="rec1cTbJ4iPAMUW0v")!;
 const live:MuseumSaintPlacement={alternatives:[],confidence:"high",rationale:"",note:"",curatorialFamily:"",familySize:1,spiritualRegions:[],sampradaya:"",needsResearch:false,id:base.baseline!.placementId,sourceRecordId:base.sourceId,saintId:base.saintId!,name:base.name,section:base.section,tier:"Featured",familyId:base.baseline!.familyKey,spnRegionTags:[],normalizedPlaces:["Puri"],arrangement:{familyKey:base.baseline!.familyKey,confirmedAt:null,inventoryAcknowledged:false,status:"Planned",vitrine:"12",shelf:"A",revision:"newer-human-choice",proposalRevision:base.baseline!.proposalRevision}};
 const view=buildLatestSpnReview([live]);
 assert.equal(view.rows.find(r=>r.sourceId===base.sourceId)?.effectiveVitrine,"12");
 assert.ok(view.designData.options[0].primeAnchors["12"].people.includes(base.name));
 assert.ok(!view.proposal.reviewedFamilies.find(v=>v.code==="37")!.families.some(g=>g.edges?.some(e=>e.fromSourceId===base.sourceId||e.toSourceId===base.sourceId)));
 assert.ok(view.proposal.tertiaryCityClusters.find(v=>v.vitrine===12)!.groups.some(g=>g.city==="Puri"));
});


test("current case notes retain cautions without historical roster directions",()=>{
 const before=JSON.stringify(currentSpnProposalRelease);
 const view=buildLatestSpnReview([]);
 const note=(code:string)=>view.proposal.indicators.find(i=>i.vitrine===code)!.specialFitNote;
 for(const code of ["2","5","27","38"])assert.equal(note(code),null);
 assert.match(note("79")!,/Gayatri Pariwar couple/);
 assert.match(note("32")!,/identity under review/);
 assert.match(note("33")!,/size is unknown/);
 assert.match(note("77")!,/institutional branches distinct/);
 assert.match(note("34")!,/source records say Still alive/);
 assert.match(note("35")!,/identity and locality questions/);
 for(const code of ["79","32","33","77","34","35"])assert.doesNotMatch(note(code)!,/Known \d|Gayatri.*Mathura 35|Banke Bihari/);
 assert.equal(JSON.stringify(currentSpnProposalRelease),before);
});