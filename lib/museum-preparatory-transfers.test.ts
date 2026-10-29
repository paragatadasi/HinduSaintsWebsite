import test from "node:test";
import assert from "node:assert/strict";
import { allowsPreparedFixedHousingTransfer, assertPreparatoryTransfers, preparatoryTransfersComplete, spnFillFirstTransfers } from "./museum-preparatory-transfers";

const location = (code: string) => ({ kind: "vitrine", code });
const rows = spnFillFirstTransfers.map(transfer => ({ sourceId: transfer.sourceId, current: location("70"), currentBasis: "confirmed", identityChanged: false, verifiedItemIds: [] as string[] }));

test("23 requires both outgoing objects currently confirmed elsewhere, and undo relocks it", () => {
  const incoming = [{ to: location("23") }];
  assert.doesNotThrow(() => assertPreparatoryTransfers(incoming, spnFillFirstTransfers, rows));
  assert.doesNotThrow(() => assertPreparatoryTransfers(incoming, spnFillFirstTransfers, [rows[0], { ...rows[1], current: location("18") }]));
  for (const changed of [
    rows.slice(0, 1),
    [rows[0], { ...rows[1], current: location("23") }],
    [rows[0], { ...rows[1], currentBasis: "source" }],
    [rows[0], { ...rows[1], current: { kind: "table", code: "staging-area" } }],
    [rows[0], { ...rows[1], identityChanged: true }],
    [rows[0], { ...rows[1], verifiedItemIds: ["item"] }],
    [{ ...rows[0], current: location("18") }, rows[1]]
  ]) assert.throws(() => assertPreparatoryTransfers(incoming, spnFillFirstTransfers, changed), /outgoing objects/);
  assert.doesNotThrow(() => assertPreparatoryTransfers([{ to: location("73") }], spnFillFirstTransfers, []));
  assert.doesNotThrow(() => assertPreparatoryTransfers([{ to: location("70") }], spnFillFirstTransfers, []));
  assert.equal(preparatoryTransfersComplete(spnFillFirstTransfers, rows), true);
});

test("special-housing exception is limited to exact approved source, origin and registered transfer target", () => {
  for (const transfer of spnFillFirstTransfers) {
    assert.equal(allowsPreparedFixedHousingTransfer(transfer.sourceId, location("23"), location("70"), spnFillFirstTransfers), true);
    assert.equal(allowsPreparedFixedHousingTransfer(transfer.sourceId, location("23"), location("70")), false);
    assert.equal(allowsPreparedFixedHousingTransfer(transfer.sourceId, location("23"), location("18"), spnFillFirstTransfers), false);
    assert.equal(allowsPreparedFixedHousingTransfer(transfer.sourceId, location("24"), location("70"), spnFillFirstTransfers), false);
    assert.equal(allowsPreparedFixedHousingTransfer(transfer.sourceId, null, location("70"), spnFillFirstTransfers), false);
  }
  const unapproved = { ...spnFillFirstTransfers[0], sourceId: "other" };
  assert.equal(allowsPreparedFixedHousingTransfer("other", location("23"), location("70"), [unapproved]), false);
  const altered = { ...spnFillFirstTransfers[0], toVitrine: "71" };
  assert.equal(allowsPreparedFixedHousingTransfer(altered.sourceId, location("23"), location("71"), [altered]), false);
});
