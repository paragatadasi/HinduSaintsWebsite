import test from "node:test";
import assert from "node:assert/strict";
import {finalReviewProgress} from "./museum-final-review-progress";
import type {FinalReviewRecord} from "./museum-final-review-view";
const row=(sourceId:string,destination:string,finallyReviewed=false)=>({sourceId,destination,finallyReviewed,addressed:true} as FinalReviewRecord);
test("final review is independent of move completion and deduplicates source records",()=>{
 const pending=row("a","64"),reviewed=row("b","65",true);
 const summary=finalReviewProgress([pending,reviewed,pending]);
 assert.equal(summary.total,2);assert.equal(summary.complete,1);
 assert.equal(summary.regions.length,1);assert.equal(summary.vitrines["64"].complete,0);assert.equal(summary.vitrines["65"].complete,1);
});
test("review tracker retains unassigned work and excludes confirmed empty observations",()=>{
 const summary=finalReviewProgress([row("a",""),row("recq8jg20kMAD2Erc","20",true),{...row("absent","20"),decision:"not_on_display"}]);
 assert.equal(summary.total,1);assert.equal(summary.complete,0);assert.equal(summary.regions[0].label,"No destination");
});

test("map coverage counts reviews or flags once while completion remains distinct",()=>{
 const summary=finalReviewProgress([row("checked","19",true),{...row("flagged","19"),flag:{type:"missing",note:null}},{...row("both","19",true),flag:{type:"other",note:"Check label"}}]);
 assert.equal(summary.vitrines["19"].total,3);
 assert.equal(summary.vitrines["19"].addressed,3);
 assert.equal(summary.vitrines["19"].flagged,2);
 assert.equal(summary.complete,2);
 const resolved=finalReviewProgress([row("flagged","19")]);
 assert.equal(resolved.vitrines["19"].addressed,0);
 assert.equal(resolved.vitrines["19"].flagged,0);
});
