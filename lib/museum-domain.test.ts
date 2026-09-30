import assert from "node:assert/strict";
import { test } from "node:test";
import {
  airtableIdentity,
  airtableSourceLink,
  museumFields,
  museumPlacementSchema,
  resolveSnapshotIdentity
} from "./museum-domain";

test("museum field mapping excludes unrelated private payload and normalizes alternatives", () => {
  const value = museumFields({
    "Primary Museum Section": "Rama",
    "Alternative Museum Sections": ["Rama", "Kashi", "Kashi"],
    "Museum Section Tier": "Featured",
    "Museum Section Confidence": "High",
    "Curatorial Family": "Curatorial bridge",
    Relic: "private",
    Name: "Imported name"
  });
  assert.deepEqual(value, {
    section: "Rama",
    alternatives: ["Kashi"],
    tier: "featured",
    confidence: "high",
    rationale: "",
    note: "",
    group: "Curatorial bridge"
  });
});
test("invalid imported enums are not silently accepted", () => {
  assert.equal(museumFields({ "Primary Museum Section": "Rama", "Museum Section Tier": "main" }), null);
  assert.equal(museumFields({ "Primary Museum Section": " " }), null);
  assert.equal(
    museumPlacementSchema.safeParse({ section: "Rama", tier: "featured", confidence: "certain" }).success,
    false
  );
});
test("legacy identifiers require one full source identity and an existing saint", () => {
  const records = [{ id: "a", externalId: "appOne:Saints:recOne", entityId: "saint" }];
  assert.equal(resolveSnapshotIdentity("recOne", records, new Set(["saint"])).record?.id, "a");
  assert.equal(
    resolveSnapshotIdentity(
      "recOne",
      [...records, { ...records[0], id: "b", externalId: "appTwo:Saints:recOne" }],
      new Set(["saint"])
    ).record,
    null
  );
  assert.equal(resolveSnapshotIdentity("recOne", records, new Set()).record, null);
  assert.equal(airtableIdentity("https://malicious.invalid"), null);
});
test("source links use real table IDs and fall back honestly when only a name is known", () => {
  assert.equal(airtableSourceLink("appOne:Saints:recOne", {})?.direct, false);
  assert.equal(
    airtableSourceLink("appOne:Saints:recOne", { tableId: "tblOne" })?.url,
    "https://airtable.com/appOne/tblOne/recOne"
  );
  assert.equal(
    airtableSourceLink("appOne:Saints:recOne", { tableId: "https://evil.invalid" })?.direct,
    false
  );
});
