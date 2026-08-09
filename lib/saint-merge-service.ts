import { Prisma } from "@/lib/generated/prisma/client";

type Transaction = Prisma.TransactionClient;
type MergeRecordSummary = { id: string; slug: string; displayName: string };

export type SaintMergeExecution = {
  actorId: string;
  candidateId: string;
  fieldChoices: Record<string, string>;
  source: MergeRecordSummary;
  target: MergeRecordSummary;
  scalarData: Prisma.SaintUncheckedUpdateInput;
};

export async function mergeSaintRecords(tx: Transaction, execution: SaintMergeExecution) {
  const { actorId, candidateId, fieldChoices, source, target } = execution;
  const summary: Record<string, number> = {};
  const count = (key: string, amount = 1) => { summary[key] = (summary[key] ?? 0) + amount; };

  await tx.saint.update({
    where: { id: target.id },
    data: {
      ...execution.scalarData,
      updatedById: actorId,
      version: { increment: 1 }
    }
  });

  count("retiredSlugRedirects", await moveSlugRedirects(tx, source, target));
  count("aliases", await moveAliases(tx, source.id, target.id));
  count("biographies", await moveBiographies(tx, source.id, target.id));
  count("galleryImages", await moveGalleryImages(tx, source.id, target.id));
  count("places", await movePlaces(tx, source.id, target.id));
  count("traditions", await moveTraditions(tx, source.id, target.id));
  count("lineageEntries", await moveLineageEntries(tx, source.id, target.id));
  count("familyMemberships", await moveFamilyMemberships(tx, source.id, target.id));
  count("museumAssignments", await moveMuseumAssignments(tx, source.id, target.id));
  count("instagramMatches", await moveInstagramMatches(tx, source.id, target.id));
  count("saintRelationships", await moveSaintRelationships(tx, source.id, target.id));

  const foundedTraditions = await tx.tradition.updateMany({ where: { founderSaintId: source.id }, data: { founderSaintId: target.id } });
  count("foundedTraditions", foundedTraditions.count);
  const quoteConfigs = await tx.homePageConfig.updateMany({ where: { quoteSaintId: source.id }, data: { quoteSaintId: target.id } });
  count("homepageQuotes", quoteConfigs.count);
  count("homepageFeatures", await moveHomepageFeatureIds(tx, source.id, target.id));

  const claims = await tx.instagramDerivedClaim.updateMany({ where: { appliedSaintId: source.id }, data: { appliedSaintId: target.id } });
  count("instagramClaims", claims.count);
  const targetedClaims = await tx.instagramDerivedClaim.updateMany({
    where: { targetEntityId: source.id, targetEntityType: { in: ["Saint", "saint"] } },
    data: { targetEntityId: target.id }
  });
  count("targetedInstagramClaims", targetedClaims.count);

  count("contentSources", (await tx.contentSource.updateMany({
    where: { entityType: "Saint", entityId: source.id },
    data: { entityId: target.id }
  })).count);
  count("externalRecords", (await tx.externalRecord.updateMany({
    where: { entityType: "Saint", entityId: source.id },
    data: { entityId: target.id }
  })).count);
  count("reconciliationIssues", (await tx.reconciliationIssue.updateMany({
    where: { entityType: "Saint", entityId: source.id },
    data: { entityId: target.id }
  })).count);
  count("assignments", (await tx.contentAssignment.updateMany({
    where: { contentType: "saint", contentId: source.id },
    data: { contentId: target.id }
  })).count);
  count("feedback", (await tx.feedbackSubmission.updateMany({
    where: { entityType: "saint", entityId: source.id },
    data: { entityId: target.id, entitySlug: target.slug }
  })).count);

  const ephemeralWhere = { entityType: "saint" as const, entityId: { in: [source.id, target.id] } };
  count("clearedEditorialDrafts", (await tx.adminEditorialDraft.deleteMany({ where: ephemeralWhere })).count);
  count("clearedEditConflicts", (await tx.adminEditConflict.deleteMany({ where: ephemeralWhere })).count);
  count("clearedPresence", (await tx.adminPresence.deleteMany({ where: ephemeralWhere })).count);

  const mergeNote = `Merged ${source.displayName} (${source.slug}) into ${target.displayName} (${target.slug}).`;
  const relatedCandidates = await tx.duplicateCandidate.findMany({
    where: {
      entityType: "Saint",
      OR: [
        { entityId: source.id },
        { candidateEntityId: source.id }
      ]
    },
    select: { id: true, resolutionNotes: true }
  });
  for (const duplicate of relatedCandidates) {
    await tx.duplicateCandidate.update({
      where: { id: duplicate.id },
      data: {
        status: "resolved",
        resolvedAt: new Date(),
        reviewedById: actorId,
        resolutionNotes: combineNotes(duplicate.resolutionNotes, mergeNote)
      }
    });
  }
  count("duplicateCandidatesClosed", relatedCandidates.length);

  const hasInstagramContent = await tx.instagramItemSaint.count({ where: { saintId: target.id } });
  if (hasInstagramContent > 0) await tx.saint.update({ where: { id: target.id }, data: { hasInstagramContent: true } });

  await tx.saint.delete({ where: { id: source.id } });
  await tx.auditEvent.create({
    data: {
      userId: actorId,
      action: "merge_saints",
      entityType: "Saint",
      entityId: target.id,
      beforeJson: toInputJson({ source, target, candidateId, fieldChoices }),
      afterJson: toInputJson({
        survivor: target,
        retiredSlug: source.slug,
        transferred: summary
      })
    }
  });

  return summary;
}

