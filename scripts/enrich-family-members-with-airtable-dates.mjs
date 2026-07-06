import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const membersPath = path.join(root, "exports", "airtable-saint-family-members.csv");
const AIRTABLE_API_URL = "https://api.airtable.com/v0";
const AIRTABLE_TABLE = "Saints";
const DATE_FIELDS = ["Birth (YYYY-MM-DD)", "Samadhi (YYYY-MM-DD)"];

function loadDotenv() {
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, raw] = match;
    if (process.env[key]) continue;
    process.env[key] = raw.replace(/^"|"$/g, "");
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (ch === '"' && next === '"') {
        value += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        value += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(value);
      value = "";
    } else if (ch === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += ch;
    }
  }
  if (value.length || row.length) {
    row.push(value.replace(/\r$/, ""));
    rows.push(row);
  }
  const headers = rows.shift().map((h) => h.trim().replace(/^\uFEFF/, ""));
  return {
    headers,
    records: rows
      .filter((r) => r.some((cell) => cell !== ""))
      .map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""]))),
  };
}

function csvEscape(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function chunk(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

function yearFromDate(value) {
  const match = String(value || "").match(/\b(\d{3,4})\b/);
  return match ? match[1] : "";
}

async function fetchDateRows(ids) {
  loadDotenv();
  const baseId = process.env.AIRTABLE_BASE_ID;
  const token = process.env.AIRTABLE_ACCESS_TOKEN ?? process.env.AIRTABLE_PAT ?? process.env.AIRTABLE_API_KEY;
  if (!baseId) throw new Error("Missing AIRTABLE_BASE_ID.");
  if (!token) throw new Error("Missing AIRTABLE_ACCESS_TOKEN, AIRTABLE_PAT, or AIRTABLE_API_KEY.");

  const result = new Map();
  for (const batch of chunk(ids, 20)) {
    const url = new URL(`${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(AIRTABLE_TABLE)}`);
    url.searchParams.set("filterByFormula", `OR(${batch.map((id) => `RECORD_ID()='${id}'`).join(",")})`);
    for (const field of DATE_FIELDS) url.searchParams.append("fields[]", field);
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error(`Airtable request failed: ${response.status} ${await response.text()}`);
    }
    const json = await response.json();
    for (const record of json.records ?? []) {
      const birth = record.fields?.["Birth (YYYY-MM-DD)"] ?? "";
      const samadhi = record.fields?.["Samadhi (YYYY-MM-DD)"] ?? "";
      result.set(record.id, {
        BirthDate: birth,
        SamadhiDate: samadhi,
        BirthYear: yearFromDate(birth),
        SamadhiYear: yearFromDate(samadhi),
      });
    }
  }
  return result;
}

const { headers, records } = parseCsv(fs.readFileSync(membersPath, "utf8"));
const ids = [...new Set(records.map((record) => record.RecordId).filter(Boolean))];
const dates = await fetchDateRows(ids);
const dateHeaders = ["BirthDate", "SamadhiDate", "BirthYear", "SamadhiYear"];
const outputHeaders = [...headers.filter((h) => !dateHeaders.includes(h)), ...dateHeaders];
const outputRows = records.map((record) => {
  const dateInfo = dates.get(record.RecordId) ?? {};
  return { ...record, ...dateInfo };
});

fs.writeFileSync(
  membersPath,
  [outputHeaders, ...outputRows.map((record) => outputHeaders.map((header) => record[header] ?? ""))]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n") + "\n"
);

const datedCount = outputRows.filter((row) => row.BirthYear || row.SamadhiYear).length;
console.log(`Updated ${membersPath} with date columns. ${datedCount}/${outputRows.length} family members have at least one parsed year.`);
