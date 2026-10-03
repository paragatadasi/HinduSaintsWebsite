import type { Prisma } from "@/lib/generated/prisma/client";

export function importedDraftSaintId(record: { entityId: string | null; rawPayloadJson: unknown }) {
  const payload = record.rawPayloadJson && typeof record.rawPayloadJson === "object" && !Array.isArray(record.rawPayloadJson)
    ? record.rawPayloadJson as Record<string, unknown> : {};
  // A merge can repoint the external link to an established saint. Retain the
  // original creation identity instead of presenting that saint for cleanup.
  return typeof payload.createdSaintId === "string" ? payload.createdSaintId : record.entityId;
}

export function getAirtableDraftReviewEvidence(rawSummary: unknown) {
  const summary = rawSummary && typeof rawSummary === "object" && !Array.isArray(rawSummary)
    ? rawSummary as Record<string, unknown> : {};
  const repairSlugs = Array.isArray(summary.slugRepairs)
    ? summary.slugRepairs.flatMap(item => item && typeof item === "object"
      && typeof item.resolvedSlug === "string" ? [item.resolvedSlug] : []) : [];
  return { tracked: summary.draftTrackingVersion === 1, repairSlugs };
}

export function airtableImportedDraftRecordWhere(job?: {
  id: string; createdAt: Date; startedAt: Date | null; completedAt: Date | null; rawSummary: unknown;
}): Prisma.ExternalRecordWhereInput {
  const provenance: Prisma.ExternalRecordWhereInput = {
    sourceType: "airtable", entityType: "Saint", entityId: { not: null },
    rawPayloadJson: { path: ["importedBy"], equals: "airtable_saints_cms_import" }
  };
  if (!job) return provenance;
  const { tracked } = getAirtableDraftReviewEvidence(job.rawSummary);
  return { AND: [provenance, tracked
    ? { rawPayloadJson: { path: ["importJobId"], equals: job.id } }
    : { importedAt: { gte: job.startedAt ?? job.createdAt,
      ...(job.completedAt ? { lte: job.completedAt } : {}) } }
  ] };
}
