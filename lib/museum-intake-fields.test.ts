import test from "node:test";
import assert from "node:assert/strict";
import { intakeFieldsEqual } from "./museum-intake-fields";

test("database key ordering does not trigger another draft save", () => {
  assert.equal(intakeFieldsEqual({saintName:"Saint", relicDescription:"Cloth"}, {relicDescription:"Cloth", saintName:"Saint"}), true);
  assert.equal(intakeFieldsEqual({saintName:"Saint"}, {saintName:"Saint", saintPlaceRaw:""}), true);
});
test("a recovered create response with older details still requires saving the edits", () => {
  assert.equal(intakeFieldsEqual({saintName:"Saint", relicDescription:"Cloth"}, {saintName:"Saint", relicDescription:"Walking stick"}), false);
  assert.equal(intakeFieldsEqual({saintName:"Saint"}, {saintName:"Saint", saintPlaceRaw:"Braj"}), false);
});
