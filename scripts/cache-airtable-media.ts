import { db } from "../lib/db";
import { cacheExternalImage } from "../lib/external-image-cache";

type AirtableAttachment = {
  filename?: string;
  url?: string;
  thumbnails?: {
    full?: { url?: string };
    large?: { url?: string };
  };
};

function parseArgs(argv: string[]) {
  return {
    dryRun: argv.includes("--dry-run"),
    limit: parsePositiveInt(getArg(argv, "--limit"))
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
  const assets = await db.mediaAsset.findMany({
    where: {
      storageKey: null,
      sourceUrl: { not: null },
      NOT: { url: { startsWith: "/media/" } }
    },
    orderBy: { createdAt: "asc" },
    take: options.limit,
    select: {
      id: true,
      url: true,
      sourceUrl: true,
      caption: true,
      altText: true,
      primaryForSaints: { select: { id: true } },
      saintGalleryImages: { select: { saintId: true } }
    }
  });
  const saintIds = Array.from(new Set(assets.flatMap(getAssetSaintIds)));
  const externalRecords = saintIds.length > 0
    ? await db.externalRecord.findMany({
        where: {
          sourceType: "airtable",
          entityType: "Saint",
          entityId: { in: saintIds }
        },
        select: { entityId: true, externalId: true }
      })
    : [];
  const recordIdBySaintId = new Map(
    externalRecords.flatMap((record) => {
      const recordId = record.externalId.split(":").at(-1);
      return record.entityId && recordId ? [[record.entityId, recordId] as const] : [];
    })
  );
  const recordIds = Array.from(new Set(recordIdBySaintId.values()));
  const mirrorRecords = recordIds.length > 0
    ? await db.airtableMirrorRecord.findMany({
        where: {
          tableIdOrName: "Saints",
          recordId: { in: recordIds }
        },
        select: { recordId: true, rawFieldsJson: true }
      })
    : [];
  const attachmentsByRecordId = new Map(
    mirrorRecords.map((record) => [record.recordId, getPictureAttachments(record.rawFieldsJson)])
  );
  const summary = { checked: 0, cached: 0, failed: 0 };

  for (const asset of assets) {
    summary.checked += 1;
    const label = asset.caption ?? asset.altText ?? asset.id;

    if (options.dryRun) {
      console.log(`${label} -> would cache`);
      continue;
    }

    try {
      const cached = await cacheExternalImage({
        fileName: asset.caption ?? asset.altText ?? `airtable-image-${asset.id}`,
        folder: "airtable-media",
        sourceUrls: [
          ...getFreshAttachmentUrls(asset, recordIdBySaintId, attachmentsByRecordId),
          asset.url,
          asset.sourceUrl
        ]
      });

      await db.mediaAsset.update({
        where: { id: asset.id },
        data: {
          url: cached.url,
          storageKey: cached.storageKey,
          mimeType: cached.mimeType
        }
      });
      summary.cached += 1;
      console.log(`${label} -> ${cached.url}`);
    } catch (error) {
      summary.failed += 1;
      console.warn(`${label} -> failed: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }

  console.log(JSON.stringify(summary, null, 2));
}

function getAssetSaintIds(asset: {
  primaryForSaints: Array<{ id: string }>;
  saintGalleryImages: Array<{ saintId: string }>;
}) {
  return [
    ...asset.primaryForSaints.map((saint) => saint.id),
    ...asset.saintGalleryImages.map((image) => image.saintId)
  ];
}

function getFreshAttachmentUrls(
  asset: {
    caption: string | null;
    primaryForSaints: Array<{ id: string }>;
    saintGalleryImages: Array<{ saintId: string }>;
  },
  recordIdBySaintId: Map<string, string>,
  attachmentsByRecordId: Map<string, AirtableAttachment[]>
) {
  const attachments = getAssetSaintIds(asset).flatMap((saintId) => {
    const recordId = recordIdBySaintId.get(saintId);
    return recordId ? attachmentsByRecordId.get(recordId) ?? [] : [];
  });
  const matching = asset.caption
    ? attachments.filter((attachment) => attachment.filename === asset.caption)
    : attachments.length === 1
      ? attachments
      : [];

  return matching.flatMap((attachment) => [
    attachment.thumbnails?.large?.url,
    attachment.thumbnails?.full?.url,
    attachment.url
  ]);
}

function getPictureAttachments(rawFieldsJson: unknown): AirtableAttachment[] {
  if (!rawFieldsJson || typeof rawFieldsJson !== "object" || Array.isArray(rawFieldsJson)) return [];
  const value = (rawFieldsJson as Record<string, unknown>)["Picture(s) of Saint"];
  if (!Array.isArray(value)) return [];

  return value.filter(
    (attachment): attachment is AirtableAttachment =>
      Boolean(attachment && typeof attachment === "object" && !Array.isArray(attachment))
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
