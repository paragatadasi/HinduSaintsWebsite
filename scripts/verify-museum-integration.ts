import { getDirectMuseumProposals } from "../lib/museum-direct-proposals";
/** Run only against a disposable database with all repository migrations applied. */
import assert from "node:assert/strict";

const testUrl = process.env.MUSEUM_TEST_DATABASE_URL;
if (!testUrl)
  throw new Error(
    "Set MUSEUM_TEST_DATABASE_URL to a disposable local museum_integration_test database.",
  );
const parsedUrl = new URL(testUrl);
if (
  !["localhost", "127.0.0.1", "::1"].includes(parsedUrl.hostname) ||
  parsedUrl.pathname !== "/museum_integration_test"
)
  throw new Error(
    "Refusing to run outside the isolated local museum_integration_test database.",
  );
process.env.DATABASE_URL = testUrl;
const { db } = await import("../lib/db");
const { saveMuseumPlacement, reviewMuseumProposal, MuseumConflict } =
  await import("../lib/museum-service");
const { recordMuseumProposal, stageMuseumImports } = await import(
  "../lib/museum-import"
);
const { getMuseumProposalData } = await import("../lib/museum-proposals");
const { mergeSaintRecords } = await import("../lib/saint-merge-service");
const { museumPlacementSchema } = await import("../lib/museum-domain");
const suffix = Date.now().toString();
const makeSaint = (name: string) =>
  db.saint.create({
    data: {
      displayName: name,
      canonicalName: name,
      slug: name.toLowerCase() + "-" + suffix,
    },
  });
