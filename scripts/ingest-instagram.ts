import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Prisma, type Confidence, type InstagramType, type MatchStatus } from "@prisma/client";
import { db } from "../lib/db";
import { getInstagramShortcode, getInstagramTypeFromUrl } from "../lib/instagram";
import { cacheInstagramCoverImage } from "../lib/instagram-cover-cache";
import { extractInstagramFirstPageDraft } from "../lib/instagram-first-page-extraction";
import { parseInstagramFirstPageMetadata, type InstagramFirstPageMetadata } from "../lib/instagram-metadata";
import { confidenceForNameMatch } from "../lib/reconciliation";

type RawInstagramRow = Record<string, unknown>;

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

function parseArgs(argv: string[]) {
  const file = getArg(argv, "--file");
  const sourceName = getArg(argv, "--source-name") ?? process.env.INSTAGRAM_IMPORT_SOURCE_NAME ?? "Instagram API";
  const urls = argv.filter((arg) => !arg.startsWith("--") && !["--file", "--source-name", "--limit"].includes(arg));

  return {
    api: argv.includes("--api") || (!file && urls.length === 0 && Boolean(process.env.INSTAGRAM_ACCESS_TOKEN)),
    file,
    sourceName,
    dryRun: argv.includes("--dry-run"),
    limit: parsePositiveInt(getArg(argv, "--limit") ?? process.env.INSTAGRAM_IMPORT_LIMIT),
    urls
  };
}

function getArg(argv: string[], key: string) {
  const inline = argv.find((arg) => arg.startsWith(`${key}=`));
  if (inline) return inline.slice(key.length + 1);

  const index = argv.indexOf(key);
  return index >= 0 ? argv[index + 1] : undefined;
}

function parsePositiveInt(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

async function loadInstagramApiRows(limit: number | undefined) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Missing INSTAGRAM_ACCESS_TOKEN for Instagram API ingestion.");
  }

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

  while (nextUrl && (!limit || rows.length < limit)) {
    const response = await fetch(nextUrl);
    const json = await response.json() as RawInstagramRow;

    if (!response.ok) {
      const message = getApiErrorMessage(json);
      throw new Error(`Instagram API fetch failed: ${response.status} ${response.statusText}${message ? ` - ${message}` : ""}`);
    }

    const data = Array.isArray(json.data) ? json.data.filter(isRawRow) : [];
    rows.push(...data);
    const paging = isRawRow(json.paging) ? json.paging : undefined;
    nextUrl = typeof paging?.next === "string" ? paging.next : undefined;
  }

  return limit ? rows.slice(0, limit) : rows;
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

function parseCsv(input: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  row.push(current);
  if (row.some((cell) => cell.trim())) rows.push(row);

  const [headerRow, ...dataRows] = rows;
  if (!headerRow) return [];

  return dataRows.map((cells) => Object.fromEntries(
    headerRow.map((header, index) => [header.trim(), cells[index]?.trim() ?? ""])
  ));
}

async function loadRows(file: string | undefined, urls: string[]) {
  if (!file) {
    return urls.map((url) => ({ url }));
  }

  const input = await readFile(file, "utf8");
  if (file.toLowerCase().endsWith(".json")) {
    const parsed = JSON.parse(input) as unknown;
    if (Array.isArray(parsed)) return parsed.filter(isRawRow);
    if (isRawRow(parsed) && Array.isArray(parsed.items)) return parsed.items.filter(isRawRow);
    if (isRawRow(parsed) && Array.isArray(parsed.posts)) return parsed.posts.filter(isRawRow);
    throw new Error("Instagram JSON must be an array, or an object with an items/posts array.");
  }

  return parseCsv(input);
}

