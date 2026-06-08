import { db } from "../lib/db";

const AIRTABLE_TABLE = "Saints";

function parseArgs(argv: string[]) {
  return {
    dryRun: !argv.includes("--write")
  };
}

async function getObviousSaintIds() {
  const mirrors = await db.airtableMirrorRecord.findMany({
    where: {
      tableIdOrName: AIRTABLE_TABLE,
      hasInstagramContent: true
    },
    select: {
      baseId: true,
      recordId: true,
      instagramTrackerRows: {
        select: {
          matchStatus: true,
          matchConfidence: true
        }
      }
    }
  });

  const externalIds = mirrors
    .filter((mirror) => {
      return mirror.instagramTrackerRows.length > 0
        && mirror.instagramTrackerRows.every((row) => row.matchStatus === "matched" && row.matchConfidence === "high");
    })
    .map((mirror) => `${mirror.baseId}:${AIRTABLE_TABLE}:${mirror.recordId}`);

  const externalRecords = await db.externalRecord.findMany({
    where: {
      sourceType: "airtable",
      externalId: { in: externalIds },
      entityType: "Saint",
      entityId: { not: null }
    },
    select: { entityId: true }
  });

  return Array.from(new Set(externalRecords.map((record) => record.entityId).filter(Boolean))) as string[];
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const saintIds = await getObviousSaintIds();

  if (options.dryRun) {
    console.log(`Dry run: would publish ${saintIds.length} high-confidence imported CMS saint(s).`);
    return;
  }

  const now = new Date();
  const result = await db.saint.updateMany({
    where: {
      id: { in: saintIds },
      status: { in: ["draft", "needs_review"] },
      hasInstagramContent: true
    },
    data: {
      status: "published",
      reviewedAt: now,
      publishedAt: now
    }
  });

  console.log(`Published ${result.count} high-confidence imported CMS saint(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
