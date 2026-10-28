import test from "node:test";
import assert from "node:assert/strict";
import { memoizePhysicalSnapshot } from "./museum-physical-snapshot-cache";
test("before and after source reads share one load only inside the same transaction",async()=>{
 let loads=0;const loader=async (_tx:object)=>({version:++loads});const read=memoizePhysicalSnapshot(loader);const tx={};
 const [before,after]=await Promise.all([read(tx),read(tx)]);assert.equal(before,after);assert.equal(loads,1);
 await read({});assert.equal(loads,2);
 const anotherRequest=memoizePhysicalSnapshot(loader);await anotherRequest(tx);assert.equal(loads,3);
});
test("a failed snapshot is not silently reloaded midway through a write",async()=>{
 let loads=0;const read=memoizePhysicalSnapshot(async (_tx:object)=>{loads++;throw new Error("Source unavailable");});const tx={};
 await assert.rejects(read(tx));await assert.rejects(read(tx));assert.equal(loads,1);
});
