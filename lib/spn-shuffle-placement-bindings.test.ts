import assert from "node:assert/strict";
import test from "node:test";
import bindings from "../data/museum/spn-shuffle-placement-bindings.json";
import { shuffleActions } from "./spn-shuffle-guide";

test("each transfer has unique source observations and the cabinet switch has no inventory binding", () => {
  const cabinet = "switch-the-positions-of-vitrines-58-and-47";
  assert.deepEqual(Object.keys(bindings).sort(), shuffleActions.map(action => action.id).filter(id => id !== cabinet).sort());
  const holdings = Object.values(bindings).flatMap(binding => {
    assert.notEqual(binding.origin, binding.target);
    assert.ok(binding.holdings.length);
    return binding.holdings;
  });
  assert.equal(new Set(holdings.map(holding => holding.sourceId)).size, holdings.length);
  assert.ok(holdings.every(holding => /^rec[a-zA-Z0-9]+$/.test(holding.sourceId)));
});

test("the Konaseema group binds the unflagged Prasad Raju observation", () => {
  const group = bindings["move-together-kamesh-maharshi-prasad-raju-swamiji-unflagged-entry-and-premanandagiri-mataji-konaseem"];
  assert.equal(group.origin, "51");
  assert.equal(group.target, "52");
  assert.ok(group.holdings.some(holding => holding.sourceId === "recdzV5EUGaiuIsEp"));
  assert.ok(Object.values(bindings).every(binding => binding.holdings.every(holding => holding.sourceId !== "recnN6SjH1pOAAXtj")));
});
