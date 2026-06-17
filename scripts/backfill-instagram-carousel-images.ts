import { Prisma } from "../lib/generated/prisma/client";
import { db } from "../lib/db";
import { getInstagramCarouselImageUrls } from "../lib/instagram";

type RawPayload = Record<string, unknown>;

function parseArgs(argv: string[]) {
  return {
    dryRun: argv.includes("--dry-run"),
    limit: parsePositiveInt(getArg(argv, "--limit") ?? process.env.INSTAGRAM_CAROUSEL_BACKFILL_LIMIT)
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

function getRawPayload(value: unknown): RawPayload | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as RawPayload : undefined;
}

function getMediaId(externalRecord?: { externalId: string; rawPayloadJson: Prisma.JsonValue } | null) {
  const externalId = externalRecord?.externalId;
  if (externalId?.startsWith("media:")) return externalId.slice("media:".length);

  const raw = getRawPayload(externalRecord?.rawPayloadJson);
  return typeof raw?.id === "string" ? raw.id : undefined;
}

function getApiErrorMessage(json: RawPayload) {
  const error = getRawPayload(json.error);
  const message = typeof error?.message === "string" ? error.message : undefined;
  const type = typeof error?.type === "string" ? error.type : undefined;
  const code = typeof error?.code === "number" || typeof error?.code === "string" ? String(error.code) : undefined;
  return [type, code ? `code ${code}` : undefined, message].filter(Boolean).join(": ");
}

function mergeRawPayload(currentRawPayloadJson: Prisma.JsonValue, refreshedRaw: RawPayload) {
  const currentRaw = getRawPayload(currentRawPayloadJson) ?? {};
  return {
    ...currentRaw,
    ...refreshedRaw,
    children: refreshedRaw.children ?? currentRaw.children
  } satisfies RawPayload;
}

async function fetchInstagramMedia(mediaId: string, accessToken: string) {
  const apiBaseUrl = process.env.INSTAGRAM_API_BASE_URL ?? "https://graph.instagram.com";
  const fields = process.env.INSTAGRAM_CAROUSEL_MEDIA_FIELDS ?? [
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
    throw new Error(`Instagram media fetch failed for ${mediaId}: ${response.status} ${response.statusText}${message ? ` - ${message}` : ""}`);
  }

  return json;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Missing INSTAGRAM_ACCESS_TOKEN for Instagram carousel backfill.");

  const items = await db.instagramItem.findMany({
    where: { type: "carousel" },
    orderBy: [{ postedAt: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      instagramUrl: true
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
  const externalRecordByItemId = new Map<string, typeof externalRecords[number]>();
  for (const record of externalRecords) {
    if (record.entityId && !externalRecordByItemId.has(record.entityId)) {
      externalRecordByItemId.set(record.entityId, record);
    }
  }

  const summary = {
    checked: 0,
    skippedWithoutMediaId: 0,
    skippedWithChildren: 0,
    updated: 0
  };

  for (const item of items) {
    summary.checked += 1;
    const externalRecord = externalRecordByItemId.get(item.id);
    const mediaId = getMediaId(externalRecord);

    if (!externalRecord || !mediaId) {
      summary.skippedWithoutMediaId += 1;
      console.log(`${item.instagramUrl} -> skipped, no Instagram media id`);
      continue;
    }

    const existingImages = getInstagramCarouselImageUrls(externalRecord.rawPayloadJson);
    if (existingImages.length > 1) {
      summary.skippedWithChildren += 1;
      console.log(`${item.instagramUrl} -> already has ${existingImages.length} carousel image URLs`);
      continue;
    }

    const refreshedRaw = await fetchInstagramMedia(mediaId, accessToken);
    const mergedRaw = mergeRawPayload(externalRecord.rawPayloadJson, refreshedRaw);
    const imageUrls = getInstagramCarouselImageUrls(mergedRaw);
    console.log(`${item.instagramUrl} -> ${imageUrls.length} carousel image URL(s)`);

    if (options.dryRun) continue;

    await db.externalRecord.update({
      where: { id: externalRecord.id },
      data: {
        rawPayloadJson: mergedRaw as Prisma.InputJsonValue,
        lastSeenAt: new Date()
      }
    });
    summary.updated += 1;
  }

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
