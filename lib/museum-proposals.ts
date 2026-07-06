import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const museumDataDir = path.join(root, "data", "museum");

const proposalsPath = path.join(museumDataDir, "airtable-museum-section-proposals.csv");
const summaryPath = path.join(museumDataDir, "airtable-museum-section-summary.csv");
const labelsPath = path.join(museumDataDir, "airtable-saint-family-labels.csv");
const membersPath = path.join(museumDataDir, "airtable-saint-family-members.csv");
const visualsPath = path.join(museumDataDir, "airtable-saint-family-tree-visuals.csv");
const cleanupFlagsPath = path.join(museumDataDir, "airtable-museum-section-cleanup-flags.csv");

export type MuseumTier = "Featured" | "Secondary" | "Tertiary";

export type MuseumSaintPlacement = {
  id: string;
  name: string;
  section: string;
  alternatives: string[];
  tier: MuseumTier;
  confidence: string;
  rationale: string;
  note: string;
  familyId: string;
  curatorialFamily: string;
  familySize: number;
  spiritualRegions: string[];
  sampradaya: string;
  normalizedPlaces: string[];
};

export type MuseumFamilyGroup = {
  key: string;
  label: string;
  rows: MuseumSaintPlacement[];
  featured: MuseumSaintPlacement[];
  secondary: MuseumSaintPlacement[];
  tertiary: MuseumSaintPlacement[];
  treeFile?: string;
};

export type MuseumSection = {
  slug: string;
  name: string;
  idea: string;
  total: number;
  featured: number;
  secondary: number;
  tertiary: number;
  confidence: {
    high: number;
    medium: number;
    low: number;
  };
  rows: MuseumSaintPlacement[];
  families: MuseumFamilyGroup[];
  primaryGroups: MuseumFamilyGroup[];
  secondaryOnlyGroups: MuseumFamilyGroup[];
  tertiaryGroups: MuseumFamilyGroup[];
  tertiaryUngrouped: MuseumSaintPlacement[];
  geography: Array<{ label: string; count: number }>;
  health: Array<{ label: string; count: number; tone: "good" | "warning" }>;
};

