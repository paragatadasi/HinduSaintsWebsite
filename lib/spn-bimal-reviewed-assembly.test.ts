import test from "node:test";
import assert from "node:assert/strict";
import {bimalAssemblyReview as review,isReviewedBimalAssembly,isReviewedBimalTransfer} from "./spn-bimal-reviewed-assembly";
import {paramanandHousingEvidence} from "./spn-paramanand-housing-evidence";
import {spnMovementBlockedReason} from "./spn-movement-holds";
import {spnPhysicalExecutionHold} from "./museum-case-execution-holds";
const source={...review,identityChanged:false};
const from={kind:"vitrine",code:"64",shelf:"E"};
const to={kind:"vitrine",code:"40"};
test("Bimal whole-assembly review requires exact fresh identity and housing evidence",()=>{
 assert.equal(isReviewedBimalAssembly(source),true);
 assert.equal(paramanandHousingEvidence({"Relics Description (move to other table)":"Yoga stick He uses for Dhyaana and Prayer book with Hadwriting"}),review.housingEvidenceRevision);
 assert.equal(spnMovementBlockedReason(source.sourceId,source),undefined);
 for(const changed of [{sourceId:"other"},{saintId:"other"},{sourceRevision:"changed"},{housingEvidenceRevision:undefined},{housingEvidenceRevision:"changed"},{identityChanged:true}])assert.equal(isReviewedBimalAssembly({...source,...changed}),false);
 assert.ok(spnMovementBlockedReason(source.sourceId,{...source,housingEvidenceRevision:undefined}));
 assert.ok(spnMovementBlockedReason("rec9vEn5oj7QZTXl0",source));
});
test("Bimal exception authorizes only the reviewed64/E to40 route, never blanket64 clearing",()=>{
 assert.equal(isReviewedBimalTransfer(source,from,to),true);
 for(const destination of [{kind:"table",code:"staging-area"},{kind:"vitrine",code:"41"},{...to,museumId:"museum-vrindavan"}])assert.equal(isReviewedBimalTransfer(source,from,destination),false);
 for(const origin of [{...from,shelf:"D"},{...from,shelf:undefined},{...from,code:"65"},{...from,museumId:"museum-vrindavan"}])assert.equal(isReviewedBimalTransfer(source,origin,to),false);
 assert.equal(isReviewedBimalTransfer({...source,sourceId:"other"},from,to),false);
 assert.ok(spnPhysicalExecutionHold(from,to));
 assert.equal(review.physicalConfirmationWritten,false);
});
