import assert from "node:assert/strict";
import test from "node:test";
import { getSaintPrimaryTraditionId, resolveSaintPrimaryTraditionUpdate } from "./saint-primary-tradition";

const traditions = [
  { traditionId: "affiliation", isPrimary: false },
  { traditionId: "original-primary", isPrimary: true }
];

test("retains a saved primary even when it is not the first affiliation", () => {
  assert.equal(getSaintPrimaryTraditionId(traditions, false), "original-primary");
});

test("legacy unflagged records retain the pre-deployment first-tradition display", () => {
  assert.equal(getSaintPrimaryTraditionId(traditions.map((item) => ({ ...item, isPrimary: false })), false), "affiliation");
});

test("an explicit no-primary choice suppresses the legacy fallback after reload", () => {
  assert.equal(getSaintPrimaryTraditionId([{ traditionId: "affiliation", isPrimary: false }], true), undefined);
  assert.equal(getSaintPrimaryTraditionId([], false), undefined);
});

const input = {
  traditions,
  selectedIds: ["affiliation", "original-primary", "new-affiliation"],
  clearPrimary: false,
  noPrimaryTradition: false
};

test("saving affiliations without a primary form field retains the saved primary", () => {
  assert.deepEqual(resolveSaintPrimaryTraditionUpdate(input), {
    primaryTraditionId: "original-primary", noPrimaryTradition: false
  });
});

test("only an explicit clearing instruction opts out of a primary", () => {
  assert.deepEqual(resolveSaintPrimaryTraditionUpdate({ ...input, clearPrimary: true }), {
    primaryTraditionId: undefined, noPrimaryTradition: true
  });
});

test("saving further affiliations preserves a previously explicit opt-out", () => {
  assert.deepEqual(resolveSaintPrimaryTraditionUpdate({ ...input, noPrimaryTradition: true }), {
    primaryTraditionId: undefined, noPrimaryTradition: true
  });
});

test("marking a primary reverses an explicit opt-out", () => {
  assert.deepEqual(resolveSaintPrimaryTraditionUpdate({ ...input, noPrimaryTradition: true, primaryTraditionId: "affiliation" }), {
    primaryTraditionId: "affiliation", noPrimaryTradition: false
  });
});

test("removing the primary uses the previous fallback instead of opting out", () => {
  assert.deepEqual(resolveSaintPrimaryTraditionUpdate({ ...input, selectedIds: ["affiliation"] }), {
    primaryTraditionId: "affiliation", noPrimaryTradition: false
  });
});

test("removing every membership leaves no dangling primary", () => {
  assert.deepEqual(resolveSaintPrimaryTraditionUpdate({ ...input, selectedIds: [] }), {
    primaryTraditionId: undefined, noPrimaryTradition: false
  });
});
