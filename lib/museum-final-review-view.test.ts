import assert from "node:assert/strict";
import test from "node:test";
import {emptyReviewFilters,filterReviewRecords,partitionReviewRecords,sortReviewRecords,type FinalReviewRecord} from "./museum-final-review-view";

function record(overrides:Partial<FinalReviewRecord>={}):FinalReviewRecord{
  return {sourceId:"one",name:"One",tier:"Primary",section:"Section",region:"East",city:"Puri",description:"",destination:"26",destinationShelf:null,addressed:false,flag:null,version:0,
    row:{sourceId:"one",name:"One",saintId:"saint",original:{kind:"vitrine",code:"20",label:"Vitrine 20"},current:{kind:"table",code:"staging-area",label:"Staging area"},currentBasis:"confirmed",currentVersion:1,currentRevision:"current",sourceRevision:"source",fixedHousing:false,verifiedItemIds:[],identityChanged:false},...overrides};
}
test("review filters distinguish starting, proposed and current locations",()=>{
  const entry=record();
  assert.equal(filterReviewRecords([entry],{...emptyReviewFilters,starting:"20",proposed:"26",current:"staging"}).length,1);
  assert.equal(filterReviewRecords([entry],{...emptyReviewFilters,current:"26"}).length,0);
  assert.equal(filterReviewRecords([entry],{...emptyReviewFilters,query:"puri"}).length,1);
  assert.equal(filterReviewRecords([record({destination:""})],{...emptyReviewFilters,proposed:"unknown"}).length,1);
});
test("flags stay visible on addressed records and are not duplicated in unaddressed",()=>{
  const flagged=record({flag:{type:"missing",note:"Check label"},addressed:true});
  const pending=record({sourceId:"two"});
  const done=record({sourceId:"three",addressed:true});
  const result=partitionReviewRecords([flagged,pending,done]);
  assert.deepEqual(result.flagged,[flagged]);assert.deepEqual(result.unaddressed,[pending]);
});
test("review sorting keeps tiers together without changing the shared roster",()=>{
  const input=[record({name:"T",tier:"Tertiary"}),record({name:"P",tier:"Primary"}),record({name:"S",tier:"Secondary"})];
  assert.deepEqual(sortReviewRecords(input).map(row=>row.name),["P","S","T"]);
  assert.deepEqual(input.map(row=>row.name),["T","P","S"]);
});
