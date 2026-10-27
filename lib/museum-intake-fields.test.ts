import test from "node:test";
import assert from "node:assert/strict";
import { intakeFieldsEqual, intakeRelicPayload, intakeRelicsEqual } from "./museum-intake-fields";

test("database key ordering does not trigger another draft save", () => {
  assert.equal(intakeFieldsEqual({saintName:"Saint", relicDescription:"Cloth"}, {relicDescription:"Cloth", saintName:"Saint"}), true);
  assert.equal(intakeFieldsEqual({saintName:"Saint"}, {saintName:"Saint", saintPlaceRaw:""}), true);
});
test("a recovered create response with older details still requires saving the edits", () => {
  assert.equal(intakeFieldsEqual({saintName:"Saint", relicDescription:"Cloth"}, {saintName:"Saint", relicDescription:"Walking stick"}), false);
  assert.equal(intakeFieldsEqual({saintName:"Saint"}, {saintName:"Saint", saintPlaceRaw:"Braj"}), false);
});

test("relic save keeps stable IDs and explicit place but excludes server-only media", () => {
  const relic = {id:"existing-child",relicDescription:"Cloth",relicPlaceRaw:" Amritsar ",media:[{id:"existing-photo"}]};
  assert.deepEqual(intakeRelicPayload(relic), {id:"existing-child",relicDescription:"Cloth",relicPlaceRaw:"Amritsar",broughtByRaw:undefined});
  assert.equal(intakeRelicPayload({...relic,relicPlaceRaw:""}).relicPlaceRaw, undefined);
});

test("recovered drafts detect a relic-place correction or removal", () => {
  const relic = {id:"existing-child",relicDescription:"Cloth"};
  assert.equal(intakeRelicsEqual([relic], [{...relic,relicPlaceRaw:""}]), true);
  assert.equal(intakeRelicsEqual([relic], [{...relic,relicPlaceRaw:"Amritsar"}]), false);
  assert.equal(intakeRelicsEqual([{...relic,relicPlaceRaw:"Amritsar"}], [relic]), false);
});