async function moveSlugRedirects(tx: Transaction, source: MergeRecordSummary, target: MergeRecordSummary) {
  const moved = await tx.saintSlugRedirect.updateMany({ where: { saintId: source.id }, data: { saintId: target.id } });
  await tx.saintSlugRedirect.upsert({
    where: { slug: source.slug },
    create: { slug: source.slug, saintId: target.id },
    update: { saintId: target.id }
  });
  return moved.count + 1;
}

async function moveAliases(tx: Transaction, sourceId: string, targetId: string) {
  const [sourceRows, targetRows] = await Promise.all([
    tx.saintAlias.findMany({ where: { saintId: sourceId } }),
    tx.saintAlias.findMany({ where: { saintId: targetId } })
  ]);
  const targetByAlias = new Map(targetRows.map((row) => [normalize(row.alias), row]));
  for (const row of sourceRows) {
    const key = normalize(row.alias);
    const existing = targetByAlias.get(key);
    if (existing) {
      await tx.saintAlias.update({ where: { id: existing.id }, data: {
        aliasType: existing.aliasType === "other" ? row.aliasType : existing.aliasType,
        source: combineNotes(existing.source, row.source)
      } });
      await tx.saintAlias.delete({ where: { id: row.id } });
    }
    else {
      await tx.saintAlias.update({ where: { id: row.id }, data: { saintId: targetId } });
      targetByAlias.set(key, row);
    }
  }
  return sourceRows.length;
}

async function moveBiographies(tx: Transaction, sourceId: string, targetId: string) {
  const [sourceRows, targetRows] = await Promise.all([
    tx.biography.findMany({ where: { saintId: sourceId }, orderBy: { createdAt: "asc" } }),
    tx.biography.findMany({ where: { saintId: targetId } })
  ]);
  const targetBySlug = new Map(targetRows.map((row) => [row.slug, row]));
  const occupied = new Set(targetRows.map((row) => row.slug));
  for (const row of sourceRows) {
    const existing = targetBySlug.get(row.slug);
    if (existing?.title === row.title && existing.bodyMarkdown === row.bodyMarkdown) {
      await tx.biography.update({ where: { id: existing.id }, data: {
        status: preferredContentStatus(existing.status, row.status),
        authorOrEditor: existing.authorOrEditor ?? row.authorOrEditor,
        publishedAt: existing.publishedAt ?? row.publishedAt,
        lastReviewedAt: latestDate(existing.lastReviewedAt, row.lastReviewedAt)
      } });
      await tx.biography.delete({ where: { id: row.id } });
      continue;
    }
    let slug = row.slug;
    if (occupied.has(slug)) {
      let suffix = 2;
      const base = `${slug}-merged`;
      slug = base;
      while (occupied.has(slug)) { slug = `${base}-${suffix}`; suffix += 1; }
    }
    await tx.biography.update({ where: { id: row.id }, data: { saintId: targetId, slug } });
    occupied.add(slug);
  }
  return sourceRows.length;
}

