import assert from "node:assert/strict";
import test from "node:test";
import { db } from "./db";
import { runAirtableSaintsMissingDraftImport, runAirtableSlugCollisionRepair } from "./airtable-saint-import";

test("a longer Airtable name cannot bypass an existing saint slug", async (t) => {
  function mockMethod(object: object, key: string, replacement: (...args: unknown[]) => unknown) {
    const target = object as Record<string, unknown>; const original = target[key];
    target[key] = replacement; t.after(() => { target[key] = original; });
  }
  mockMethod(db.airtableMirrorRecord, "findMany", async () => [{
    baseId: "test-base", recordId: "rec-test",
    rawFieldsJson: { Name: "Sri Narayan Maharaj of Khedgoan Bed" }, rawPayloadJson: {}
  }]);
  mockMethod(db.externalRecord, "findUnique", async () => null);
  let slugQueries = 0;
  mockMethod(db.saint, "findUnique", async () => {
    slugQueries++;
    return { id: "existing", slug: "sri-narayan-maharaj", displayName: "Sri Narayan Maharaj", aliases: [] };
  });
  mockMethod(db.saint, "create", async () => { throw Error("Must not create a duplicate"); });
  for (const run of [runAirtableSaintsMissingDraftImport, runAirtableSlugCollisionRepair]) {
    const summary = await run({ dryRun: false });
    assert.equal(summary.newDraftSaintsCreated, 0);
    assert.equal(summary.slugCollisionsResolved, 0);
    assert.equal(summary.slugNameCollisionsSkipped, 1);
    assert.equal(summary.errors.length, 0);
    assert.equal(summary.collisions[0].existingSaintId, "existing");
  }
  assert.equal(slugQueries, 2, "Never probes a longer slug to manufacture another identity");
});
