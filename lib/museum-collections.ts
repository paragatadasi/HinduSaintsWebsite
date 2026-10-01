import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { collectionObservationSchema, stableCollectionJson } from "@/lib/museum-collection-domain";
import type { MuseumCollectionCardItem } from "@/lib/museum-collection-domain";

// Private reader: callers enforce access_museum. Never use in public page data.
export async function readSaintCollectionItems(client: Prisma.TransactionClient = db) {
  const links = await client.museumItemSaint.findMany({
    where: { saint: { status: { not: "archived" } },
      item: { status: { not: "archived" }, catalogMuseum: { archivedAt: null } } },
    include: { item: { include: {
      catalogMuseum: { select: { id: true, name: true, slug: true } },
      placements: { where: { endedAt: null }, include: { location: { include: { museum: true } } } }
    } } },
    orderBy: [{ saintId: "asc" }, { itemId: "asc" }]
  });
  const result = new Map<string, MuseumCollectionCardItem[]>();
  for (const link of links) {
    const item = link.item;
    const current = item.placements[0]?.location;
    const location = current && !current.archivedAt && !current.museum.archivedAt ? {
      id: current.id, museumId: current.museumId, museumName: current.museum.name,
      museumSlug: current.museum.slug, code: current.code, label: current.label,
      kind: current.kind, room: current.room
    } : null;
    const cards = result.get(link.saintId) || [];
    cards.push({ id: item.id, label: item.label, inventoryCode: item.inventoryCode,
      reviewStatus: item.status === "verified" ? "verified" : "needs_review",
      catalogMuseum: item.catalogMuseum, location });
    result.set(link.saintId, cards);
  }
  return result;
}

// Ingestion-only: observations never create inventory or overwrite reviewed placements.
export async function stageCollectionObservation(input: {
  museumId: string; sourceKey: string; raw: Prisma.InputJsonValue; normalized: unknown;
}) {
  const normalized = collectionObservationSchema.parse(input.normalized);
  if (!input.sourceKey.trim() || input.sourceKey.length > 1000) throw new Error("A stable source identity is required.");
  normalized.saintIds = [...new Set(normalized.saintIds)].sort();
  const content = stableCollectionJson({ raw: input.raw, normalized });
  return db.$transaction(async tx => {
    await tx.$queryRaw(Prisma.sql`SELECT true AS locked FROM pg_advisory_xact_lock(hashtextextended(${"collection:" + input.museumId + ":" + input.sourceKey}, 0))`);
    const museum = await tx.museum.findFirst({ where: { id: input.museumId, archivedAt: null } });
    if (!museum) throw new Error("Choose an active museum.");
    const saints = await tx.saint.count({ where: { id: { in: normalized.saintIds }, status: { not: "archived" } } });
    if (saints !== normalized.saintIds.length) throw new Error("Resolve the saint identities before staging this item.");
    const latest = await tx.museumCollectionImport.findFirst({
      where: { museumId: input.museumId, sourceKey: input.sourceKey },
      orderBy: [{ observedAt: "desc" }, { id: "desc" }]
    });
    if (latest && stableCollectionJson({ raw: latest.rawJson, normalized: latest.normalizedJson }) === content) return latest;
    const fingerprint = createHash("sha256").update((latest?.id || "") + ":" + content).digest("hex");
    return tx.museumCollectionImport.create({ data: {
      museumId: input.museumId, sourceKey: input.sourceKey, fingerprint,
      rawJson: input.raw, normalizedJson: normalized
    } });
  });
}
