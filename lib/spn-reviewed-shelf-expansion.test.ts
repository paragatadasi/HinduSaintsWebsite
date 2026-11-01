import test from "node:test";
import assert from "node:assert/strict";
import packet from "../data/museum/spn-datta-odisha-reviewed-shelves-v2.json";
import {allOperationalSpnShelves} from "./spn-operational-shelves";

test("reviewed shelf expansion covers seven cases without duplicating source observations", () => {
  assert.deepEqual(packet.vitrines.map(v => [v.code, v.allocations.length]), [["3",20],["81",17],["82",20],["80",8],["4",18],["25",17],["26",20]]);
  const all = allOperationalSpnShelves.vitrines.flatMap(v => v.allocations);
  assert.equal(new Set(all.map(a => a.sourceId)).size, all.length);
  for (const vitrine of packet.vitrines) {
    const loaded = allOperationalSpnShelves.vitrines.find(v => v.code === vitrine.code)!;
    assert.deepEqual(loaded.allocations.map(a => a.sourceId), vitrine.allocations.map(a => a.sourceId));
  }
});

test("later Datta proposals and confirmed placements remain qualified", () => {
  const at81 = packet.vitrines.find(v => v.code === "81")!;
  for (const id of ["recMZz192pFJvWICf", "recNUYxXhqLlajDKR"]) assert.ok(at81.allocations.some(a => a.sourceId === id));
  const sadananda = packet.vitrines.find(v => v.code === "3")!.allocations.find(a => a.sourceId === "recVHeFkChYKxsFTK")!;
  assert.ok(sadananda.reviewAlerts.length > 0);
  for (const vitrine of packet.vitrines) for (const row of vitrine.allocations) {
    if (row.preserveCurrentPlacement) assert.equal(row.suggestedShelfIndex, null);
    if ("isContextOnly" in row && row.isContextOnly) assert.equal(row.suggestedShelfIndex, null);
  }
});
