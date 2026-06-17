import { createHash } from "node:crypto";
import { Prisma, type Confidence, type InstagramType, type MatchStatus } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";
import { getInstagramShortcode, getInstagramTypeFromUrl } from "@/lib/instagram";
import { cacheInstagramMediaAssets } from "@/lib/instagram-cover-cache";
import { extractInstagramFirstPageDraft } from "@/lib/instagram-first-page-extraction";
import { parseInstagramFirstPageMetadata, type InstagramFirstPageMetadata } from "@/lib/instagram-metadata";
import { confidenceForNameMatch } from "@/lib/reconciliation";

export type RawInstagramRow = Record<string, unknown>;

export type InstagramIngestionMode = "full_refresh" | "incremental_refresh" | "repair_incomplete";

type InstagramImportRow = {
  sourceKey: string;
  instagramUrl: string;
  instagramShortcode?: string;
  type: InstagramType;
  captionText?: string;
  extractedSaintName?: string;
  firstPageText?: string;
  firstPageMetadata?: InstagramFirstPageMetadata;
  postedAt?: Date;
  thumbnailUrl?: string;
  raw: RawInstagramRow;
};

type SaintCandidate = {
  id: string;
  displayName: string;
  names: string[];
};

type IngestionJobOptions = {
  createdByEmail?: string | null;
  jobId?: string;
  limit?: number;
  sourceName?: string;
};

type IngestRowsOptions = {
  batchId?: string;
  dryRun?: boolean;
  jobId?: string;
  mode: InstagramIngestionMode;
  rows: RawInstagramRow[];
  skipExisting?: boolean;
  repairItemIds?: Set<string>;
};

export async function createInstagramRefreshJob({ createdByEmail, sourceName }: IngestionJobOptions = {}) {
  assertInstagramIngestionConfigured();
  const existingItemCount = await db.instagramItem.count();
  const mode: InstagramIngestionMode = existingItemCount === 0 ? "full_refresh" : "incremental_refresh";

  return db.instagramIngestionJob.create({
    data: {
      mode,
      status: "queued",
      sourceName: sourceName ?? getInstagramSourceName(),
      createdByEmail: createdByEmail ?? undefined,
      message: mode === "full_refresh"
        ? "Queued full Instagram import."
        : "Queued incremental Instagram refresh."
    }
  });
}

export async function createInstagramIncompleteRepairJob({ createdByEmail, sourceName }: IngestionJobOptions = {}) {
  assertInstagramIngestionConfigured();

  return db.instagramIngestionJob.create({
    data: {
      mode: "repair_incomplete",
      status: "queued",
      sourceName: sourceName ?? getInstagramSourceName(),
      createdByEmail: createdByEmail ?? undefined,
      message: "Queued repair for posts missing cached media or first-page extraction."
    }
  });
}

export async function runInstagramIngestionJob(jobId: string, { limit }: Pick<IngestionJobOptions, "limit"> = {}) {
  const job = await db.instagramIngestionJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("Instagram ingestion job was not found.");
  if (job.status === "running") return;

  await updateJob(jobId, {
    status: "running",
    startedAt: new Date(),
    message: "Connecting to Instagram."
  });

  try {
    if (job.mode === "repair_incomplete") {
      await runIncompleteRepairJob(jobId, limit);
    } else {
      await runRefreshJob(jobId, job.mode as InstagramIngestionMode, limit);
    }
  } catch (error) {
    await updateJob(jobId, {
      status: "failed",
      completedAt: new Date(),
      error: error instanceof Error ? error.message : "Instagram ingestion failed.",
      message: "Instagram ingestion failed."
    });
    throw error;
  }
}

export async function ingestInstagramRowsForCli({
  dryRun = false,
  limit,
  rows,
  sourceName = getInstagramSourceName()
}: {
  dryRun?: boolean;
  limit?: number;
  rows?: RawInstagramRow[];
  sourceName?: string;
}) {
  const rawRows = rows ?? await loadInstagramApiRows({ limit });
  const batch = dryRun
    ? undefined
    : await db.importBatch.create({
        data: {
          sourceType: "instagram",
          sourceName,
          status: "running",
          rawSummary: JSON.stringify({ rows: rawRows.length, source: rows ? "cli_rows" : "api" })
        }
      });

  const summary = await ingestInstagramRows({
    batchId: batch?.id,
    dryRun,
    mode: "full_refresh",
    rows: rawRows,
    skipExisting: false
  });

  if (!dryRun && batch) {
    await db.importBatch.update({
      where: { id: batch.id },
      data: {
        completedAt: new Date(),
        status: "completed",
        rawSummary: JSON.stringify(summary)
      }
    });
  }

  return summary;
}

