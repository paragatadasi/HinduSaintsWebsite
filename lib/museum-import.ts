import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  museumFields,
  museumPlacementSchema,
  proposalSignature,
  resolveSnapshotIdentity,
  type MuseumPlacementInput
} from "@/lib/museum-domain";
import { getMuseumProposalData } from "@/lib/museum-proposals";

// Only museum planning fields enter this snapshot. Never forward a whole mirror payload.
export async function recordMuseumProposal(
  externalRecordId: string,
  sourceKind: string,
  payload: MuseumPlacementInput | null,
  client?: Prisma.TransactionClient
): Promise<boolean> {
  if (!client)
    return db.$transaction(async (tx) => {
      await tx.$queryRaw(
        Prisma.sql`SELECT id FROM "ExternalRecord" WHERE id = ${externalRecordId} FOR UPDATE`
      );
      return recordMuseumProposal(externalRecordId, sourceKind, payload, tx);
    });
  if (sourceKind === "airtable") {
    const legacy = await client.museumImportProposal.findMany({
      where: { externalRecordId, sourceKind: "legacy-export", status: "pending" },
      select: { id: true }
    });
    await client.reconciliationIssue.updateMany({
      where: {
        entityType: "MuseumImportProposal",
        entityId: { in: legacy.map((p) => p.id) },
        status: "open"
      },
      data: { status: "resolved", resolvedAt: new Date(), resolutionAction: "superseded_by_source" }
    });
    await client.museumImportProposal.updateMany({
      where: { id: { in: legacy.map((p) => p.id) } },
      data: { status: "superseded" }
    });
  }
  const latest = await client.museumImportProposal.findFirst({
    where: { externalRecordId, sourceKind },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });
  if (
    latest &&
    proposalSignature(latest.payload === null ? null : museumPlacementSchema.parse(latest.payload)) ===
      proposalSignature(payload)
  )
    return false;
  // Include the predecessor so A -> B -> A creates a fresh reviewable event.
  const fingerprint = createHash("sha256")
    .update(proposalSignature(payload) + (latest?.id || ""))
    .digest("hex");
  const key = { externalRecordId, sourceKind, fingerprint };
  const superseded = await client.museumImportProposal.findMany({
    where: { externalRecordId, sourceKind, status: "pending" },
    select: { id: true }
  });
  await client.reconciliationIssue.updateMany({
    where: {
      entityType: "MuseumImportProposal",
      entityId: { in: superseded.map((p) => p.id) },
      status: "open"
    },
    data: { status: "resolved", resolvedAt: new Date(), resolutionAction: "superseded_by_source" }
  });
  await client.museumImportProposal.updateMany({
    where: { externalRecordId, sourceKind, status: "pending" },
    data: { status: "superseded" }
  });
  const proposal = await client.museumImportProposal.create({
    data: { ...key, payload: payload === null ? Prisma.JsonNull : payload }
  });
  const source = await client.externalRecord.findUnique({
    where: { id: externalRecordId },
    select: { entityId: true, entityType: true }
  });
  if (source?.entityId && source.entityType === "Saint") {
    const accepted = await client.saintMuseumSection.findMany({
      where: { saintId: source.entityId, status: "published" },
      include: { museumSection: true, exhibitGroup: true }
    });
    const primary = accepted.find((a) => a.assignmentType === "primary");
    if (primary) {
      const reviewed = museumPlacementSchema.parse({
        section: primary.museumSection.name,
        alternatives: accepted
          .filter((a) => a.assignmentType === "alternative")
          .map((a) => a.museumSection.name),
        tier: primary.tier,
        confidence: primary.confidence,
        rationale: primary.rationale || "",
        note: primary.internalPlacementNote || "",
        group: primary.exhibitGroup?.label || ""
      });
      if (proposalSignature(reviewed) !== proposalSignature(payload))
        await client.reconciliationIssue.create({
          data: {
            issueType: "museum_source_conflict",
            severity: "warning",
            entityType: "MuseumImportProposal",
            entityId: proposal.id,
            message:
              "Imported museum proposal differs from an accepted placement. Review the saint in Museum placement review."
          }
        });
    }
  }
  return true;
}

