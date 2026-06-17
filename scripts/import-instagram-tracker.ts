import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Prisma } from "../lib/generated/prisma/client";
import { db } from "../lib/db";

type TrackerRow = {
  rowNumber: number;
  raw: Record<string, string>;
  saintName?: string;
  postUrl?: string;
  postedAt?: Date;
  sourceRowKey: string;
};

type AirtableSaintCandidate = {
  id: string;
  recordId: string;
  name: string;
  normalizedName: string;
  coreName: string;
};

const HONORIFICS = new Set([
  "108",
  "baba",
  "bhagat",
  "ji",
  "mahant",
  "maharaj",
  "maharaja",
  "maharishi",
  "maharshi",
  "paramahamsa",
  "paramahansa",
  "saint",
  "sant",
  "shri",
  "sri",
  "srila",
  "swami"
]);

function parseArgs(argv: string[]) {
  return {
    file: getArg(argv, "--file"),
    csvUrl: getArg(argv, "--csv-url") ?? process.env.GOOGLE_SHEETS_TRACKER_CSV_URL,
    dryRun: argv.includes("--dry-run")
  };
}

function getArg(argv: string[], key: string) {
  const inline = argv.find((arg) => arg.startsWith(`${key}=`));
  if (inline) return inline.split("=", 2)[1];

  const index = argv.indexOf(key);
  return index >= 0 ? argv[index + 1] : undefined;
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

  return dataRows.map((cells, rowIndex) => {
    const raw: Record<string, string> = {};
    headerRow.forEach((header, cellIndex) => {
      raw[header.trim()] = cells[cellIndex]?.trim() ?? "";
    });

    return normalizeTrackerRow(raw, rowIndex + 2);
  });
}

function normalizeTrackerRow(raw: Record<string, string>, rowNumber: number): TrackerRow {
  const saintName = pickField(raw, [
    "saint",
    "saint name",
    "name",
    "person",
    "posted saint",
    "subject"
  ]);
  const postUrl = pickField(raw, [
    "instagram url",
    "instagram",
    "post url",
    "url",
    "link",
    "post"
  ]);
  const dateValue = pickField(raw, [
    "date",
    "posted at",
    "post date",
    "published date"
  ]);
  const postedAt = parseDate(dateValue);
  const hash = createHash("sha256")
    .update(JSON.stringify(raw))
    .digest("hex")
    .slice(0, 16);
  const sourceRowKey = postUrl ? `url:${postUrl}` : `row:${rowNumber}:${hash}`;

  return {
    rowNumber,
    raw,
    saintName,
    postUrl,
    postedAt,
    sourceRowKey
  };
}

function pickField(raw: Record<string, string>, candidates: string[]) {
  const entries = Object.entries(raw);
  const match = entries.find(([key]) => candidates.includes(key.trim().toLowerCase()));
  return match?.[1]?.trim() || undefined;
}

function parseDate(value: string | undefined) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function normalizeName(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((token) => token && !HONORIFICS.has(token))
    .join(" ")
    .trim();
}

function coreName(value: unknown) {
  return normalizeName(String(value ?? "").split(/\s+of\s+/i)[0]);
}

function tokenCount(value: string) {
  return value.split(/\s+/).filter(Boolean).length;
}

function getMatch(row: TrackerRow, candidates: AirtableSaintCandidate[]) {
  const normalized = normalizeName(row.saintName);
  const core = coreName(row.saintName);

  if (!normalized) {
    return { status: "needs_review" as const, confidence: undefined, notes: "Missing saint name." };
  }

  const exactMatches = candidates.filter((candidate) => candidate.normalizedName === normalized);
  if (exactMatches.length === 1) {
    return {
      status: "matched" as const,
      confidence: "high" as const,
      candidate: exactMatches[0],
      notes: "Exact normalized Airtable saint name match."
    };
  }

  const coreMatches = candidates.filter((candidate) => candidate.coreName === core);
  if (coreMatches.length === 1 && tokenCount(core) >= 2) {
    return {
      status: "matched" as const,
      confidence: "high" as const,
      candidate: coreMatches[0],
      notes: "Exact normalized core-name match."
    };
  }

  const containedMatches = candidates.filter((candidate) => {
    if (tokenCount(core) < 2) return false;
    return candidate.normalizedName.includes(core) || normalized.includes(candidate.coreName);
  });
  if (containedMatches.length === 1) {
    return {
      status: "matched" as const,
      confidence: "medium" as const,
      candidate: containedMatches[0],
      notes: "Unique contained-name match; review spelling/place context."
    };
  }

  return {
    status: "needs_review" as const,
    confidence: undefined,
    notes: exactMatches.length + coreMatches.length + containedMatches.length > 1
      ? "Ambiguous tracker name; multiple Airtable saints matched."
      : "No obvious Airtable saint match."
  };
}

