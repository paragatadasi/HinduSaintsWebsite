import test from "node:test";
import assert from "node:assert/strict";
import {readInMuseumTransaction,withMuseumTransactionReads} from "./museum-transaction-reads";

test("only an opted-in transaction shares repeated read models and concurrent loads", async () => {
  const transaction = {}, other = {};
  let loads = 0;
  const load = async () => ({version: ++loads});
  await withMuseumTransactionReads(transaction, async () => {
    const [first, second] = await Promise.all([
      readInMuseumTransaction(transaction, "working", load),
      readInMuseumTransaction(transaction, "working", load)
    ]);
    assert.equal(first, second);
    assert.equal(loads, 1);
    await readInMuseumTransaction(transaction, "different-options", load);
    await readInMuseumTransaction(other, "working", load);
    assert.equal(loads, 3);
  });
  await readInMuseumTransaction(transaction, "working", load);
  assert.equal(loads, 4);
});

test("failed loads remain failed for that scope, and scope is released on failure", async () => {
  const transaction = {};
  let loads = 0;
  const load = async () => { loads++; throw new Error("Unavailable source"); };
  await assert.rejects(withMuseumTransactionReads(transaction, async () => {
    await assert.rejects(readInMuseumTransaction(transaction, "working", load));
    await assert.rejects(readInMuseumTransaction(transaction, "working", load));
    assert.equal(loads, 1);
    throw new Error("Abort transaction");
  }), /Abort transaction/);
  await assert.rejects(readInMuseumTransaction(transaction, "working", load));
  assert.equal(loads, 2);
});
