/** Run only against a disposable database with all repository migrations applied. */
import assert from "node:assert/strict";

const testUrl = process.env.MUSEUM_TEST_DATABASE_URL;
if (!testUrl)
  throw new Error("Set MUSEUM_TEST_DATABASE_URL to a disposable local museum_integration_test database.");
const parsedUrl = new URL(testUrl);
if (
  !["localhost", "127.0.0.1", "::1"].includes(parsedUrl.hostname) ||
  parsedUrl.pathname !== "/museum_integration_test"
)
  throw new Error("Refusing to run outside the isolated local museum_integration_test database.");
process.env.DATABASE_URL = testUrl;
const { db } = await import("../lib/db");
const { saveMuseumPlacement, reviewMuseumProposal, MuseumConflict } = await import("../lib/museum-service");
const { recordMuseumProposal, stageMuseumImports } = await import("../lib/museum-import");
const { getMuseumProposalData } = await import("../lib/museum-proposals");
const { mergeSaintRecords } = await import("../lib/saint-merge-service");
const { museumPlacementSchema } = await import("../lib/museum-domain");
const suffix = Date.now().toString();
const makeSaint = (name: string) =>
  db.saint.create({
    data: { displayName: name, canonicalName: name, slug: name.toLowerCase() + "-" + suffix }
  });
