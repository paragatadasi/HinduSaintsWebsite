import test from "node:test";
import assert from "node:assert/strict";
import {groupClearContents} from "./museum-clear-contents";
import type {CompanionRow} from "@/lib/spn-move-guide";

test("clearing groups count source entries once and sort destinations numerically with unknown last", () => {
  const rows = [{sourceId:"a", name:"Zed"}, {sourceId:"b", name:"Bee"}, {sourceId:"c", name:"Amy"}, {sourceId:"d", name:"Unknown"}] as CompanionRow[];
  const groups = groupClearContents(rows, new Map([["a","26"],["b","5"],["c","5"]]));
  assert.deepEqual(groups.map(g=>[g.destination,g.entries.length]), [["5",2],["26",1],["",1]]);
  assert.deepEqual(groups[0].entries.map(e=>e.name), ["Amy","Bee"]);
  assert.deepEqual(rows.map(e=>e.sourceId), ["a","b","c","d"]);
  assert.deepEqual(groupClearContents([],new Map()),[]);
});
