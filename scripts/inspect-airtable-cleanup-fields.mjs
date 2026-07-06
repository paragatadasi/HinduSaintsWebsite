import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const AIRTABLE_META_URL = "https://api.airtable.com/v0/meta";
const AIRTABLE_TABLE = "Saints";

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

async function main() {
  const { baseId } = getConfig();
  const schema = await airtableFetch(`${AIRTABLE_META_URL}/bases/${baseId}/tables`);
  const table = schema.tables?.find((candidate) => candidate.name === AIRTABLE_TABLE || candidate.id === AIRTABLE_TABLE);
  if (!table) throw new Error(`Could not find Airtable table "${AIRTABLE_TABLE}".`);

  const interesting = /Potential duplicate|Partner|Incarnation|Spiritual Region|From field/i;
  for (const field of table.fields.filter((candidate) => interesting.test(candidate.name))) {
    console.log(JSON.stringify({
      id: field.id,
      name: field.name,
      type: field.type,
      options: field.options ?? null,
    }, null, 2));
  }
}

await main();