const sectionIdeas = new Map(Object.entries({
  "Andhra Avadhuta & Datta-Advaita Lineages": "A southern avadhuta and Datta-Advaita section for Andhra-centered saints, especially where the visitor story is ascetic, avadhuta, Datta, or non-institutional devotional practice rather than a larger pan-Indian sampradaya.",
  "Bengal Shakta, Baul & Modern Saints": "A Bengal-centered modern devotional and contemplative section for Shakta, Baul, Ramakrishna/Tota Puri, Aurobindo-related, and other Bengal/South Asia modern saints who are not better placed in Gaudiya Vaishnava.",
  "Bhakti Marga & Mauritius Lineage": "A curatorial lineage section for saints connected to Bhakti Marga and the Mauritius-centered devotional context of the Founder, overriding generic global or country-based placement when needed.",
  "Braj & Krishna Bhakti": "A Krishna-bhakti section for Vrindavan, Barsana, Govardhan, Mathura, Nimbarka, Vallabha, and broader Braj devotional figures when Gaudiya, Ramanandi, or another stronger family does not decide placement.",
  "Buddhist Saints": "A focused Buddhist section for Gautama Buddha and explicitly Buddhist saint records, keeping Buddhist identity visible rather than burying these records under general geography or global categories.",
  "Datta Tradition": "A Datta-centered section anchored in Dattatreya, Narasimha Saraswati, Swami Samarth, Akkalkot, Narsobawadi, Kolhapur, Kurvapur, and related incarnation or disciple lineages.",
  "Gaudiya Vaishnava": "A Gaudiya section for Chaitanya, Nityananda, the Vrindavan Goswamis, Navadwip-Mayapur figures, Gaudiya Math lineages, and related Bengal-Braj-Puri Gaudiya families.",
  "Girnar & Nath Traditions": "A western ascetic section for Girnar, Nath, Juna Akhara, and related Gujarat/Maharashtra Shaiva ascetic clusters when family or tradition points there.",
  "Global & Diaspora Lineages": "A deliberately sparse section for saints whose primary museum story is diaspora transmission or whose geography cannot usefully anchor the visitor experience after family and sampradaya are considered.",
  "Gujarat & Swaminarayan Traditions": "A western devotional section for Gujarat saints, Swaminarayan/BAPS gurus, Pushkar and Rajputana-adjacent western devotional clusters, and Gujarat-centered saint families.",
  "Jagannath-Puri & Odisha": "An Odisha and Puri section for Jagannath-centered devotional lineages, Odisha ashram families, and saints whose family is Odisha-centered without a stronger Gaudiya or Kriya placement.",
  "Kashi & Ascetic Lineages": "A Varanasi/Kashi section for renunciants, akhara-related saints, North Indian ascetic figures, and saints whose strongest visitor-facing anchor is Kashi or nearby ascetic geography.",
  "Maharashtra Guru Lineages": "A Maharashtra devotional and guru-family section, including Shirdi, Sakori, Pune, Nagpur, Khedgoan Bed, Ganeshpuri, Gajanan, Samarth, and other Maharashtra-centered guru networks.",
  "Needs Research": "A holding section for records where no strong family, sampradaya, or spiritual-region placement is yet reliable, or where cleanup is needed before museum placement.",
  "Ramana & Arunachala": "An Arunachala-focused contemplative section for Ramana Maharshi, direct Ramana-family saints, and nearby South Indian Advaita or contemplative figures.",
  "Rama & Avadh": "A Rama-bhakti and Avadh section for Ayodhya, Chitrakoot, Naimisharanya, Tulsidas-related devotional geography, and Rama-centered saints not more strongly placed in Ramanandi.",
  "Ramanandi": "A Ramanandi section for saints whose family or sampradaya connects them to Ramanandacharya, Ravidas, Kabir, Mira Bai, Tyagi, Satuwa, and broader Ramanandi devotional lineages.",
  "Rishikesh-Haridwar & Himalayan Monastic Lineages": "A Himalayan and monastic section for Rishikesh, Haridwar, Uttarakhand, upper Himalayan corridors, Sivananda, Kriya Yoga, and related modern renunciant lineages.",
  "Shaiva Siddhanta & Tamil Traditions": "A Tamil and southern Shaiva section for Shaiva Siddhanta, Tamil saints, Rameshwaram, Kumbakonam, and southern Shaiva/Siddhar figures not better placed under Ramana.",
  "Sikh & Punjab Traditions": "A Sikh and Punjab section for Sikh, Punjab-centered, and related devotional records, kept adjacent to Udasin where the historical context overlaps.",
  "Sri Vaishnava & South Indian Vaishnava Traditions": "A South Indian Vaishnava section for Ramanuja, Sri Vaishnava, Tirumala, and related southern Vaishnava figures where sampradaya is stronger than generic southern geography.",
  "Udasin Saints": "A distinct section for Baba Udasin and explicitly Udasin Sampradaya or Udasin ashram records, with adjacency to Sikh/Punjab, Kashi, and Himalayan ascetic sections.",
  "Varkari": "A Pandharpur and Vitthal-centered section for Varkari saints and Maharashtra devotional families where movement identity is more intuitive than fine-grained local geography."
}));

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (ch === "\"" && next === "\"") {
        value += "\"";
        i += 1;
      } else if (ch === "\"") {
        quoted = false;
      } else {
        value += ch;
      }
    } else if (ch === "\"") {
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
    .map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])));
}

function readCsv(filePath: string) {
  if (!fs.existsSync(filePath)) return [];
  return parseCsv(fs.readFileSync(filePath, "utf8"));
}

function clean(value: string | undefined) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function splitMulti(value: string | undefined) {
  return String(value || "")
    .split(";")
    .map(clean)
    .filter(Boolean);
}

