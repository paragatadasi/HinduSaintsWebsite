import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const exportsDir = path.join(root, "exports");
const AIRTABLE_API_URL = "https://api.airtable.com/v0";
const AIRTABLE_META_URL = "https://api.airtable.com/v0/meta";
const AIRTABLE_TABLE = "Saints";
const POTENTIAL_DUPLICATE_LINK_FIELD = "Potential duplicate match";
const RAJARSHI_IDS = ["rec72DZPKexDMty7G", "recOs3jGNyfMlakIB"];
const JAGAD_BANDHU_NAME = "Sri Jagad Bandhu Sundar of Faridpur";
const REVIEWED_FUZZY_DUPLICATE_GROUPS = [
  {
    key: "reviewed-namdev",
    note: "Names differ, but date fields indicate the same saint; locations may reflect relic context.",
    names: ["Sri Bhagat Namdev of Gurudwara Ghoman, Gurdaspur, Punjab", "Namdev (13th century)"],
  },
  {
    key: "reviewed-hatiram-hathiram",
    note: "Hatiram/Hathiram spelling variant; date fields indicate the same saint; locations may reflect relic context.",
    names: [
      "Sri Hatiram Baba of Tirupati, Andhra Pradesh",
      "Sri Hathiram Baba of Dalpatpur, Uparhar, Maya, Ayodhya, Uttar Pradesh",
    ],
  },
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

function ids(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function csvEscape(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function normName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textList(value) {
  if (Array.isArray(value)) return value.map(String).join("; ");
  return String(value ?? "");
}

function parseYear(value) {
  const match = String(value ?? "").match(/\b(\d{3,4})\b/);
  return match ? Number(match[1]) : null;
}

function yearSpan(record) {
  return {
    birth: parseYear(record.fields["Birth (YYYY-MM-DD)"]),
    samadhi: parseYear(record.fields["Samadhi (YYYY-MM-DD)"]),
  };
}

const TITLE_WORDS = new Set([
  "auliya",
  "baba",
  "babaji",
  "bhagat",
  "deva",
  "devi",
  "ji",
  "ma",
  "maharaj",
  "maharaja",
  "mata",
  "paramahamsa",
  "paramhansa",
  "saint",
  "sant",
  "shri",
  "sri",
  "srila",
  "swami",
]);

function coreName(value) {
  const withoutPlace = String(value ?? "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(?:of|from|later)\b.+$/i, " ");
  return normName(withoutPlace)
    .split(" ")
    .filter((word) => word && !TITLE_WORDS.has(word) && !/^\d+$/.test(word))
    .join(" ");
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j];
  }
  return prev[b.length];
}

function nameSimilarity(a, b) {
  if (!a || !b) return 0;
  const longer = Math.max(a.length, b.length);
  if (!longer) return 1;
  return 1 - levenshtein(a, b) / longer;
}

function dateClue(a, b) {
  const ay = yearSpan(a);
  const by = yearSpan(b);
  const clues = [];
  if (ay.birth && by.birth) clues.push(`birth ${ay.birth}/${by.birth}`);
  if (ay.samadhi && by.samadhi) clues.push(`samadhi ${ay.samadhi}/${by.samadhi}`);
  const birthClose = ay.birth && by.birth && Math.abs(ay.birth - by.birth) <= 2;
  const samadhiClose = ay.samadhi && by.samadhi && Math.abs(ay.samadhi - by.samadhi) <= 2;
  const exactAny = (ay.birth && ay.birth === by.birth) || (ay.samadhi && ay.samadhi === by.samadhi);
  return {
    clue: clues.join("; "),
    compatible: Boolean(exactAny || birthClose || samadhiClose),
  };
}

function fuzzyDuplicateCandidates(records) {
  const candidates = [];
  for (let i = 0; i < records.length; i += 1) {
    for (let j = i + 1; j < records.length; j += 1) {
      const a = records[i];
      const b = records[j];
      const coreA = coreName(a.fields.Name);
      const coreB = coreName(b.fields.Name);
      if (!coreA || !coreB || coreA === coreB) continue;
      const similarity = nameSimilarity(coreA, coreB);
      const date = dateClue(a, b);
      const shortName = coreA.length <= 4 || coreB.length <= 4;
      const threshold = shortName ? 0.9 : 0.82;
      if (similarity < threshold || !date.compatible) continue;
      candidates.push({
        CandidateKey: `fuzzy-${a.id}-${b.id}`,
        Confidence: similarity >= 0.9 ? "high" : "medium",
        Similarity: similarity.toFixed(3),
        DateClue: date.clue,
        RecordIdA: a.id,
        NameA: a.fields.Name ?? "",
        CoreNameA: coreA,
        NormalizedPlacesA: textList(a.fields["Normalized places"] ?? a.fields["Normalized Places"]),
        BirthDateA: textList(a.fields["Birth (YYYY-MM-DD)"]),
        SamadhiDateA: textList(a.fields["Samadhi (YYYY-MM-DD)"]),
        RecordIdB: b.id,
        NameB: b.fields.Name ?? "",
        CoreNameB: coreB,
        NormalizedPlacesB: textList(b.fields["Normalized places"] ?? b.fields["Normalized Places"]),
        BirthDateB: textList(b.fields["Birth (YYYY-MM-DD)"]),
        SamadhiDateB: textList(b.fields["Samadhi (YYYY-MM-DD)"]),
        Note: "Fuzzy name/date candidate only; place differences may be relic or association context.",
      });
    }
  }
  return candidates.sort((a, b) => Number(b.Similarity) - Number(a.Similarity) || a.NameA.localeCompare(b.NameA));
}

async function getSaintsTable() {
  const { baseId } = getConfig();
  const schema = await airtableFetch(`${AIRTABLE_META_URL}/bases/${baseId}/tables`);
  const table = schema.tables?.find((candidate) => candidate.name === AIRTABLE_TABLE || candidate.id === AIRTABLE_TABLE);
  if (!table) throw new Error(`Could not find Airtable table "${AIRTABLE_TABLE}".`);
  return table;
}

async function ensurePotentialDuplicateField() {
  const { baseId } = getConfig();
  const table = await getSaintsTable();
  let changed = false;
  if (!table.fields?.some((field) => field.name === POTENTIAL_DUPLICATE_LINK_FIELD)) {
    await airtableFetch(`${AIRTABLE_META_URL}/bases/${baseId}/tables/${table.id}/fields`, {
      method: "POST",
      body: JSON.stringify({
        name: POTENTIAL_DUPLICATE_LINK_FIELD,
        type: "multipleRecordLinks",
        options: { linkedTableId: table.id },
      }),
    });
    changed = true;
  }
  return changed ? getSaintsTable() : table;
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
      body: JSON.stringify({ records: updates.slice(i, i + 10) }),
    });
  }
}

