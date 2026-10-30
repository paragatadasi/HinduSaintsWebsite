import test from "node:test";
import assert from "node:assert/strict";
import {paramanandPlanningContext,paramanandReview} from "./spn-paramanand-planning-context";
import type {MuseumSaintPlacement} from "./museum-proposals";
import {paramanandObjectReview} from "./spn-paramanand-reviewed-object";
const fixture=()=>({source:{sourceId:paramanandReview.sourceId,saintId:paramanandReview.saintId,sourceRevision:paramanandReview.sourceRevision,housingEvidenceRevision:paramanandObjectReview.housingEvidenceRevision,identityChanged:false},
 placement:{id:paramanandReview.sourceId,sourceRecordId:paramanandReview.sourceId,saintId:paramanandReview.saintId,name:"Sri Paramanand Das",section:"Gaudiya Vaishnava",tier:"Tertiary",alternatives:[],confidence:"High",rationale:"",note:"",familyId:"",curatorialFamily:"",familySize:0,spiritualRegions:[],sampradaya:"Gaudiya Vaishnava",normalizedPlaces:["Puri"],needsResearch:false,arrangement:{proposalRevision:paramanandReview.proposalRevision,revision:"current",status:"Proposed",familyKey:"",vitrine:"",shelf:"",confirmedAt:null,inventoryAcknowledged:false}} satisfies MuseumSaintPlacement,
 effectiveDestination:null as string|null,pendingReason:"Outside the approved core; destination still to review"});
test("Paramanand pending whole-source destination is distinct from historical37 and recommended26",()=>{
 const input=fixture(),before=structuredClone(input),context=paramanandPlanningContext(input)!;
 assert.equal(context.effectiveDestination,null);assert.equal(context.destinationState,"pending");
 assert.equal(context.historicalDestination.code,"37");assert.equal(context.recommendation.code,"26");
 assert.equal(context.recommendation.scope,"yoga_patta_arm_support");assert.equal(context.recommendation.wholeSourceApproved,true);
 assert.equal(context.recommendation.status,"approved");assert.equal(context.movementReview.executionHeld,false);
 assert.match(context.movementReview.confirmationNeeded[0],/dimensions.*housing/);assert.deepEqual(input,before);
});
test("a changed source fingerprint or identity cannot silently approve the recommendation",()=>{
 const input=fixture();input.source.sourceRevision="changed";
 assert.equal(paramanandPlanningContext(input)?.recommendation.status,"needs_review");
 input.source.identityChanged=true;input.effectiveDestination="26";
 assert.equal(paramanandPlanningContext(input)?.effectiveDestination,null);
 assert.match(paramanandPlanningContext(input)!.pendingReason!,/identity/);
});
test("explicit current destinations remain proposals and cannot become physical confirmations",()=>{
 const input=fixture();input.effectiveDestination="28";
 const context=paramanandPlanningContext(input)!;
 assert.equal(context.effectiveDestination,"28");assert.equal(context.destinationState,"proposed");
 assert.equal(context.movementReview.state,"reviewed_complete_arm_support");assert.equal(context.recommendation.wholeSourceApproved,true);
});
test("unrelated sources receive no Paramanand planning context",()=>{
 const input=fixture();input.source.sourceId="other";assert.equal(paramanandPlanningContext(input),null);
});
