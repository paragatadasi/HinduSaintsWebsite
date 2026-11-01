import test from "node:test";
import assert from "node:assert/strict";
import {retryMuseumSerialization} from "./museum-write-concurrency";

test("retries only rolled-back serialization conflicts, including adapter commit errors", async () => {
  for (const failure of [{code:"P2034"},{cause:{originalCode:"40001",kind:"TransactionWriteConflict"}},
    {code:"P2010",meta:{driverAdapterError:{cause:{originalCode:"40001",kind:"TransactionWriteConflict"}}}}]) {
    let attempts=0;
    const result=await retryMuseumSerialization(async()=>{if(++attempts===1)throw failure;return "saved";});
    assert.equal(result,"saved");assert.equal(attempts,2);
  }
  let attempts=0;
  await assert.rejects(retryMuseumSerialization(async()=>{attempts++;throw new Error("Connection lost");}),/Connection lost/);
  assert.equal(attempts,1);
  await assert.rejects(retryMuseumSerialization(async()=>{throw {code:"P2010",meta:{driverAdapterError:{cause:{originalCode:"42601",kind:"SyntaxError"}}}};}));
});

test("exhausted serialization attempts become a recoverable conflict", async () => {
  let attempts=0;
  await assert.rejects(retryMuseumSerialization(async()=>{attempts++;throw {code:"P2034"};}),
    error=>Boolean(error&&typeof error==="object"&&"status" in error&&error.status===409));
  assert.equal(attempts,5);
});
