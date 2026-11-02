import west from "../data/museum/spn-west-mount-abu-v6.json";
import test from "node:test";
import assert from "node:assert/strict";
import packet from "../data/museum/spn-curated-headlines-v2.json";
import {curatedVitrineHeadline} from "./museum-curated-headlines";

test("named headlines follow exact active membership and retain locality fallback", () => {
  const rule = packet.rules["39"];
  const entries = rule.anchorClauses.flatMap(clause => clause.sourceIds.map(sourceId => ({sourceId, destination: "39"})));
  assert.equal(curatedVitrineHeadline("39", entries, "old"), west.vitrines.find(v=>v.code==="39")!.headline);
  assert.equal(curatedVitrineHeadline("39", [], "old"), rule.fallback);
  const changed = entries.map(entry => ({...entry, destination: entry.sourceId === rule.anchorClauses[0].sourceIds[0] ? "40" : "39"}));
  assert.equal(curatedVitrineHeadline("39", changed, "old"), `${rule.anchorClauses[1].text} · ${rule.fallback}`);
  assert.equal(entries[0].destination, "39");
});

test("institutional any-member rules and unmapped cases retain their intended copy", () => {
  const rule = packet.rules["1"];
  assert.equal(curatedVitrineHeadline("1", [{sourceId: rule.anchorClauses[0].sourceIds[0], destination: "1"}], "old"), rule.headline);
  assert.equal(curatedVitrineHeadline("76", [], "Existing family story"), "Existing family story");
});