export function museumSectionSlug(section: string) {
  return clean(section)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function numberValue(value: string | undefined) {
  return Number.parseInt(String(value || "0"), 10) || 0;
}

function familyKey(row: MuseumSaintPlacement) {
  return row.curatorialFamily || row.familyId || "";
}

function groupLabel(key: string, familyLabels: Map<string, string>) {
  if (!key) return "";
  return key.startsWith("CUR-") ? key : familyLabels.get(key) || key;
}

function sortSaints(a: MuseumSaintPlacement, b: MuseumSaintPlacement) {
  return a.name.localeCompare(b.name);
}

const indianStateNames = new Set([
  "andhra pradesh",
  "arunachal pradesh",
  "assam",
  "bihar",
  "chhattisgarh",
  "delhi",
  "goa",
  "gujarat",
  "haryana",
  "himachal pradesh",
  "jammu and kashmir",
  "jharkhand",
  "karnataka",
  "kerala",
  "madhya pradesh",
  "maharashtra",
  "manipur",
  "meghalaya",
  "mizoram",
  "nagaland",
  "odisha",
  "orissa",
  "punjab",
  "rajasthan",
  "sikkim",
  "tamil nadu",
  "telangana",
  "tripura",
  "uttar pradesh",
  "uttarakhand",
  "uttharkand",
  "west bengal"
]);

export function museumLocationLabel(value: string | undefined, fallback = "Location pending") {
  const parts = clean(value)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) return parts.slice(-2).join(", ");
  if (!parts[0]) return fallback;
  if (indianStateNames.has(parts[0].toLowerCase())) return `${parts[0]}, India`;
  return parts[0];
}

function topCounts(values: string[], max = 6) {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, max);
}

