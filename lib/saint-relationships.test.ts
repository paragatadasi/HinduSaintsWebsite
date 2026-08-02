import assert from "node:assert/strict";
import test from "node:test";
import { getReciprocalRelationshipType } from "./saint-relationships";

test("maps directional saint relationships to their reciprocal view", () => {
  assert.equal(getReciprocalRelationshipType("guru"), "disciple");
  assert.equal(getReciprocalRelationshipType("disciple"), "guru");
  assert.equal(getReciprocalRelationshipType("husband"), "wife");
  assert.equal(getReciprocalRelationshipType("wife"), "husband");
  assert.equal(getReciprocalRelationshipType("son"), "parent");
  assert.equal(getReciprocalRelationshipType("mother"), "child");
});

test("keeps symmetric saint relationships unchanged", () => {
  assert.equal(getReciprocalRelationshipType("partner"), "partner");
  assert.equal(getReciprocalRelationshipType("contemporary"), "contemporary");
  assert.equal(getReciprocalRelationshipType("related"), "related");
});
