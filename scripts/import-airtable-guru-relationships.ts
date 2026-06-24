import "dotenv/config";
import { db } from "../lib/db";

type AirtableFields = Record<string, unknown>;

type GuruRelationshipPlan = {
  discipleRecordId: string;
  guruRecordId: string;
  discipleSaintId?: string | null;
  guruSaintId?: string | null;
};

const AIRTABLE_TABLE = "Saints";
const IMPORTER_NOTE = "Imported from Airtable Master(s) field; pending editorial review.";

function parseArgs(argv: string[]) {
  return {
    dryRun: !argv.includes("--write"),
    limit: numberArg(argv, "--limit")
  };
}

function numberArg(argv: string[], key: string) {
  const inline = argv.find((arg) => arg.startsWith(`${key}=`));
  const value = inline ? inline.split("=", 2)[1] : argv[argv.indexOf(key) + 1];
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function asObject(value: unknown): AirtableFields {
  return value && typeof value === "object" && !Array.isArray(value) ? value as AirtableFields : {};
}

function linkedRecordIds(fields: AirtableFields, key: string) {
  const value = fields[key];
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

async function buildExternalSaintMap(rows: Array<{ baseId: string; recordId: string }>) {
  const externalIds = rows.map((row) => `${row.baseId}:${AIRTABLE_TABLE}:${row.recordId}`);
  const externalRecords = await db.externalRecord.findMany({
    where: {
      sourceType: "airtable",
      externalId: { in: externalIds },
      entityType: "Saint"
    },
    select: {
      externalId: true,
      entityId: true
    }
  });

  return new Map(externalRecords.map((record) => [record.externalId, record.entityId]));
}

async function buildPlans() {
  const rows = await db.airtableMirrorRecord.findMany({
    where: { tableIdOrName: AIRTABLE_TABLE },
    orderBy: { recordId: "asc" },
    select: {
      baseId: true,
      recordId: true,
      rawFieldsJson: true
    }
  });
  const saintIdByExternalId = await buildExternalSaintMap(rows);
  const plans: GuruRelationshipPlan[] = [];

  for (const row of rows) {
    const fields = asObject(row.rawFieldsJson);
    const guruRecordIds = linkedRecordIds(fields, "Master(s)");
    if (guruRecordIds.length === 0) continue;

    const discipleSaintId = saintIdByExternalId.get(`${row.baseId}:${AIRTABLE_TABLE}:${row.recordId}`);
    for (const guruRecordId of guruRecordIds) {
      plans.push({
        discipleRecordId: row.recordId,
        guruRecordId,
        discipleSaintId,
        guruSaintId: saintIdByExternalId.get(`${row.baseId}:${AIRTABLE_TABLE}:${guruRecordId}`)
      });
    }
  }

  return plans;
}

async function classifyPlan(plan: GuruRelationshipPlan) {
  if (!plan.discipleSaintId) return "skipped_unmapped_disciple" as const;
  if (!plan.guruSaintId) return "skipped_unmapped_guru" as const;
  if (plan.discipleSaintId === plan.guruSaintId) return "skipped_self_relationship" as const;

  const existing = await db.saintRelationship.findFirst({
    where: {
      fromSaintId: plan.discipleSaintId,
      toSaintId: plan.guruSaintId,
      relationshipType: "guru"
    },
    select: { id: true }
  });

  return existing ? "existing" as const : "create" as const;
}

function emptyCounts() {
  return {
    create: 0,
    existing: 0,
    skippedUnmappedDisciple: 0,
    skippedUnmappedGuru: 0,
    skippedSelfRelationship: 0
  };
}

function addClassification(counts: ReturnType<typeof emptyCounts>, classification: Awaited<ReturnType<typeof classifyPlan>>) {
  if (classification === "create") counts.create += 1;
  if (classification === "existing") counts.existing += 1;
  if (classification === "skipped_unmapped_disciple") counts.skippedUnmappedDisciple += 1;
  if (classification === "skipped_unmapped_guru") counts.skippedUnmappedGuru += 1;
  if (classification === "skipped_self_relationship") counts.skippedSelfRelationship += 1;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const plans = (await buildPlans()).slice(0, options.limit);
  const counts = emptyCounts();

  for (const plan of plans) {
    const classification = await classifyPlan(plan);
    addClassification(counts, classification);

    if (!options.dryRun && classification === "create" && plan.discipleSaintId && plan.guruSaintId) {
      await db.saintRelationship.create({
        data: {
          fromSaintId: plan.discipleSaintId,
          toSaintId: plan.guruSaintId,
          relationshipType: "guru",
          confidence: "medium",
          notes: IMPORTER_NOTE
        }
      });
    }
  }

  console.log(`${options.dryRun ? "Dry run: would create" : "Created"} ${counts.create} guru relationship records.`);
  console.log(`Existing guru relationships skipped: ${counts.existing}`);
  console.log(`Unmapped disciples skipped: ${counts.skippedUnmappedDisciple}`);
  console.log(`Unmapped gurus skipped: ${counts.skippedUnmappedGuru}`);
  console.log(`Self relationships skipped: ${counts.skippedSelfRelationship}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