export function getMuseumProposalData() {
  const proposalRows = readCsv(proposalsPath);
  const summaryRows = readCsv(summaryPath);
  const labelRows = readCsv(labelsPath);
  const memberRows = readCsv(membersPath);
  const visualRows = readCsv(visualsPath);
  const cleanupRows = readCsv(cleanupFlagsPath);
  const familyLabels = new Map(labelRows.map((row) => [row["Family ID"], row["Proposed Family Label"]]));
  const treeByFamily = new Map(visualRows.map((row) => [row.FamilyID, path.basename(row.TreeFile || "")]));
  const membersById = new Map(memberRows.map((row) => [row.RecordId, row]));
  const cleanupById = new Set(cleanupRows.map((row) => row["Airtable Record ID"]));

  const placements = proposalRows.map((row): MuseumSaintPlacement => ({
    id: row["Saint ID"],
    name: clean(row.Saint),
    section: clean(row["Primary Museum Section"]),
    alternatives: splitMulti(row["Alternative Museum Sections"]),
    tier: row["Museum Section Tier"] as MuseumTier,
    confidence: clean(row["Museum Section Confidence"]),
    rationale: clean(row["Museum Section Rationale"]),
    note: clean(row["Museum Section Internal Placement Note"]),
    familyId: clean(row["Family ID"]),
    curatorialFamily: clean(row["Curatorial Family"]),
    familySize: numberValue(row["Family Size"]),
    spiritualRegions: splitMulti(row["Spiritual regions"]),
    sampradaya: clean(row.Sampradaya),
    normalizedPlaces: splitMulti(row["Normalized places"])
  }));

  const rowsBySection = new Map<string, MuseumSaintPlacement[]>();
  for (const row of placements) {
    if (!rowsBySection.has(row.section)) rowsBySection.set(row.section, []);
    rowsBySection.get(row.section)?.push(row);
  }

  const summaryBySection = new Map(summaryRows.map((row) => [row["Primary Museum Section"], row]));
  const sections = [...rowsBySection.entries()]
    .map(([name, rows]): MuseumSection => {
      const summary = summaryBySection.get(name);
      const familyMap = new Map<string, MuseumSaintPlacement[]>();
      for (const row of rows) {
        const key = familyKey(row);
        if (!key) continue;
        if (!familyMap.has(key)) familyMap.set(key, []);
        familyMap.get(key)?.push(row);
      }
      const families = [...familyMap.entries()]
        .map(([key, familyRows]): MuseumFamilyGroup => ({
          key,
          label: groupLabel(key, familyLabels),
          rows: familyRows.sort(sortSaints),
          featured: familyRows.filter((row) => row.tier === "Featured").sort(sortSaints),
          secondary: familyRows.filter((row) => row.tier === "Secondary").sort(sortSaints),
          tertiary: familyRows.filter((row) => row.tier === "Tertiary").sort(sortSaints),
          treeFile: treeByFamily.get(key)
        }))
        .sort((a, b) => b.rows.length - a.rows.length || a.label.localeCompare(b.label));
      const usedSecondary = new Set<string>();
      const primaryGroups = families.filter((family) => family.featured.length);
      for (const family of primaryGroups) {
        for (const row of family.secondary) usedSecondary.add(row.id);
      }
      const secondaryOnlyGroups = families.filter((family) => !family.featured.length && family.secondary.length > 1);
      for (const family of secondaryOnlyGroups) {
        for (const row of family.secondary) usedSecondary.add(row.id);
      }
      const tertiaryGroups = families.filter((family) => family.tertiary.length > 1);
      const usedTertiary = new Set(tertiaryGroups.flatMap((family) => family.tertiary.map((row) => row.id)));
      const lowConfidence = rows.filter((row) => row.confidence === "Low").length;
      const missingPlace = rows.filter((row) => !row.normalizedPlaces.length).length;
      const needsResearch = rows.filter((row) => row.section === "Needs Research" || row.alternatives.includes("Needs Research")).length;
      const cleanup = rows.filter((row) => cleanupById.has(row.id)).length;

      return {
        slug: museumSectionSlug(name),
        name,
        idea: sectionIdeas.get(name) || "Section idea pending curator review.",
        total: summary ? numberValue(summary["Saint Count"]) : rows.length,
        featured: summary ? numberValue(summary.Featured) : rows.filter((row) => row.tier === "Featured").length,
        secondary: summary ? numberValue(summary.Secondary) : rows.filter((row) => row.tier === "Secondary").length,
        tertiary: summary ? numberValue(summary.Tertiary) : rows.filter((row) => row.tier === "Tertiary").length,
        confidence: {
          high: summary ? numberValue(summary["High Confidence"]) : rows.filter((row) => row.confidence === "High").length,
          medium: summary ? numberValue(summary["Medium Confidence"]) : rows.filter((row) => row.confidence === "Medium").length,
          low: lowConfidence
        },
        rows: rows.sort(sortSaints),
        families,
        primaryGroups,
        secondaryOnlyGroups,
        tertiaryGroups,
        tertiaryUngrouped: rows.filter((row) => row.tier === "Tertiary" && !usedTertiary.has(row.id)).sort(sortSaints),
        geography: topCounts(rows.flatMap((row) => row.normalizedPlaces.map((place) => museumLocationLabel(place, "Unspecified")))),
        health: [
          { label: "saints assigned", count: rows.length, tone: "good" },
          { label: "low-confidence placements", count: lowConfidence, tone: lowConfidence ? "warning" : "good" },
          { label: "missing normalized places", count: missingPlace, tone: missingPlace ? "warning" : "good" },
          { label: "needs-research alternates", count: needsResearch, tone: needsResearch ? "warning" : "good" },
          { label: "cleanup flags", count: cleanup, tone: cleanup ? "warning" : "good" }
        ]
      };
    })
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

  return {
    sections,
    placements,
    sectionBySlug: new Map(sections.map((section) => [section.slug, section])),
    membersById
  };
}

export function searchMuseumPlacements(query: string, limit = 24) {
  const q = clean(query).toLowerCase();
  if (!q) return [];
  return getMuseumProposalData().placements
    .filter((row) =>
      row.name.toLowerCase().includes(q) ||
      row.section.toLowerCase().includes(q) ||
      row.spiritualRegions.some((region) => region.toLowerCase().includes(q)) ||
      row.normalizedPlaces.some((place) => place.toLowerCase().includes(q))
    )
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, limit);
}
