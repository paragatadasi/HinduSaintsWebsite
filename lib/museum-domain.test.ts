import assert from "node:assert/strict";
import { test } from "node:test";
import {
  airtableIdentity,
  createSnapshotIdentityResolver,
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

test("indexed identities preserve missing, inactive, malformed and cross-base ambiguous sources", () => {
  const records = [
    {id:"one",externalId:"appOne:Saints:recOne",entityId:"active"},
    {id:"two",externalId:"appOne:Saints:recTwo",entityId:"active"},
    {id:"twoOtherBase",externalId:"appTwo:Saints:recTwo",entityId:"active"},
    {id:"inactive",externalId:"appOne:Saints:recInactive",entityId:"archived"},
    {id:"unbound",externalId:"appOne:Saints:recUnbound",entityId:null},
    {id:"relic",externalId:"appOne:Relics:recOne",entityId:"other"},
    {id:"malformed",externalId:"invalid:Saints:recMalformed",entityId:"active"}
  ];
  const active=new Set(["active"]);
  const indexed=createSnapshotIdentityResolver(records,active);
  for(const id of ["recOne","recTwo","recInactive","recUnbound","recMalformed","recMissing"])
    assert.deepEqual(indexed(id),resolveSnapshotIdentity(id,records,active));
  assert.equal(indexed("recTwo").reason,"Ambiguous source identity");
  assert.equal(indexed("recOne").record?.id,"one");
});

test("a fresh identity index observes a changed source binding without cross-request caching", () => {
  const records=[{id:"one",externalId:"appOne:Saints:recOne",entityId:"first"}];
  const active=new Set(["first","second"]);
  assert.equal(createSnapshotIdentityResolver(records,active)("recOne").record?.entityId,"first");
  records[0]={...records[0],entityId:"second"};
  assert.equal(createSnapshotIdentityResolver(records,active)("recOne").record?.entityId,"second");
  records.push({id:"duplicate",externalId:"appTwo:Saints:recOne",entityId:"second"});
  assert.equal(createSnapshotIdentityResolver(records,active)("recOne").record,null);
});
