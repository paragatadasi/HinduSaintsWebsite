import { Prisma } from "../lib/generated/prisma/client";
import { db } from "../lib/db";

type AirtableRecord = {
  id: string;
  createdTime?: string;
  fields: Record<string, unknown>;
};

type AirtableListResponse = {
  records?: AirtableRecord[];
  offset?: string;
  error?: {
    type?: string;
    message?: string;
  };
};

type ImportOptions = {
  baseId: string;
  token: string;
  tables: string[];
  view?: string;
  dryRun: boolean;
};

const AIRTABLE_API_URL = "https://api.airtable.com/v0";

function parseArgs(argv: string[]) {
  const args = new Map<string, string | boolean>();

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (!value.startsWith("--")) continue;

    const [rawKey, inlineValue] = value.slice(2).split("=", 2);
    if (inlineValue !== undefined) {
      args.set(rawKey, inlineValue);
      continue;
    }

    const nextValue = argv[index + 1];
    if (nextValue && !nextValue.startsWith("--")) {
      args.set(rawKey, nextValue);
      index += 1;
    } else {
      args.set(rawKey, true);
    }
  }

  return args;
}

function listFromCsv(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getStringArg(args: Map<string, string | boolean>, key: string) {
  const value = args.get(key);
  return typeof value === "string" ? value : undefined;
}

function getOptions(): ImportOptions {
  const args = parseArgs(process.argv.slice(2));
  const baseId = getStringArg(args, "base") ?? process.env.AIRTABLE_BASE_ID;
  const token =
    process.env.AIRTABLE_ACCESS_TOKEN ??
    process.env.AIRTABLE_PAT ??
    process.env.AIRTABLE_API_KEY;
  const tables =
    listFromCsv(getStringArg(args, "tables")).length > 0
      ? listFromCsv(getStringArg(args, "tables"))
      : listFromCsv(process.env.AIRTABLE_TABLES);

  if (!baseId) {
    throw new Error("Missing AIRTABLE_BASE_ID or --base.");
  }

  if (!token) {
    throw new Error("Missing AIRTABLE_ACCESS_TOKEN, AIRTABLE_PAT, or AIRTABLE_API_KEY.");
  }

  if (tables.length === 0) {
    throw new Error("Missing AIRTABLE_TABLES or --tables. Use a comma-separated list of table IDs or names.");
  }

  return {
    baseId,
    token,
    tables,
    view: getStringArg(args, "view") ?? process.env.AIRTABLE_VIEW,
    dryRun: args.has("dry-run")
  };
}

function buildAirtableUrl(options: ImportOptions, table: string, offset?: string) {
  const url = new URL(`${AIRTABLE_API_URL}/${options.baseId}/${encodeURIComponent(table)}`);
  url.searchParams.set("pageSize", "100");

  if (options.view) {
    url.searchParams.set("view", options.view);
  }

  if (offset) {
    url.searchParams.set("offset", offset);
  }

  return url;
}

async function fetchTableRecords(options: ImportOptions, table: string) {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const response = await fetch(buildAirtableUrl(options, table, offset), {
      headers: {
        Authorization: `Bearer ${options.token}`
      }
    });

    const payload = (await response.json()) as AirtableListResponse;

    if (!response.ok) {
      const message = payload.error?.message ?? response.statusText;
      throw new Error(`Airtable ${response.status} while reading "${table}": ${message}`);
    }

    records.push(...(payload.records ?? []));
    offset = payload.offset;
  } while (offset);

  return records;
}

function asJson(value: unknown) {
  return value as Prisma.InputJsonValue;
}

function parseAirtableDate(value: string | undefined) {
  return value ? new Date(value) : null;
}

async function mirrorRecord(options: ImportOptions, table: string, record: AirtableRecord, importBatchId: string) {
  const externalId = `${options.baseId}:${table}:${record.id}`;
  const rawPayload = {
    baseId: options.baseId,
    table,
    record
  };
  const now = new Date();

  await db.$transaction([
    db.airtableMirrorRecord.upsert({
      where: {
        baseId_tableIdOrName_recordId: {
          baseId: options.baseId,
          tableIdOrName: table,
          recordId: record.id
        }
      },
      create: {
        baseId: options.baseId,
        tableIdOrName: table,
        recordId: record.id,
        airtableCreatedTime: parseAirtableDate(record.createdTime),
        rawFieldsJson: asJson(record.fields),
        rawPayloadJson: asJson(rawPayload),
        sourceImportBatchId: importBatchId,
        firstSeenAt: now,
        lastSeenAt: now,
        importedAt: now
      },
      update: {
        airtableCreatedTime: parseAirtableDate(record.createdTime),
        rawFieldsJson: asJson(record.fields),
        rawPayloadJson: asJson(rawPayload),
        sourceImportBatchId: importBatchId,
        lastSeenAt: now,
        importedAt: now
      }
    }),
    db.externalRecord.upsert({
      where: {
        sourceType_externalId: {
          sourceType: "airtable",
          externalId
        }
      },
      create: {
        sourceType: "airtable",
        externalId,
        entityType: `airtable:${table}`,
        rawPayloadJson: asJson(rawPayload),
        importedAt: now,
        lastSeenAt: now
      },
      update: {
        rawPayloadJson: asJson(rawPayload),
        lastSeenAt: now
      }
    })
  ]);
}

async function main() {
  const options = getOptions();
  const startedAt = new Date();
  const summary: Record<string, number> = {};

  console.log(`Pulling Airtable base ${options.baseId}`);
  console.log(`Tables: ${options.tables.join(", ")}`);

  if (options.dryRun) {
    for (const table of options.tables) {
      const records = await fetchTableRecords(options, table);
      summary[table] = records.length;
      console.log(`[dry-run] ${table}: fetched ${records.length} records`);
    }
    return;
  }

  const batch = await db.importBatch.create({
    data: {
      sourceType: "airtable",
      sourceName: `Airtable ${options.baseId}`,
      status: "running",
      notes: options.view ? `View: ${options.view}` : undefined
    }
  });

  try {
    for (const table of options.tables) {
      const records = await fetchTableRecords(options, table);
      summary[table] = records.length;

      for (const record of records) {
        await mirrorRecord(options, table, record, batch.id);
      }

      console.log(`${table}: mirrored ${records.length} records`);
    }

    await db.importBatch.update({
      where: { id: batch.id },
      data: {
        completedAt: new Date(),
        status: "completed",
        rawSummary: JSON.stringify({
          baseId: options.baseId,
          tables: summary,
          startedAt: startedAt.toISOString(),
          completedAt: new Date().toISOString()
        })
      }
    });
  } catch (error) {
    await db.importBatch.update({
      where: { id: batch.id },
      data: {
        completedAt: new Date(),
        status: "failed",
        rawSummary: JSON.stringify({
          baseId: options.baseId,
          tables: summary,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    });

    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
