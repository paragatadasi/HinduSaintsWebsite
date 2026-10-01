import assert from "node:assert/strict";
import test from "node:test";
import { db } from "./db";
import { getMuseumProposalData } from "./museum-proposals";
import { getEditableMuseumProposalData, moveMuseumFamilyProposal } from "./museum-family-moves";
import { getDirectMuseumProposals } from "./museum-direct-proposals";
import { reviewMuseumProposal } from "./museum-service";
import { proposalFamilyKey } from "./museum-family-move-domain";

// Run only against a dedicated disposable local database, never a shared development dataset.
test("family moves are atomic, durable and reviewable without replacing confirmed placements", {
  skip: process.env.MUSEUM_FAMILY_MOVE_INTEGRATION !== "1"
}, async () => {
  const url = new URL(process.env.DATABASE_URL!);
  assert.ok(["localhost", "127.0.0.1"].includes(url.hostname));
  assert.equal(url.pathname, "/museum_family_move_verify");
  try {
    const original = getMuseumProposalData();
    const counts = new Map<string, number>();
    for (const row of original.placements) if (proposalFamilyKey(row)) counts.set(proposalFamilyKey(row), (counts.get(proposalFamilyKey(row)) ?? 0) + 1);
    const key = [...counts].find(([, count]) => count === 2)![0];
    const rows = original.placements.filter(row => proposalFamilyKey(row) === key);
    const destination = original.sections.find(s => rows.every(row => row.section !== s.name))!;
    const actor = await db.user.create({ data: { email: "family-move-test@example.invalid", roles: ["site_admin"] } });
    const saint = await db.saint.create({ data: { slug: "family-move-test", canonicalName: "Test", displayName: "Test" } });
    await db.externalRecord.create({ data: { sourceType: "airtable", entityType: "Saint", entityId: saint.id,
      externalId: `appFamilyTest:Saints:${rows[0].id}`, rawPayloadJson: { original: true } } });
    const confirmedSection = await db.museumSection.create({ data: { slug: "confirmed-test", name: "Confirmed test" } });
    const confirmed = await db.saintMuseumSection.create({ data: { saintId: saint.id, museumSectionId: confirmedSection.id, status: "published", tier: "featured" } });
    const view = await getEditableMuseumProposalData();
    const family = view.familyMoveOptions.find(f => f.key === key)!;
    const input = { familyKey: key, section: destination.name, revision: family.revision, actorId: actor.id };
    const results = await Promise.allSettled([moveMuseumFamilyProposal(input), moveMuseumFamilyProposal(input)]);
    assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
    assert.equal(results.filter(result => result.status === "rejected").length, 1);
    const moved = await getEditableMuseumProposalData();
    assert.ok(moved.placements.filter(row => proposalFamilyKey(row) === key).every(row => row.section === destination.name));
    assert.equal(moved.familyMoveOptions.find(f => f.key === key)?.count, 2); // Includes unlinked member.
    assert.deepEqual(await db.saintMuseumSection.findUnique({ where: { id: confirmed.id } }), confirmed);
    assert.equal(await db.auditEvent.count({ where: { action: "museum.family.proposal_moved" } }), 1);
    const direct = await getDirectMuseumProposals();
    const proposal = direct.proposals.find(p => p.entityId === saint.id && p.sourceKind.startsWith("family-move:"))!;
    assert.equal(proposal.payload?.section, destination.name);
    assert.ok(!direct.proposals.some(p => p.entityId === saint.id && p.sourceKind === "legacy-export"));
    await reviewMuseumProposal({ saintId: saint.id, version: 0, actorId: actor.id, proposalId: proposal.id, decision: "accept" });
    assert.equal((await db.saintMuseumSection.findFirstOrThrow({ where: { saintId: saint.id, assignmentType: "primary", status: "published" }, include: { museumSection: true } })).museumSection.name, destination.name);
    assert.ok(!(await getDirectMuseumProposals()).proposals.some(p => p.id === proposal.id));
    await assert.rejects(moveMuseumFamilyProposal(input), /changed/);
    const fresh = moved.familyMoveOptions.find(f => f.key === key)!;
    await assert.rejects(moveMuseumFamilyProposal({ ...input, revision: fresh.revision, section: "Unknown destination" }), /available/);
    await moveMuseumFamilyProposal({ ...input, revision: fresh.revision, section: rows[0].section });
    const next = (await getDirectMuseumProposals()).proposals.find(p => p.entityId === saint.id && p.sourceKind.startsWith("family-move:"))!;
    assert.notEqual(next.id, proposal.id);
    assert.equal(next.payload?.section, rows[0].section);
    await assert.rejects(reviewMuseumProposal({ saintId: saint.id, version: 1, actorId: actor.id, proposalId: proposal.id, decision: "accept" }), /changed|reviewed/);
  } finally { await db.$disconnect(); }
});
