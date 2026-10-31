import test from "node:test";
import assert from "node:assert/strict";
import {spnCaseExecutionHold, spnPhysicalExecutionHold} from "./museum-case-execution-holds";

test("all five retained Sikh cases block preparation, incoming and outgoing physical records", () => {
  for (const code of ["64", "65", "66", "67", "68"]) {
    const hold = spnCaseExecutionHold(code);
    assert.ok(hold);
    const vitrine = {kind: "vitrine", code};
    assert.equal(spnPhysicalExecutionHold(vitrine, {kind: "table", code: "staging-area"}), hold);
    assert.equal(spnPhysicalExecutionHold({kind: "vitrine", code: "77"}, vitrine), hold);
    assert.equal(spnPhysicalExecutionHold(null, vitrine), hold);
    assert.equal(spnPhysicalExecutionHold(vitrine, vitrine), hold);
  }
});

test("unrelated cases and non-vitrine location codes remain unaffected", () => {
  for (const code of ["5", "14", "18", "54", "63", "69", "77"]) assert.equal(spnCaseExecutionHold(code), null);
  assert.equal(spnPhysicalExecutionHold({kind: "vitrine", code: "7"}, {kind: "vitrine", code: "77"}), null);
  assert.equal(spnPhysicalExecutionHold({kind: "table", code: "64"}, undefined), null);
  assert.equal(spnPhysicalExecutionHold(undefined, null), null);
});

test("verified item shelves resolve to their SPN case without affecting another museum", () => {
  assert.ok(spnPhysicalExecutionHold({kind:"shelf",code:"64/A",museumId:"museum-spn"},null));
  assert.ok(spnPhysicalExecutionHold(null,{kind:"shelf",code:"68/3",museumId:"museum-spn"}));
  assert.equal(spnPhysicalExecutionHold({kind:"shelf",code:"64/A",museumId:"museum-vrindavan"},null),null);
  assert.equal(spnPhysicalExecutionHold(null,{kind:"vitrine",code:"68",museumId:"museum-vrindavan"}),null);
});
