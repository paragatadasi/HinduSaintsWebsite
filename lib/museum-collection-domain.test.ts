import assert from "node:assert/strict";
import test from "node:test";
import { collectionObservationSchema, stableCollectionJson } from "./museum-collection-domain";

test("collection observations retain explicit location codes and require a mapping version", () => {
  const value = { mappingVersion: "spn-v1", label: "Relic", inventoryCode: null, saintIds: [],
    location: { code: "012", label: "Vitrine 012", kind: "vitrine", room: null } };
  assert.equal(collectionObservationSchema.parse(value).location?.code, "012");
  assert.equal(collectionObservationSchema.parse({ ...value, location: null }).location, null);
  assert.equal(collectionObservationSchema.safeParse({ ...value, mappingVersion: "" }).success, false);
  assert.equal(collectionObservationSchema.safeParse({ ...value, location: { ...value.location, code: "" } }).success, false);
});
test("observation comparison is independent of object key order, but retains changed values", () => {
  assert.equal(stableCollectionJson({ a: 1, b: { c: 2 } }), stableCollectionJson({ b: { c: 2 }, a: 1 }));
  assert.notEqual(stableCollectionJson({ vitrine: "012" }), stableCollectionJson({ vitrine: "12" }));
  assert.notEqual(stableCollectionJson({ vitrine: null }), stableCollectionJson({ vitrine: "0" }));
});
