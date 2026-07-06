import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const exportsDir = path.join(root, "exports");
const AIRTABLE_API_URL = "https://api.airtable.com/v0";
const AIRTABLE_META_URL = "https://api.airtable.com/v0/meta";
const AIRTABLE_TABLE = "Saints";

const museumUpdatesPath = path.join(exportsDir, "airtable-museum-section-updates.csv");
const relationshipUpdatesPath = path.join(exportsDir, "airtable-museum-section-relationship-updates.csv");
const sampradayaUpdatesPath = path.join(exportsDir, "airtable-museum-section-sampradaya-updates.csv");
const duplicateUpdatesPath = path.join(exportsDir, "airtable-museum-section-duplicate-updates.csv");
const familyLabelsPath = path.join(exportsDir, "airtable-saint-family-labels.csv");
const familyMembersPath = path.join(exportsDir, "airtable-saint-family-members.csv");
const appliedPath = path.join(exportsDir, "airtable-museum-section-updates-applied.csv");
const POTENTIAL_DUPLICATE_LINK_FIELD = "Potential duplicate match";

const fieldSpecs = [
  { name: "Primary Museum Section", type: "singleSelect" },
  { name: "Alternative Museum Sections", type: "multipleSelects" },
  { name: "Museum Section Tier", type: "singleSelect" },
  { name: "Museum Section Confidence", type: "singleSelect" },
  { name: "Museum Section Rationale", type: "multilineText" },
  { name: "Museum Section Internal Placement Note", type: "multilineText" },
  { name: "Family Label", type: "singleLineText" },
];

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
  if (value.length || row.length) row.push(value.replace(/\r$/, ""));
  if (row.length) rows.push(row);
  const [rawHeaders, ...data] = rows;
  const headers = rawHeaders.map((header) => header.trim().replace(/^\uFEFF/, ""));
  return data
    .filter((cells) => cells.some((cell) => cell !== ""))
    .map((cells) => Object.fromEntries(headers.map((header, i) => [header, cells[i] ?? ""])));
}