function duplicateGroups(records) {
  const groups = new Map();
  for (const record of records) {
    const key = normName(record.fields.Name);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }
  return [...groups.entries()].filter(([, group]) => group.length > 1);
}

await ensurePotentialDuplicateField();
const records = await fetchAllSaints();
const byId = new Map(records.map((record) => [record.id, record]));
const byName = new Map(records.map((record) => [normName(record.fields.Name), record]));
const jagad = records.find((record) => normName(record.fields.Name) === normName(JAGAD_BANDHU_NAME));
if (!jagad) throw new Error(`Could not find ${JAGAD_BANDHU_NAME}.`);

const duplicateRows = [];
const duplicateIds = new Set();
const duplicateLinks = new Map();
function addDuplicateGroup(group) {
  for (const record of group) {
    if (!duplicateLinks.has(record.id)) duplicateLinks.set(record.id, new Set());
    for (const other of group) {
      if (other.id !== record.id) duplicateLinks.get(record.id).add(other.id);
    }
  }
}

for (const [key, group] of duplicateGroups(records)) {
  addDuplicateGroup(group);
  for (const record of group) {
    duplicateIds.add(record.id);
    duplicateRows.push({
      DuplicateKey: key,
      GroupSize: group.length,
      RecordId: record.id,
      Name: record.fields.Name ?? "",
      NormalizedPlaces: textList(record.fields["Normalized places"] ?? record.fields["Normalized Places"]),
      BirthDate: textList(record.fields["Birth (YYYY-MM-DD)"]),
      SamadhiDate: textList(record.fields["Samadhi (YYYY-MM-DD)"]),
      FamilyID: record.fields["Family ID"] ?? "",
    });
  }
}
for (const id of RAJARSHI_IDS) duplicateIds.add(id);
addDuplicateGroup(RAJARSHI_IDS.map((id) => byId.get(id)).filter(Boolean));

const reviewedFuzzyRows = [];
for (const group of REVIEWED_FUZZY_DUPLICATE_GROUPS) {
  const matched = group.names.map((name) => byName.get(normName(name)));
  const missing = group.names.filter((name, index) => !matched[index]);
  if (missing.length) throw new Error(`Missing reviewed fuzzy duplicate record(s): ${missing.join("; ")}`);
  addDuplicateGroup(matched);
  for (const record of matched) {
    duplicateIds.add(record.id);
    reviewedFuzzyRows.push({
      DuplicateKey: group.key,
      GroupSize: matched.length,
      RecordId: record.id,
      Name: record.fields.Name ?? "",
      NormalizedPlaces: textList(record.fields["Normalized places"] ?? record.fields["Normalized Places"]),
      BirthDate: textList(record.fields["Birth (YYYY-MM-DD)"]),
      SamadhiDate: textList(record.fields["Samadhi (YYYY-MM-DD)"]),
      FamilyID: record.fields["Family ID"] ?? "",
      Note: group.note,
    });
  }
}

