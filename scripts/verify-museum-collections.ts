import assert from "node:assert/strict";
const url = process.env.MUSEUM_TEST_DATABASE_URL;
if (!url || !["localhost", "127.0.0.1"].includes(new URL(url).hostname) ||
    new URL(url).pathname !== "/museum_integration_test") throw Error("Disposable local museum_integration_test database required");
process.env.DATABASE_URL = url;
const { db } = await import("../lib/db");
const { readSaintCollectionItems, stageCollectionObservation } = await import("../lib/museum-collections");
const { readMuseumData } = await import("../lib/museum-working-data");
const { getMuseumProposalData } = await import("../lib/museum-proposals");
const { mergeSaintRecords } = await import("../lib/saint-merge-service");
try {
  const s = await db.saint.create({ data: { slug: "collection-test", displayName: "Collection test", canonicalName: "Collection test" } });
  const source = getMuseumProposalData().placements[0];
  await db.externalRecord.create({ data: { sourceType: "airtable", entityType: "Saint", entityId: s.id, externalId: "appCollections:Saints:"+source.id, rawPayloadJson: {} } });
  const location = async (museumId: string) => db.museumLocation.create({ data: { museumId, code: "12", label: "Vitrine 12", kind: "vitrine" } });
  const spn = await location("museum-spn"), vrindavan = await location("museum-vrindavan");
  await assert.rejects(location("museum-spn"));
  const item = async (catalogMuseumId: string) => db.museumCollectionItem.create({ data: {
    catalogMuseumId, inventoryCode: "001", label: "Test relic", status: "verified",
    saints: { create: { saintId: s.id } }
  } });
  const a = await item("museum-spn"), b = await item("museum-vrindavan");
  await assert.rejects(item("museum-spn"));
  const first = await db.museumItemPlacement.create({ data: { itemId: a.id, locationId: spn.id } });
  await db.museumItemPlacement.create({ data: { itemId: b.id, locationId: vrindavan.id } });
  await assert.rejects(async () => { await db.museumItemPlacement.create({ data: { itemId: a.id, locationId: vrindavan.id } }); });
  let cards = (await readSaintCollectionItems()).get(s.id)!;
  assert.equal(cards.length, 2);
  assert.deepEqual(new Set(cards.map(c => c.location?.museumSlug)), new Set(["spn", "vrindavan"]));
  await db.$transaction(async tx => {
    await tx.museumItemPlacement.update({ where: { id: first.id }, data: { endedAt: new Date() } });
    await tx.museumItemPlacement.create({ data: { itemId: a.id, locationId: vrindavan.id } });
  });
  assert.equal(await db.museumItemPlacement.count({ where: { itemId: a.id } }), 2);
  cards = (await readSaintCollectionItems()).get(s.id)!;
  assert.equal(cards.find(c => c.id === a.id)?.catalogMuseum.slug, "spn");
  assert.equal(cards.find(c => c.id === a.id)?.location?.museumSlug, "vrindavan");
  const working = await readMuseumData();
  assert.equal(working.placements.find(p => p.saintId === s.id)?.collectionItems?.length, 2);
  const observation = {
    museumId: "museum-spn", sourceKey: "airtable:appFixture:Relics:recFixture",
    raw: { Vitrine: "12" }, normalized: { mappingVersion: "test-v1", label: "Source relic", inventoryCode: "001", saintIds: [s.id], location: { code: "12", label: "Vitrine 12", kind: "vitrine", room: null } }
  };
  const one = await stageCollectionObservation(observation);
  assert.equal((await stageCollectionObservation(observation)).id, one.id);
  await stageCollectionObservation({ ...observation, raw: { Vitrine: "13" } });
  assert.notEqual((await stageCollectionObservation(observation)).id, one.id);
  assert.equal((await db.museumCollectionItem.findUniqueOrThrow({ where: { id: a.id } })).label, "Test relic");
  assert.equal(await db.museumCollectionItem.count(), 2);
  assert.equal(await db.museumCollectionImport.count(), 3);
  const target = await db.saint.create({ data: { slug: "collection-target", displayName: "Target", canonicalName: "Target" } });
  await db.museumItemSaint.create({ data: { itemId: a.id, saintId: target.id } });
  const actor = await db.user.create({ data: { email: "collection-test@example.invalid", roles: ["site_admin"] } });
  const candidate = await db.duplicateCandidate.create({ data: { entityType: "Saint", entityId: s.id, candidateEntityId: target.id } });
  await db.$transaction(tx => mergeSaintRecords(tx, {
    actorId: actor.id, candidateId: candidate.id, fieldChoices: {}, scalarData: {},
    source: { id: s.id, slug: s.slug, displayName: s.displayName },
    target: { id: target.id, slug: target.slug, displayName: target.displayName }
  }), { timeout: 30000 });
  assert.equal((await readSaintCollectionItems()).get(target.id)?.length, 2);
  assert.equal(await db.museumItemSaint.count({ where: { saintId: s.id } }), 0);
  await db.museumCollectionItem.update({ where: { id: b.id }, data: { status: "archived" } });
  assert.equal((await readSaintCollectionItems()).get(target.id)?.length, 1);
  console.log("PASS museum-scoped inventory/vitrines, physical uniqueness, transfers/history, private card data, immutable/idempotent source observations, reversions, saint merges and archival");
} finally { await db.$disconnect(); }

