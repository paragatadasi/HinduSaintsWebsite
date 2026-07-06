import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const exportsDir = path.join(root, "exports");
const docsDir = path.join(root, "docs");

const proposalsPath = path.join(exportsDir, "airtable-museum-section-proposals.csv");
const labelsPath = path.join(exportsDir, "airtable-saint-family-labels.csv");
const familyMembersPath = path.join(exportsDir, "airtable-saint-family-members.csv");
const curatorialFamiliesPath = path.join(exportsDir, "airtable-museum-section-curatorial-families.csv");
const outputPath = path.join(docsDir, "final-museum-section-proposals.md");

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

const sectionOrder = [
  "Gaudiya Vaishnava",
  "Varkari",
  "Datta Tradition",
  "Ramanandi",
  "Rama & Avadh",
  "Braj & Krishna Bhakti",
  "Jagannath-Puri & Odisha",
  "Kashi & Ascetic Lineages",
  "Rishikesh-Haridwar & Himalayan Monastic Lineages",
  "Girnar & Nath Traditions",
  "Maharashtra Guru Lineages",
  "Ramana & Arunachala",
  "Sri Vaishnava & South Indian Vaishnava Traditions",
  "Shaiva Siddhanta & Tamil Traditions",
  "Andhra Avadhuta & Datta-Advaita Lineages",
  "Gujarat & Swaminarayan Traditions",
  "Sikh & Punjab Traditions",
  "Bengal Shakta, Baul & Modern Saints",
  "Buddhist Saints",
  "Udasin Saints",
  "Bhakti Marga & Mauritius Lineage",
  "Global & Diaspora Lineages",
  "Needs Research"
];

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