function csvEscape(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function writeCsv(filePath, rows, headers) {
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(headers.map((header) => csvEscape(row[header])).join(","));
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`);
}

function ids(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function splitMulti(value) {
  return String(value || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeSelectValue(value) {
  if (Array.isArray(value)) return value.map(String).join("; ");
  return String(value ?? "");
}

function sameValue(current, next) {
  if (Array.isArray(next)) {
    const a = [...ids(current)].map(String).sort();
    const b = [...next].map(String).sort();
    return a.length === b.length && a.every((value, i) => value === b[i]);
  }
  return normalizeSelectValue(current) === String(next ?? "");
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

async function getSaintsTable() {
  const { baseId } = getConfig();
  const schema = await airtableFetch(`${AIRTABLE_META_URL}/bases/${baseId}/tables`);
  const table = schema.tables?.find((candidate) => candidate.name === AIRTABLE_TABLE || candidate.id === AIRTABLE_TABLE);
  if (!table) throw new Error(`Could not find Airtable table "${AIRTABLE_TABLE}".`);
  return table;
}

async function ensureFields() {
  const { baseId } = getConfig();
  let table = await getSaintsTable();
  const existing = new Set((table.fields ?? []).map((field) => field.name));
  for (const spec of fieldSpecs) {
    if (existing.has(spec.name)) continue;
    await airtableFetch(`${AIRTABLE_META_URL}/bases/${baseId}/tables/${table.id}/fields`, {
      method: "POST",
      body: JSON.stringify({
        name: spec.name,
        type: spec.type,
        ...(spec.type === "singleSelect" || spec.type === "multipleSelects" ? { options: { choices: [] } } : {}),
      }),
    });
    existing.add(spec.name);
  }
  if (!existing.has(POTENTIAL_DUPLICATE_LINK_FIELD)) {
    await airtableFetch(`${AIRTABLE_META_URL}/bases/${baseId}/tables/${table.id}/fields`, {
      method: "POST",
      body: JSON.stringify({
        name: POTENTIAL_DUPLICATE_LINK_FIELD,
        type: "multipleRecordLinks",
        options: { linkedTableId: table.id },
      }),
    });
    existing.add(POTENTIAL_DUPLICATE_LINK_FIELD);
  }
  table = await getSaintsTable();
  return new Map((table.fields ?? []).map((field) => [field.name, field]));
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
  return records.map((record) => ({ id: record.id, fields: record.fields ?? {} }));
}

async function patchRecords(updates) {
  const { baseId } = getConfig();
  for (let i = 0; i < updates.length; i += 10) {
    await airtableFetch(`${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(AIRTABLE_TABLE)}`, {
      method: "PATCH",
      body: JSON.stringify({ records: updates.slice(i, i + 10), typecast: true }),
    });
  }
}

function addPatch(patches, recordsById, id, fields, applied, source) {
  const record = recordsById.get(id);
  if (!record) {
    applied.push({ Source: source, RecordId: id, Name: "", Status: "missing record", Fields: Object.keys(fields).join("; ") });
    return;
  }
  const changed = {};
  for (const [field, next] of Object.entries(fields)) {
    if (!sameValue(record.fields[field], next)) changed[field] = next;
  }
  if (!Object.keys(changed).length) {
    applied.push({ Source: source, RecordId: id, Name: record.fields.Name ?? "", Status: "already current", Fields: Object.keys(fields).join("; ") });
    return;
  }
  if (!patches.has(id)) patches.set(id, { id, fields: {} });
  Object.assign(patches.get(id).fields, changed);
  applied.push({ Source: source, RecordId: id, Name: record.fields.Name ?? "", Status: "queued", Fields: Object.keys(changed).join("; ") });
}

function familyLabelByRecord() {
  const labels = new Map(parseCsv(fs.readFileSync(familyLabelsPath, "utf8")).map((row) => [row["Family ID"], row["Proposed Family Label"]]));
  const map = new Map();
  for (const member of parseCsv(fs.readFileSync(familyMembersPath, "utf8"))) {
    const label = labels.get(member.FamilyID);
    if (label) map.set(member.RecordId, label);
  }
  return map;
}

function addLinkedRecordPatch(patches, recordsById, id, fieldName, linkedId, applied, source) {
  const record = recordsById.get(id);
  if (!record) {
    applied.push({ Source: source, RecordId: id, Name: "", Status: "missing record", Fields: fieldName });
    return false;
  }
  const pending = patches.get(id)?.fields?.[fieldName];
  const current = ids(pending ?? record.fields[fieldName]);
  if (current.includes(linkedId)) return false;
  if (!patches.has(id)) patches.set(id, { id, fields: {} });
  patches.get(id).fields[fieldName] = [...current, linkedId];
  applied.push({ Source: source, RecordId: id, Name: record.fields.Name ?? "", Status: "queued", Fields: fieldName });
  return true;
}

await ensureFields();
const records = await fetchAllSaints();
const recordsById = new Map(records.map((record) => [record.id, record]));
const patches = new Map();
const applied = [];

for (const row of parseCsv(fs.readFileSync(museumUpdatesPath, "utf8"))) {
  addPatch(
    patches,
    recordsById,
    row["Airtable Record ID"],
    {
      "Primary Museum Section": row["Primary Museum Section"],
      "Alternative Museum Sections": splitMulti(row["Alternative Museum Sections"]),
      "Museum Section Tier": row["Museum Section Tier"],
      "Museum Section Confidence": row["Museum Section Confidence"],
      "Museum Section Rationale": row["Museum Section Rationale"],
      "Museum Section Internal Placement Note": row["Museum Section Internal Placement Note"],
    },
    applied,
    "museum section"
  );
}

for (const [recordId, label] of familyLabelByRecord()) {
  addPatch(patches, recordsById, recordId, { "Family Label": label }, applied, "family label");
}

for (const row of parseCsv(fs.readFileSync(sampradayaUpdatesPath, "utf8"))) {
  addPatch(patches, recordsById, row["Airtable Record ID"], { Sampradaya: row["Proposed Sampradaya"] }, applied, "sampradaya");
}

for (const row of parseCsv(fs.readFileSync(relationshipUpdatesPath, "utf8"))) {
  const discipleId = row["Disciple Record ID"];
  const guruId = row["Guru Record ID"];
  if (!discipleId || !guruId) {
    applied.push({ Source: "relationship", RecordId: discipleId || guruId, Name: row["Disciple Name"] || row["Guru Name"], Status: "skipped absent linked record", Fields: row["Relationship Type"] });
    continue;
  }
  const disciple = recordsById.get(discipleId);
  const guru = recordsById.get(guruId);
  if (!disciple || !guru) {
    applied.push({ Source: "relationship", RecordId: discipleId, Name: row["Disciple Name"], Status: "missing record", Fields: row["Relationship Type"] });
    continue;
  }
  const discipleQueued = addLinkedRecordPatch(patches, recordsById, discipleId, "Master(s)", guruId, applied, "relationship");
  const guruQueued = addLinkedRecordPatch(patches, recordsById, guruId, "Disciples", discipleId, applied, "relationship");
  if (!discipleQueued && !guruQueued) {
    applied.push({ Source: "relationship", RecordId: discipleId, Name: disciple.fields.Name ?? row["Disciple Name"], Status: "already current", Fields: row["Relationship Type"] });
  }
}

if (fs.existsSync(duplicateUpdatesPath)) {
  for (const row of parseCsv(fs.readFileSync(duplicateUpdatesPath, "utf8"))) {
    const recordId = row["Airtable Record ID"];
    const duplicateId = row["Potential Duplicate Record ID"];
    if (!recordId || !duplicateId) {
      applied.push({ Source: "duplicate", RecordId: recordId || duplicateId, Name: row.Name || row["Potential Duplicate Name"], Status: "skipped absent linked record", Fields: POTENTIAL_DUPLICATE_LINK_FIELD });
      continue;
    }
    const record = recordsById.get(recordId);
    const duplicate = recordsById.get(duplicateId);
    if (!record || !duplicate) {
      applied.push({ Source: "duplicate", RecordId: recordId, Name: row.Name, Status: "missing record", Fields: POTENTIAL_DUPLICATE_LINK_FIELD });
      continue;
    }
    const recordQueued = addLinkedRecordPatch(patches, recordsById, recordId, POTENTIAL_DUPLICATE_LINK_FIELD, duplicateId, applied, "duplicate");
    const duplicateQueued = addLinkedRecordPatch(patches, recordsById, duplicateId, POTENTIAL_DUPLICATE_LINK_FIELD, recordId, applied, "duplicate");
    if (!recordQueued && !duplicateQueued) {
      applied.push({ Source: "duplicate", RecordId: recordId, Name: record.fields.Name ?? row.Name, Status: "already current", Fields: POTENTIAL_DUPLICATE_LINK_FIELD });
    }
  }
}

const queued = [...patches.values()].filter((patch) => Object.keys(patch.fields).length);
await patchRecords(queued);

writeCsv(appliedPath, applied, ["Source", "RecordId", "Name", "Status", "Fields"]);

console.log(`Queued and applied ${queued.length} Airtable record patch(es).`);
console.log(`Wrote apply log to ${appliedPath}.`);
