import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  airtableIdentity,
  museumPlacementSchema,
  type MuseumPlacementInput,
} from "@/lib/museum-domain";
import { getDirectMuseumProposals } from "@/lib/museum-direct-proposals";
import { recordMuseumProposal } from "@/lib/museum-import";
import { toSlug } from "@/lib/slugs";

type Tx = Prisma.TransactionClient;
export class MuseumConflict extends Error {}
export async function lockMuseumSaint(
  tx: Tx,
  saintId: string,
  version: number,
) {
  const saints = await tx.$queryRaw<Array<{ id: string; status: string }>>(
    Prisma.sql`SELECT id, status FROM "Saint" WHERE id = ${saintId} FOR UPDATE`,
  );
  if (!saints.length || saints[0].status === "archived")
    throw new MuseumConflict("Saint is no longer available.");
  const state = await tx.museumSaintState.upsert({
    where: { saintId },
    create: { saintId },
    update: {},
  });
  if (state.version !== version)
    throw new MuseumConflict(
      "Another reviewer changed this placement. Reload and compare before saving.",
    );
  await tx.museumSaintState.update({
    where: { saintId },
    data: { version: { increment: 1 } },
  });
}

async function lockMuseumSource(
  tx: Tx,
  sourceId: string,
  saintId: string,
  sourceKind: string,
) {
  await tx.$queryRaw(
    Prisma.sql`SELECT id FROM "ExternalRecord" WHERE id = ${sourceId} FOR UPDATE`,
  );
  const source = await tx.externalRecord.findUnique({
    where: { id: sourceId },
  });
  if (source?.entityType !== "Saint" || source.entityId !== saintId)
    throw new MuseumConflict(
      "The source now belongs to a different saint. Reload before saving.",
    );
  const key = airtableIdentity(source.externalId);
  if (sourceKind === "airtable" && key)
    await tx.$queryRaw(
      Prisma.sql`SELECT id FROM "AirtableMirrorRecord" WHERE "baseId" = ${key.baseId} AND "tableIdOrName" = ${key.table} AND "recordId" = ${key.recordId} FOR UPDATE`,
    );
}

async function writePlacement(
  tx: Tx,
  saintId: string,
  input: MuseumPlacementInput,
  externalRecordId?: string,
  anchor = "",
) {
  const data = museumPlacementSchema.parse(input);
  const sections = await Promise.all(
    [data.section, ...data.alternatives].map(async (name) => {
      const slug = toSlug(name);
      if (!slug) throw new MuseumConflict("Choose a valid section name.");
      return tx.museumSection.upsert({
        where: { slug },
        create: { slug, name, publicVisible: false, status: "needs_review" },
        update: {},
      });
    }),
  );
  if (new Set(sections.map((s) => s.id)).size !== sections.length)
    throw new MuseumConflict(
      "Primary and alternative sections must be different.",
    );
  const section = sections[0];
  if (sections.some((s) => s.status === "archived"))
    throw new MuseumConflict("An archived section cannot receive placements.");
  await tx.museumExhibitGroup.updateMany({
    where: { anchorSaintId: saintId, museumSectionId: { not: section.id } },
    data: { anchorSaintId: null },
  });
  let exhibitGroupId: string | null = null;
  if (anchor && anchor !== "self") {
    const group = await tx.museumExhibitGroup.findUnique({
      where: { id: anchor },
    });
    if (!group || group.museumSectionId !== section.id)
      throw new MuseumConflict(
        "The selected anchor belongs to another section.",
      );
    exhibitGroupId = group.id;
  } else if (anchor === "self" || data.group) {
    const saint = await tx.saint.findUniqueOrThrow({
      where: { id: saintId },
      select: { displayName: true },
    });
    const key =
      anchor === "self" ? "saint:" + saintId : "curatorial:" + data.group;
    const group = await tx.museumExhibitGroup.upsert({
      where: { museumSectionId_key: { museumSectionId: section.id, key } },
      create: {
        museumSectionId: section.id,
        key,
        label: anchor === "self" ? saint.displayName : data.group,
        anchorSaintId: anchor === "self" ? saintId : null,
      },
      update: {},
    });
    exhibitGroupId = group.id;
  }
  await tx.museumExhibitGroup.updateMany({
    where: {
      anchorSaintId: saintId,
      ...(exhibitGroupId ? { id: { not: exhibitGroupId } } : {}),
    },
    data: { anchorSaintId: null },
  });
  // Preserve old records and provenance, including competing primary placements.
  await tx.saintMuseumSection.updateMany({
    where: { saintId, status: { not: "archived" } },
    data: { status: "archived" },
  });
  for (let i = 0; i < sections.length; i++) {
    const assignmentType = i === 0 ? "primary" : "alternative";
    const values = {
      tier: anchor === "self" ? ("featured" as const) : data.tier,
      confidence: data.confidence,
      rationale: data.rationale || null,
      internalPlacementNote: data.note || null,
      status: "published" as const,
      exhibitGroupId: i === 0 ? exhibitGroupId : null,
      ...(externalRecordId ? { externalRecordId } : {}),
    };
    await tx.saintMuseumSection.upsert({
      where: {
        saintId_museumSectionId_assignmentType: {
          saintId,
          museumSectionId: sections[i].id,
          assignmentType,
        },
      },
      create: {
        saintId,
        museumSectionId: sections[i].id,
        assignmentType,
        ...values,
      },
      update: values,
    });
  }
}