export async function stageMuseumImports(dryRun = false) {
  const [records, saints, mirrors, previousProposals, assignments] = await Promise.all([
    db.externalRecord.findMany({
      where: { sourceType: "airtable", entityType: "Saint" },
      select: { id: true, externalId: true, entityId: true }
    }),
    db.saint.findMany({ where: { status: { not: "archived" } }, select: { id: true } }),
    db.airtableMirrorRecord.findMany({
      where: { tableIdOrName: "Saints" },
      select: { baseId: true, tableIdOrName: true, recordId: true, rawFieldsJson: true }
    }),
    db.museumImportProposal.findMany({
      where: { sourceKind: "airtable" },
      distinct: ["externalRecordId"],
      select: { externalRecordId: true }
    }),
    db.saintMuseumSection.findMany({
      where: { status: { not: "archived" }, externalRecordId: { not: null } },
      distinct: ["externalRecordId"],
      select: { externalRecordId: true }
    })
  ]);
  const ids = new Set(saints.map((s) => s.id));
  const byExternal = new Map(records.map((r) => [r.externalId, r]));
  const seen = new Set<string>();
  const hasPrevious = new Set([...previousProposals, ...assignments].map((p) => p.externalRecordId));
  const unresolved: Array<{ recordId: string; name: string; reason: string }> = [];
  const plans: Array<{ externalRecordId: string; sourceKind: string; payload: MuseumPlacementInput | null }> =
    [];
  for (const mirror of mirrors) {
    const externalId = [mirror.baseId, mirror.tableIdOrName, mirror.recordId].join(":");
    const record = byExternal.get(externalId);
    const fields = (mirror.rawFieldsJson ?? {}) as Record<string, unknown>;
    const payload = museumFields(fields);
    // A mirror with no museum fields and no planning history may predate the exports.
    // Once a source has planning history, omitted fields are a clearing signal.
    if (payload || fields["Primary Museum Section"] || (record && hasPrevious.has(record.id))) seen.add(externalId);
    if (!record?.entityId || !ids.has(record.entityId)) {
      if (payload || fields["Primary Museum Section"])
        unresolved.push({
          recordId: mirror.recordId,
          name: String(fields.Name || mirror.recordId),
          reason: "Mirror has no active CMS saint"
        });
      continue;
    }
    if (!payload && fields["Primary Museum Section"]) {
      unresolved.push({
        recordId: mirror.recordId,
        name: String(fields.Name || mirror.recordId),
        reason: "Invalid museum field values"
      });
      continue;
    }
    if (payload || hasPrevious.has(record.id))
      plans.push({ externalRecordId: record.id, sourceKind: "airtable", payload });
  }
  for (const row of getMuseumProposalData().placements) {
    const resolved = resolveSnapshotIdentity(row.id, records, ids);
    if (!resolved.record) {
      unresolved.push({ recordId: row.id, name: row.name, reason: resolved.reason });
      continue;
    }
    if (seen.has(resolved.record.externalId)) continue;
    plans.push({
      externalRecordId: resolved.record.id,
      sourceKind: "legacy-export",
      payload: {
        section: row.section,
        alternatives: row.alternatives,
        tier: row.tier.toLowerCase() as MuseumPlacementInput["tier"],
        confidence: row.confidence.toLowerCase() as MuseumPlacementInput["confidence"],
        rationale: row.rationale,
        note: row.note,
        group: row.curatorialFamily
      }
    });
  }
  let staged = 0;
  if (!dryRun)
    for (const plan of plans) {
      await db.$transaction(async (tx) => {
        await tx.$queryRaw(
          Prisma.sql`SELECT id FROM "ExternalRecord" WHERE id = ${plan.externalRecordId} FOR UPDATE`
        );
        if (await recordMuseumProposal(plan.externalRecordId, plan.sourceKind, plan.payload, tx)) staged++;
      });
    }
  return { candidates: plans.length, staged, unresolved };
}