export async function loadInstagramApiRows({ limit, stopAtKnown = false }: { limit?: number; stopAtKnown?: boolean } = {}) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Missing INSTAGRAM_ACCESS_TOKEN for Instagram API ingestion.");

  const apiBaseUrl = process.env.INSTAGRAM_API_BASE_URL ?? "https://graph.instagram.com";
  const fields = process.env.INSTAGRAM_MEDIA_FIELDS ?? [
    "id",
    "caption",
    "media_type",
    "media_url",
    "children{media_type,media_url,thumbnail_url}",
    "permalink",
    "thumbnail_url",
    "timestamp",
    "username"
  ].join(",");
  const rows: RawInstagramRow[] = [];
  let nextUrl: string | undefined = buildInstagramMediaUrl(apiBaseUrl, fields, accessToken, limit);
  let shouldStop = false;

  while (nextUrl && !shouldStop && (!limit || rows.length < limit)) {
    const response = await fetch(nextUrl);
    const json = await response.json() as RawInstagramRow;

    if (!response.ok) {
      const message = getApiErrorMessage(json);
      throw new Error(`Instagram API fetch failed: ${response.status} ${response.statusText}${message ? ` - ${message}` : ""}`);
    }

    const data = Array.isArray(json.data) ? json.data.filter(isRawRow) : [];
    for (const row of data) {
      if (limit && rows.length >= limit) break;
      const instagramUrl = getRawInstagramUrl(row);
      if (stopAtKnown && instagramUrl && await db.instagramItem.findUnique({ where: { instagramUrl }, select: { id: true } })) {
        shouldStop = true;
        break;
      }
      rows.push(row);
    }

    const paging = isRawRow(json.paging) ? json.paging : undefined;
    nextUrl = typeof paging?.next === "string" ? paging.next : undefined;
  }

  return rows;
}

export function assertInstagramIngestionConfigured() {
  if (!process.env.INSTAGRAM_ACCESS_TOKEN) throw new Error("Set INSTAGRAM_ACCESS_TOKEN before refreshing the Instagram queue.");
  if (!process.env.OPENAI_API_KEY) throw new Error("Set OPENAI_API_KEY before refreshing the Instagram queue.");
}

async function runRefreshJob(jobId: string, mode: InstagramIngestionMode, limit: number | undefined) {
  const sourceName = getInstagramSourceName();
  const stopAtKnown = mode === "incremental_refresh";
  const rawRows = await loadInstagramApiRows({ limit, stopAtKnown });
  const batch = await db.importBatch.create({
    data: {
      sourceType: "instagram",
      sourceName,
      status: "running",
      rawSummary: JSON.stringify({ rows: rawRows.length, source: "api", mode })
    }
  });

  await updateJob(jobId, {
    totalRows: rawRows.length,
    message: rawRows.length === 0 ? "No new Instagram posts found." : `Processing ${rawRows.length} Instagram posts.`
  });

  const summary = await ingestInstagramRows({
    batchId: batch.id,
    jobId,
    mode,
    rows: rawRows,
    skipExisting: true
  });

  await db.importBatch.update({
    where: { id: batch.id },
    data: {
      completedAt: new Date(),
      status: "completed",
      rawSummary: JSON.stringify(summary)
    }
  });

  await updateJob(jobId, {
    status: "completed",
    completedAt: new Date(),
    rawSummary: summary as Prisma.InputJsonValue,
    message: `Completed: ${summary.imported} imported, ${summary.skipped} skipped, ${summary.failed} failed.`
  });
}

