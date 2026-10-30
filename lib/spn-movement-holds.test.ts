import test from "node:test";
import assert from "node:assert/strict";
import { assertSpnMovementAllowed, spnMovementBlockedReason } from "./spn-movement-holds";

const original = { kind: "vitrine" as const, code: "42", label: "Vitrine 42", shelf: "E" };
const destination = { kind: "vitrine" as const, code: "35", label: "Vitrine 35" };

test("mixed stick observations cannot move as whole displays, including old session snapshots", () => {
  for (const id of ["reck86EKve5tFAi6R", "rec9vEn5oj7QZTXl0", "recsm43oeUdKNUMqs", "rec7GxgNvmubmTvMM"]) {
    assert.throws(() => assertSpnMovementAllowed(id, original, destination), /separate objects and stick housing/);
    assert.doesNotThrow(() => assertSpnMovementAllowed(id, original, original));
  }
});

test("Paramanand retains a housing hold without asserting multiple objects or a separate staff",()=>{
 const id="recVN6Ty3682Uz2g4";
 assert.throws(()=>assertSpnMovementAllowed(id,original,destination),/arm-support.*housing/);
 assert.doesNotThrow(()=>assertSpnMovementAllowed(id,original,original));
 assert.doesNotMatch(spnMovementBlockedReason(id)!,/separate objects|walking staff/);
});

test("fragments and covers do not inherit a complete-stick restriction", () => {
  for (const id of ["rec1cTbJ4iPAMUW0v", "rec1rr4Ktv320QXvd", "recich5ddJOLsUnVm"]) {
    assert.equal(spnMovementBlockedReason(id), undefined);
    assert.doesNotThrow(() => assertSpnMovementAllowed(id, original, destination));
  }
});
