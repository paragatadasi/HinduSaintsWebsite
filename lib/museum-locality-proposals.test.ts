import test from "node:test";
import assert from "node:assert/strict";
import {applyAcceptedLocalityProposal,museumSectionForLocality} from "./museum-locality-proposals";
import {getMuseumProposalData} from "./museum-proposals";
const place={locality:"Vrindavan",country:"India",region:"Uttar Pradesh",localityPlaceId:"place1"};
test("accepted primary locality moves tertiary proposal without changing source, tier or family",()=>{
 const original={...getMuseumProposalData().placements[0],tier:"Tertiary" as const,section:"Maharashtra Guru Lineages"};
 const updated=applyAcceptedLocalityProposal(original,place);
 assert.equal(updated.section,"Braj & Krishna Bhakti");assert.equal(updated.tier,"Tertiary");assert.equal(updated.familyId,original.familyId);
 assert.ok(updated.alternatives.includes(original.section));assert.equal(original.section,"Maharashtra Guru Lineages");assert.match(updated.rationale,/accepted primary locality/);
});
test("higher tiers and manually moved families stay unchanged; no geographical guesses",()=>{
 const original=getMuseumProposalData().placements[0];
 for(const tier of ["Featured","Secondary"] as const) assert.equal(applyAcceptedLocalityProposal({...original,tier},place).section,original.section);
 assert.equal(applyAcceptedLocalityProposal({...original,tier:"Tertiary"},place,true).section,original.section);
 assert.equal(museumSectionForLocality({...place,country:"USA"}),null);
 assert.equal(museumSectionForLocality({...place,locality:"Unknown town"}),null);
 assert.equal(applyAcceptedLocalityProposal({...original,tier:"Tertiary"},{...place,locality:"Unknown town"}).needsResearch,true);
});
