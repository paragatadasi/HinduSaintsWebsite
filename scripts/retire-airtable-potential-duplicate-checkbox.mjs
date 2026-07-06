import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const AIRTABLE_API_URL = "https://api.airtable.com/v0";
const AIRTABLE_META_URL = "https://api.airtable.com/v0/meta";
const AIRTABLE_TABLE = "Saints";
const RETIRED_FIELD = "Potential duplicate";

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

function getConfig() {
  loadDotenv();
  const baseId = process.env.AIRTABLE_BASE_ID;
  const token = process.env.AIRTABLE_ACCESS_TOKEN ?? process.env.AIRTABLE_PAT ?? process.env.AIRTABLE_API_KEY;
  if (!baseId) throw new Error("Missing AIRTABLE_BASE_ID.");
  if (!token) throw new Error("Missing AIRTABLE_ACCESS_TOKEN, AIRTABLE_PAT, or AIRTABLE_API_KEY.");
  return { baseId, token };
}

async function airtableFetch(url, options = {}) {
  const { token } = getConfig();
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(`Airtable request failed: ${response.status} ${await response.text()}`);
  return response.json();
}

async function fetchAllSaints() {
  const { baseId } = getConfig();
  const records = [];
  let offset = "";
  do {
    const url = new URL(`${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(AIRTABLE_TABLE)}`);
    if (offset) url.searchParams.set("offset", offset);
    const json = await airtableFetch(url);
    records.push(...(json.records ?? []));
    offset = json.offset ?? "";
  } while (offset);
  return records;
}

async function patchRecords(updates) {
  const { baseId } = getConfig();
  for (let i = 0; i < updates.length; i += 10) {
    await airtableFetch(`${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(AIRTABLE_TABLE)}`, {
      method: "PATCH",
      body: JSON.stringify({ records: updates.slice(i, i + 10) }),
    });
  }
}

async function main() {
  const { baseId } = getConfig();
  const schema = await airtableFetch(`${AIRTABLE_META_URL}/bases/${baseId}/tables`);
  const table = schema.tables?.find((candidate) => candidate.name === AIRTABLE_TABLE || candidate.id === AIRTABLE_TABLE);
  const field = table?.fields?.find((candidate) => candidate.name === RETIRED_FIELD);
  if (!field) {
    console.log(`No retired "${RETIRED_FIELD}" field found.`);
    return;
  }
  if (field.type !== "checkbox") {
    throw new Error(`Refusing to clear "${RETIRED_FIELD}" because it is type "${field.type}", not checkbox.`);
  }

  const records = await fetchAllSaints();
  const updates = records
    .filter((record) => record.fields?.[RETIRED_FIELD])
    .map((record) => ({ id: record.id, fields: { [RETIRED_FIELD]: false } }));

  await patchRecords(updates);
  console.log(`Cleared retired checkbox "${RETIRED_FIELD}" on ${updates.length} record(s).`);
}

await main();
