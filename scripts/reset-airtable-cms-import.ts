import "dotenv/config";
import { pathToFileURL } from "node:url";
import { db } from "../lib/db";

export type ResetCounts = {
  airtableSaintExternalRecords: number;
  airtableRelationshipExternalRecords: number;
  airtableFamilyExternalRecords: number;
  airtableMuseumExternalRecords: number;
  airtableSaintIds: string[];
  saintRelationships: number;
  saintRelationshipSources: number;
  saintFamilies: number;
  saintFamilyMembers: number;
  duplicateCandidates: number;
  saintMuseumSections: number;
  museumSections: number;
  airtableImportJobs: number;
  saints: number;
};

function parseArgs(argv: string[]) {
  return {
    write: argv.includes("--write"),
    keepJobs: argv.includes("--keep-jobs")
  };
}

export async function collectAirtableCmsResetCounts(): Promise<ResetCounts> {
  const saintExternalRecords = await db.externalRecord.findMany({
    where: { sourceType: "airtable", entityType: "Saint", entityId: { not: null } },
    select: { id: true, entityId: true }
  });
  const airtableSaintIds = uniqueStrings(saintExternalRecords.map((record) => record.entityId));

  const [
    airtableRelationshipExternalRecords,
    airtableFamilyExternalRecords,
    airtableMuseumExternalRecords,
    saintRelationships,
    saintRelationshipSources,
    saintFamilies,
    saintFamilyMembers,
    duplicateCandidates,
    saintMuseumSections,
    museumSections,
    airtableImportJobs
  ] = await Promise.all([
    db.externalRecord.count({ where: { sourceType: "airtable", entityType: { in: ["SaintRelationship", "Relationship"] } } }),
    db.externalRecord.count({ where: { sourceType: "airtable", entityType: { in: ["SaintFamily", "SaintFamilyMember", "Family"] } } }),
    db.externalRecord.count({ where: { sourceType: "airtable", entityType: { in: ["MuseumSection", "SaintMuseumSection"] } } }),
    db.saintRelationship.count({
      where: {
        OR: [
          { fromSaintId: { in: airtableSaintIds } },
          { toSaintId: { in: airtableSaintIds } },
          { externalRecord: { sourceType: "airtable" } },
          { notes: { contains: "Airtable", mode: "insensitive" } }
        ]
      }
    }),
    db.saintRelationshipSource.count({
      where: {
        OR: [
          { externalRecord: { sourceType: "airtable" } },
          { relationship: { OR: [{ fromSaintId: { in: airtableSaintIds } }, { toSaintId: { in: airtableSaintIds } }] } }
        ]
      }
    }),
    db.saintFamily.count({ where: { OR: [{ sourceExternalId: { not: null } }, { notes: { contains: "Airtable", mode: "insensitive" } }] } }),
    db.saintFamilyMember.count({
      where: { OR: [{ saintId: { in: airtableSaintIds } }, { externalRecord: { sourceType: "airtable" } }] }
    }),
    db.duplicateCandidate.count({ where: { OR: [{ sourceType: "airtable" }, { entityId: { in: airtableSaintIds } }, { candidateEntityId: { in: airtableSaintIds } }] } }),
    db.saintMuseumSection.count({
      where: { OR: [{ saintId: { in: airtableSaintIds } }, { externalRecord: { sourceType: "airtable" } }] }
    }),
    db.museumSection.count({ where: { assignments: { some: {} } } }),
    db.airtableImportJob.count()
  ]);

  return {
    airtableSaintExternalRecords: saintExternalRecords.length,
    airtableRelationshipExternalRecords,
    airtableFamilyExternalRecords,
    airtableMuseumExternalRecords,
    airtableSaintIds,
    saintRelationships,
    saintRelationshipSources,
    saintFamilies,
    saintFamilyMembers,
    duplicateCandidates,
    saintMuseumSections,
    museumSections,
    airtableImportJobs,
    saints: airtableSaintIds.length
  };
}