try {
  const actor = await db.user.create({
    data: {
      email: "museum-test-" + suffix + "@example.invalid",
      active: true,
      roles: ["site_admin"],
    },
  });
  const saint = await makeSaint("MuseumFixture");
  const input = museumPlacementSchema.parse({
    section: "Test Section A",
    alternatives: ["Test Section B"],
    tier: "featured",
    confidence: "high",
    rationale: "Human decision",
  });
  const external = await db.externalRecord.create({
    data: {
      sourceType: "airtable",
      entityType: "Saint",
      entityId: saint.id,
      externalId: "appTest:Saints:rec" + suffix,
      rawPayloadJson: {},
    },
  });
  await saveMuseumPlacement({
    saintId: saint.id,
    version: 0,
    actorId: actor.id,
    input,
    anchor: "self",
  });
  let active = await db.saintMuseumSection.findMany({
    where: { saintId: saint.id, status: { not: "archived" } },
  });
  assert.equal(active.filter((a) => a.assignmentType === "primary").length, 1);
  const originalAnchorId = active.find(
    (a) => a.assignmentType === "primary",
  )?.exhibitGroupId;
  assert.ok(originalAnchorId);
  await assert.rejects(
    saveMuseumPlacement({
      saintId: saint.id,
      version: 0,
      actorId: actor.id,
      input,
    }),
    MuseumConflict,
  );
  console.log(
    "PASS persisted placement, alternatives, anchor, and stale-write rejection",
  );

  await recordMuseumProposal(external.id, "airtable", {
    ...input,
    rationale: "Imported A",
  });
  assert.equal(
    await recordMuseumProposal(external.id, "airtable", {
      ...input,
      rationale: "Imported A",
    }),
    false,
  );
  await recordMuseumProposal(external.id, "airtable", {
    ...input,
    rationale: "Imported B",
  });
  await recordMuseumProposal(external.id, "airtable", {
    ...input,
    rationale: "Imported A",
  });
  assert.equal(
    await db.museumImportProposal.count({
      where: { externalRecordId: external.id },
    }),
    3,
  );
  assert.equal(
    await db.museumImportProposal.count({
      where: { externalRecordId: external.id, status: "pending" },
    }),
    1,
  );
  assert.equal(
    (
      await db.saintMuseumSection.findFirstOrThrow({
        where: {
          saintId: saint.id,
          assignmentType: "primary",
          status: "published",
        },
      })
    ).rationale,
    "Human decision",
  );
  const proposal = await db.museumImportProposal.findFirstOrThrow({
    where: { externalRecordId: external.id, status: "pending" },
  });
  await reviewMuseumProposal({
    saintId: saint.id,
    version: 1,
    actorId: actor.id,
    proposalId: proposal.id,
    decision: "accept",
  });
  await assert.rejects(
    reviewMuseumProposal({
      saintId: saint.id,
      version: 2,
      actorId: actor.id,
      proposalId: proposal.id,
      decision: "accept",
    }),
    MuseumConflict,
  );
  assert.equal(
    await db.reconciliationIssue.count({
      where: {
        entityType: "MuseumImportProposal",
        entityId: proposal.id,
        status: "open",
      },
    }),
    0,
  );
  console.log(
    "PASS idempotent imports, source reversions, human-edit preservation, proposal acceptance, and conflict resolution",
  );

  const oldPrimary = await db.saintMuseumSection.findFirstOrThrow({
    where: {
      saintId: saint.id,
      assignmentType: "primary",
      status: "published",
    },
  });
  await assert.rejects(
    saveMuseumPlacement({
      saintId: saint.id,
      version: 2,
      actorId: actor.id,
      input: { ...input, section: "Test Section B", alternatives: [] },
      anchor: originalAnchorId,
    }),
    MuseumConflict,
  );
  assert.equal(
    (
      await db.museumSaintState.findUniqueOrThrow({
        where: { saintId: saint.id },
      })
    ).version,
    2,
  );
  const sectionB = await db.museumSection.findUniqueOrThrow({
    where: { slug: "test-section-b" },
  });
  await assert.rejects(
    db.saintMuseumSection.create({
      data: {
        saintId: saint.id,
        museumSectionId: sectionB.id,
        assignmentType: "primary",
        status: "published",
      },
    }),
  );
  await saveMuseumPlacement({
    saintId: saint.id,
    version: 2,
    actorId: actor.id,
    input: { ...input, section: "Test Section B", alternatives: [] },
  });
  assert.equal(
    (
      await db.saintMuseumSection.findUniqueOrThrow({
        where: { id: oldPrimary.id },
      })
    ).status,
    "archived",
  );
  assert.equal(
    await db.saintMuseumSection.count({
      where: {
        saintId: saint.id,
        assignmentType: "primary",
        status: { not: "archived" },
      },
    }),
    1,
  );
  console.log(
    "PASS transaction rollback, section moves, and database primary uniqueness",
  );

  await recordMuseumProposal(external.id, "airtable", null);
  const cleared = await db.museumImportProposal.findFirstOrThrow({
    where: { externalRecordId: external.id, status: "pending" },
  });
  await assert.rejects(
    reviewMuseumProposal({
      saintId: saint.id,
      version: 3,
      actorId: actor.id,
      proposalId: cleared.id,
      decision: "accept",
    }),
    MuseumConflict,
  );
  await reviewMuseumProposal({
    saintId: saint.id,
    version: 3,
    actorId: actor.id,
    proposalId: cleared.id,
    decision: "ignore",
  });
  assert.equal(
    await db.saintMuseumSection.count({
      where: {
        saintId: saint.id,
        status: "published",
        assignmentType: "primary",
      },
    }),
    1,
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
      rawPayloadJson: {},
    },
  });
  await db.airtableMirrorRecord.create({
    data: {
      baseId: "appTest",
      tableIdOrName: "Saints",
      recordId: exported.id,
      rawFieldsJson: { Name: "Older mirror without planning fields" },
      rawPayloadJson: { tableId: "tblTests" },
    },
  });
  const coverage = await stageMuseumImports(true);
  assert.ok(coverage.candidates >= 1);
  assert.ok(coverage.unresolved.some((r) => r.reason === "No Airtable link"));
  const snapshotCount = await db.museumImportProposal.count();
  const direct = await getDirectMuseumProposals();
  const available = direct.proposals.find((p) => p.entityId === mapped.id);
  assert.ok(
    available?.payload,
    "existing export is reviewable without preparation",
  );
  assert.equal(
    await db.museumImportProposal.count(),
    snapshotCount,
    "browsing is read-only",
  );
  assert.equal(direct.linkedSaintByRecordId.get(exported.id), mapped.id);
  const duplicate = await db.externalRecord.create({
    data: {
      sourceType: "airtable",
      externalId: "appOther:Saints:" + exported.id,
      entityType: "Saint",
      entityId: mapped.id,
      rawPayloadJson: {},
    },
  });
  assert.ok(
    !(await getDirectMuseumProposals()).proposals.some(
      (p) => p.entityId === mapped.id,
    ),
    "ambiguous source identities are never guessed",
  );
  await assert.rejects(
    reviewMuseumProposal({
      saintId: mapped.id,
      version: 0,
      actorId: actor.id,
      proposalId: available.id,
      decision: "accept",
    }),
    MuseumConflict,
  );
  assert.equal(
    await db.museumImportProposal.count(),
    snapshotCount,
    "failed identity check cannot capture a snapshot",
  );
  await db.externalRecord.delete({ where: { id: duplicate.id } });
  const edited = {
    ...available.payload,
    rationale: "Edited directly from the existing proposal",
  };
  await reviewMuseumProposal({
    saintId: mapped.id,
    version: 0,
    actorId: actor.id,
    proposalId: available.id,
    decision: "accept",
    editedInput: edited,
  });
  const confirmed = await db.saintMuseumSection.findFirstOrThrow({
    where: {
      saintId: mapped.id,
      status: "published",
      assignmentType: "primary",
    },
  });
  assert.equal(confirmed.rationale, edited.rationale);
  const captured = await db.museumImportProposal.findFirstOrThrow({
    where: {
      externalRecordId: available.externalRecordId,
      sourceKind: "legacy-export",
    },
  });
  assert.equal(captured.status, "accepted");
  assert.equal(
    (captured.payload as { rationale: string }).rationale,
    available.payload.rationale,
    "original source values are preserved",
  );
  assert.ok(
    !(await getDirectMuseumProposals()).proposals.some(
      (p) => p.id === available.id,
    ),
    "reviewed proposal does not reappear",
  );
  await assert.rejects(
    reviewMuseumProposal({
      saintId: mapped.id,
      version: 0,
      actorId: actor.id,
      proposalId: available.id,
      decision: "accept",
    }),
    MuseumConflict,
  );
  console.log(
    "PASS direct proposals without preparation, read-only browsing, ambiguity/stale protection, edited confirmation and immutable source snapshot",
  );
  const mirrorWhere = {
    baseId_tableIdOrName_recordId: {
      baseId: "appTest",
      tableIdOrName: "Saints",
      recordId: exported.id,
    },
  };
  await db.airtableMirrorRecord.update({
    where: mirrorWhere,
    data: {
      rawFieldsJson: {
        "Primary Museum Section": exported.section,
        "Museum Section Rationale": "Latest source discrepancy",
      },
    },
  });
  const firstUpdate = (await getDirectMuseumProposals()).proposals.find(
    (p) => p.entityId === mapped.id && p.sourceKind === "airtable",
  );
  assert.ok(
    firstUpdate?.payload,
    "latest imported source is reviewable without preparation",
  );
  await recordMuseumProposal(
    firstUpdate.externalRecordId,
    "airtable",
    firstUpdate.payload,
  );
  const oldSnapshot = await db.museumImportProposal.findFirstOrThrow({
    where: {
      externalRecordId: firstUpdate.externalRecordId,
      sourceKind: "airtable",
      status: "pending",
    },
  });
  await db.airtableMirrorRecord.update({
    where: mirrorWhere,
    data: {
      rawFieldsJson: {
        "Primary Museum Section": exported.section,
        "Museum Section Rationale": "Changed again while reviewing",
      },
    },
  });
  await assert.rejects(
    reviewMuseumProposal({
      saintId: mapped.id,
      version: 1,
      actorId: actor.id,
      proposalId: firstUpdate.id,
      decision: "accept",
    }),
    MuseumConflict,
  );
  await assert.rejects(
    reviewMuseumProposal({
      saintId: mapped.id,
      version: 1,
      actorId: actor.id,
      proposalId: oldSnapshot.id,
      decision: "accept",
    }),
    MuseumConflict,
  );
  const latestUpdate = (await getDirectMuseumProposals()).proposals.find(
    (p) => p.entityId === mapped.id && p.sourceKind === "airtable",
  );
  assert.ok(latestUpdate);
  await reviewMuseumProposal({
    saintId: mapped.id,
    version: 1,
    actorId: actor.id,
    proposalId: latestUpdate.id,
    decision: "ignore",
  });
  assert.equal(
    (
      await db.saintMuseumSection.findUniqueOrThrow({
        where: { id: confirmed.id },
      })
    ).rationale,
    edited.rationale,
  );
  assert.ok(
    !(await getDirectMuseumProposals()).proposals.some(
      (p) => p.id === latestUpdate.id,
    ),
  );
  console.log(
    "PASS automatic source discrepancy, stale snapshot rejection, and keep-site resolution",
  );
  await stageMuseumImports();
  assert.ok(
    await db.museumImportProposal.count({
      where: {
        sourceKind: "legacy-export",
        externalRecord: { entityId: mapped.id },
      },
    }),
  );
  console.log("PASS legacy snapshot mapping and visible unresolved coverage");

  const target = await makeSaint("MergeFixture");
  await saveMuseumPlacement({
    saintId: target.id,
    version: 0,
    actorId: actor.id,
    input,
    anchor: "self",
  });
  const candidate = await db.duplicateCandidate.create({
    data: {
      entityType: "Saint",
      entityId: saint.id,
      candidateEntityId: target.id,
    },
  });
  await db.$transaction(
    (tx) =>
      mergeSaintRecords(tx, {
        actorId: actor.id,
        candidateId: candidate.id,
        fieldChoices: {},
        source: {
          id: saint.id,
          slug: saint.slug,
          displayName: saint.displayName,
        },
        target: {
          id: target.id,
          slug: target.slug,
          displayName: target.displayName,
        },
        scalarData: {},
      }),
    { timeout: 30000 },
  );
  assert.equal(
    (await db.externalRecord.findUniqueOrThrow({ where: { id: external.id } }))
      .entityId,
    target.id,
  );
  assert.equal(await db.saint.findUnique({ where: { id: saint.id } }), null);
  assert.ok(
    await db.saintMuseumSection.count({
      where: { saintId: target.id, status: "needs_review" },
    }),
  );
  assert.ok(
    await db.auditEvent.count({
      where: { entityId: target.id, action: "museum.saint.merged" },
    }),
  );
  assert.ok(
    (
      await db.museumSaintState.findUniqueOrThrow({
        where: { saintId: target.id },
      })
    ).version > 1,
  );
  console.log(
    "PASS saint merge preserves source links and flags placement review",
  );

  const { readMuseumData } = await import("../lib/museum-working-data");
  const sourceRows = getMuseumProposalData().placements;
  const workingSource = sourceRows.find(p => p.familyId && !p.curatorialFamily)!;
  const currentCard = await makeSaint("CanonicalCard");
  const cardSource = await db.externalRecord.create({ data: {
    sourceType: "airtable", entityType: "Saint", entityId: currentCard.id,
    externalId: "appWorkingCards:Saints:" + workingSource.id, rawPayloadJson: {}
  }});
  await db.saint.update({ where: { id: currentCard.id }, data: {
    displayName: "Renamed canonical saint", birthDateRaw: "c. 1850", birthYear: 1850
  }});
  let working = await readMuseumData(db);
  let card = working.placements.find(p => p.saintId === currentCard.id)!;
  assert.equal(card.name, "Renamed canonical saint");
  assert.equal(card.placementState, "Proposed");
  assert.equal(working.membersById.get(card.id)?.BirthDate, "c. 1850");
  assert.deepEqual(card.normalizedPlaces, []);
  assert.equal(card.sampradaya, "");
  await saveMuseumPlacement({
    saintId: currentCard.id, version: 0, actorId: actor.id,
    input: museumPlacementSchema.parse({ section: "Current Cards Destination", tier: "secondary", confidence: "high" }),
    anchor: ""
  });
  working = await readMuseumData(db);
  assert.equal(working.placements.filter(p => p.saintId === currentCard.id).length, 1);
  card = working.placements.find(p => p.saintId === currentCard.id)!;
  assert.equal(card.section, "Current Cards Destination");
  assert.equal(card.placementState, "Confirmed");
  assert.equal(card.tier, "Secondary");
  assert.ok(working.sections.some(s => s.name === workingSource.section));
  assert.equal(working.original.placements.find(p => p.id === workingSource.id)?.section, workingSource.section);
  await db.saint.update({ where: { id: currentCard.id }, data: { birthYear: null, birthDateRaw: null }});
  working = await readMuseumData(db);
  assert.equal(working.membersById.get(card.id)?.BirthDate, "");
  // A later source reassignment must never leave cached cards attached to the former saint.
  await db.externalRecord.update({ where: { id: cardSource.id }, data: { entityId: null }});
  working = await readMuseumData(db);
  assert.equal(working.placements.find(p => p.id === workingSource.id)?.placementState, "Unlinked");
  assert.equal(working.placements.find(p => p.saintId === currentCard.id)?.placementState, "Confirmed");
  console.log("PASS working cards reflect current edits, confirmed moves, cleared fields and source reassignment");
} finally {
  await db.$disconnect();
}
