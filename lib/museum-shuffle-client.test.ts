import assert from "node:assert/strict";
import test from "node:test";
import {mergeShuffleStates} from "./museum-shuffle-client";
test("late save receipts and stale reads never overwrite newer shared completion",()=>{
 const head={a:{actionId:"a",completed:false,version:2}};
 const result=mergeShuffleStates(head,[{actionId:"a",completed:true,version:1},{actionId:"b",completed:true,version:1}]);
 assert.equal(result.a.completed,false);
 assert.equal(result.b.completed,true);
 assert.equal(head.a.version,2);
 assert.equal("b" in head,false);
 assert.equal(mergeShuffleStates(result,[{actionId:"a",completed:true,version:3}]).a.completed,true);
});