export async function resetAirtableCmsImport({ keepJobs }: { keepJobs: boolean }) {
  const counts = await collectAirtableCmsResetCounts();
  const saintIds = counts.airtableSaintIds;

  await db.$transaction(async (tx) => {
    await tx.saintRelationshipSource.deleteMany({
      where: {
        OR: [
          { externalRecord: { sourceType: "airtable" } },
          { relationship: { OR: [{ fromSaintId: { in: saintIds } }, { toSaintId: { in: saintIds } }] } }
        ]
      }
    });
    await tx.saintRelationship.deleteMany({
      where: {
        OR: [
          { fromSaintId: { in: saintIds } },
          { toSaintId: { in: saintIds } },
          { externalRecord: { sourceType: "airtable" } },
          { notes: { contains: "Airtable", mode: "insensitive" } }
        ]
      }
    });
    await tx.duplicateCandidate.deleteMany({
      where: { OR: [{ sourceType: "airtable" }, { entityId: { in: saintIds } }, { candidateEntityId: { in: saintIds } }] }
    });
    await tx.saintMuseumSection.deleteMany({
      where: { OR: [{ saintId: { in: saintIds } }, { externalRecord: { sourceType: "airtable" } }] }
    });
    await tx.museumSection.deleteMany({
      where: { assignments: { none: {} }, publicVisible: false }
    });
    await tx.saintFamilyMember.deleteMany({
      where: { OR: [{ saintId: { in: saintIds } }, { externalRecord: { sourceType: "airtable" } }] }
    });
    await tx.saintFamily.deleteMany({
      where: { members: { none: {} }, publicVisible: false }
    });
    await tx.contentSource.deleteMany({
      where: { entityType: "Saint", entityId: { in: saintIds } }
    });
    await tx.externalRecord.deleteMany({
      where: {
        sourceType: "airtable",
        OR: [
          { entityType: "Saint" },
          { entityType: { in: ["SaintRelationship", "Relationship", "SaintFamily", "SaintFamilyMember", "Family", "MuseumSection", "SaintMuseumSection"] } }
        ]
      }
    });
    await tx.saint.deleteMany({ where: { id: { in: saintIds } } });
    if (!keepJobs) await tx.airtableImportJob.deleteMany();
  });

  return counts;
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function printCounts(label: string, counts: ResetCounts, keepJobs: boolean) {
  console.log(label);
  console.log(`Airtable-linked CMS saints: ${counts.saints}`);
  console.log(`Airtable saint ExternalRecord rows: ${counts.airtableSaintExternalRecords}`);
  console.log(`Saint relationships: ${counts.saintRelationships}`);
  console.log(`Saint relationship source rows: ${counts.saintRelationshipSources}`);
  console.log(`Saint families: ${counts.saintFamilies}`);
  console.log(`Saint family memberships: ${counts.saintFamilyMembers}`);
  console.log(`Duplicate candidates: ${counts.duplicateCandidates}`);
  console.log(`Saint museum section assignments: ${counts.saintMuseumSections}`);
  console.log(`Museum sections with assignments: ${counts.museumSections}`);
  console.log(`Relationship/family/museum ExternalRecord rows: ${counts.airtableRelationshipExternalRecords + counts.airtableFamilyExternalRecords + counts.airtableMuseumExternalRecords}`);
  console.log(`Airtable import jobs${keepJobs ? " retained" : ""}: ${counts.airtableImportJobs}`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const before = await collectAirtableCmsResetCounts();
  printCounts(options.write ? "Preparing to reset Airtable-derived CMS import data:" : "Dry run: Airtable-derived CMS import data that would be reset:", before, options.keepJobs);

  if (!options.write) {
    console.log("No data was changed. Re-run with --write to reset these rows.");
    return;
  }

  await resetAirtableCmsImport({ keepJobs: options.keepJobs });
  const after = await collectAirtableCmsResetCounts();
  printCounts("After reset:", after, options.keepJobs);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await db.$disconnect();
    });
}
