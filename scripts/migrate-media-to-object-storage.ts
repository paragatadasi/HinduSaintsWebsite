import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "../lib/db";
import type { Prisma } from "../lib/generated/prisma/client";
import {
  getMediaStorageBackend,
  getMediaUploadRoot,
  saveImageBuffer,
  type StoredMedia
} from "../lib/media-storage";

const apply = process.argv.includes("--apply");
const limit = parseLimit(process.argv);

if (getMediaStorageBackend() !== "s3") {
  throw new Error("Set MEDIA_STORAGE_BACKEND=s3 before migrating media.");
}

const [mediaAssets, instagramAssets] = await Promise.all([
  db.mediaAsset.findMany({
    where: {
      storageKey: { not: null },
      url: { startsWith: "/media/" }
    },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: {
      id: true,
      storageKey: true,
      url: true
    }
  }),
  db.instagramMediaAsset.findMany({
    where: {
      storageKey: { not: null },
      cachedUrl: { startsWith: "/media/" }
    },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: {
      id: true,
      instagramItemId: true,
      storageKey: true,
      cachedUrl: true
    }
  })
]);

const migratedByStorageKey = new Map<string, StoredMedia>();
let migrated = 0;
let missing = 0;
let failed = 0;

for (const asset of mediaAssets) {
  if (!asset.storageKey) continue;
  const stored = await migrateStorageKey(asset.storageKey);
  if (!stored) continue;

  if (apply) {
    await db.mediaAsset.update({
      where: { id: asset.id },
      data: {
        url: stored.url,
        storageKey: stored.storageKey,
        mimeType: stored.mimeType,
        width: stored.width,
        height: stored.height,
        variants: stored.variants as Prisma.InputJsonValue | undefined
      }
    });
  }

  migrated += 1;
  console.log(`${apply ? "migrated" : "would migrate"} MediaAsset ${asset.id}: ${asset.url} -> ${stored.url}`);
}

for (const asset of instagramAssets) {
  if (!asset.storageKey) continue;
  const stored = await migrateStorageKey(asset.storageKey);
  if (!stored) continue;

  if (apply) {
    await db.$transaction([
      db.instagramMediaAsset.update({
        where: { id: asset.id },
        data: {
          cachedUrl: stored.url,
          storageKey: stored.storageKey,
          mediaType: stored.mimeType,
          variants: stored.variants as Prisma.InputJsonValue | undefined
        }
      }),
      db.instagramItem.updateMany({
        where: {
          id: asset.instagramItemId,
          thumbnailUrl: asset.cachedUrl
        },
        data: { thumbnailUrl: stored.url }
      })
    ]);
  }

  migrated += 1;
  console.log(`${apply ? "migrated" : "would migrate"} InstagramMediaAsset ${asset.id}: ${asset.cachedUrl} -> ${stored.url}`);
}

console.log(JSON.stringify({
  apply,
  failed,
  migrated,
  missing,
  scanned: mediaAssets.length + instagramAssets.length
}, null, 2));

await db.$disconnect();

async function migrateStorageKey(storageKey: string) {
  const existing = migratedByStorageKey.get(storageKey);
  if (existing) return existing;

  const localPath = path.resolve(getMediaUploadRoot(), storageKey);
  const uploadRoot = getMediaUploadRoot();
  if (!localPath.startsWith(uploadRoot + path.sep)) {
    failed += 1;
    console.warn(`unsafe storage key skipped: ${storageKey}`);
    return undefined;
  }

  try {
    const body = await readFile(localPath);
    if (!apply) {
      return {
        url: `s3://preview/${storageKey}`,
        storageKey,
        mimeType: getMimeType(storageKey)
      } satisfies StoredMedia;
    }

    const stored = await saveImageBuffer({
      body,
      contentType: getMimeType(storageKey),
      fileName: path.basename(storageKey),
      folder: storageKey.split("/", 1)[0] || "media"
    });
    migratedByStorageKey.set(storageKey, stored);
    return stored;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      missing += 1;
    } else {
      failed += 1;
    }
    console.warn(`${storageKey}: ${error instanceof Error ? error.message : "migration failed"}`);
    return undefined;
  }
}

function parseLimit(argv: string[]) {
  const value = argv.find((argument) => argument.startsWith("--limit="))?.split("=", 2)[1];
  if (!value) return undefined;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("--limit must be a positive integer.");
  }

  return parsed;
}

function getMimeType(storageKey: string): StoredMedia["mimeType"] {
  switch (path.extname(storageKey).toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      throw new Error(`Unsupported media extension: ${storageKey}`);
  }
}