try {
  const actor = await db.user.create({
    data: { email: "museum-test-" + suffix + "@example.invalid", active: true, roles: ["site_admin"] }
  });
  const saint = await makeSaint("MuseumFixture");
  const input = museumPlacementSchema.parse({
    section: "Test Section A",
    alternatives: ["Test Section B"],
    tier: "featured",
    confidence: "high",
    rationale: "Human decision"
  });
  const external = await db.externalRecord.create({
    data: {
      sourceType: "airtable",
      entityType: "Saint",
      entityId: saint.id,
      externalId: "appTest:Saints:rec" + suffix,
      rawPayloadJson: {}
    }
  });
  await saveMuseumPlacement({ saintId: saint.id, version: 0, actorId: actor.id, input, anchor: "self" });
  let active = await db.saintMuseumSection.findMany({
    where: { saintId: saint.id, status: { not: "archived" } }
  });
  assert.equal(active.filter((a) => a.assignmentType === "primary").length, 1);
  const originalAnchorId=active.find((a) => a.assignmentType === "primary")?.exhibitGroupId;
  assert.ok(originalAnchorId);
  await assert.rejects(
    saveMuseumPlacement({ saintId: saint.id, version: 0, actorId: actor.id, input }),
    MuseumConflict
  );
  console.log("PASS persisted placement, alternatives, anchor, and stale-write rejection");

  await recordMuseumProposal(external.id, "airtable", { ...input, rationale: "Imported A" });
  assert.equal(
    await recordMuseumProposal(external.id, "airtable", { ...input, rationale: "Imported A" }),
    false
  );
  await recordMuseumProposal(external.id, "airtable", { ...input, rationale: "Imported B" });
  await recordMuseumProposal(external.id, "airtable", { ...input, rationale: "Imported A" });
  assert.equal(await db.museumImportProposal.count({ where: { externalRecordId: external.id } }), 3);
  assert.equal(
    await db.museumImportProposal.count({ where: { externalRecordId: external.id, status: "pending" } }),
    1
  );
  assert.equal(
    (
      await db.saintMuseumSection.findFirstOrThrow({
        where: { saintId: saint.id, assignmentType: "primary", status: "published" }
      })
    ).rationale,
    "Human decision"
  );
  const proposal = await db.museumImportProposal.findFirstOrThrow({
    where: { externalRecordId: external.id, status: "pending" }
  });
  await reviewMuseumProposal({
    saintId: saint.id,
    version: 1,
    actorId: actor.id,
    proposalId: proposal.id,
    decision: "accept"
  });
  await assert.rejects(
    reviewMuseumProposal({
      saintId: saint.id,
      version: 2,
      actorId: actor.id,
      proposalId: proposal.id,
      decision: "accept"
    }),
    MuseumConflict
  );
  assert.equal(await db.reconciliationIssue.count({where:{entityType:"MuseumImportProposal",entityId:proposal.id,status:"open"}}),0);
  console.log("PASS idempotent imports, source reversions, human-edit preservation, proposal acceptance, and conflict resolution");

  const oldPrimary = await db.saintMuseumSection.findFirstOrThrow({
    where: { saintId: saint.id, assignmentType: "primary", status: "published" }
  });
  await assert.rejects(
    saveMuseumPlacement({
      saintId: saint.id,
      version: 2,
      actorId: actor.id,
      input: { ...input, section: "Test Section B", alternatives: [] },
      anchor: originalAnchorId
    }),
    MuseumConflict
  );
  assert.equal((await db.museumSaintState.findUniqueOrThrow({ where: { saintId: saint.id } })).version, 2);
  const sectionB = await db.museumSection.findUniqueOrThrow({ where: { slug: "test-section-b" } });
  await assert.rejects(
    db.saintMuseumSection.create({
      data: {
        saintId: saint.id,
        museumSectionId: sectionB.id,
        assignmentType: "primary",
        status: "published"
      }
    })
  );
  await saveMuseumPlacement({
    saintId: saint.id,
    version: 2,
    actorId: actor.id,
    input: { ...input, section: "Test Section B", alternatives: [] }
  });
  assert.equal(
    (await db.saintMuseumSection.findUniqueOrThrow({ where: { id: oldPrimary.id } })).status,
    "archived"
  );
  assert.equal(
    await db.saintMuseumSection.count({
      where: { saintId: saint.id, assignmentType: "primary", status: { not: "archived" } }
    }),
    1
  );
  console.log("PASS transaction rollback, section moves, and database primary uniqueness");

  await recordMuseumProposal(external.id, "airtable", null);
  const cleared = await db.museumImportProposal.findFirstOrThrow({
    where: { externalRecordId: external.id, status: "pending" }
  });
  await assert.rejects(
    reviewMuseumProposal({
      saintId: saint.id,
      version: 3,
      actorId: actor.id,
      proposalId: cleared.id,
      decision: "accept"
    }),
    MuseumConflict
  );
  await reviewMuseumProposal({
    saintId: saint.id,
    version: 3,
    actorId: actor.id,
    proposalId: cleared.id,
    decision: "ignore"
  });
  assert.equal(
    await db.saintMuseumSection.count({
      where: { saintId: saint.id, status: "published", assignmentType: "primary" }
    }),
    1
  );
  console.log("PASS cleared source values preserve accepted placements");

  const exported = getMuseumProposalData().placements[0];
  const mapped = await makeSaint("MappedFixture");
  await db.externalRecord.create({
    data: {
      sourceType: "airtable",
      externalId: "appTest:Saints:" + exported.id,
      entityType: "Saint",
      entityId: mapped.id,
      rawPayloadJson: {}
    }
  });
  await db.airtableMirrorRecord.create({data:{baseId:"appTest",tableIdOrName:"Saints",recordId:exported.id,rawFieldsJson:{Name:"Older mirror without planning fields"},rawPayloadJson:{tableId:"tblTests"}}});
  const coverage = await stageMuseumImports(true);
  assert.ok(coverage.candidates >= 1);
  assert.ok(coverage.unresolved.some((r) => r.reason === "No Airtable link"));
  await stageMuseumImports();
  assert.ok(
    await db.museumImportProposal.count({
      where: { sourceKind: "legacy-export", externalRecord: { entityId: mapped.id } }
    })
  );
  console.log("PASS legacy snapshot mapping and visible unresolved coverage");

  const target = await makeSaint("MergeFixture");
  await saveMuseumPlacement({ saintId: target.id, version: 0, actorId: actor.id, input, anchor: "self" });
  const candidate = await db.duplicateCandidate.create({
    data: { entityType: "Saint", entityId: saint.id, candidateEntityId: target.id }
  });
  await db.$transaction(
    (tx) =>
      mergeSaintRecords(tx, {
        actorId: actor.id,
        candidateId: candidate.id,
        fieldChoices: {},
        source: { id: saint.id, slug: saint.slug, displayName: saint.displayName },
        target: { id: target.id, slug: target.slug, displayName: target.displayName },
        scalarData: {}
      }),
    { timeout: 30000 }
  );
  assert.equal(
    (await db.externalRecord.findUniqueOrThrow({ where: { id: external.id } })).entityId,
    target.id
  );
  assert.equal(await db.saint.findUnique({ where: { id: saint.id } }), null);
  assert.ok(await db.saintMuseumSection.count({ where: { saintId: target.id, status: "needs_review" } }));
  assert.ok(await db.auditEvent.count({ where: { entityId: target.id, action: "museum.saint.merged" } }));
  assert.ok((await db.museumSaintState.findUniqueOrThrow({ where: { saintId: target.id } })).version > 1);
  console.log("PASS saint merge preserves source links and flags placement review");
} finally {
  await db.$disconnect();
}
