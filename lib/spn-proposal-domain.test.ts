import {test} from "node:test";
import assert from "node:assert/strict";
import {projectSpnProposal,spnBaselineRevision,spnReviewRevision,spnRegionTagsSchema} from "./spn-proposal-domain";
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

test("cross-regional tags remain separate from geography, tradition, section and tier",()=>{
 const source={...baseline,normalizedPlaces:["Puducherry","Pune"],spiritualRegions:["Tamil Nadu"],sampradaya:"Integral Yoga"};
 const regionalEvent={id:"regions",afterJson:{...event.afterJson,baselineRevision:spnBaselineRevision(source),section:source.section,tier:source.tier,familyKey:"",familyLabel:"",regionTags:["The South","Maharashtra & the West"]}};
 const next=projectSpnProposal(source,regionalEvent,undefined);
 assert.deepEqual(next.spnRegionTags,["Maharashtra & the West","The South"]);
 for(const key of ["normalizedPlaces","spiritualRegions","sampradaya","section","tier"] as const)assert.deepEqual(next[key],source[key]);
 const saved={proposalRevision:next.arrangement!.proposalRevision,status:"Implemented",version:3,vitrine:"29",shelf:"E",confirmedAt:new Date("2026-10-01"),inventoryAcknowledged:true};
 const restored=projectSpnProposal(source,regionalEvent,saved);
 assert.equal(restored.arrangement?.vitrine,"29");assert.equal(restored.arrangement?.shelf,"E");assert.equal(restored.arrangement?.status,"Implemented");
 assert.equal(restored.arrangement?.confirmedAt,"2026-10-01T00:00:00.000Z");
});

test("unknown regions are rejected; old decisions still apply and changed baselines hold tags",()=>{
 assert.equal(spnRegionTagsSchema.safeParse(["Invented spiritual tradition"]).success,false);
 assert.deepEqual(spnRegionTagsSchema.parse(["The South","The South"]),["The South"]);
 assert.deepEqual(projectSpnProposal(baseline,event,undefined).spnRegionTags,[]);
 const regionalEvent={id:"regions",afterJson:{...event.afterJson,regionTags:["The South"]}};
 const held=projectSpnProposal({...baseline,section:"Changed source"},regionalEvent,undefined);
 assert.equal(held.spnProposal?.state,"needs_review");assert.equal(held.spnRegionTags,undefined);
});
