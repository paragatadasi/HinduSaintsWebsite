import test from "node:test";
import assert from "node:assert/strict";
import {finalReviewInput,finalReviewAddressed,assertFinalReviewVersion,effectiveFinalReviewDecision} from "./museum-final-review-domain";
import type {CompanionRow} from "./spn-move-guide";
const row:CompanionRow={sourceId:"source",saintId:null,name:"Source",original:null,current:{kind:"vitrine",code:"14",label:"Vitrine 14"},currentBasis:"confirmed",currentVersion:1,currentRevision:"a".repeat(64),sourceRevision:"b".repeat(64),identityChanged:false,fixedHousing:false,verifiedItemIds:[]};
test("a proposal alone is unaddressed, while a checked effective destination is addressed",()=>{
 assert.equal(finalReviewAddressed(row,"14","pending"),true);
 assert.equal(finalReviewAddressed(row,"15","pending"),false);
 assert.equal(finalReviewAddressed({...row,currentBasis:"source"},"14","pending"),false);
 assert.equal(finalReviewAddressed(row,"15","declined"),true);
 assert.equal(finalReviewAddressed(row,"15","not_on_display"),true);
 assert.equal(finalReviewAddressed(row,"14","deferred"),false);
});
test("final review rejects stale versions and does not accept move claims in flag payloads",()=>{
 assert.throws(()=>assertFinalReviewVersion(1,2),/reviewed elsewhere/);
 const flag={action:"flag.set",museumId:"museum-spn",sourceId:"source",saintId:null,expectedSourceRevision:"a".repeat(64),expectedReviewVersion:0,clientRequestId:"00000000-0000-4000-8000-000000000001",kind:"missing"};
 assert.ok(finalReviewInput.safeParse(flag).success);
 assert.equal(finalReviewInput.safeParse({...flag,physicalConfirmation:true}).success,false);
 assert.equal(finalReviewInput.safeParse({...flag,note:"x".repeat(2001)}).success,false);
});

test("a flag preserves an earlier decision; a new explicit proposal clears it",()=>{
 assert.equal(effectiveFinalReviewDecision({decision:"pending",decisionAt:null},"declined"),"declined");
 assert.equal(effectiveFinalReviewDecision({decision:"pending",decisionAt:"2026-11-02T00:00:00Z"},"declined"),"pending");
 assert.equal(effectiveFinalReviewDecision({decision:"not_on_display",decisionAt:"2026-11-02T00:00:00Z"},"pending"),"not_on_display");
});
