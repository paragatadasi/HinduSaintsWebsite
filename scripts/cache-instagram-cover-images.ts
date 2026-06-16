import { Prisma } from "@prisma/client";
import { db } from "../lib/db";
import { cacheInstagramCoverImage, isLocalMediaUrl } from "../lib/instagram-cover-cache";

type RawPayload = Record<string, unknown>;
type ExternalInstagramRecord = {
  id: string;
  externalId: string;
  rawPayloadJson: Prisma.JsonValue;
};

function parseArgs(argv: string[]) {
  return {
    dryRun: argv.includes("--dry-run"),
    limit: parsePositiveInt(getArg(argv, "--limit") ?? process.env.INSTAGRAM_COVER_CACHE_LIMIT)
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

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const items = await db.instagramItem.findMany({
    where: {
      type: "carousel",
      status: { not: "hidden" }
    },
    orderBy: [
      { postedAt: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" }
    ],
    select: {
      id: true,
      instagramShortcode: true,
      instagramUrl: true,
      thumbnailUrl: true
    },
    take: options.limit
  });
  const externalRecords = await db.externalRecord.findMany({
    where: {
      sourceType: "instagram",
      entityType: "InstagramItem",
      entityId: { in: items.map((item) => item.id) }
    },
    orderBy: { lastSeenAt: "desc" },
    select: {
      id: true,
      entityId: true,
      externalId: true,
      rawPayloadJson: true
    }
  });
  const rawPayloadByItemId = new Map<string, unknown>();
  const externalRecordByItemId = new Map<string, typeof externalRecords[number]>();

  for (const record of externalRecords) {
    if (record.entityId && !rawPayloadByItemId.has(record.entityId)) {
      rawPayloadByItemId.set(record.entityId, record.rawPayloadJson);
      externalRecordByItemId.set(record.entityId, record);
    }
  }

  const summary = {
    checked: 0,
    skippedCached: 0,
    updated: 0,
    failed: 0
  };

  for (const item of items) {
    summary.checked += 1;

    if (item.thumbnailUrl && isLocalMediaUrl(item.thumbnailUrl)) {
      summary.skippedCached += 1;
      console.log(`${item.instagramUrl} -> already cached`);
      continue;
    }

    if (options.dryRun) {
      console.log(`${item.instagramUrl} -> would cache cover image`);
      continue;
    }

    try {
      const cachedUrl = await cacheItemCover({
        externalRecord: externalRecordByItemId.get(item.id),
        fallbackUrl: item.thumbnailUrl,
        fileName: item.instagramShortcode ? `${item.instagramShortcode}-cover` : `${item.id}-cover`,
        rawPayloadJson: rawPayloadByItemId.get(item.id)
      });

      if (!cachedUrl) {
        summary.failed += 1;
        console.log(`${item.instagramUrl} -> skipped, no cover image URL`);
        continue;
      }

      await db.instagramItem.update({
        where: { id: item.id },
        data: { thumbnailUrl: cachedUrl }
      });
      summary.updated += 1;
      console.log(`${item.instagramUrl} -> cached ${cachedUrl}`);
    } catch (error) {
      summary.failed += 1;
      console.warn(`${item.instagramUrl} -> failed: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }

  console.log(JSON.stringify(summary, null, 2));
}

async function cacheItemCover({
  externalRecord,
  fallbackUrl,
  fileName,
  rawPayloadJson
}: {
  externalRecord?: ExternalInstagramRecord;
  fallbackUrl?: string | null;
  fileName: string;
  rawPayloadJson?: unknown;
}) {
  try {
    return await cacheInstagramCoverImage({ fallbackUrl, fileName, rawPayloadJson });
  } catch (error) {
    const mediaId = getMediaId(externalRecord);
    if (!externalRecord || !mediaId) throw error;

    const refreshedRaw = await fetchInstagramMedia(mediaId);
    const mergedRaw = mergeRawPayload(externalRecord.rawPayloadJson, refreshedRaw);

    await db.externalRecord.update({
      where: { id: externalRecord.id },
      data: {
        rawPayloadJson: mergedRaw as Prisma.InputJsonValue,
        lastSeenAt: new Date()
      }
    });

    return cacheInstagramCoverImage({ fallbackUrl, fileName, rawPayloadJson: mergedRaw });
  }
}

function getMediaId(externalRecord?: { externalId: string; rawPayloadJson: Prisma.JsonValue } | null) {
  const externalId = externalRecord?.externalId;
  if (externalId?.startsWith("media:")) return externalId.slice("media:".length);

  const raw = getRawPayload(externalRecord?.rawPayloadJson);
  return typeof raw?.id === "string" ? raw.id : undefined;
}

function getRawPayload(value: unknown): RawPayload | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as RawPayload : undefined;
}

function mergeRawPayload(currentRawPayloadJson: Prisma.JsonValue, refreshedRaw: RawPayload) {
  const currentRaw = getRawPayload(currentRawPayloadJson) ?? {};
  return {
    ...currentRaw,
    ...refreshedRaw,
    children: refreshedRaw.children ?? currentRaw.children
  } satisfies RawPayload;
}

async function fetchInstagramMedia(mediaId: string) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Missing INSTAGRAM_ACCESS_TOKEN for Instagram media refresh.");

  const apiBaseUrl = process.env.INSTAGRAM_API_BASE_URL ?? "https://graph.instagram.com";
  const fields = [
    "id",
    "media_type",
    "media_url",
    "thumbnail_url",
    "permalink",
    "children{media_type,media_url,thumbnail_url}"
  ].join(",");
  const url = new URL(`/${mediaId}`, apiBaseUrl);
  url.searchParams.set("fields", fields);
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url);
  const json = await response.json() as RawPayload;

  if (!response.ok) {
    const message = getApiErrorMessage(json);
    throw new Error(`Instagram media refresh failed: ${response.status} ${response.statusText}${message ? ` - ${message}` : ""}`);
  }

  return json;
}

function getApiErrorMessage(json: RawPayload) {
  const error = getRawPayload(json.error);
  const message = typeof error?.message === "string" ? error.message : undefined;
  const type = typeof error?.type === "string" ? error.type : undefined;
  const code = typeof error?.code === "number" || typeof error?.code === "string" ? String(error.code) : undefined;
  return [type, code ? `code ${code}` : undefined, message].filter(Boolean).join(": ");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