function isRawRow(value: unknown): value is RawInstagramRow {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

async function normalizeRow(raw: RawInstagramRow): Promise<InstagramImportRow | undefined> {
  const instagramUrl = pickString(raw, [
    "instagramUrl",
    "instagram_url",
    "url",
    "postUrl",
    "post_url",
    "permalink",
    "link"
  ]);
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
    ? {
        firstPageText: importedFirstPageText,
        metadata: parseInstagramFirstPageMetadata(importedFirstPageText)
      }
    : await extractInstagramFirstPageDraft({ rawPayloadJson: raw, captionText, thumbnailUrl });
  const firstPageText = firstPageDraft.firstPageText;
  const firstPageMetadata = firstPageDraft.metadata;
  const postedAt = parseDate(pickString(raw, ["postedAt", "posted_at", "timestamp", "date", "taken_at"]));
  const type = normalizeType(pickString(raw, ["type", "mediaType", "media_type", "product_type"]), instagramUrl);

  return {
    sourceKey: mediaId ? `media:${mediaId}` : shortcode ? `shortcode:${shortcode}` : `url:${stableHash(instagramUrl)}`,
    instagramUrl,
    instagramShortcode: shortcode,
    type,
    captionText,
    extractedSaintName,
    firstPageText,
    firstPageMetadata,
    postedAt,
    thumbnailUrl,
    raw
  };
}

function pickString(raw: RawInstagramRow, candidates: string[]) {
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

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const rawRows = options.api
    ? await loadInstagramApiRows(options.limit)
    : await loadRows(options.file, options.urls);
  const rows = (await Promise.all(rawRows.map(normalizeRow))).filter((row): row is InstagramImportRow => Boolean(row));
  const candidates = await loadSaintCandidates();
  const batch = options.dryRun
    ? undefined
    : await db.importBatch.create({
        data: {
          sourceType: "instagram",
          sourceName: options.sourceName,
          status: "running",
          rawSummary: JSON.stringify({ rows: rows.length, source: options.api ? "api" : options.file ?? "cli_urls" })
        }
      });
  const summary = { rows: rawRows.length, validRows: rows.length, suggested: 0, needsReview: 0 };

  for (const row of rows) {
    const suggestions = getSuggestions(row, candidates);
    const status = itemStatusFor(row, suggestions.length);
    if (status === "suggested") summary.suggested += 1;
    if (status === "needs_review") summary.needsReview += 1;

    console.log(`${row.instagramUrl} -> ${status}${suggestions.length ? ` (${suggestions.map((match) => `${match.candidate.displayName}: ${match.confidence}`).join(", ")})` : ""}`);

    if (options.dryRun) continue;

    const existingItem = await db.instagramItem.findUnique({
      where: { instagramUrl: row.instagramUrl },
      select: { id: true, status: true, matchConfidence: true, firstPageText: true, firstPageMetadata: true }
    });
    const nextStatus = existingItem && isReviewedStatus(existingItem.status) ? existingItem.status : status;
    const nextConfidence = existingItem && isReviewedStatus(existingItem.status) ? existingItem.matchConfidence : suggestions[0]?.confidence;
    const thumbnailUrl = await getCachedInstagramCoverUrl(row);

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
        thumbnailUrl,
        status: nextStatus,
        matchConfidence: nextConfidence,
        sourceImportBatchId: batch?.id,
        notes: "Imported from real Instagram post/reel data."
      },
      update: {
        instagramShortcode: row.instagramShortcode,
        type: row.type,
        captionText: row.captionText,
        extractedSaintName: row.extractedSaintName,
        firstPageText: existingItem?.firstPageText ? undefined : row.firstPageText,
        firstPageMetadata: existingItem?.firstPageMetadata ? undefined : row.firstPageMetadata as Prisma.InputJsonValue,
        postedAt: row.postedAt,
        thumbnailUrl,
        status: nextStatus,
        matchConfidence: nextConfidence,
        sourceImportBatchId: batch?.id
      }
    });

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

    for (const suggestion of suggestions) {
      const existingLink = await db.instagramItemSaint.findUnique({
        where: {
          instagramItemId_saintId: {
            instagramItemId: item.id,
            saintId: suggestion.candidate.id
          }
        },
        select: { matchStatus: true }
      });

      const shouldPreserveLink = existingLink && isReviewedStatus(existingLink.matchStatus);
      await db.instagramItemSaint.upsert({
        where: {
          instagramItemId_saintId: {
            instagramItemId: item.id,
            saintId: suggestion.candidate.id
          }
        },
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

  if (!options.dryRun) {
    await db.importBatch.update({
      where: { id: batch!.id },
      data: {
        completedAt: new Date(),
        status: "completed",
        rawSummary: JSON.stringify(summary)
      }
    });
  }

  console.log(JSON.stringify(summary, null, 2));
}

async function getCachedInstagramCoverUrl(row: InstagramImportRow) {
  try {
    return await cacheInstagramCoverImage({
      fallbackUrl: row.thumbnailUrl,
      fileName: row.instagramShortcode ? `${row.instagramShortcode}-cover` : `${stableHash(row.instagramUrl)}-cover`,
      rawPayloadJson: row.raw
    });
  } catch (error) {
    console.warn(`${row.instagramUrl} -> could not cache Instagram cover image: ${error instanceof Error ? error.message : "unknown error"}`);
    return row.thumbnailUrl;
  }
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
