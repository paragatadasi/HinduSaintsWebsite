import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const exportsDir = path.join(root, "exports");
const AIRTABLE_API_URL = "https://api.airtable.com/v0";
const AIRTABLE_TABLE = "Saints";

const guruLinks = [
  ["Sri Rajarshi Banamali Roy of Vrindavan", "Sri Jagad Bandhu Sundar of Faridpur"],
  ["Sri Daya Mata of Salt Lake City, Utah, USA", "Sri Paramahamsa Yogananda of Gorakhpur"],
  ["Sri Lakshmi Mani Devi of Calcutta", "Sri Paramahansa Ramakrishna of Calcutta"],
];

const partnerLinks = [
  ["Sri Nityananda Prabhu of Navadwip", "Sri Chaitanya Mahaprabhu of Puri/ Navadwip"],
  ["Sri Chaitanya Mahaprabhu of Puri/ Navadwip", "Sri Vishnupriya Devi of Navadwip"],
];

const explicitRecordIds = new Map([
  ["Sri Rajarshi Banamali Roy of Vrindavan", "rec72DZPKexDMty7G"],
]);

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

function normName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function ids(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function csvEscape(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function yearFromDate(value) {
  const match = String(value || "").match(/\b(\d{3,4})\b/);
  return match ? match[1] : "";
}

function splitPlaces(value) {
  if (Array.isArray(value)) return value.map(String);
  return String(value || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
}

function getFirstField(fields, names) {
  for (const name of names) {
    if (fields[name] !== undefined) return fields[name];
  }
  return "";
}

function textList(value) {
  if (Array.isArray(value)) return value.map(String).join("; ");
  return String(value ?? "");
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
  return records.map((record) => ({ id: record.id, fields: record.fields ?? {} }));
}

function buildNameIndex(records) {
  const index = new Map();
  for (const record of records) {
    const name = record.fields.Name;
    if (!name) continue;
    const key = normName(name);
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(record);
  }
  return index;
}

function resolve(index, name, recordsById) {
  const explicitId = explicitRecordIds.get(name);
  if (explicitId) {
    const record = recordsById.get(explicitId);
    if (!record) throw new Error(`Explicit record ID ${explicitId} for "${name}" was not found.`);
    return record;
  }
  const matches = index.get(normName(name)) ?? [];
  if (matches.length !== 1) {
    throw new Error(`Expected one match for "${name}", found ${matches.length}: ${matches.map((r) => r.id).join(", ")}`);
  }
  return matches[0];
}

async function patchRecords(updates) {
  const { baseId } = getConfig();
  for (let i = 0; i < updates.length; i += 10) {
    const batch = updates.slice(i, i + 10);
    await airtableFetch(`${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(AIRTABLE_TABLE)}`, {
      method: "PATCH",
      body: JSON.stringify({ records: batch }),
    });
  }
}

function addLinked(fields, fieldName, id) {
  const current = ids(fields[fieldName]);
  if (current.includes(id)) return false;
  fields[fieldName] = [...current, id];
  return true;
}

function connectedComponents(records) {
  const byId = new Map(records.map((record) => [record.id, record]));
  const parent = new Map(records.map((record) => [record.id, record.id]));
  const find = (id) => {
    while (parent.get(id) !== id) {
      parent.set(id, parent.get(parent.get(id)));
      id = parent.get(id);
    }
    return id;
  };
  const union = (a, b) => {
    if (!byId.has(a) || !byId.has(b)) return;
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(rb, ra);
  };
  for (const record of records) {
    for (const field of ["Master(s)", "Disciples", "Partner", "Incarnation"]) {
      for (const linked of ids(record.fields[field])) union(record.id, linked);
    }
  }
  const groups = new Map();
  for (const record of records) {
    const root = find(record.id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(record);
  }
  return [...groups.values()].filter((group) => group.length > 1);
}

function stableFamilyOrder(groups) {
  return groups.sort((a, b) => {
    const sizeDiff = b.length - a.length;
    if (sizeDiff) return sizeDiff;
    const aName = a.map((r) => r.fields.Name || "").sort()[0] || "";
    const bName = b.map((r) => r.fields.Name || "").sort()[0] || "";
    return aName.localeCompare(bName);
  });
}

function writeFamilyExports(records) {
  const byId = new Map(records.map((record) => [record.id, record]));
  const groups = stableFamilyOrder(connectedComponents(records));
  const familyByRecord = new Map();
  groups.forEach((group, index) => {
    const familyId = `FAM-${String(index + 1).padStart(3, "0")}`;
    for (const record of group) familyByRecord.set(record.id, familyId);
  });

  const memberHeaders = [
    "FamilyID", "FamilySize", "RecordId", "Name", "Masters", "Disciples", "Partner", "Incarnation",
    "NormalizedPlaces", "SpiritualRegion", "Sampradaya", "BirthDate", "SamadhiDate", "BirthYear", "SamadhiYear",
  ];
  const memberRows = [];
  for (const group of groups) {
    const familyId = familyByRecord.get(group[0].id);
    for (const record of group.sort((a, b) => String(a.fields.Name || "").localeCompare(String(b.fields.Name || "")))) {
      const fields = record.fields;
      const birthDate = textList(fields["Birth (YYYY-MM-DD)"]);
      const samadhiDate = textList(fields["Samadhi (YYYY-MM-DD)"]);
      memberRows.push({
        FamilyID: familyId,
        FamilySize: group.length,
        RecordId: record.id,
        Name: fields.Name ?? "",
        Masters: ids(fields["Master(s)"]).join(";"),
        Disciples: ids(fields.Disciples).join(";"),
        Partner: ids(fields.Partner).join(";"),
        Incarnation: ids(fields.Incarnation).join(";"),
        NormalizedPlaces: textList(getFirstField(fields, ["Normalized Places", "Normalized Place Names", "Normalized Place"])),
        SpiritualRegion: textList(getFirstField(fields, ["Spiritual Region", "Spiritual Regions"])),
        Sampradaya: textList(fields.Sampradaya),
        BirthDate: birthDate,
        SamadhiDate: samadhiDate,
        BirthYear: yearFromDate(birthDate),
        SamadhiYear: yearFromDate(samadhiDate),
      });
    }
  }
  fs.writeFileSync(
    path.join(exportsDir, "airtable-saint-family-members.csv"),
    [memberHeaders, ...memberRows.map((row) => memberHeaders.map((header) => row[header] ?? ""))]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n") + "\n"
  );

  const edgeHeaders = ["RelationshipType", "FromRecordId", "FromName", "ToRecordId", "ToName"];
  const edgeRows = [];
  for (const record of records) {
    if (!familyByRecord.has(record.id)) continue;
    for (const [field, relationshipType] of [["Disciples", "Disciples"], ["Master(s)", "Master(s)"], ["Partner", "Partner"], ["Incarnation", "Incarnation"]]) {
      for (const toId of ids(record.fields[field])) {
        if (!familyByRecord.has(toId)) continue;
        edgeRows.push({
          RelationshipType: relationshipType,
          FromRecordId: record.id,
          FromName: record.fields.Name ?? "",
          ToRecordId: toId,
          ToName: byId.get(toId)?.fields.Name ?? "",
        });
      }
    }
  }
  fs.writeFileSync(
    path.join(exportsDir, "airtable-saint-family-relationship-edges.csv"),
    [edgeHeaders, ...edgeRows.map((row) => edgeHeaders.map((header) => row[header] ?? ""))]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n") + "\n"
  );

  return { groups, familyByRecord, memberRows, edgeRows };
}

function updateFamilyIdsPayload(records, familyByRecord) {
  const updates = [];
  for (const record of records) {
    const next = familyByRecord.get(record.id) ?? "";
    const current = String(record.fields["Family ID"] ?? "");
    if (current !== next) updates.push({ id: record.id, fields: { "Family ID": next } });
  }
  return updates;
}

const records = await fetchAllSaints();
const index = buildNameIndex(records);
const recordsById = new Map(records.map((record) => [record.id, record]));
const updatesById = new Map();
const applied = [];

function mutable(record) {
  if (!updatesById.has(record.id)) updatesById.set(record.id, { id: record.id, fields: {} });
  return updatesById.get(record.id).fields;
}

for (const [discipleName, guruName] of guruLinks) {
  const disciple = resolve(index, discipleName, recordsById);
  const guru = resolve(index, guruName, recordsById);
  const disciplePatch = mutable(disciple);
  const guruPatch = mutable(guru);
  const nextMasters = [...new Set([...ids(disciplePatch["Master(s)"] ?? disciple.fields["Master(s)"]), guru.id])];
  const nextDisciples = [...new Set([...ids(guruPatch.Disciples ?? guru.fields.Disciples), disciple.id])];
  const discipleChanged = nextMasters.length !== ids(disciple.fields["Master(s)"]).length;
  const guruChanged = nextDisciples.length !== ids(guru.fields.Disciples).length;
  disciplePatch["Master(s)"] = nextMasters;
  guruPatch.Disciples = nextDisciples;
  applied.push({ RelationshipType: "Guru-disciple", FromName: discipleName, FromRecordId: disciple.id, ToName: guruName, ToRecordId: guru.id, Status: discipleChanged || guruChanged ? "updated" : "already linked" });
}

for (const [aName, bName] of partnerLinks) {
  const a = resolve(index, aName, recordsById);
  const b = resolve(index, bName, recordsById);
  const aPatch = mutable(a);
  const bPatch = mutable(b);
  const aPartner = [...new Set([...ids(a.fields.Partner), b.id])];
  const bPartner = [...new Set([...ids(b.fields.Partner), a.id])];
  const changed = aPartner.length !== ids(a.fields.Partner).length || bPartner.length !== ids(b.fields.Partner).length;
  aPatch.Partner = aPartner;
  bPatch.Partner = bPartner;
  applied.push({ RelationshipType: "Partner", FromName: aName, FromRecordId: a.id, ToName: bName, ToRecordId: b.id, Status: changed ? "updated" : "already linked" });
}

await patchRecords([...updatesById.values()].filter((update) => Object.keys(update.fields).length));

const refreshed = await fetchAllSaints();
const familyExports = writeFamilyExports(refreshed);
const familyIdUpdates = updateFamilyIdsPayload(refreshed, familyExports.familyByRecord);
await patchRecords(familyIdUpdates);

const appliedHeaders = ["RelationshipType", "FromName", "FromRecordId", "ToName", "ToRecordId", "Status"];
fs.writeFileSync(
  path.join(exportsDir, "airtable-manual-relationship-updates-applied.csv"),
  [appliedHeaders, ...applied.map((row) => appliedHeaders.map((header) => row[header] ?? ""))]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n") + "\n"
);

console.log(`Applied ${applied.length} requested relationships.`);
console.log(`Refreshed ${familyExports.groups.length} connected families and ${familyExports.memberRows.length} family member rows.`);
console.log(`Updated ${familyIdUpdates.length} Airtable Family ID values.`);
