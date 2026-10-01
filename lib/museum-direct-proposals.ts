import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { getMuseumProposalData } from "@/lib/museum-proposals";
import { proposalFamilyKey } from "@/lib/museum-family-move-domain";
import {
  museumFields,
  museumPlacementSchema,
  proposalSignature,
  resolveSnapshotIdentity,
  type MuseumPlacementInput,
} from "@/lib/museum-domain";

type DirectProposal = {
  id: string;
  externalRecordId: string;
  externalId: string;
  entityId: string;
  sourceKind: string;
  payload: MuseumPlacementInput | null;
  createdAt: null;
  status: string;
};
// Read-only projection: proposals and source discrepancies need no staging write.
export async function getDirectMuseumProposals(
  client: Prisma.TransactionClient = db,
) {
  const [records, saints, snapshots, mirrors, familyMoves] = await Promise.all([
    client.externalRecord.findMany({
      where: { sourceType: "airtable", entityType: "Saint" },
      select: { id: true, externalId: true, entityId: true },
    }),
    client.saint.findMany({
      where: { status: { not: "archived" } },
      select: { id: true },
    }),
    client.museumImportProposal.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        externalRecordId: true,
        sourceKind: true,
        payload: true,
        status: true,
      },
    }),
    client.airtableMirrorRecord.findMany({
      where: { tableIdOrName: "Saints" },
      select: {
        baseId: true,
        tableIdOrName: true,
        recordId: true,
        rawFieldsJson: true,
      },
    }),
    client.museumFamilyProposalMove.findMany(),
  ]);
  const ids = new Set(saints.map((s) => s.id));
  const linkedSaintByRecordId = new Map<string, string>();
  const unresolved: Array<{ recordId: string; name: string; reason: string }> =
    [];
  const proposals: DirectProposal[] = [];
  const supersededSnapshotIds = new Set<string>();
  const seen = new Set<string>();
  for (const row of getMuseumProposalData().placements) {
    const resolved = resolveSnapshotIdentity(row.id, records, ids);
    if (!resolved.record) {
      unresolved.push({
        recordId: row.id,
        name: row.name,
        reason: resolved.reason,
      });
      continue;
    }
    const source = resolved.record;
    linkedSaintByRecordId.set(row.id, source.entityId!);
    if (familyMoves.some(move => move.familyKey === proposalFamilyKey(row))) {
      for (const snapshot of snapshots) if (snapshot.externalRecordId === source.id && snapshot.sourceKind === "legacy-export" && snapshot.status === "pending")
        supersededSnapshotIds.add(snapshot.id);
      continue;
    }
    const payload = museumPlacementSchema.parse({
      section: row.section,
      alternatives: row.alternatives,
      tier: row.tier.toLowerCase(),
      confidence: row.confidence.toLowerCase(),
      rationale: row.rationale,
      note: row.note,
      group: row.curatorialFamily,
    });
    const signature = proposalSignature(payload);
    const id =
      "existing:" +
      createHash("sha256")
        .update(source.id + ":" + signature)
        .digest("hex");
    if (seen.has(id)) continue;
    seen.add(id);
    if (
      snapshots.some(
        (p) =>
          p.externalRecordId === source.id &&
          p.sourceKind === "legacy-export" &&
          proposalSignature(
            p.payload === null ? null : museumPlacementSchema.parse(p.payload),
          ) === signature,
      )
    )
      continue;
    proposals.push({
      id,
      externalRecordId: source.id,
      externalId: source.externalId,
      entityId: source.entityId!,
      sourceKind: "legacy-export",
      payload,
      createdAt: null,
      status: "pending",
    });
  }
  for (const move of familyMoves) {
    const prefix = `family-move:${move.familyKey}:`;
    const sourceKind = prefix + move.version;
    for (const snapshot of snapshots) {
      if (snapshot.status === "pending" && snapshot.sourceKind.startsWith(prefix) && snapshot.sourceKind !== sourceKind)
        supersededSnapshotIds.add(snapshot.id);
    }
    for (const row of getMuseumProposalData().placements.filter(row => proposalFamilyKey(row) === move.familyKey)) {
      const resolved = resolveSnapshotIdentity(row.id, records, ids);
      if (!resolved.record) continue;
      const source = resolved.record;
      const payload = museumPlacementSchema.parse({
        section: move.section, alternatives: row.alternatives, tier: row.tier.toLowerCase(),
        confidence: row.confidence.toLowerCase(), rationale: row.rationale, note: row.note,
        group: row.curatorialFamily
      });
      const signature = proposalSignature(payload);
      if (snapshots.some(p => p.externalRecordId === source.id && p.sourceKind === sourceKind &&
        proposalSignature(p.payload === null ? null : museumPlacementSchema.parse(p.payload)) === signature)) continue;
      const id = "source:" + createHash("sha256").update(source.id + ":" + sourceKind + ":" + signature).digest("hex");
      if (seen.has(id)) continue;
      seen.add(id);
      proposals.push({ id, externalRecordId: source.id, externalId: source.externalId,
        entityId: source.entityId!, sourceKind, payload, createdAt: null, status: "pending" });
    }
  }
  for (const mirror of mirrors) {
    const externalId = [
      mirror.baseId,
      mirror.tableIdOrName,
      mirror.recordId,
    ].join(":");
    const source = records.find((r) => r.externalId === externalId);
    if (!source?.entityId || !ids.has(source.entityId)) continue;
    const history = snapshots.filter(
      (p) => p.externalRecordId === source.id && p.sourceKind === "airtable",
    );
    const latest = history[0];
    const fields = (mirror.rawFieldsJson ?? {}) as Record<string, unknown>;
    const payload = museumFields(fields);
    // Missing fields on a pre-planning mirror are not a deletion instruction.
    if (!payload && (!latest || fields["Primary Museum Section"])) continue;
    const signature = proposalSignature(payload);
    if (
      latest &&
      signature ===
        proposalSignature(
          latest.payload === null
            ? null
            : museumPlacementSchema.parse(latest.payload),
        )
    )
      continue;
    for (const old of history.filter((p) => p.status === "pending"))
      supersededSnapshotIds.add(old.id);
    const id =
      "source:" +
      createHash("sha256")
        .update(source.id + ":" + signature + ":" + (latest?.id || ""))
        .digest("hex");
    proposals.push({
      id,
      externalRecordId: source.id,
      externalId,
      entityId: source.entityId,
      sourceKind: "airtable",
      payload,
      createdAt: null,
      status: "pending",
    });
  }
  return {
    proposals,
    linkedSaintByRecordId,
    unresolved,
    supersededSnapshotIds,
  };
}
