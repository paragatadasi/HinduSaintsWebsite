import type { AirtableImportJob } from "@/lib/generated/prisma/client";

export type AirtableImportSummaryDetails = {
  collisions: Array<{
    recordId: string;
    airtableName?: string;
    existingSaintId?: string;
    existingSaintSlug?: string;
    existingSaintName?: string;
    reason: "slug_collision" | "name_collision";
    message: string;
  }>;
  unresolvedGuruRelationships: Array<{
    discipleRecordId: string;
    discipleName?: string;
    discipleSaintSlug?: string;
    discipleSaintName?: string;
    guruRecordId: string;
    guruName?: string;
    guruSaintSlug?: string;
    guruSaintName?: string;
    reason: "unmapped_disciple" | "unmapped_guru";
    message: string;
  }>;
  selfSkippedGuruRelationships: Array<{
    discipleRecordId: string;
    discipleName?: string;
    guruRecordId: string;
    guruName?: string;
    saintSlug?: string;
    saintName?: string;
    message: string;
  }>;
  errors: Array<{
    recordId: string;
    airtableName?: string;
    discipleRecordId?: string;
    discipleName?: string;
    guruRecordId?: string;
    guruName?: string;
    message: string;
  }>;
};

export function serializeAirtableImportJob(job: AirtableImportJob) {
  return {
    id: job.id,
    mode: job.mode,
    status: job.status,
    sourceName: job.sourceName,
    mirrorRowsChecked: job.mirrorRowsChecked,
    existingCmsSaintsSkipped: job.existingCmsSaintsSkipped,
    newDraftSaintsCreated: job.newDraftSaintsCreated,
    slugNameCollisionsSkipped: job.slugNameCollisionsSkipped,
    guruRelationshipsCreated: job.guruRelationshipsCreated,
    guruRelationshipsExisting: job.guruRelationshipsExisting,
    guruRelationshipsUnresolved: job.guruRelationshipsUnresolved,
    skippedSelfRelationships: job.skippedSelfRelationships,
    failedRows: job.failedRows,
    message: job.message,
    error: job.error,
    rawSummary: normalizeAirtableSummaryDetails(job.rawSummary),
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString()
  };
}

export function normalizeAirtableSummaryDetails(rawSummary: unknown): AirtableImportSummaryDetails {
  const summary = asRecord(rawSummary);
  return {
    collisions: arrayOfRecords(summary?.collisions).map((item) => ({
      recordId: getString(item.recordId) ?? "",
      airtableName: getString(item.airtableName),
      existingSaintId: getString(item.existingSaintId),
      existingSaintSlug: getString(item.existingSaintSlug),
      existingSaintName: getString(item.existingSaintName),
      reason: getCollisionReason(item.reason),
      message: getString(item.message) ?? "Needs review"
    })).filter((item) => item.recordId),
    unresolvedGuruRelationships: arrayOfRecords(summary?.unresolvedGuruRelationships).map((item) => ({
      discipleRecordId: getString(item.discipleRecordId) ?? "",
      discipleName: getString(item.discipleName),
      discipleSaintSlug: getString(item.discipleSaintSlug),
      discipleSaintName: getString(item.discipleSaintName),
      guruRecordId: getString(item.guruRecordId) ?? "",
      guruName: getString(item.guruName),
      guruSaintSlug: getString(item.guruSaintSlug),
      guruSaintName: getString(item.guruSaintName),
      reason: getGuruIssueReason(item.reason),
      message: getString(item.message) ?? "Not linked"
    })).filter((item) => item.discipleRecordId && item.guruRecordId),
    selfSkippedGuruRelationships: arrayOfRecords(summary?.selfSkippedGuruRelationships).map((item) => ({
      discipleRecordId: getString(item.discipleRecordId) ?? "",
      discipleName: getString(item.discipleName),
      guruRecordId: getString(item.guruRecordId) ?? "",
      guruName: getString(item.guruName),
      saintSlug: getString(item.saintSlug),
      saintName: getString(item.saintName),
      message: getString(item.message) ?? "Same saint on both sides"
    })).filter((item) => item.discipleRecordId && item.guruRecordId),
    errors: normalizeErrors(summary?.errors)
  };
}

function normalizeErrors(value: unknown): AirtableImportSummaryDetails["errors"] {
  return (Array.isArray(value) ? value : []).map((item) => {
    if (typeof item === "string") {
      const [recordId, ...messageParts] = item.split(":");
      return {
        recordId: recordId.trim(),
        message: messageParts.join(":").trim() || "Import failed"
      };
    }

    const record = asRecord(item);
    return {
      recordId: getString(record?.recordId) ?? "",
      airtableName: getString(record?.airtableName),
      discipleRecordId: getString(record?.discipleRecordId),
      discipleName: getString(record?.discipleName),
      guruRecordId: getString(record?.guruRecordId),
      guruName: getString(record?.guruName),
      message: getString(record?.message) ?? "Import failed"
    };
  }).filter((item) => item.recordId);
}

function arrayOfRecords(value: unknown) {
  return Array.isArray(value) ? value.map(asRecord).filter((item): item is Record<string, unknown> => Boolean(item)) : [];
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getCollisionReason(value: unknown): AirtableImportSummaryDetails["collisions"][number]["reason"] {
  return value === "name_collision" ? "name_collision" : "slug_collision";
}

function getGuruIssueReason(value: unknown): AirtableImportSummaryDetails["unresolvedGuruRelationships"][number]["reason"] {
  return value === "unmapped_guru" ? "unmapped_guru" : "unmapped_disciple";
}