async function runIncompleteRepairJob(jobId: string, limit: number | undefined) {
  const incompleteItems = await db.instagramItem.findMany({
    where: {
      OR: [
        { firstPageText: null },
        { firstPageMetadata: { equals: Prisma.JsonNull } },
        { mediaAssets: { none: {} } }
      ]
    },
    orderBy: [{ postedAt: "desc" }, { updatedAt: "desc" }],
    take: limit
  });
  const repairIds = new Set(incompleteItems.map((item) => item.id));
  const repairUrls = new Set(incompleteItems.map((item) => item.instagramUrl));
  const repairShortcodes = new Set(incompleteItems.map((item) => item.instagramShortcode).filter((value): value is string => Boolean(value)));

  await updateJob(jobId, {
    totalRows: incompleteItems.length,
    message: incompleteItems.length === 0
      ? "No incomplete Instagram posts found."
      : `Refreshing ${incompleteItems.length} incomplete Instagram posts.`
  });

  if (incompleteItems.length === 0) {
    await updateJob(jobId, {
      status: "completed",
      completedAt: new Date(),
      message: "No incomplete Instagram posts found.",
      rawSummary: { repaired: 0 } as Prisma.InputJsonValue
    });
    return;
  }

  const apiRows = await loadInstagramApiRows();
  const apiRowsByUrl = new Map(apiRows.map((row) => [getRawInstagramUrl(row), row]).filter((entry): entry is [string, RawInstagramRow] => Boolean(entry[0])));
  const apiRowsByShortcode = new Map(apiRows.map((row) => {
    const url = getRawInstagramUrl(row);
    return [url ? getInstagramShortcode(url) : undefined, row];
  }).filter((entry): entry is [string, RawInstagramRow] => Boolean(entry[0])));

  const fallbackRecords = await db.externalRecord.findMany({
    where: {
      sourceType: "instagram",
      entityType: "InstagramItem",
      entityId: { in: [...repairIds] }
    },
    orderBy: { lastSeenAt: "desc" }
  });
  const fallbackRowsByItemId = new Map<string, RawInstagramRow>();
  for (const record of fallbackRecords) {
    if (record.entityId && isRawRow(record.rawPayloadJson)) fallbackRowsByItemId.set(record.entityId, record.rawPayloadJson);
  }
  const rows: RawInstagramRow[] = [];
  for (const item of incompleteItems) {
    const apiRow = apiRowsByUrl.get(item.instagramUrl) ?? (item.instagramShortcode ? apiRowsByShortcode.get(item.instagramShortcode) : undefined);
    const fallbackRow = fallbackRowsByItemId.get(item.id);
    const row = apiRow ?? fallbackRow;
    if (row) rows.push(row);
  }

  const summary = await ingestInstagramRows({
    jobId,
    mode: "repair_incomplete",
    repairItemIds: repairIds,
    rows,
    skipExisting: false
  });

  await updateJob(jobId, {
    status: "completed",
    completedAt: new Date(),
    rawSummary: {
      ...summary,
      requestedIncompleteRows: incompleteItems.length,
      matchedApiRows: rows.length,
      repairShortcodes: [...repairShortcodes]
    } as Prisma.InputJsonValue,
    message: `Repair completed: ${summary.updated} refreshed, ${summary.failed} failed.`
  });
}

