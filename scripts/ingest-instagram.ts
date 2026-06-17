import { readFile } from "node:fs/promises";
import { db } from "@/lib/db";
import { ingestInstagramRowsForCli, loadInstagramApiRows, type RawInstagramRow } from "@/lib/instagram-ingestion";

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

async function loadRows(file: string | undefined, urls: string[]) {
  if (!file) return urls.map((url) => ({ url }));

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

function parseCsv(input: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === "\"" && inQuotes && next === "\"") {
      current += "\"";
      index += 1;
      continue;
    }

    if (char === "\"") {
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

function isRawRow(value: unknown): value is RawInstagramRow {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const rows = options.api
    ? await loadInstagramApiRows({ limit: options.limit })
    : await loadRows(options.file, options.urls);
  const summary = await ingestInstagramRowsForCli({
    dryRun: options.dryRun,
    rows,
    sourceName: options.sourceName
  });

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