function clean(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function sortBySaint(a, b) {
  return clean(a.Saint).localeCompare(clean(b.Saint));
}

function sortPrimary(a, b) {
  return primaryRank(a) - primaryRank(b) || sortBySaint(a, b);
}

function bulletList(items, indent = "") {
  if (!items.length) return "";
  return items.map((item) => `${indent}- ${item}\n`).join("");
}

function names(rows) {
  return rows.map((row) => clean(row.Saint)).filter(Boolean).sort((a, b) => a.localeCompare(b));
}

function tierRows(rows, tier) {
  return rows.filter((row) => row["Museum Section Tier"] === tier).sort(sortBySaint);
}

function familyKey(row) {
  return row["Curatorial Family"] || row["Family ID"] || "";
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function splitIds(value) {
  return String(value || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseYear(value) {
  const match = String(value || "").match(/\d{3,4}/);
  return match ? Number.parseInt(match[0], 10) : null;
}

function primaryRank(row) {
  const member = familyMemberById.get(row["Saint ID"]);
  if (!member) return 999999;
  const hasMaster = splitIds(member.Masters).length > 0;
  const discipleCount = splitIds(member.Disciples).length;
  const birthYear = parseYear(member.BirthYear) ?? 9999;
  return (hasMaster ? 100000 : 0) - discipleCount * 100 + birthYear;
}

function boldName(row) {
  return `**${clean(row.Saint)}**`;
}

function groupLabel(key) {
  if (!key) return "";
  return key.startsWith("CUR-") ? key : labels.get(key)?.["Proposed Family Label"] || key;
}

const proposals = parseCsv(fs.readFileSync(proposalsPath, "utf8"));
const labels = new Map(parseCsv(fs.readFileSync(labelsPath, "utf8")).map((row) => [row["Family ID"], row]));
const familyMemberById = new Map(parseCsv(fs.readFileSync(familyMembersPath, "utf8")).map((row) => [row.RecordId, row]));
const curatorialFamilies = parseCsv(fs.readFileSync(curatorialFamiliesPath, "utf8"));
const curatorialById = new Map(curatorialFamilies.map((row) => [row["Curatorial Family"], row]));
const bySection = new Map();

for (const row of proposals) {
  const section = row["Primary Museum Section"];
  if (!bySection.has(section)) bySection.set(section, []);
  bySection.get(section).push(row);
}

const allSections = unique([...sectionOrder, ...bySection.keys()]).filter((section) => bySection.has(section));
const lines = [];

lines.push("# Final Museum Section Proposals\n\n");
lines.push("This document is generated from the final Airtable museum section proposal exports. It focuses on the proposed sections, the primary saints and their affiliated secondary saints, and the tertiary saints to organize around concise family, subgroup, and regional context.\n\n");
lines.push(`Total proposed saint placements: ${proposals.length}.\n\n`);

lines.push("## Sections\n\n");
for (const section of allSections) {
  const rows = bySection.get(section) || [];
  const featured = tierRows(rows, "Featured");
  const secondary = tierRows(rows, "Secondary");
  const tertiary = tierRows(rows, "Tertiary");
  lines.push(`- ${section}: ${rows.length} total (${featured.length} primary, ${secondary.length} secondary, ${tertiary.length} tertiary)\n`);
}
lines.push("\n");

for (const section of allSections) {
  const rows = [...(bySection.get(section) || [])].sort(sortBySaint);
  const featured = tierRows(rows, "Featured");
  const secondary = tierRows(rows, "Secondary");
  const tertiary = tierRows(rows, "Tertiary");
  const sectionCuratorial = curatorialFamilies.filter((row) => row["Primary Museum Section"] === section);
  const familyGroups = new Map();

  for (const row of rows) {
    const key = familyKey(row);
    if (!key) continue;
    if (!familyGroups.has(key)) familyGroups.set(key, []);
    familyGroups.get(key).push(row);
  }

  const notableFamilies = [...familyGroups.entries()]
    .map(([key, familyRows]) => ({
      key,
      rows: familyRows.sort(sortBySaint),
      label: key.startsWith("CUR-")
        ? key
        : labels.get(key)?.["Proposed Family Label"] || key,
      size: familyRows.length
    }))
    .sort((a, b) => b.size - a.size || a.label.localeCompare(b.label));

  lines.push(`## ${section}\n\n`);
  lines.push(`**Idea:** ${sectionIdeas.get(section) || "Section idea pending curator review."}\n\n`);
  lines.push(`**Placement Count:** ${rows.length} total: ${featured.length} featured, ${secondary.length} secondary, ${tertiary.length} tertiary.\n\n`);

  lines.push("### Primary Saints And Affiliated Secondary Saints\n\n");
  const secondaryUsed = new Set();
  if (!featured.length) {
    if (secondary.length) {
      lines.push("Secondary saints are listed here because this section currently has no primary saint anchor.\n\n");
    }
  } else {
    const featuredGroups = new Map();
    for (const row of featured) {
      const key = familyKey(row) || `__single__${row["Saint ID"]}`;
      if (!featuredGroups.has(key)) featuredGroups.set(key, []);
      featuredGroups.get(key).push(row);
    }
    const orderedFeaturedGroups = [...featuredGroups.entries()]
      .map(([key, groupRows]) => ({ key, rows: groupRows.sort(sortPrimary), head: groupRows.sort(sortPrimary)[0] }))
      .sort((a, b) => sortPrimary(a.head, b.head));

    for (const group of orderedFeaturedGroups) {
      const realKey = group.key.startsWith("__single__") ? "" : group.key;
      const affiliated = realKey
        ? secondary.filter((candidate) => familyKey(candidate) === realKey)
        : [];
      const label = groupLabel(realKey);
      const isPeerCuratorialGroup = realKey.startsWith("CUR-") && group.rows.length > 1;

      if (isPeerCuratorialGroup) {
        lines.push(`- ${label}\n`);
        for (const primaryRow of group.rows.sort(sortPrimary)) {
          lines.push(`  - ${boldName(primaryRow)}\n`);
        }
        for (const secondaryRow of affiliated.filter((candidate) => !secondaryUsed.has(candidate["Saint ID"])).sort(sortBySaint)) {
          secondaryUsed.add(secondaryRow["Saint ID"]);
          lines.push(`  - ${clean(secondaryRow.Saint)}\n`);
        }
        continue;
      }

      const [head, ...otherPrimaries] = group.rows.sort(sortPrimary);
      lines.push(`- ${boldName(head)}`);
      if (label) lines.push(` (${label})`);
      lines.push("\n");
      for (const primaryRow of otherPrimaries) {
        lines.push(`  - ${boldName(primaryRow)}\n`);
      }
      for (const secondaryRow of affiliated.filter((candidate) => !secondaryUsed.has(candidate["Saint ID"])).sort(sortBySaint)) {
        secondaryUsed.add(secondaryRow["Saint ID"]);
        lines.push(`  - ${clean(secondaryRow.Saint)}\n`);
      }
    }
  }

  const unaffiliatedSecondary = secondary.filter((row) => !secondaryUsed.has(row["Saint ID"]));
  if (unaffiliatedSecondary.length) {
    const secondaryGroups = new Map();
    for (const row of unaffiliatedSecondary) {
      const key = familyKey(row) || `__single__${row["Saint ID"]}`;
      if (!secondaryGroups.has(key)) secondaryGroups.set(key, []);
      secondaryGroups.get(key).push(row);
    }
    if (featured.length) lines.push("- Other secondary saints\n");
    for (const [key, groupRows] of [...secondaryGroups.entries()].sort((a, b) => {
      const labelA = groupLabel(a[0].startsWith("__single__") ? "" : a[0]) || clean(a[1][0].Saint);
      const labelB = groupLabel(b[0].startsWith("__single__") ? "" : b[0]) || clean(b[1][0].Saint);
      return labelA.localeCompare(labelB);
    })) {
      const realKey = key.startsWith("__single__") ? "" : key;
      const label = groupLabel(realKey);
      if (realKey && groupRows.length > 1) {
        lines.push(featured.length ? `  - ${label}\n` : `- ${label}\n`);
        for (const row of groupRows.sort(sortBySaint)) {
          lines.push(featured.length ? `    - ${clean(row.Saint)}\n` : `  - ${clean(row.Saint)}\n`);
        }
      } else {
        const row = groupRows[0];
        lines.push(featured.length ? `  - ${clean(row.Saint)}` : `- ${clean(row.Saint)}`);
        if (label) lines.push(` (${label})`);
        lines.push("\n");
      }
    }
  }
  lines.push("\n");

  const tertiaryFamilies = notableFamilies
    .map((family) => ({
      ...family,
      tertiaryRows: tierRows(family.rows, "Tertiary")
    }))
    .filter((family) => family.tertiaryRows.length);
  lines.push("### Tertiary Saints\n\n");
  const tertiaryUsed = new Set();
  if (sectionCuratorial.length || tertiaryFamilies.length) {
    for (const family of sectionCuratorial) {
      const curatorialRows = familyGroups.get(family["Curatorial Family"]) || [];
      const curatorialTertiary = tierRows(curatorialRows, "Tertiary");
      if (!curatorialTertiary.length) continue;
      lines.push(`- ${family["Curatorial Family"]}`);
      if (family.Rationale) lines.push(`: ${family.Rationale}`);
      lines.push("\n");
      for (const row of curatorialTertiary) {
        tertiaryUsed.add(row["Saint ID"]);
        lines.push(`  - ${clean(row.Saint)}\n`);
      }
    }
    for (const family of tertiaryFamilies.slice(0, 18)) {
      if (family.key.startsWith("CUR-")) continue;
      const usableRows = family.tertiaryRows.filter((row) => !tertiaryUsed.has(row["Saint ID"]));
      if (!usableRows.length) continue;
      const label = labels.get(family.key);
      lines.push(`- ${family.label}`);
      if (label?.["Dominant Spiritual Regions"]) lines.push(`: ${label["Dominant Spiritual Regions"]}`);
      lines.push("\n");
      for (const row of usableRows.sort(sortBySaint)) {
        tertiaryUsed.add(row["Saint ID"]);
        lines.push(`  - ${clean(row.Saint)}\n`);
      }
    }
  }

  const tertiaryList = bulletList(names(tertiary.filter((row) => !tertiaryUsed.has(row["Saint ID"]))));
  if (tertiaryList) lines.push(tertiaryList);
  lines.push("\n");
}

fs.writeFileSync(outputPath, lines.join(""));
console.log(`Wrote ${outputPath}`);
console.log(`Included ${proposals.length} saint placements across ${allSections.length} museum sections.`);