async function moveGalleryImages(tx: Transaction, sourceId: string, targetId: string) {
  const [sourceRows, targetRows] = await Promise.all([
    tx.saintGalleryImage.findMany({ where: { saintId: sourceId } }),
    tx.saintGalleryImage.findMany({ where: { saintId: targetId } })
  ]);
  const targetByMedia = new Map(targetRows.map((row) => [row.mediaAssetId, row]));
  for (const row of sourceRows) {
    const existing = targetByMedia.get(row.mediaAssetId);
    if (existing) {
      await tx.saintGalleryImage.update({ where: { id: existing.id }, data: {
        publicVisible: existing.publicVisible || row.publicVisible,
        sortOrder: Math.min(existing.sortOrder, row.sortOrder)
      } });
      await tx.saintGalleryImage.delete({ where: { id: row.id } });
    }
    else {
      await tx.saintGalleryImage.update({ where: { id: row.id }, data: { saintId: targetId } });
      targetByMedia.set(row.mediaAssetId, row);
    }
  }
  return sourceRows.length;
}

async function movePlaces(tx: Transaction, sourceId: string, targetId: string) {
  const [sourceRows, targetRows] = await Promise.all([
    tx.saintPlace.findMany({ where: { saintId: sourceId } }),
    tx.saintPlace.findMany({ where: { saintId: targetId } })
  ]);
  const targetByKey = new Map(targetRows.map((row) => [`${row.placeId}:${row.placeType}`, row]));
  for (const row of sourceRows) {
    const existing = targetByKey.get(`${row.placeId}:${row.placeType}`);
    if (existing) {
      await tx.saintPlace.update({ where: { id: existing.id }, data: {
        notes: combineNotes(existing.notes, row.notes),
        routeOrder: existing.routeOrder ?? row.routeOrder,
        routeLabel: existing.routeLabel ?? row.routeLabel,
        routeConfidence: existing.routeConfidence ?? row.routeConfidence
      } });
      await tx.saintPlace.delete({ where: { id: row.id } });
    } else {
      await tx.saintPlace.update({ where: { id: row.id }, data: { saintId: targetId } });
      targetByKey.set(`${row.placeId}:${row.placeType}`, row);
    }
  }
  return sourceRows.length;
}

async function moveTraditions(tx: Transaction, sourceId: string, targetId: string) {
  const [sourceRows, targetRows] = await Promise.all([
    tx.saintTradition.findMany({ where: { saintId: sourceId } }),
    tx.saintTradition.findMany({ where: { saintId: targetId } })
  ]);
  const targetByTradition = new Map(targetRows.map((row) => [row.traditionId, row]));
  for (const row of sourceRows) {
    const existing = targetByTradition.get(row.traditionId);
    if (existing) {
      await tx.saintTradition.update({ where: { id: existing.id }, data: {
        isPrimary: existing.isPrimary || row.isPrimary,
        notes: combineNotes(existing.notes, row.notes)
      } });
      await tx.saintTradition.delete({ where: { id: row.id } });
    } else await tx.saintTradition.update({ where: { id: row.id }, data: { saintId: targetId } });
  }
  return sourceRows.length;
}

async function moveLineageEntries(tx: Transaction, sourceId: string, targetId: string) {
  await tx.traditionLineageSaint.updateMany({ where: { parentSaintId: sourceId, saintId: targetId }, data: { parentSaintId: null } });
  await tx.traditionLineageSaint.updateMany({ where: { parentSaintId: sourceId, saintId: { not: targetId } }, data: { parentSaintId: targetId } });
  const [sourceRows, targetRows] = await Promise.all([
    tx.traditionLineageSaint.findMany({ where: { saintId: sourceId } }),
    tx.traditionLineageSaint.findMany({ where: { saintId: targetId } })
  ]);
  const targetByTradition = new Map(targetRows.map((row) => [row.traditionId, row]));
  for (const row of sourceRows) {
    const existing = targetByTradition.get(row.traditionId);
    if (existing) {
      await tx.traditionLineageSaint.update({ where: { id: existing.id }, data: {
        sortOrder: Math.min(existing.sortOrder, row.sortOrder),
        roleLabel: existing.roleLabel ?? row.roleLabel,
        parentSaintId: existing.parentSaintId ?? (row.parentSaintId === sourceId || row.parentSaintId === targetId ? null : row.parentSaintId)
      } });
      await tx.traditionLineageSaint.delete({ where: { id: row.id } });
    } else await tx.traditionLineageSaint.update({ where: { id: row.id }, data: {
      saintId: targetId,
      parentSaintId: row.parentSaintId === sourceId || row.parentSaintId === targetId ? null : row.parentSaintId
    } });
  }
  return sourceRows.length;
}

