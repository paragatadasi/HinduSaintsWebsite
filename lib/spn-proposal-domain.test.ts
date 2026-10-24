import {test} from "node:test";
import assert from "node:assert/strict";
import {projectSpnProposal,spnBaselineRevision,spnReviewRevision} from "./spn-proposal-domain";
import {arrangementControl} from "./museum-arrangement-domain";
import type {MuseumSaintPlacement} from "./museum-proposals";
const row: MuseumSaintPlacement={id:"recSource",saintId:"canonical",name:"Saint",sourceRecordId:"recSource",section:"South",tier:"Tertiary",confidence:"Medium",rationale:"Source",note:"",familyId:"",curatorialFamily:"",familySize:0,spiritualRegions:[],sampradaya:"",normalizedPlaces:[],needsResearch:false,alternatives:[]};
const baseline={...row,arrangement:arrangementControl(row,undefined,{saintVersion:0})};
const event={id:"decision",afterJson:{baselineRevision:spnBaselineRevision(baseline),placementId:row.id,saintId:row.saintId,section:"West",tier:"Secondary",familyKey:"Sai",familyLabel:"Sai Family",reason:"Explicit curator decision"}};
test("SPN decision retains source placement identity and provenance",()=>{
 const next=projectSpnProposal(baseline,event,undefined);
 assert.equal(next.id,row.id);assert.equal(next.sourceRecordId,row.sourceRecordId);assert.equal(next.section,"West");assert.equal(next.familyId,"Sai");assert.equal(next.placementState,"Confirmed");assert.equal(baseline.section,"South");
});
test("later canonical or source change holds old decision instead of overwriting",()=>{
 const changed={...baseline,tier:"Featured" as const};
 const next=projectSpnProposal(changed,event,undefined);
 assert.equal(next.tier,"Featured");assert.equal(next.section,"South");assert.equal(next.spnProposal?.state,"needs_review");
});
test("only a matching scoped arrangement revision restores saved physical state",()=>{
 const next=projectSpnProposal(baseline,event,undefined);
 const saved={proposalRevision:next.arrangement!.proposalRevision,status:"Implemented",version:2,vitrine:"8",shelf:"B",confirmedAt:new Date("2026-10-01"),inventoryAcknowledged:true};
 const restored=projectSpnProposal(baseline,event,saved);
 assert.equal(restored.arrangement?.status,"Implemented");assert.equal(restored.arrangement?.confirmedAt,"2026-10-01T00:00:00.000Z");assert.equal(restored.arrangement?.shelf,"B");
 const stale=projectSpnProposal(baseline,event,{...saved,proposalRevision:"stale"});assert.equal(stale.arrangement?.status,"Proposed");assert.equal(stale.arrangement?.vitrine,"");
});
test("form revision changes with decision and arrangement state",()=>{
 const next=projectSpnProposal(baseline,event,undefined);
 assert.notEqual(spnReviewRevision(next),spnReviewRevision(baseline));
 assert.notEqual(spnReviewRevision(next),spnReviewRevision({...next,arrangement:{...next.arrangement!,revision:"later"}}));
});
