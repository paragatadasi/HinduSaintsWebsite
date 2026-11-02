import test from "node:test";
import assert from "node:assert/strict";
import {mergeFinalReviewRecords,mergeFinalReviewSnapshot} from "./museum-final-review-client";
import type {FinalReviewRecord,FinalReviewSnapshot} from "./museum-final-review-domain";
const record=(id:string,reviewVersion=1,currentVersion=1)=>({sourceId:id,reviewVersion,physical:{currentVersion}} as FinalReviewRecord);
test("late responses cannot undo another review or physical save",()=>{
 const latest=record("a",3,4);
 for(const stale of [record("a",2,4),record("a",3,3)])assert.deepEqual(mergeFinalReviewRecords([latest],[stale]),[latest]);
 assert.deepEqual(mergeFinalReviewRecords([latest],[record("a",4,4)]),[record("a",4,4)]);
});
test("scoped deltas preserve other reviewers' records while explicit removals and full snapshots reconcile membership",()=>{
 const current={records:[record("a"),record("b")]} as FinalReviewSnapshot;
 const delta={complete:false,records:[record("a",2)],removedSourceIds:[]} as FinalReviewSnapshot;
 assert.deepEqual(mergeFinalReviewSnapshot(current,delta).records,[record("a",2),record("b")]);
 assert.deepEqual(mergeFinalReviewSnapshot(current,{...delta,removedSourceIds:["b"]}).records,[record("a",2)]);
 assert.deepEqual(mergeFinalReviewSnapshot(current,{...delta,complete:true}).records,[record("a",2)]);
});