async function moveFamilyMemberships(tx: Transaction, sourceId: string, targetId: string) {
  const [sourceRows, targetRows] = await Promise.all([
    tx.saintFamilyMember.findMany({ where: { saintId: sourceId } }),
    tx.saintFamilyMember.findMany({ where: { saintId: targetId } })
  ]);
  const targetByFamily = new Map(targetRows.map((row) => [row.familyId, row]));
  for (const row of sourceRows) {
    const existing = targetByFamily.get(row.familyId);
    if (existing) {
      await tx.saintFamilyMember.update({ where: { id: existing.id }, data: {
        role: preferredFamilyRole(existing.role, row.role),
        tier: existing.tier ?? row.tier,
        sortOrder: Math.min(existing.sortOrder, row.sortOrder),
        notes: combineNotes(existing.notes, row.notes),
        externalRecordId: existing.externalRecordId ?? row.externalRecordId
      } });
      await tx.saintFamilyMember.delete({ where: { id: row.id } });
    } else await tx.saintFamilyMember.update({ where: { id: row.id }, data: { saintId: targetId } });
  }
  return sourceRows.length;
}

async function moveMuseumAssignments(tx: Transaction, sourceId: string, targetId: string) {
  const [sourceRows, targetRows] = await Promise.all([
    tx.saintMuseumSection.findMany({ where: { saintId: sourceId } }),
    tx.saintMuseumSection.findMany({ where: { saintId: targetId } })
  ]);
  const targetByKey = new Map(targetRows.map((row) => [`${row.museumSectionId}:${row.assignmentType}`, row]));
  for (const row of sourceRows) {
    const existing = targetByKey.get(`${row.museumSectionId}:${row.assignmentType}`);
    if (existing) {
      await tx.saintMuseumSection.update({ where: { id: existing.id }, data: {
        tier: preferredMuseumTier(existing.tier, row.tier),
        confidence: preferredConfidence(existing.confidence, row.confidence),
        status: preferredContentStatus(existing.status, row.status),
        rationale: combineNotes(existing.rationale, row.rationale),
        internalPlacementNote: combineNotes(existing.internalPlacementNote, row.internalPlacementNote),
        externalRecordId: existing.externalRecordId ?? row.externalRecordId
      } });
      await tx.saintMuseumSection.delete({ where: { id: row.id } });
    } else await tx.saintMuseumSection.update({ where: { id: row.id }, data: { saintId: targetId } });
  }
  return sourceRows.length;
}

async function moveInstagramMatches(tx: Transaction, sourceId: string, targetId: string) {
  const [sourceRows, targetRows] = await Promise.all([
    tx.instagramItemSaint.findMany({ where: { saintId: sourceId } }),
    tx.instagramItemSaint.findMany({ where: { saintId: targetId } })
  ]);
  const targetByItem = new Map(targetRows.map((row) => [row.instagramItemId, row]));
  for (const row of sourceRows) {
    const existing = targetByItem.get(row.instagramItemId);
    if (existing) {
      await tx.instagramItemSaint.update({ where: { id: existing.id }, data: {
        isPrimary: existing.isPrimary || row.isPrimary,
        matchStatus: preferredMatchStatus(existing.matchStatus, row.matchStatus),
        matchConfidence: preferredConfidence(existing.matchConfidence, row.matchConfidence),
        reviewedById: existing.reviewedById ?? row.reviewedById,
        reviewedAt: existing.reviewedAt ?? row.reviewedAt,
        notes: combineNotes(existing.notes, row.notes)
      } });
      await tx.instagramItemSaint.delete({ where: { id: row.id } });
    } else await tx.instagramItemSaint.update({ where: { id: row.id }, data: { saintId: targetId } });
  }
  return sourceRows.length;
}