async function ingestInstagramRows({
  batchId,
  dryRun,
  jobId,
  mode,
  repairItemIds,
  rows,
  skipExisting
}: IngestRowsOptions) {
  const normalizedRows = (await Promise.all(rows.map(normalizeRow))).filter((row): row is InstagramImportRow => Boolean(row));
  const candidates = await loadSaintCandidates();
  const summary = { rows: rows.length, validRows: normalizedRows.length, imported: 0, skipped: 0, updated: 0, suggested: 0, needsReview: 0, failed: 0, mediaCached: 0 };

  if (jobId) await updateJob(jobId, { totalRows: normalizedRows.length });

  for (const row of normalizedRows) {
    try {
      const existingItem = await db.instagramItem.findUnique({
        where: { instagramUrl: row.instagramUrl },
        select: { id: true, status: true, matchConfidence: true, firstPageText: true, firstPageMetadata: true }
      });

      if (skipExisting && existingItem) {
        summary.skipped += 1;
        await incrementJob(jobId, { processedRows: 1, skippedRows: 1 }, `Skipped existing ${row.instagramShortcode ?? row.instagramUrl}.`);
        continue;
      }

      if (repairItemIds && (!existingItem || !repairItemIds.has(existingItem.id))) {
        summary.skipped += 1;
        await incrementJob(jobId, { processedRows: 1, skippedRows: 1 }, `Skipped non-target ${row.instagramShortcode ?? row.instagramUrl}.`);
        continue;
      }

      const suggestions = getSuggestions(row, candidates);
      const status = itemStatusFor(row, suggestions.length);
      if (status === "suggested") summary.suggested += 1;
      if (status === "needs_review") summary.needsReview += 1;

      if (dryRun) {
        await incrementJob(jobId, { processedRows: 1 }, `Dry run processed ${row.instagramShortcode ?? row.instagramUrl}.`);
        continue;
      }

      const nextStatus = existingItem && isReviewedStatus(existingItem.status) ? existingItem.status : status;
      const nextConfidence = existingItem && isReviewedStatus(existingItem.status) ? existingItem.matchConfidence : suggestions[0]?.confidence;
      const shouldRepair = mode === "repair_incomplete";
      const item = await db.instagramItem.upsert({
        where: { instagramUrl: row.instagramUrl },
        create: {
          instagramUrl: row.instagramUrl,
          instagramShortcode: row.instagramShortcode,
          type: row.type,
          captionText: row.captionText,
          extractedSaintName: row.extractedSaintName,
          firstPageText: row.firstPageText,
          firstPageMetadata: row.firstPageMetadata as Prisma.InputJsonValue,
          postedAt: row.postedAt,
          thumbnailUrl: row.thumbnailUrl,
          status: nextStatus,
          matchConfidence: nextConfidence,
          sourceImportBatchId: batchId,
          notes: "Imported from real Instagram post/reel data."
        },
        update: {
          instagramShortcode: shouldRepair ? undefined : row.instagramShortcode,
          type: shouldRepair ? undefined : row.type,
          captionText: shouldRepair ? undefined : row.captionText,
          extractedSaintName: shouldRepair ? undefined : row.extractedSaintName,
          firstPageText: existingItem?.firstPageText ? undefined : row.firstPageText,
          firstPageMetadata: existingItem?.firstPageMetadata ? undefined : row.firstPageMetadata as Prisma.InputJsonValue,
          postedAt: shouldRepair ? undefined : row.postedAt,
          thumbnailUrl: row.thumbnailUrl,
          status: shouldRepair ? undefined : nextStatus,
          matchConfidence: shouldRepair ? undefined : nextConfidence,
          sourceImportBatchId: batchId
        }
      });

      const cachedMediaAssets = await getCachedInstagramMediaAssets(item.id, row);
      if (cachedMediaAssets.length > 0) summary.mediaCached += 1;
      if (cachedMediaAssets[0]?.cachedUrl && cachedMediaAssets[0].cachedUrl !== row.thumbnailUrl) {
        await db.instagramItem.update({
          where: { id: item.id },
          data: { thumbnailUrl: cachedMediaAssets[0].cachedUrl }
        });
      }

      await db.externalRecord.upsert({
        where: { sourceType_externalId: { sourceType: "instagram", externalId: row.sourceKey } },
        create: {
          sourceType: "instagram",
          externalId: row.sourceKey,
          entityType: "InstagramItem",
          entityId: item.id,
          rawPayloadJson: row.raw as Prisma.InputJsonValue
        },
        update: {
          entityType: "InstagramItem",
          entityId: item.id,
          rawPayloadJson: row.raw as Prisma.InputJsonValue,
          lastSeenAt: new Date()
        }
      });

      if (!shouldRepair) {
        for (const suggestion of suggestions) {
          const existingLink = await db.instagramItemSaint.findUnique({
            where: { instagramItemId_saintId: { instagramItemId: item.id, saintId: suggestion.candidate.id } },
            select: { matchStatus: true }
          });
          const shouldPreserveLink = existingLink && isReviewedStatus(existingLink.matchStatus);
          await db.instagramItemSaint.upsert({
            where: { instagramItemId_saintId: { instagramItemId: item.id, saintId: suggestion.candidate.id } },
            create: {
              instagramItemId: item.id,
              saintId: suggestion.candidate.id,
              matchStatus: "suggested",
              matchConfidence: suggestion.confidence,
              isPrimary: suggestion === suggestions[0],
              notes: `Suggested from extracted Instagram name: ${row.extractedSaintName}`
            },
            update: {
              matchStatus: shouldPreserveLink ? existingLink.matchStatus : "suggested",
              matchConfidence: shouldPreserveLink ? undefined : suggestion.confidence,
              isPrimary: suggestion === suggestions[0],
              notes: shouldPreserveLink ? undefined : `Suggested from extracted Instagram name: ${row.extractedSaintName}`
            }
          });
        }
      }

      if (existingItem) summary.updated += 1;
      else summary.imported += 1;
      await incrementJob(
        jobId,
        {
          processedRows: 1,
          importedRows: existingItem ? 0 : 1,
          updatedRows: existingItem ? 1 : 0,
          mediaCachedRows: cachedMediaAssets.length > 0 ? 1 : 0,
          incompleteRefetchedRows: shouldRepair ? 1 : 0
        },
        `${existingItem ? "Updated" : "Imported"} ${row.instagramShortcode ?? row.instagramUrl}.`
      );
    } catch (error) {
      summary.failed += 1;
      await incrementJob(
        jobId,
        { processedRows: 1, failedRows: 1 },
        `Failed ${row.instagramShortcode ?? row.instagramUrl}: ${error instanceof Error ? error.message : "unknown error"}`
      );
    }
  }

  return summary;
}