export async function saveMuseumPlacement(args: {
  saintId: string;
  version: number;
  actorId: string;
  input: MuseumPlacementInput;
  anchor?: string;
}) {
  return db.$transaction(async (tx) => {
    await lockMuseumSaint(tx, args.saintId, args.version);
    const before = await tx.saintMuseumSection.findMany({
      where: { saintId: args.saintId },
    });
    await writePlacement(tx, args.saintId, args.input, undefined, args.anchor);
    await tx.reconciliationIssue.updateMany({
      where: {
        entityType: "Saint",
        entityId: args.saintId,
        issueType: "museum_merge_review",
        status: "open",
      },
      data: {
        status: "resolved",
        resolvedById: args.actorId,
        resolvedAt: new Date(),
        resolutionAction: "museum_placement_reviewed",
      },
    });
    await tx.auditEvent.create({
      data: {
        userId: args.actorId,
        action: "museum.placement.saved",
        entityType: "Saint",
        entityId: args.saintId,
        beforeJson: JSON.parse(JSON.stringify(before)),
        afterJson: JSON.parse(
          JSON.stringify(
            await tx.saintMuseumSection.findMany({
              where: { saintId: args.saintId },
            }),
          ),
        ),
      },
    });
  });
}
export async function reviewMuseumProposal(args: {
  saintId: string;
  version: number;
  actorId: string;
  proposalId: string;
  decision: "accept" | "ignore";
  editedInput?: MuseumPlacementInput;
  anchor?: string;
}) {
  return db.$transaction(async (tx) => {
    await lockMuseumSaint(tx, args.saintId, args.version);
    let proposalId = args.proposalId;
    if (/^(existing|source):/.test(proposalId)) {
      const initial = (await getDirectMuseumProposals(tx)).proposals.find(
        (p) => p.id === proposalId && p.entityId === args.saintId,
      );
      if (!initial)
        throw new MuseumConflict(
          "This proposal has changed or was already reviewed. Reload before saving.",
        );
      await lockMuseumSource(
        tx,
        initial.externalRecordId,
        args.saintId,
        initial.sourceKind,
      );
      const fresh = (await getDirectMuseumProposals(tx)).proposals.find(
        (p) => p.id === proposalId && p.entityId === args.saintId,
      );
      if (!fresh)
        throw new MuseumConflict(
          "The source link or proposal has changed. Reload before saving.",
        );
      await recordMuseumProposal(
        fresh.externalRecordId,
        fresh.sourceKind,
        fresh.payload,
        tx,
      );
      const captured = await tx.museumImportProposal.findFirstOrThrow({
        where: {
          externalRecordId: fresh.externalRecordId,
          sourceKind: fresh.sourceKind,
          status: "pending",
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      });
      proposalId = captured.id;
    }
    if (
      (await getDirectMuseumProposals(tx)).supersededSnapshotIds.has(proposalId)
    )
      throw new MuseumConflict(
        "A newer source value is available. Reload and compare before saving.",
      );
    const proposal = await tx.museumImportProposal.findUnique({
      where: { id: proposalId },
      include: { externalRecord: true },
    });
    if (
      !proposal ||
      proposal.externalRecord.entityType !== "Saint" ||
      proposal.externalRecord.entityId !== args.saintId ||
      proposal.status !== "pending"
    )
      throw new MuseumConflict(
        "This proposal has changed. Reload before reviewing.",
      );
    await lockMuseumSource(
      tx,
      proposal.externalRecordId,
      args.saintId,
      proposal.sourceKind,
    );
    // Refresh may have superseded this proposal while we waited for the source lock.
    const current = await tx.museumImportProposal.findUniqueOrThrow({
      where: { id: proposal.id },
    });
    if (
      (await getDirectMuseumProposals(tx)).supersededSnapshotIds.has(
        proposal.id,
      )
    )
      throw new MuseumConflict(
        "The source changed while this decision was open. Reload and compare.",
      );
    if (current.status !== "pending")
      throw new MuseumConflict(
        "A newer source proposal is available. Reload before reviewing.",
      );
    const before = await tx.saintMuseumSection.findMany({
      where: { saintId: args.saintId },
    });
    if (args.decision === "accept") {
      // Clearing a source field is a review signal, never an instruction to erase accepted data.
      if (proposal.payload === null)
        throw new MuseumConflict(
          "Source placement was cleared. Keep the current placement or edit it explicitly.",
        );
      await writePlacement(
        tx,
        args.saintId,
        args.editedInput ?? museumPlacementSchema.parse(proposal.payload),
        proposal.externalRecordId,
        args.anchor,
      );
    }
    await tx.reconciliationIssue.updateMany({
      where: {
        entityType: "MuseumImportProposal",
        entityId: proposal.id,
        status: "open",
      },
      data: {
        status: "resolved",
        resolvedById: args.actorId,
        resolvedAt: new Date(),
        resolutionAction: "museum_" + args.decision,
      },
    });
    if (args.decision === "accept")
      await tx.reconciliationIssue.updateMany({
        where: {
          entityType: "Saint",
          entityId: args.saintId,
          issueType: "museum_merge_review",
          status: "open",
        },
        data: {
          status: "resolved",
          resolvedById: args.actorId,
          resolvedAt: new Date(),
          resolutionAction: "museum_placement_reviewed",
        },
      });
    await tx.museumImportProposal.update({
      where: { id: proposal.id },
      data: {
        status: args.decision === "accept" ? "accepted" : "ignored",
        reviewedById: args.actorId,
        reviewedAt: new Date(),
      },
    });
    await tx.auditEvent.create({
      data: {
        userId: args.actorId,
        action: "museum.proposal." + args.decision,
        entityType: "Saint",
        entityId: args.saintId,
        beforeJson: JSON.parse(JSON.stringify(before)),
        afterJson: {
          proposalId: proposal.id,
          payload: proposal.payload,
          editedInput: args.editedInput ?? null,
        },
      },
    });
  });
}