async function moveSaintRelationships(tx: Transaction, sourceId: string, targetId: string) {
  const sourceRows = await tx.saintRelationship.findMany({
    where: { OR: [{ fromSaintId: sourceId }, { toSaintId: sourceId }] },
    include: { relationshipSources: true }
  });
  for (const row of sourceRows) {
    const fromSaintId = row.fromSaintId === sourceId ? targetId : row.fromSaintId;
    const toSaintId = row.toSaintId === sourceId ? targetId : row.toSaintId;
    if (fromSaintId === toSaintId) {
      await tx.saintRelationship.delete({ where: { id: row.id } });
      continue;
    }
    const existing = await tx.saintRelationship.findFirst({
      where: { id: { not: row.id }, fromSaintId, toSaintId, relationshipType: row.relationshipType },
      include: { relationshipSources: true }
    });
    if (!existing) {
      await tx.saintRelationship.update({ where: { id: row.id }, data: { fromSaintId, toSaintId } });
      continue;
    }
    const sourceIds = new Set(existing.relationshipSources.map((item) => item.sourceId).filter(Boolean));
    const externalIds = new Set(existing.relationshipSources.map((item) => item.externalRecordId).filter(Boolean));
    for (const evidence of row.relationshipSources) {
      if ((evidence.sourceId && sourceIds.has(evidence.sourceId)) || (evidence.externalRecordId && externalIds.has(evidence.externalRecordId))) {
        await tx.saintRelationshipSource.delete({ where: { id: evidence.id } });
      } else await tx.saintRelationshipSource.update({ where: { id: evidence.id }, data: { relationshipId: existing.id } });
    }
    await tx.saintRelationship.update({ where: { id: existing.id }, data: {
      status: preferredContentStatus(existing.status, row.status),
      evidenceStatus: preferredEvidenceStatus(existing.evidenceStatus, row.evidenceStatus),
      confidence: preferredConfidence(existing.confidence, row.confidence),
      publicVisible: existing.publicVisible || row.publicVisible,
      displayOrder: Math.min(existing.displayOrder, row.displayOrder),
      publicNote: existing.publicNote ?? row.publicNote,
      notes: combineNotes(existing.notes, row.notes),
      internalNotes: combineNotes(existing.internalNotes, row.internalNotes),
      sourceId: existing.sourceId ?? row.sourceId,
      externalRecordId: existing.externalRecordId ?? row.externalRecordId,
      importJobId: existing.importJobId ?? row.importJobId
    } });
    await tx.saintRelationship.delete({ where: { id: row.id } });
  }
  return sourceRows.length;
}

async function moveHomepageFeatureIds(tx: Transaction, sourceId: string, targetId: string) {
  const configs = await tx.homePageConfig.findMany({ where: { featuredSaintIds: { has: sourceId } }, select: { id: true, featuredSaintIds: true } });
  for (const config of configs) {
    const featuredSaintIds = Array.from(new Set(config.featuredSaintIds.map((id) => id === sourceId ? targetId : id)));
    await tx.homePageConfig.update({ where: { id: config.id }, data: { featuredSaintIds } });
  }
  return configs.length;
}

function preferredConfidence<T extends "low" | "medium" | "high">(left: T, right: T): T {
  const rank = { low: 0, medium: 1, high: 2 };
  return rank[right] > rank[left] ? right : left;
}

function preferredContentStatus<T extends "draft" | "needs_review" | "published" | "archived">(left: T, right: T): T {
  const rank = { archived: 0, draft: 1, needs_review: 2, published: 3 };
  return rank[right] > rank[left] ? right : left;
}

function preferredMatchStatus<T extends "imported" | "suggested" | "needs_review" | "matched" | "ignored" | "published">(left: T, right: T): T {
  const rank = { ignored: 0, imported: 1, suggested: 2, needs_review: 3, matched: 4, published: 5 };
  return rank[right] > rank[left] ? right : left;
}

function preferredEvidenceStatus<T extends "certain" | "probable" | "traditional" | "disputed" | "imported" | "uncategorized">(left: T, right: T): T {
  const rank = { uncategorized: 0, imported: 1, disputed: 2, traditional: 3, probable: 4, certain: 5 };
  return rank[right] > rank[left] ? right : left;
}

function preferredFamilyRole<T extends "head" | "subgroup_head" | "member" | "partner" | "incarnation" | "successor" | "associated">(left: T, right: T): T {
  const rank = { associated: 0, member: 1, partner: 2, successor: 3, incarnation: 4, subgroup_head: 5, head: 6 };
  return rank[right] > rank[left] ? right : left;
}

function preferredMuseumTier<T extends "featured" | "secondary" | "tertiary">(left: T, right: T): T {
  const rank = { tertiary: 0, secondary: 1, featured: 2 };
  return rank[right] > rank[left] ? right : left;
}

function latestDate(left: Date | null, right: Date | null) {
  if (!left) return right;
  if (!right) return left;
  return left > right ? left : right;
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase();
}

function combineNotes(left: string | null, right: string | null) {
  if (!left) return right;
  if (!right || left === right) return left;
  return `${left}\n\n${right}`;
}

function toInputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
