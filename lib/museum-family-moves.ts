import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { getMuseumProposalData } from "@/lib/museum-proposals";
import { applyFamilyProposalMoves, familyMoveRevision, proposalFamilyKey } from "@/lib/museum-family-move-domain";
import { MuseumConflict } from "@/lib/museum-service";
import { airtableIdentity } from "@/lib/museum-domain";

export async function getEditableMuseumProposalData(client: Prisma.TransactionClient = db) {
  return applyFamilyProposalMoves(getMuseumProposalData(), await client.museumFamilyProposalMove.findMany());
}

export async function moveMuseumFamilyProposal(args: {
  familyKey: string; section: string; revision: string; actorId: string;
}) {
  return db.$transaction(async tx => {
    // Serializes even the first move, before a row exists to lock.
    await tx.$queryRaw(Prisma.sql`SELECT pg_advisory_xact_lock(hashtextextended(${"museum-family:" + args.familyKey}, 0))`);
    const original = getMuseumProposalData();
    const members = original.placements.filter(row => proposalFamilyKey(row) === args.familyKey);
    if (!members.length) throw new MuseumConflict("This family is no longer available. Reload the section.");
    const before = await tx.museumFamilyProposalMove.findUnique({ where: { familyKey: args.familyKey } });
    if (familyMoveRevision(members, before ?? undefined) !== args.revision)
      throw new MuseumConflict("This family proposal changed. Reload the section before moving it.");
    const definitions = await tx.museumSection.findMany({ select: { name: true, status: true } });
    if (definitions.some(s => s.name === args.section && s.status === "archived") ||
      ![...original.sections, ...definitions.filter(s => s.status !== "archived")].some(s => s.name === args.section))
      throw new MuseumConflict("Choose an available museum section.");
    if (members.every(row => (before?.section ?? row.section) === args.section))
      throw new MuseumConflict("This family is already proposed for that section.");
    // Coordinate with individual proposal review without touching confirmed assignments.
    const ids = new Set(members.map(row => row.id));
    const sources = await tx.externalRecord.findMany({ where: { sourceType: "airtable", entityType: "Saint" }, select: { id: true, externalId: true } });
    for (const source of sources.filter(s => ids.has(airtableIdentity(s.externalId)?.recordId ?? "")).sort((a, b) => a.id.localeCompare(b.id)))
      await tx.$queryRaw(Prisma.sql`SELECT id FROM "ExternalRecord" WHERE id = ${source.id} FOR UPDATE`);
    const after = await tx.museumFamilyProposalMove.upsert({
      where: { familyKey: args.familyKey },
      create: { familyKey: args.familyKey, section: args.section, updatedById: args.actorId },
      update: { section: args.section, version: { increment: 1 }, updatedById: args.actorId }
    });
    await tx.auditEvent.create({ data: {
      userId: args.actorId, action: "museum.family.proposal_moved", entityType: "MuseumFamilyProposalMove", entityId: args.familyKey,
      beforeJson: { section: before?.section ?? null, version: before?.version ?? 0, members: members.map(row => ({ id: row.id, section: before?.section ?? row.section })) },
      afterJson: { section: after.section, version: after.version, memberIds: members.map(row => row.id) }
    } });
  }, { timeout: 30000 });
}