async function loadTrackerRows(file: string | undefined, csvUrl: string | undefined) {
  if (file) return parseCsv(await readFile(file, "utf8"));
  if (!csvUrl) {
    throw new Error("Missing --file, --csv-url, or GOOGLE_SHEETS_TRACKER_CSV_URL.");
  }

  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error(`Google Sheets CSV fetch failed: ${response.status} ${response.statusText}`);
  }

  return parseCsv(await response.text());
}

async function loadAirtableSaintCandidates() {
  const records = await db.airtableMirrorRecord.findMany({
    where: { tableIdOrName: "Saints" },
    select: {
      id: true,
      recordId: true,
      rawFieldsJson: true
    }
  });

  return records
    .map((record) => {
      const fields = record.rawFieldsJson as Record<string, unknown>;
      const name = String(fields.Name ?? "").trim();

      return {
        id: record.id,
        recordId: record.recordId,
        name,
        normalizedName: normalizeName(name),
        coreName: coreName(name)
      };
    })
    .filter((candidate) => candidate.name && candidate.normalizedName);
}

async function refreshAirtableInstagramFlags() {
  const matches = await db.instagramTrackerRow.groupBy({
    by: ["matchedAirtableRecordId"],
    where: {
      matchStatus: "matched",
      matchedAirtableRecordId: { not: null }
    },
    _count: { _all: true }
  });
  const matchedIds = matches
    .map((match) => match.matchedAirtableRecordId)
    .filter(Boolean) as string[];

  await db.airtableMirrorRecord.updateMany({
    where: { tableIdOrName: "Saints" },
    data: {
      hasInstagramContent: false,
      instagramTrackerMatchCount: 0,
      instagramTrackerLastMatchedAt: null
    }
  });

  for (const match of matches) {
    if (!match.matchedAirtableRecordId) continue;
    await db.airtableMirrorRecord.update({
      where: { id: match.matchedAirtableRecordId },
      data: {
        hasInstagramContent: true,
        instagramTrackerMatchCount: match._count._all,
        instagramTrackerLastMatchedAt: new Date()
      }
    });
  }

  return matchedIds.length;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const trackerRows = await loadTrackerRows(options.file, options.csvUrl);
  const candidates = await loadAirtableSaintCandidates();
  const batch = options.dryRun
    ? undefined
    : await db.importBatch.create({
        data: {
          sourceType: "csv",
          sourceName: "Instagram Google Sheets tracker",
          status: "running",
          rawSummary: JSON.stringify({ rows: trackerRows.length })
        }
      });
  const summary = {
    rows: trackerRows.length,
    matched: 0,
    needsReview: 0
  };

  for (const row of trackerRows) {
    const match = getMatch(row, candidates);
    if (match.status === "matched") summary.matched += 1;
    if (match.status === "needs_review") summary.needsReview += 1;

    console.log(
      `${row.rowNumber}: ${row.saintName ?? "(missing name)"} -> ${match.status}` +
        (match.candidate ? ` (${match.candidate.recordId}: ${match.candidate.name})` : "")
    );

    if (options.dryRun) continue;

    await db.instagramTrackerRow.upsert({
      where: {
        sourceName_sourceRowKey: {
          sourceName: "google_sheets",
          sourceRowKey: row.sourceRowKey
        }
      },
      create: {
        sourceName: "google_sheets",
        sourceRowKey: row.sourceRowKey,
        rowNumber: row.rowNumber,
        saintName: row.saintName,
        postUrl: row.postUrl,
        postedAt: row.postedAt,
        rawPayloadJson: row.raw as Prisma.InputJsonValue,
        matchStatus: match.status,
        matchConfidence: match.confidence,
        matchedAirtableRecordId: match.candidate?.id,
        matchedAt: match.candidate ? new Date() : undefined,
        sourceImportBatchId: batch?.id,
        notes: match.notes
      },
      update: {
        rowNumber: row.rowNumber,
        saintName: row.saintName,
        postUrl: row.postUrl,
        postedAt: row.postedAt,
        rawPayloadJson: row.raw as Prisma.InputJsonValue,
        matchStatus: match.status,
        matchConfidence: match.confidence,
        matchedAirtableRecordId: match.candidate?.id ?? null,
        matchedAt: match.candidate ? new Date() : null,
        sourceImportBatchId: batch?.id,
        notes: match.notes
      }
    });
  }

  if (!options.dryRun) {
    const flaggedSaints = await refreshAirtableInstagramFlags();
    await db.importBatch.update({
      where: { id: batch!.id },
      data: {
        completedAt: new Date(),
        status: "completed",
        rawSummary: JSON.stringify({ ...summary, flaggedAirtableSaints: flaggedSaints })
      }
    });
    console.log(`Flagged ${flaggedSaints} Airtable mirror saint(s) with Instagram content.`);
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