const updatesById = new Map();
function patch(id) {
  if (!updatesById.has(id)) updatesById.set(id, { id, fields: {} });
  return updatesById.get(id).fields;
}

for (const id of duplicateIds) {
  if (!byId.has(id)) continue;
  const currentLinks = ids(byId.get(id).fields[POTENTIAL_DUPLICATE_LINK_FIELD]);
  const nextLinks = [...new Set([...currentLinks, ...[...(duplicateLinks.get(id) ?? [])]])];
  if (nextLinks.length) patch(id)[POTENTIAL_DUPLICATE_LINK_FIELD] = nextLinks;
}

for (const id of RAJARSHI_IDS) {
  const record = byId.get(id);
  if (!record) throw new Error(`Missing Rajarshi duplicate record ${id}.`);
  patch(id)["Master(s)"] = [...new Set([...ids(record.fields["Master(s)"]), jagad.id])];
}
patch(jagad.id).Disciples = [...new Set([...ids(jagad.fields.Disciples), ...RAJARSHI_IDS])];

await patchRecords([...updatesById.values()]);

const exportDuplicateRows = [...duplicateRows, ...reviewedFuzzyRows].map((row) => {
  const matchIds = [...(duplicateLinks.get(row.RecordId) ?? [])];
  return {
    ...row,
    PotentialDuplicateMatchIds: matchIds.join(";"),
    PotentialDuplicateMatchNames: matchIds.map((id) => byId.get(id)?.fields.Name ?? id).join("; "),
  };
});
const headers = [
  "DuplicateKey",
  "GroupSize",
  "RecordId",
  "Name",
  "PotentialDuplicateMatchIds",
  "PotentialDuplicateMatchNames",
  "NormalizedPlaces",
  "BirthDate",
  "SamadhiDate",
  "FamilyID",
  "Note",
];
fs.writeFileSync(
  path.join(exportsDir, "airtable-potential-duplicate-saints.csv"),
  [headers, ...exportDuplicateRows.map((row) => headers.map((header) => row[header] ?? ""))]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n") + "\n"
);

const fuzzyRows = fuzzyDuplicateCandidates(records);
const fuzzyHeaders = [
  "CandidateKey",
  "Confidence",
  "Similarity",
  "DateClue",
  "RecordIdA",
  "NameA",
  "CoreNameA",
  "NormalizedPlacesA",
  "BirthDateA",
  "SamadhiDateA",
  "RecordIdB",
  "NameB",
  "CoreNameB",
  "NormalizedPlacesB",
  "BirthDateB",
  "SamadhiDateB",
  "Note",
];
fs.writeFileSync(
  path.join(exportsDir, "airtable-fuzzy-duplicate-candidates.csv"),
  [fuzzyHeaders, ...fuzzyRows.map((row) => fuzzyHeaders.map((header) => row[header] ?? ""))]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n") + "\n"
);

const rajRows = RAJARSHI_IDS.map((id) => ({
  RecordId: id,
  Name: byId.get(id)?.fields.Name ?? "",
  PotentialDuplicateMatchIds: [...(duplicateLinks.get(id) ?? [])].join(";"),
  PotentialDuplicateMatchNames: [...(duplicateLinks.get(id) ?? [])].map((matchId) => byId.get(matchId)?.fields.Name ?? matchId).join("; "),
  AddedMasterRecordId: jagad.id,
  AddedMasterName: jagad.fields.Name ?? "",
}));
const rajHeaders = [
  "RecordId",
  "Name",
  "PotentialDuplicateMatchIds",
  "PotentialDuplicateMatchNames",
  "AddedMasterRecordId",
  "AddedMasterName",
];
fs.writeFileSync(
  path.join(exportsDir, "airtable-rajarshi-duplicate-guru-update.csv"),
  [rajHeaders, ...rajRows.map((row) => rajHeaders.map((header) => row[header] ?? ""))]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n") + "\n"
);

console.log(
  `Linked ${duplicateIds.size} potential duplicate records across ${duplicateGroups(records).length} exact-name groups and ${REVIEWED_FUZZY_DUPLICATE_GROUPS.length} reviewed fuzzy groups.`
);
console.log(`Linked ${RAJARSHI_IDS.length} Rajarshi records to ${jagad.fields.Name}.`);
console.log(`Exported ${fuzzyRows.length} additional fuzzy duplicate candidate pairs for review.`);