async function normalizeRow(raw: RawInstagramRow): Promise<InstagramImportRow | undefined> {
  const instagramUrl = getRawInstagramUrl(raw);
  if (!instagramUrl) return undefined;

  const mediaId = pickString(raw, ["id", "mediaId", "media_id"]);
  const shortcode = pickString(raw, ["instagramShortcode", "shortcode", "code"]) ?? getInstagramShortcode(instagramUrl) ?? undefined;
  const captionText = pickString(raw, ["captionText", "caption_text", "caption", "description"]);
  const extractedSaintName = pickString(raw, ["extractedSaintName", "extracted_saint_name", "saintName", "saint_name", "name", "subject"]);
  const importedFirstPageText = pickString(raw, [
    "firstPageText",
    "first_page_text",
    "firstSlideText",
    "first_slide_text",
    "coverText",
    "cover_text",
    "ocrText",
    "ocr_text",
    "altText",
    "alt_text"
  ]);
  const thumbnailUrl = pickString(raw, ["thumbnailUrl", "thumbnail_url", "thumbnail", "imageUrl", "image_url", "mediaUrl", "media_url"]);
  const firstPageDraft = importedFirstPageText
    ? { firstPageText: importedFirstPageText, metadata: parseInstagramFirstPageMetadata(importedFirstPageText) }
    : await extractInstagramFirstPageDraft({ rawPayloadJson: raw, captionText, thumbnailUrl });
  const postedAt = parseDate(pickString(raw, ["postedAt", "posted_at", "timestamp", "date", "taken_at"]));
  const type = normalizeType(pickString(raw, ["type", "mediaType", "media_type", "product_type"]), instagramUrl);

  return {
    sourceKey: mediaId ? `media:${mediaId}` : shortcode ? `shortcode:${shortcode}` : `url:${stableHash(instagramUrl)}`,
    instagramUrl,
    instagramShortcode: shortcode,
    type,
    captionText,
    extractedSaintName: extractedSaintName ?? firstPageDraft.metadata.displayName,
    firstPageText: firstPageDraft.firstPageText,
    firstPageMetadata: firstPageDraft.metadata,
    postedAt,
    thumbnailUrl,
    raw
  };
}

function buildInstagramMediaUrl(apiBaseUrl: string, fields: string, accessToken: string, limit: number | undefined) {
  const url = new URL("/me/media", apiBaseUrl);
  url.searchParams.set("fields", fields);
  url.searchParams.set("access_token", accessToken);
  if (limit) url.searchParams.set("limit", String(Math.min(limit, 100)));
  return url.toString();
}

function getApiErrorMessage(json: RawInstagramRow) {
  const error = isRawRow(json.error) ? json.error : undefined;
  const message = typeof error?.message === "string" ? error.message : undefined;
  const type = typeof error?.type === "string" ? error.type : undefined;
  const code = typeof error?.code === "number" || typeof error?.code === "string" ? String(error.code) : undefined;
  return [type, code ? `code ${code}` : undefined, message].filter(Boolean).join(": ");
}

function getRawInstagramUrl(raw: RawInstagramRow) {
  return pickString(raw, ["instagramUrl", "instagram_url", "url", "postUrl", "post_url", "permalink", "link"]);
}

function isRawRow(value: unknown): value is RawInstagramRow {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function pickString(raw: RawInstagramRow | undefined, candidates: string[]) {
  if (!raw) return undefined;
  const normalizedCandidates = new Set(candidates.map((candidate) => candidate.toLowerCase()));
  const match = Object.entries(raw).find(([key, value]) => normalizedCandidates.has(key.trim().toLowerCase()) && value != null);
  const value = match?.[1];
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number") return String(value);
  return undefined;
}

function parseDate(value: string | undefined) {
  if (!value) return undefined;
  const parsed = /^\d+$/.test(value) ? new Date(Number(value) * 1000) : new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function normalizeType(value: string | undefined, instagramUrl: string): InstagramType {
  const lower = value?.toLowerCase() ?? "";
  if (lower.includes("reel")) return "reel";
  if (lower.includes("carousel") || lower.includes("album")) return "carousel";
  if (lower.includes("post") || lower.includes("image") || lower.includes("photo")) return "post";
  return getInstagramTypeFromUrl(instagramUrl);
}

function stableHash(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

async function loadSaintCandidates(): Promise<SaintCandidate[]> {
  const saints = await db.saint.findMany({
    select: {
      id: true,
      displayName: true,
      canonicalName: true,
      aliases: { select: { alias: true } }
    }
  });

  return saints.map((saint) => ({
    id: saint.id,
    displayName: saint.displayName,
    names: [saint.displayName, saint.canonicalName, ...saint.aliases.map((alias) => alias.alias)]
  }));
}

function getSuggestions(row: InstagramImportRow, candidates: SaintCandidate[]) {
  if (!row.extractedSaintName) return [];

  return candidates
    .map((candidate) => {
      const confidences = candidate.names.map((name) => confidenceForNameMatch(row.extractedSaintName!, name));
      const confidence = rankConfidence(confidences);
      return { candidate, confidence };
    })
    .filter((suggestion) => suggestion.confidence !== "low")
    .sort((left, right) => confidenceScore(right.confidence) - confidenceScore(left.confidence))
    .slice(0, 5);
}

function rankConfidence(confidences: string[]): Confidence {
  if (confidences.includes("high")) return "high";
  if (confidences.includes("medium")) return "medium";
  return "low";
}

function confidenceScore(confidence: Confidence) {
  return confidence === "high" ? 3 : confidence === "medium" ? 2 : 1;
}

function itemStatusFor(row: InstagramImportRow, suggestionCount: number): MatchStatus {
  if (!row.extractedSaintName) return "needs_review";
  return suggestionCount > 0 ? "suggested" : "needs_review";
}

function isReviewedStatus(status: MatchStatus) {
  return status === "matched" || status === "ignored" || status === "published" || status === "hidden";
}

async function getCachedInstagramMediaAssets(instagramItemId: string, row: InstagramImportRow) {
  return cacheInstagramMediaAssets({
    fallbackUrl: row.thumbnailUrl,
    fileNamePrefix: row.instagramShortcode ?? stableHash(row.instagramUrl),
    instagramItemId,
    rawPayloadJson: row.raw
  });
}

function getInstagramSourceName() {
  return process.env.INSTAGRAM_IMPORT_SOURCE_NAME ?? "Instagram API";
}

async function updateJob(jobId: string | undefined, data: Prisma.InstagramIngestionJobUpdateInput) {
  if (!jobId) return;
  await db.instagramIngestionJob.update({
    where: { id: jobId },
    data
  });
}

async function incrementJob(jobId: string | undefined, counters: Partial<Record<"processedRows" | "importedRows" | "skippedRows" | "updatedRows" | "failedRows" | "mediaCachedRows" | "incompleteRefetchedRows", number>>, message: string) {
  if (!jobId) return;
  await updateJob(jobId, {
    message,
    processedRows: counters.processedRows ? { increment: counters.processedRows } : undefined,
    importedRows: counters.importedRows ? { increment: counters.importedRows } : undefined,
    skippedRows: counters.skippedRows ? { increment: counters.skippedRows } : undefined,
    updatedRows: counters.updatedRows ? { increment: counters.updatedRows } : undefined,
    failedRows: counters.failedRows ? { increment: counters.failedRows } : undefined,
    mediaCachedRows: counters.mediaCachedRows ? { increment: counters.mediaCachedRows } : undefined,
    incompleteRefetchedRows: counters.incompleteRefetchedRows ? { increment: counters.incompleteRefetchedRows } : undefined
  });
}
