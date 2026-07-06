import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const exportsDir = path.join(root, "exports");
const coveragePath = path.join(exportsDir, "airtable-state-region-export-coverage-audit.csv");
const familyMembersPath = path.join(exportsDir, "airtable-saint-family-members.csv");
const proposalPath = path.join(exportsDir, "airtable-museum-section-proposals.csv");
const summaryPath = path.join(exportsDir, "airtable-museum-section-summary.csv");
const relationshipUpdatesPath = path.join(exportsDir, "airtable-museum-section-relationship-updates.csv");
const sectionLinksPath = path.join(exportsDir, "airtable-museum-section-links.csv");
const curatorialFamiliesPath = path.join(exportsDir, "airtable-museum-section-curatorial-families.csv");
const sampradayaUpdatesPath = path.join(exportsDir, "airtable-museum-section-sampradaya-updates.csv");
const cleanupFlagsPath = path.join(exportsDir, "airtable-museum-section-cleanup-flags.csv");
const familyLabelsPath = path.join(exportsDir, "airtable-saint-family-labels.csv");
const duplicateUpdatesPath = path.join(exportsDir, "airtable-museum-section-duplicate-updates.csv");

const SECTION = {
  gaudiya: "Gaudiya Vaishnava",
  varkari: "Varkari",
  datta: "Datta Tradition",
  kriya: "Rishikesh-Haridwar & Himalayan Monastic Lineages",
  ramanandi: "Ramanandi",
  rama: "Rama & Avadh",
  braj: "Braj & Krishna Bhakti",
  puri: "Jagannath-Puri & Odisha",
  kashi: "Kashi & Ascetic Lineages",
  rishikesh: "Rishikesh-Haridwar & Himalayan Monastic Lineages",
  nath: "Girnar & Nath Traditions",
  maharashtra: "Maharashtra Guru Lineages",
  sai: "Maharashtra Guru Lineages",
  ramana: "Ramana & Arunachala",
  sriVaishnava: "Sri Vaishnava & South Indian Vaishnava Traditions",
  shaivaTamil: "Shaiva Siddhanta & Tamil Traditions",
  andhra: "Andhra Avadhuta & Datta-Advaita Lineages",
  gujarat: "Gujarat & Swaminarayan Traditions",
  sikh: "Sikh & Punjab Traditions",
  bengal: "Bengal Shakta, Baul & Modern Saints",
  buddhist: "Buddhist Saints",
  udasin: "Udasin Saints",
  bhaktiMarga: "Bhakti Marga & Mauritius Lineage",
  global: "Global & Diaspora Lineages",
  needsResearch: "Needs Research"
};

const familySectionOverrides = new Map(Object.entries({
  "FAM-001": SECTION.gaudiya,
  "FAM-002": SECTION.gaudiya,
  "FAM-003": SECTION.datta,
  "FAM-004": SECTION.kriya,
  "FAM-005": SECTION.gaudiya,
  "FAM-006": SECTION.puri,
  "FAM-007": SECTION.sai,
  "FAM-008": SECTION.rishikesh,
  "FAM-009": SECTION.global,
  "FAM-010": SECTION.ramana,
  "FAM-011": SECTION.maharashtra,
  "FAM-012": SECTION.maharashtra,
  "FAM-013": SECTION.bengal,
  "FAM-014": SECTION.maharashtra,
  "FAM-015": SECTION.ramanandi,
  "FAM-016": SECTION.nath,
  "FAM-017": SECTION.braj,
  "FAM-018": SECTION.rishikesh,
  "FAM-019": SECTION.varkari,
  "FAM-020": SECTION.maharashtra,
  "FAM-021": SECTION.rishikesh,
  "FAM-022": SECTION.sai,
  "FAM-023": SECTION.nath,
  "FAM-024": SECTION.bengal,
  "FAM-060": SECTION.bhaktiMarga
}));

const familyLabelSectionOverrides = [
  [/gaudiya math/i, SECTION.gaudiya],
  [/bhagavan nityananda|ganeshpuri/i, SECTION.maharashtra],
  [/chaitanya|nityananda prabhu|jiva goswami|srinivasa acharya|gaudiya|bhaktivedanta baman|kishorikishorananda|tinkodi|navadwip goswami/i, SECTION.gaudiya],
  [/jagad bandhu/i, SECTION.gaudiya],
  [/dattatreya|swami samarth|narasimha saraswati/i, SECTION.datta],
  [/mahavatar|kriya/i, SECTION.kriya],
  [/ramakrishna|tota puri/i, SECTION.bengal],
  [/vijay krishna|radharamana charan das|puri/i, SECTION.puri],
  [/sai family|shirdi|upasani|meher baba|tajuddin|narayan maharaj/i, SECTION.sai],
  [/swami shivananda|haidakhan|chinmayananda/i, SECTION.rishikesh],
  [/ramana/i, SECTION.ramana],
  [/samarth ramdas|bhagavan nityananda|gajanan|janardhana giri/i, SECTION.maharashtra],
  [/ramanandi|sudama dasji|devraha|ravidas|kabhir/i, SECTION.ramanandi],
  [/braj|vrindavan|barsana|sudama das ji/i, SECTION.braj],
  [/nange baba|juna akhara|nath/i, SECTION.nath],
  [/baul|anandamoyi|tota puri|aurobindo/i, SECTION.bengal],
  [/bhakti marga|mauritius/i, SECTION.bhaktiMarga]
];

const bhaktiMargaNames = new Set([
  "arav das of salvador, brazil",
  "kaji of kenya",
  "mr natwarlal shah (mzee) of kenya",
  "mrs kasturben natwarlal shah (mauri) of kenya",
  "anuraagini dasi - manju komalram of mauritius",
  "sri gurudev veervasantha of surinam, mauritius",
  "sri narendra kumar geerjanan (dinesh) of rose hill mauritius",
  "sri rashmanee geerjanan (manee) of rose hill, mauritius"
]);

const featuredOverridesByRecordId = new Map([
  ["rec4V2uLs4HP4Ps3d", { section: SECTION.buddhist, note: "Curatorial cluster anchor: Gautama Buddha should feature in the Buddhist Saints section." }],
  ["recUhNLRTtAmi9JZG", { section: SECTION.udasin, note: "Curatorial cluster anchor: Baba Udasin should feature in the Udasin Saints section." }],
  ["reccJ4FERQ4WpHl8w", { note: "Explicit archivalist featured saint override: Sri Pranagopal Goswami." }],
  ["rec8qDaH8zmGtELbj", { note: "Explicit archivalist featured saint override: Sri Swami Shivananda of Rishikesh." }],
  ["recwLihcAMWgrOkeh", { note: "Explicit archivalist featured saint override: Sri Ravidas of Varanasi." }],
  ["recVqP32AbkSAHMVz", { note: "Explicit archivalist featured saint override: Sri Tailanga Swami." }],
  ["recrFB4BzrxVE7gr6", { note: "Explicit archivalist featured saint override: Sri Goswami Tulsidas." }],
  ["recQSPzGD8p4ZGPDh", { note: "Explicit archivalist featured saint override: Sri Kabir Dev Ji." }],
  ["rec8IrXY686AIc1rz", { note: "Explicit archivalist featured saint override: Sri Ramanujacharya." }],
  ["recMo8X6ehasAq0cW", { section: SECTION.sikh, note: "Explicit archivalist featured saint override: Baba Harbhajan Singh." }],
  ["rec5bMBZLbIgDKTi3", { note: "Explicit archivalist featured saint override: Sri Jalaram Baba." }],
  ["recBVn7Vp9onOO9Bh", { note: "Explicit archivalist featured saint override: Sri Anandamoyi Ma." }],
  ["reckV8sJXL5cq978J", { note: "Explicit archivalist featured saint override: Sri Paramahamsa Ramakrishna." }],
  ["recGN3z8hfy3Z0qqU", { note: "Explicit archivalist featured saint override: Sri Meher Baba." }],
  ["recnGc8AjeiSKvU0F", { note: "Explicit archivalist featured saint override: Sri Tukaram Maharaj of Pune." }],
  ["recwaqzrPJ8GnzVjC", { note: "Explicit archivalist featured saint override: Sri Gyaneshwar of Alandi." }],
  ["reca69ZkG7n2a7yYY", { section: SECTION.braj, note: "Explicit archivalist featured saint override: Sri Surdas Ji." }],
  ["rec1z1QnISdDcq5jB", { note: "Explicit archivalist featured saint override: Sri Surdas Ji / Surdas lineage." }],
  ["rec9cGrqgBRNKmfQV", { note: "Explicit archivalist featured saint override: Sri Satya Sai Baba." }],
  ["recoRltXupeZas8zP", { note: "Explicit archivalist featured saint override: Sri Mahavatar Babaji." }],
  ["rec1cTbJ4iPAMUW0v", { note: "Explicit archivalist featured saint override: Sri Vijay Krishna Goswami." }],
  ["reco84eCakzUdrmmP", { note: "Explicit archivalist featured saint override: Sri Radharamana Charan Das." }],
  ["recgLvBMiGOevOuZM", { note: "Explicit archivalist featured saint override: Sri Chaitanya Mahaprabhu." }],
  ["recK4u1sUzyWGtVTu", { note: "Explicit archivalist featured saint override: Nityananda Prabhu." }],
  ["recDQE3wQ8BNrmIpR", { note: "Explicit archivalist featured saint override: Sri Shirdi Sai Baba." }],
  ["recCC420vYWEjA1ZK", { note: "Explicit archivalist featured saint override: Dadu Dayal." }],
  ["recmarxKCZnFGzlo0", { note: "Explicit archivalist featured saint override: Mira Bai." }],
  ["recf7vlRhEe9AnHT8", { section: SECTION.varkari, note: "Explicit archivalist featured saint override: Namdev (13th century), part of the Namdev duplicate pair." }],
  ["recoFDxvENFFnNBOo", { section: SECTION.varkari, note: "Explicit archivalist featured saint override: Sri Bhagat Namdev, part of the Namdev duplicate pair." }],
  ["recIZYFwtqvfV8e8t", { note: "Explicit archivalist featured saint override: Sri Pamban Swamigal of Rameshwaram." }],
  ["rec7CR2qx4C8gkMYV", { note: "Explicit archivalist featured saint override: Kashmiri Bapu." }],
  ["rec4X9Xuul5WnIpxq", { section: SECTION.sriVaishnava, note: "Explicit archivalist featured saint override: Sri Raghavendra Swami; source row appears as Sri Ragavendarar Swamigal of ??." }],
  ["recx5ElFhvJ8JYJpx", { section: SECTION.kashi, note: "Explicit archivalist featured saint override: Sri Narayan Baba from Delhi; placed in the broader North Indian ascetic section pending stronger family data." }],
  ["rec8MNKAu5qm4Mk94", { note: "Explicit archivalist featured saint override: Sri Janabai of Pandharpur." }],
  ["recelwEuCC6ZnY62Y", { section: SECTION.shaivaTamil, note: "Explicit archivalist featured saint override: Sri Shiva Prabhakar; source row appears as Sri Siddha Yoga Shivaprabhakara Swami Brahmananda." }]
]);

const placementOverridesByRecordId = new Map([
  ["rec3ulkcd4vs7FA6v", { tier: "Secondary", note: "Explicit archivalist tier override: Balak Sadhu should be secondary in Gaudiya context." }],
  ["recMF6lJ4Vq5sZPUN", { tier: "Tertiary", note: "Explicit archivalist tier override: Gaudiya Math-associated monk should be tertiary." }],
  ["recyu7A0Cmfh0EA9N", { tier: "Tertiary", note: "Explicit archivalist tier override: Cuttack/Orissa Gaudiya Math-associated monk should be tertiary." }],
  ["recDske4jSTiuYtga", { tier: "Tertiary", note: "Explicit archivalist tier override: Cuttack/Orissa Gaudiya Math-associated monk should be tertiary." }],
  ["reccRAlL008YucnZG", { tier: "Tertiary", note: "Explicit archivalist tier override: Cuttack/Orissa Gaudiya Math-associated monk should be tertiary." }],
  ["reckHUfQ5SSZ3CGWg", { tier: "Tertiary", note: "Explicit archivalist tier override: Cuttack/Orissa Gaudiya Math-associated monk should be tertiary." }],
  ["rec8kLoCs2julYZOc", { tier: "Tertiary", note: "Explicit archivalist tier override: Cuttack/Orissa Gaudiya Math-associated monk should be tertiary." }],
  ["recseCcZfyiPXe8GD", { tier: "Tertiary", note: "Explicit archivalist tier override: Navadwip Gaudiya Math-associated monk should be tertiary." }],
  ["recsy2wkjoTURVDaG", { tier: "Tertiary", note: "Explicit archivalist tier override: Mayapur Gaudiya Math-associated monk should be tertiary." }],
  ["receYXrNaTeGyvi3M", { tier: "Tertiary", note: "Explicit archivalist tier override: Tridandi Gaudiya Math-associated monk should be tertiary." }],
  ["recozhkjd7tfSJLxO", { tier: "Tertiary", note: "Explicit archivalist tier override: Mayapur Gaudiya Math-associated monk should be tertiary." }],
  ["recBvAIzHPy3xmzNr", { tier: "Featured", note: "Explicit archivalist featured saint override: Goswamis of Vrindavan." }],
  ["recVaCcbHUvx8FlnC", { section: SECTION.varkari, tier: "Featured", note: "Explicit archivalist featured saint override: Sri Eknath Maharaj of Paithan." }],
  ["recyneffGvOQBsKXb", { section: SECTION.varkari, tier: "Featured", note: "Explicit archivalist featured saint override: Sri Narahari Sonar Maharaj." }],
  ["rec4Gy3pnr5aPNZn6", { section: SECTION.varkari, tier: "Featured", note: "Explicit archivalist featured saint override: Sant Sri Gora Kumbhar." }],
  ["rec5uKfAgf1pXTKbY", { section: SECTION.varkari, tier: "Featured", note: "Explicit archivalist featured saint override: Sri Kanopathra." }],
  ["rec5C2z9xBit3ohbJ", { tier: "Secondary", note: "Explicit archivalist tier override: Sri Sudama Dasji Maharaj should be secondary." }],
  ["recBiZXx2h4Dh3FRT", { tier: "Featured", note: "Explicit archivalist featured saint override: Sri Hanumanji." }],
  ["recNPByqGwt8AEDAr", { section: SECTION.sriVaishnava, tier: "Featured", only: true, note: "Explicit archivalist override: Sri Hathiram Baba should be featured and only recommended for Sri Vaishnava & South Indian Vaishnava Traditions." }],
  ["recjmxp3rHz88F4Zz", { section: SECTION.sriVaishnava, tier: "Featured", only: true, note: "Explicit archivalist override: duplicate Sri Hatiram Baba record should be featured and only recommended for Sri Vaishnava & South Indian Vaishnava Traditions." }],
  ["rechEXrlzldl7ZpoA", { tier: "Secondary", note: "Explicit archivalist tier override: Sri Mata Saroj Bala Devi of Varanasi should be secondary." }],
  ["recRZkHSnl8nDNArl", { tier: "Featured", note: "Explicit archivalist featured saint override: Sri Yogmaya Devi of Puri/Vrindavan." }],
  ["recaSmpkXpqslt29K", { tier: "Featured", note: "Explicit archivalist featured saint override: duplicate Sri Yogmaya Devi of Puri/Vrindavan record." }],
  ["rec1z1QnISdDcq5jB", { tier: "Secondary", note: "Explicit archivalist tier override: Sri Baba Surdas ji Maharaj of Allahabad should be secondary, not featured." }],
  ["recx6n6mmw1tEEnFF", { tier: "Featured", note: "Explicit archivalist featured saint override: Sri Lahiri Mahasaya of Varanasi." }],
  ["recH8o102sJ3mQ7aT", { tier: "Featured", note: "Explicit archivalist featured saint override: Sri Swami SriYukteshwar Giri of Serampur." }],
  ["reciPBtb5T1Js7Lqz", { tier: "Featured", note: "Explicit archivalist featured saint override: Sri Paramahamsa Yogananda of Gorakhpur." }],
  ["recZb2o8xbSZi6An4", { tier: "Tertiary", note: "Explicit archivalist tier override: Nange Baba should be tertiary." }],
  ["recDUrDJEvXGc72TG", { tier: "Tertiary", note: "Explicit archivalist tier override: Shivgiriji Maharaj should be tertiary." }],
  ["recj1Kgc42NXnBTla", { tier: "Tertiary", note: "Explicit archivalist tier override: Vidurdas Maharaj should be tertiary." }],
  ["rec6NG6MDSYvD0JT5", { tier: "Secondary", note: "Explicit archivalist tier override: Sri Bala Sai Baba of Kurnool should be secondary." }],
  ["recUGf2K67AR5c59I", { section: SECTION.maharashtra, tier: "Secondary", note: "Explicit archivalist override: Sri Janardhana Giri should be placed with Maharashtra and treated as secondary." }],
  ["rec5GvGX2G8pL2JKX", { tier: "Featured", note: "Explicit archivalist featured saint override: Sri Potuluri Veerabrahmendhra Swami." }],
  ["recmZi2DTfstyRd1l", { tier: "Featured", note: "Explicit archivalist featured saint override: Sri Guru Arjan Dev Ji of Amritsar." }],
  ["rec1r10GziEeP3uA8", { tier: "Featured", note: "Explicit archivalist featured saint override: Sri Guru Ram Das Ji & Guru Arjan Devji of Amritsar." }],
  ["receJdtoix1yXOu4k", { tier: "Tertiary", note: "Explicit archivalist tier override: Sant Gajo Singh of Amritsar should be tertiary." }],
  ["recKHsX7NM77DdRwx", { tier: "Tertiary", note: "Explicit archivalist tier override: Sant Gyaneshwar Singh of Amritsar should be tertiary." }],
  ["rec7pUhtDroFBKYZ9", { tier: "Secondary", note: "Explicit archivalist tier override: Sri Ravi Gopalam Nair should be secondary." }],
  ["reci9HfgQoLxj6igt", { tier: "Secondary", note: "Explicit archivalist tier override: Sri Shashanko Goshai should be secondary." }],
  ["recScF5b1ChfaQuFr", { section: SECTION.gaudiya, tier: "Tertiary", note: "Needs-research override: Sri Hum Itho Ikaan Sidap family should be proposed for Gaudiya, but remain tertiary." }],
  ["rec2kY7DzT3Kldfoc", { section: SECTION.braj, tier: "Tertiary", note: "Needs-research override: Sri Sudama Das ji family should be proposed for Braj & Krishna, but remain tertiary." }],
  ["rec1zHMns6EOTfUe7", { section: SECTION.shaivaTamil, tier: "Tertiary", note: "Needs-research override: Sri Chidambar Mahaswami Dixit should be proposed for Shaiva Siddhanta & Tamil Traditions, but remain tertiary." }],
  ["recwaqzrPJ8GnzVjC", { section: SECTION.varkari, only: true, note: "Explicit archivalist movement override: Sri Gyaneshwar of Alandi belongs only in Varkari." }],
  ["recVXtvEukZGghvSl", { section: SECTION.varkari, only: true, note: "Explicit archivalist movement override: Sri Savata Mali belongs only in Varkari." }],
  ["recrxPZFWGMXNLjkh", { section: SECTION.ramana, only: true, note: "Explicit archivalist movement override: Sri Radhe Ma of Tiruvannamalai belongs only in Ramana & Arunachala." }],
  ["recBVn7Vp9onOO9Bh", { section: SECTION.bengal, only: true, note: "Explicit archivalist movement override: Sri Anandamoyi Ma belongs only in Bengal Shakta, Baul & Modern Saints." }],
  ["rec4bgn1KKkTDDEkG", { section: SECTION.andhra, only: true, note: "Explicit archivalist movement override: Sri Amritananda Natha Saraswati of Devipuram belongs only in the Andhra section." }],
  ["recNYNzrzpmXr2lbV", { section: SECTION.braj, tier: "Featured", note: "Explicit archivalist featured saint override: Banke Bihariji from Vrindavan (deity)." }],
  ["recZDpbsnZYFhwjOp", { section: SECTION.braj, tier: "Featured", note: "Explicit archivalist featured saint override: Govardhan Shila supposedly from Advaita Acharya." }],
  ["reclyIPFpFR6q67Bx", { section: SECTION.puri, tier: "Featured", note: "Explicit archivalist featured saint override: Lord Jagannath (deity)." }],
  ["receeTTYzFn1nRAom", { section: SECTION.rishikesh, tier: "Featured", note: "Explicit archivalist featured saint override: Badrinarayana deity of Badrinath." }],
  ["recje6xb9KoUwRpQL", { section: SECTION.puri, tier: "Secondary", note: "Explicit archivalist tier override: Tota Gopinath should be secondary in the Jagannath-Puri & Odisha section." }],
  ["recwlct6RplW4XEhj", { section: SECTION.braj, tier: "Featured", note: "Explicit archivalist featured saint override: Sri Radha Raman (deity in Vrindavan)." }],
  ["recqrHsjXJuayrZml", { section: SECTION.bengal, tier: "Secondary", note: "Explicit archivalist tier override: Sri Swami Vivekananda of Calcutta & Sri Lokmanya Tilak should be secondary and associated with Sri Paramahamsa Ramakrishna." }]
]);

const virtualFamiliesByRecordId = new Map([
  ["recDQE3wQ8BNrmIpR", {
    id: "CUR-FAM-FIVE-PERFECT-MASTERS",
    section: SECTION.sai,
    tier: "Featured",
    confidence: "High",
    note: "Virtual curatorial Five Perfect Masters family for the Meher Baba era: Shirdi Sai Baba, Upasni Maharaj, Hazrat Babajan, Hazrat Tajuddin Baba, and Narayan Maharaj of Khedgoan Bed are grouped together as featured anchors."
  }],
  ["recV8xezfabpzSS0B", {
    id: "CUR-FAM-FIVE-PERFECT-MASTERS",
    section: SECTION.sai,
    tier: "Featured",
    confidence: "High",
    note: "Virtual curatorial Five Perfect Masters family for the Meher Baba era; Upasni Maharaj is one of the five perfect masters."
  }],
  ["recAzBZTh80FmTUJN", {
    id: "CUR-FAM-FIVE-PERFECT-MASTERS",
    section: SECTION.sai,
    tier: "Featured",
    confidence: "High",
    note: "Virtual curatorial Five Perfect Masters family for the Meher Baba era; Hazrat Babajan is one of the five perfect masters and should also be proposed as guru of Meher Baba."
  }],
  ["recZxEDfwSCOpkXyC", {
    id: "CUR-FAM-FIVE-PERFECT-MASTERS",
    section: SECTION.sai,
    tier: "Featured",
    confidence: "High",
    note: "Virtual curatorial Five Perfect Masters family for the Meher Baba era; Hazrat Tajuddin Baba is one of the five perfect masters."
  }],
  ["rec7rcJAHv3rsPsZN", {
    id: "CUR-FAM-FIVE-PERFECT-MASTERS",
    section: SECTION.sai,
    tier: "Featured",
    confidence: "High",
    note: "Virtual curatorial Five Perfect Masters family for the Meher Baba era; Narayan Maharaj of Khedgoan Bed is one of the five perfect masters."
  }],
  ["recGN3z8hfy3Z0qqU", {
    id: "CUR-FAM-FIVE-PERFECT-MASTERS",
    section: SECTION.sai,
    tier: "Secondary",
    confidence: "High",
    note: "Virtual curatorial Five Perfect Masters family for the Meher Baba era; Meher Baba is grouped here through Hazrat Babajan and the five perfect masters context."
  }],
  ["recmarxKCZnFGzlo0", {
    id: "CUR-FAM-RAMANANDACHARYA",
    section: SECTION.ramanandi,
    tier: "Secondary",
    confidence: "High",
    note: "Virtual curatorial Ramanandacharya family: Mira Bai is treated as a disciple of Ravidas; Ravidas and Kabhir Devji are treated as disciples of Ramanandacharya, the founder of the Ramanandi Sampradaya, whose relics are not in the table."
  }],
  ["recwLihcAMWgrOkeh", {
    id: "CUR-FAM-RAMANANDACHARYA",
    section: SECTION.ramanandi,
    tier: "Featured",
    confidence: "High",
    note: "Virtual curatorial Ramanandacharya family: Ravidas shares Ramanandacharya as common guru with Kabhir Devji and is the guru of Mira Bai."
  }],
  ["recQSPzGD8p4ZGPDh", {
    id: "CUR-FAM-RAMANANDACHARYA",
    section: SECTION.ramanandi,
    tier: "Featured",
    confidence: "High",
    note: "Virtual curatorial Ramanandacharya family: Kabhir Devji shares Ramanandacharya as common guru with Ravidas; Ramanandacharya is absent from the saint table because relics are not present."
  }],
  ["recvXsFbwopnW8RTA", {
    id: "CUR-FAM-AUROBINDO-INTEGRAL-YOGA",
    section: SECTION.bengal,
    tier: "Featured",
    confidence: "High",
    note: "Virtual curatorial Sri Aurobindo family: Sri Mirra Alfassa is treated as Sri Aurobindo's spiritual partner and coworker; Sri Aurobindo is not represented as a saint row because relics are not in the table."
  }],
  ["recXXBTDJy7Tp8LoG", {
    id: "CUR-FAM-AUROBINDO-INTEGRAL-YOGA",
    section: SECTION.bengal,
    tier: "Secondary",
    confidence: "High",
    note: "Virtual curatorial Sri Aurobindo family: Dadaji Dilip Kumar Roy is treated as a disciple of Sri Aurobindo and guru of Indira Devi."
  }],
  ["recXYK78omBVuEYQM", {
    id: "CUR-FAM-AUROBINDO-INTEGRAL-YOGA",
    section: SECTION.bengal,
    tier: "Secondary",
    confidence: "High",
    note: "Virtual curatorial Sri Aurobindo family: Indira Devi is treated as a disciple of Dadaji Dilip Kumar Roy."
  }],
  ["recasMrurmAu0iQ8J", {
    id: "CUR-FAM-SWAMINARAYAN-BAPS-GURUS",
    section: SECTION.gujarat,
    tier: "Featured",
    confidence: "High",
    note: "Virtual curatorial Swaminarayan/BAPS guru family: Bhagwan Swaminarayan is the founding anchor and should be tagged with Swaminarayan sampradaya."
  }],
  ["recjvIW2squH6mA0M", {
    id: "CUR-FAM-SWAMINARAYAN-BAPS-GURUS",
    section: SECTION.gujarat,
    tier: "Featured",
    confidence: "High",
    note: "Virtual curatorial Swaminarayan/BAPS guru family: Yogiji Maharaj is part of the key BAPS guru succession and should be tagged with Swaminarayan sampradaya."
  }],
  ["recotj9QaQaUUzAbE", {
    id: "CUR-FAM-SWAMINARAYAN-BAPS-GURUS",
    section: SECTION.gujarat,
    tier: "Featured",
    confidence: "High",
    note: "Virtual curatorial Swaminarayan/BAPS guru family: Pramukh Swami Maharaj is part of the key BAPS guru succession and should be tagged with Swaminarayan sampradaya."
  }]
]);

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
  const headers = rawHeaders.map((h) => h.trim().replace(/^\uFEFF/, ""));
  return data
    .filter((r) => r.some((cell) => cell !== ""))
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
}

function csvEscape(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function writeCsv(filePath, rows, headers) {
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`);
}

function norm(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function isNonSaintName(value) {
  const name = norm(value);
  return /^https?:\/\//.test(name) || /^rec[a-z0-9]+$/i.test(name);
}

function splitMulti(value) {
  return String(value || "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

function addUnique(items, item) {
  if (item && !items.includes(item)) items.push(item);
}

let familyLabelsById = new Map();

function sectionFromFamilyLabel(familyId) {
  const label = familyLabelsById.get(familyId);
  if (!label) return null;
  for (const [pattern, section] of familyLabelSectionOverrides) {
    if (pattern.test(label)) return section;
  }
  return null;
}

function sectionFromSampradaya(sampradaya) {
  const s = norm(sampradaya);
  if (!s || s === "(no sampradaya)") return null;
  if (s.includes("gaudiya") || s.includes("nityananda") || s.includes("shyamananda")) return SECTION.gaudiya;
  if (s.includes("varkari") || s.includes("vaikari")) return SECTION.varkari;
  if (s.includes("datta")) return SECTION.datta;
  if (s.includes("kriya")) return SECTION.kriya;
  if (s.includes("ramanandi") || s.includes("tyagi") || s.includes("satuwa")) return SECTION.ramanandi;
  if (s.includes("nimbarka")) return SECTION.braj;
  if (s.includes("sri vaishnava") || s.includes("sri sampradaya") || s.includes("ramanuja")) return SECTION.sriVaishnava;
  if (s.includes("swaminarayan")) return SECTION.gujarat;
  if (s.includes("nath") || s.includes("juna akhara") || s.includes("dashanami") || s.includes("giri sampradaya")) return SECTION.nath;
  if (s.includes("baul") || s.includes("tantra") || s.includes("jnana")) return SECTION.bengal;
  if (s.includes("ramana")) return SECTION.ramana;
  if (s.includes("buddh")) return SECTION.buddhist;
  if (s.includes("udasin")) return SECTION.udasin;
  return null;
}

function sectionFromRegion(region, name = "") {
  const r = norm(region);
  const n = norm(name);
  if (!r || r.includes("needs place research")) return null;
  if (n.includes("udasin")) return SECTION.udasin;
  if (r.includes("gaudiya")) return SECTION.gaudiya;
  if (r.includes("varkari")) return SECTION.varkari;
  if (r.includes("datta")) return SECTION.datta;
  if (r.includes("braj") || r.includes("krishna-dwarka")) return SECTION.braj;
  if (r.includes("govardhan")) return SECTION.braj;
  if (r.includes("kashi") || r.includes("prayag")) return SECTION.kashi;
  if (r.includes("jagannath") || r.includes("odisha") || r.includes("coastal odisha")) return SECTION.puri;
  if (r.includes("rishikesh") || r.includes("haridwar") || r.includes("char dham") || r.includes("himalaya") || r.includes("kumaon") || r.includes("uttarakhand")) return SECTION.rishikesh;
  if (r.includes("girnar") || r.includes("nath") || r.includes("gorakh")) return SECTION.nath;
  if (r.includes("gajanan") || r.includes("vidarbha") || r.includes("samarth") || r.includes("maharashtra") || r.includes("modern guru centers")) {
    if (n.includes("sai") || n.includes("shirdi") || n.includes("sathya")) return SECTION.sai;
    return SECTION.maharashtra;
  }
  if (r.includes("rama") || r.includes("avadh") || r.includes("chitrakoot") || r.includes("naimisharanya")) return SECTION.rama;
  if (r.includes("shaiva siddhanta") || r.includes("tamil")) return SECTION.shaivaTamil;
  if (r.includes("chennai") || r.includes("southern pilgrimage")) return SECTION.shaivaTamil;
  if (r.includes("andhra") || r.includes("coastal andhra")) return SECTION.andhra;
  if (r.includes("sri vaishnava") || r.includes("tirumala")) return SECTION.sriVaishnava;
  if (r.includes("gujarat") || r.includes("pushkar") || r.includes("rajputana") || r.includes("rajasthan") || r.includes("saurashtra")) return SECTION.gujarat;
  if (r.includes("sikh") || r.includes("punjab")) return SECTION.sikh;
  if (r.includes("bengal") || r.includes("kolkata") || r.includes("shakta") || r.includes("south asia") || r.includes("bardhaman")) return SECTION.bengal;
  if (r.includes("global")) return SECTION.global;
  return null;
}

function sectionFromName(name) {
  const n = norm(name);
  if (n.includes("govardhan") || n.includes("vrindavan") || n.includes("barsana")) return SECTION.braj;
  if (n.includes("girnar") || n.includes("gorakh") || n.includes("nath")) return SECTION.nath;
  if (n.includes("chitrakoot") || n.includes("ayodhya") || n.includes("ramdev") || n.includes("dhanushkodi") || n.includes("rameshwaram")) return SECTION.rama;
  if (n.includes("tirumala") || n.includes("rangannath") || n.includes("ramanuja")) return SECTION.sriVaishnava;
  if (n.includes("shirdi") || n.includes("sathya sai")) return SECTION.sai;
  if (n.includes("buddha") || n.includes("buddhist")) return SECTION.buddhist;
  if (n.includes("udasin")) return SECTION.udasin;
  if (n.includes("bengal") || n.includes("burdwan") || n.includes("bardhaman") || n.includes("tarapith")) return SECTION.bengal;
  if (n.includes("saurashtra") || n.includes("gujarat") || n.includes("rajasthan")) return SECTION.gujarat;
  return null;
}

function tierFor(row, family, primary, reasonType) {
  const name = norm(row["Saint"]);
  if (primary === SECTION.bhaktiMarga) {
    if (name.includes("narendra kumar") || name.includes("rashmanee geerjanan")) return "Secondary";
    return "Secondary";
  }
  if (primary === SECTION.needsResearch) return "Tertiary";
  if (family && reasonType === "family") {
    const familyId = family.FamilyID;
    const famSize = Number.parseInt(family.FamilySize || "0", 10);
    const isHeadish = !family.Masters && (family.Disciples || family.Partner || family.Incarnation);
    if (isHeadish || famSize >= 8 && !family.Masters) return "Featured";
    if (family.Masters || family.Partner) return "Secondary";
    return "Tertiary";
  }
  if (family && (family.Masters || family.Disciples || family.Partner || family.Incarnation)) return "Secondary";
  if (reasonType === "sampradaya") return "Tertiary";
  return "Tertiary";
}

function makeProposal(row, familyById) {
  const recordId = row["Saint ID"];
  const name = row["Saint"];
  const family = familyById.get(recordId);
  const alternatives = [];
  const rationaleBits = [];
  let primary = null;
  let confidence = "Medium";
  let reasonType = "region";
  let internalNote = "";
  const virtualFamily = virtualFamiliesByRecordId.get(recordId);
  const featuredOverride = featuredOverridesByRecordId.get(recordId);
  const placementOverride = placementOverridesByRecordId.get(recordId);

  if (isNonSaintName(name)) {
    primary = SECTION.needsResearch;
    confidence = "Low";
    reasonType = "data cleanup";
    rationaleBits.push("Record name appears to be a URL or raw Airtable record ID rather than a saint name; do not use as a museum placement until cleaned.");
  } else if (virtualFamily) {
    primary = virtualFamily.section;
    confidence = virtualFamily.confidence;
    reasonType = "virtual family";
    rationaleBits.push(virtualFamily.note);
  } else if (bhaktiMargaNames.has(norm(name))) {
    primary = SECTION.bhaktiMarga;
    confidence = "High";
    reasonType = "curatorial override";
    rationaleBits.push("Explicit curatorial override for Bhakti Marga and Mauritius lineage grouping.");
    addUnique(alternatives, SECTION.global);
  } else if (family && (sectionFromFamilyLabel(family.FamilyID) || familySectionOverrides.has(family.FamilyID))) {
    primary = sectionFromFamilyLabel(family.FamilyID) || familySectionOverrides.get(family.FamilyID);
    confidence = Number.parseInt(family.FamilySize || "0", 10) >= 4 ? "High" : "Medium";
    reasonType = "family";
    const label = familyLabelsById.get(family.FamilyID);
    rationaleBits.push(`Family override from ${label ? `${family.FamilyID} (${label})` : family.FamilyID}; family placement takes priority over geography.`);
  }

  const sampradayaSection = sectionFromSampradaya(row["Sampradaya"]);
  const regionSections = splitMulti(row["Spiritual regions"]).map((region) => sectionFromRegion(region, name)).filter(Boolean);
  const firstRegionSection = regionSections[0] || null;
  const nameSection = sectionFromName(name);

  if (!primary && sampradayaSection) {
    primary = sampradayaSection;
    reasonType = "sampradaya";
    confidence = "High";
    rationaleBits.push(`Sampradaya maps directly to ${primary}.`);
  }

  if (!primary && firstRegionSection) {
    primary = firstRegionSection;
    reasonType = "region";
    confidence = firstRegionSection === SECTION.global ? "Low" : "Medium";
    rationaleBits.push(`Spiritual region maps to ${primary}.`);
  }

  if (!primary && nameSection) {
    primary = nameSection;
    reasonType = "name clue";
    confidence = "Low";
    rationaleBits.push(`Name/place wording suggests ${primary}, but this should be reviewed.`);
  }

  if (!primary) {
    primary = SECTION.needsResearch;
    confidence = "Low";
    reasonType = "needs research";
    rationaleBits.push("No strong family, sampradaya, or spiritual-region section could be inferred.");
  }

  if (featuredOverride && reasonType !== "data cleanup") {
    const previousPrimary = primary;
    if (featuredOverride.section && featuredOverride.section !== primary) {
      primary = featuredOverride.section;
      reasonType = "featured override";
      confidence = "High";
      addUnique(alternatives, previousPrimary);
      rationaleBits.push(`${featuredOverride.note} Section also overridden to ${primary}.`);
    } else {
      rationaleBits.push(featuredOverride.note);
    }
  }

  if (placementOverride && reasonType !== "data cleanup") {
    const previousPrimary = primary;
    if (placementOverride.section && placementOverride.section !== primary) {
      primary = placementOverride.section;
      reasonType = "curatorial placement override";
      confidence = "High";
      if (!placementOverride.only) addUnique(alternatives, previousPrimary);
      rationaleBits.push(`${placementOverride.note} Section overridden to ${primary}.`);
    } else {
      rationaleBits.push(placementOverride.note);
    }
    if (placementOverride.only) alternatives.length = 0;
  }

  for (const section of [sampradayaSection, ...regionSections, nameSection]) {
    if (section !== primary) addUnique(alternatives, section);
  }

  if (placementOverride?.only) alternatives.length = 0;

  if (primary !== SECTION.global && row["Spiritual regions"]?.includes("Global")) addUnique(alternatives, SECTION.global);
  if (primary === SECTION.global && alternatives.length === 0) addUnique(alternatives, SECTION.needsResearch);

  if (reasonType === "data cleanup") {
    internalNote = "Data cleanup needed: this row appears to contain a source URL or raw record ID in the saint name field.";
  } else if (reasonType === "virtual family") {
    internalNote = virtualFamily.note;
  } else if (reasonType === "featured override") {
    internalNote = featuredOverride.note;
  } else if (reasonType === "curatorial placement override") {
    internalNote = placementOverride.note;
  } else if (reasonType === "curatorial override") {
    internalNote = "Keep with the Bhakti Marga and Mauritius lineage group even though the data may otherwise suggest Global or country-based placement.";
  } else if (family && reasonType !== "family" && family.FamilyID) {
    internalNote = `Family ${family.FamilyID} is present but not mapped to a stronger section override; review family tree if this placement feels off.`;
  } else if (reasonType === "family") {
    internalNote = `Organize inside ${primary} using ${family.FamilyID} family context before geography.`;
  }

  if (!alternatives.length && primary !== SECTION.needsResearch && !placementOverride?.only) addUnique(alternatives, SECTION.needsResearch);

  const tier = reasonType === "data cleanup" ? "Tertiary" : placementOverride?.tier ?? (featuredOverride ? "Featured" : virtualFamily?.tier ?? tierFor(row, family, primary, reasonType));
  if (tier === "Featured") rationaleBits.push("Tier proposed as Featured because the record appears to anchor or lead a family cluster.");
  if (tier === "Secondary") rationaleBits.push("Tier proposed as Secondary because the record is a close family/lineage member or direct section fit.");
  if (tier === "Tertiary") rationaleBits.push("Tier proposed as Tertiary because placement is contextual, inferred, or lower-confidence.");

  return {
    "Saint ID": recordId,
    "Saint": name,
    "Primary Museum Section": primary,
    "Alternative Museum Sections": alternatives.join("; "),
    "Museum Section Tier": tier,
    "Museum Section Confidence": confidence,
    "Museum Section Rationale": rationaleBits.join(" "),
    "Museum Section Internal Placement Note": internalNote,
    "Family ID": family?.FamilyID ?? "",
    "Curatorial Family": virtualFamily?.id ?? "",
    "Family Size": family?.FamilySize ?? "",
    "Spiritual regions": row["Spiritual regions"],
    "Sampradaya": row["Sampradaya"],
    "Normalized places": row["Normalized places"]
  };
}

if (fs.existsSync(familyLabelsPath)) {
  familyLabelsById = new Map(parseCsv(fs.readFileSync(familyLabelsPath, "utf8")).map((row) => [row["Family ID"], row["Proposed Family Label"]]));
}

const coverageRows = parseCsv(fs.readFileSync(coveragePath, "utf8"));
const familyRows = parseCsv(fs.readFileSync(familyMembersPath, "utf8"));
const familyById = new Map(familyRows.map((row) => [row.RecordId, row]));
const familyStats = new Map();
for (const row of familyRows) {
  if (!row.FamilyID) continue;
  if (isNonSaintName(row.Name)) continue;
  if (!familyStats.has(row.FamilyID)) {
    familyStats.set(row.FamilyID, { count: 0, names: [] });
  }
  const stats = familyStats.get(row.FamilyID);
  stats.count += 1;
  if (stats.names.length < 3) stats.names.push(row.Name);
}
familyStats.set("CUR-FAM-RAMANANDACHARYA", {
  count: 3,
  names: ["Sri Ravidas of Varanasi", "Sri Kabhir Devji of Varanasi", "Sri Mira Bai of Rajasthan"]
});
familyStats.set("CUR-FAM-FIVE-PERFECT-MASTERS", {
  count: 6,
  names: [
    "Sri Shirdi Sai Baba of Shirdi",
    "Sri Upasani Maharaj of Shirdi",
    "Sri Hazrat Babajan of Pune",
    "Sri Tajuddin Baba (Auliya) of Nagpur",
    "Sri Narayan Maharaj of Khedgoan Bed",
    "Sri Meher Baba of Pune"
  ]
});

const proposals = coverageRows
  .map((row) => makeProposal(row, familyById))
  .sort((a, b) => a["Primary Museum Section"].localeCompare(b["Primary Museum Section"]) || a["Saint"].localeCompare(b["Saint"]));

const proposalHeaders = [
  "Saint ID",
  "Saint",
  "Primary Museum Section",
  "Alternative Museum Sections",
  "Museum Section Tier",
  "Museum Section Confidence",
  "Museum Section Rationale",
  "Museum Section Internal Placement Note",
  "Family ID",
  "Curatorial Family",
  "Family Size",
  "Spiritual regions",
  "Sampradaya",
  "Normalized places"
];
writeCsv(proposalPath, proposals, proposalHeaders);

const updatesPath = path.join(exportsDir, "airtable-museum-section-updates.csv");
writeCsv(
  updatesPath,
  proposals.map((row) => ({
    "Airtable Record ID": row["Saint ID"],
    "Name": row["Saint"],
    "Primary Museum Section": row["Primary Museum Section"],
    "Alternative Museum Sections": row["Alternative Museum Sections"],
    "Museum Section Tier": row["Museum Section Tier"],
    "Museum Section Confidence": row["Museum Section Confidence"],
    "Museum Section Rationale": row["Museum Section Rationale"],
    "Museum Section Internal Placement Note": row["Museum Section Internal Placement Note"]
  })),
  [
    "Airtable Record ID",
    "Name",
    "Primary Museum Section",
    "Alternative Museum Sections",
    "Museum Section Tier",
    "Museum Section Confidence",
    "Museum Section Rationale",
    "Museum Section Internal Placement Note"
  ]
);

const bySection = new Map();
for (const row of proposals) {
  const key = row["Primary Museum Section"];
  if (!bySection.has(key)) {
    bySection.set(key, {
      count: 0,
      high: 0,
      medium: 0,
      low: 0,
      featured: 0,
      secondary: 0,
      tertiary: 0,
      featuredSaints: [],
      familyIds: new Set()
    });
  }
  const item = bySection.get(key);
  item.count += 1;
  item[row["Museum Section Confidence"].toLowerCase()] += 1;
  item[row["Museum Section Tier"].toLowerCase()] += 1;
  if (row["Museum Section Tier"] === "Featured" && !isNonSaintName(row.Saint)) item.featuredSaints.push(row.Saint);
  if (row["Family ID"]) item.familyIds.add(row["Family ID"]);
  if (row["Curatorial Family"]) item.familyIds.add(row["Curatorial Family"]);
}

const summary = [...bySection.entries()]
  .map(([section, stats]) => ({
    "Primary Museum Section": section,
    "Saint Count": stats.count,
    "High Confidence": stats.high,
    "Medium Confidence": stats.medium,
    "Low Confidence": stats.low,
    "Featured": stats.featured,
    "Secondary": stats.secondary,
    "Tertiary": stats.tertiary,
    "Featured Saints": stats.featuredSaints.sort((a, b) => a.localeCompare(b)).join("; "),
    "Associated Families": [...stats.familyIds]
      .sort((a, b) => a.localeCompare(b))
      .map((familyId) => {
        const family = familyStats.get(familyId);
        return family ? `${familyId} (${family.count}): ${family.names.join("; ")}` : familyId;
      })
      .join(" | ")
  }))
  .sort((a, b) => Number(b["Saint Count"]) - Number(a["Saint Count"]) || a["Primary Museum Section"].localeCompare(b["Primary Museum Section"]));

writeCsv(summaryPath, summary, [
  "Primary Museum Section",
  "Saint Count",
  "High Confidence",
  "Medium Confidence",
  "Low Confidence",
  "Featured",
  "Secondary",
  "Tertiary",
  "Featured Saints",
  "Associated Families"
]);

writeCsv(
  relationshipUpdatesPath,
  [
    {
      "Relationship Type": "Guru-disciple",
      "Disciple Record ID": "recmarxKCZnFGzlo0",
      "Disciple Name": "Sri Mira Bai of Rajasthan",
      "Guru Record ID": "recwLihcAMWgrOkeh",
      "Guru Name": "Sri Ravidas of Varanasi",
      "Airtable Update Note": "Add Ravidas to Mira Bai Master(s), and Mira Bai to Ravidas Disciples.",
      "Curatorial Context": "Ravidas and Sri Kabhir Devji of Varanasi share Ramanandacharya as common guru; Ramanandacharya founded the Ramanandi Sampradaya but is not represented as a saint row because relics are not in the table.",
      "Museum Section Impact": "Groups Mira Bai, Ravidas, and Kabhir Devji under Ramanandi via CUR-FAM-RAMANANDACHARYA."
    },
    {
      "Relationship Type": "Guru-disciple",
      "Disciple Record ID": "recV8xezfabpzSS0B",
      "Disciple Name": "Sri Upasani Maharaj of Shirdi",
      "Guru Record ID": "recDQE3wQ8BNrmIpR",
      "Guru Name": "Sri Shirdi Sai Baba of Shirdi",
      "Airtable Update Note": "Add Shirdi Sai Baba to Upasani Maharaj Master(s), and Upasani Maharaj to Shirdi Sai Baba Disciples.",
      "Curatorial Context": "Upasani Maharaj belongs in the Shirdi/Five Perfect Masters context and should be explicitly connected as a disciple of Shirdi Sai Baba.",
      "Museum Section Impact": "Strengthens CUR-FAM-FIVE-PERFECT-MASTERS inside Maharashtra Guru Lineages."
    },
    {
      "Relationship Type": "Guru-disciple",
      "Disciple Record ID": "recGN3z8hfy3Z0qqU",
      "Disciple Name": "Sri Meher Baba of Pune",
      "Guru Record ID": "recAzBZTh80FmTUJN",
      "Guru Name": "Sri Hazrat Babajan of Pune",
      "Airtable Update Note": "Add Hazrat Babajan to Meher Baba Master(s), and Meher Baba to Hazrat Babajan Disciples.",
      "Curatorial Context": "Hazrat Babajan is one of the five perfect masters associated with Meher Baba's era.",
      "Museum Section Impact": "Connects Meher Baba to CUR-FAM-FIVE-PERFECT-MASTERS inside Maharashtra Guru Lineages."
    },
    {
      "Relationship Type": "Guru-disciple",
      "Disciple Record ID": "recGN3z8hfy3Z0qqU",
      "Disciple Name": "Sri Meher Baba of Pune",
      "Guru Record ID": "recV8xezfabpzSS0B",
      "Guru Name": "Sri Upasani Maharaj of Shirdi",
      "Airtable Update Note": "Add Upasani Maharaj to Meher Baba Master(s), and Meher Baba to Upasani Maharaj Disciples.",
      "Curatorial Context": "Meher Baba is also a disciple of Upasani Maharaj, linking him directly into the Shirdi/Sakori branch of the Five Perfect Masters context.",
      "Museum Section Impact": "Strengthens Meher Baba's placement inside CUR-FAM-FIVE-PERFECT-MASTERS and Maharashtra Guru Lineages."
    },
    {
      "Relationship Type": "Guru-disciple",
      "Disciple Record ID": "recKQvAzazop2jggr",
      "Disciple Name": "Sri Sai Leela Amma of Andhra Pradesh",
      "Guru Record ID": "recDQE3wQ8BNrmIpR",
      "Guru Name": "Sri Shirdi Sai Baba of Shirdi",
      "Airtable Update Note": "Add Shirdi Sai Baba to Sai Leela Amma Master(s), and Sai Leela Amma to Shirdi Sai Baba Disciples.",
      "Curatorial Context": "Sai Leelamma should be considered a disciple of Shirdi Sai Baba within the Sai Family grouping.",
      "Museum Section Impact": "Strengthens the Sai Family branch inside Maharashtra Guru Lineages."
    },
    {
      "Relationship Type": "Guru-disciple",
      "Disciple Record ID": "rec4OqIqWOTDRvYLU",
      "Disciple Name": "Sri Binod Bihari Das Babaji of Barsana",
      "Guru Record ID": "recf4vRbtCanSjor4",
      "Guru Name": "Sri Srimad Kishorikishorananda Das Babaji Maharaj Goswami of Navadwip (Tinkodi Baba)",
      "Airtable Update Note": "Add Tinkodi Baba to Binod Bihari Das Babaji Master(s), and Binod Bihari Das Babaji to Tinkodi Baba Disciples.",
      "Curatorial Context": "Missing guru relationship supplied by archival review.",
      "Museum Section Impact": "Strengthens the Gaudiya/Braj family bridge while keeping family context explicit."
    },
    {
      "Relationship Type": "Guru-disciple",
      "Disciple Record ID": "recjvIW2squH6mA0M",
      "Disciple Name": "Sri Yogiji Maharaj(BAPS-4th Guru after Swaminarayn)",
      "Guru Record ID": "recasMrurmAu0iQ8J",
      "Guru Name": "Sri Bhagavan Sri Swaminarayan of Gujarat",
      "Airtable Update Note": "Add Bhagwan Swaminarayan to Yogiji Maharaj Master(s), and Yogiji Maharaj to Bhagwan Swaminarayan Disciples.",
      "Curatorial Context": "Present Swaminarayan/BAPS records should affiliate to Bhagwan Swaminarayan as guru/source figure.",
      "Museum Section Impact": "Creates an explicit Swaminarayan guru family inside Gujarat & Swaminarayan Traditions."
    },
    {
      "Relationship Type": "Guru-disciple",
      "Disciple Record ID": "recotj9QaQaUUzAbE",
      "Disciple Name": "Sri Pramukh Swami Maharaj (BAPS-5th Guru after Swaminarayan) of Gujarat",
      "Guru Record ID": "recasMrurmAu0iQ8J",
      "Guru Name": "Sri Bhagavan Sri Swaminarayan of Gujarat",
      "Airtable Update Note": "Add Bhagwan Swaminarayan to Pramukh Swami Maharaj Master(s), and Pramukh Swami Maharaj to Bhagwan Swaminarayan Disciples.",
      "Curatorial Context": "Present Swaminarayan/BAPS records should affiliate to Bhagwan Swaminarayan as guru/source figure.",
      "Museum Section Impact": "Creates an explicit Swaminarayan guru family inside Gujarat & Swaminarayan Traditions."
    },
    {
      "Relationship Type": "Guru-disciple",
      "Disciple Record ID": "rechBZw1LyW9TTX9L",
      "Disciple Name": "Sri Hemalata Thakurani",
      "Guru Record ID": "recJepdkXi90kdROh",
      "Guru Name": "Sri Srinivasa Acharya of Vrindavan",
      "Airtable Update Note": "Add Srinivasa Acharya to Hemalata Thakurani Master(s), and Hemalata Thakurani to Srinivasa Acharya Disciples.",
      "Curatorial Context": "Hemalata Thakurani is the daughter of Srinivasa Acharya; treat this as the museum/family guru relationship.",
      "Museum Section Impact": "Keeps Hemalata inside the Gaudiya family narrative."
    },
    {
      "Relationship Type": "Guru-disciple",
      "Disciple Record ID": "recqrHsjXJuayrZml",
      "Disciple Name": "Sri Swami Vivekananda of Calcutta & Sri Lokmanya Tilak of (from where?)",
      "Guru Record ID": "reckV8sJXL5cq978J",
      "Guru Name": "Sri Paramahamsa Ramakrishna",
      "Airtable Update Note": "Add Sri Paramahamsa Ramakrishna to the combined Vivekananda/Tilak row Master(s), and the combined row to Ramakrishna Disciples.",
      "Curatorial Context": "Archival review notes this row should be secondary and connected to Sri Paramahamsa Ramakrishna through Swami Vivekananda.",
      "Museum Section Impact": "Keeps the row with the Bengal/Ramakrishna family context."
    },
    {
      "Relationship Type": "Guru-disciple",
      "Disciple Record ID": "recXXBTDJy7Tp8LoG",
      "Disciple Name": "Sri Dadaji Dilip Kumar Roy of Pune",
      "Guru Record ID": "",
      "Guru Name": "Sri Aurobindo",
      "Airtable Update Note": "Represent Sri Aurobindo as guru of Dadaji Dilip Kumar Roy in family/museum notes. There is no saint row to link because Sri Aurobindo relics are not in the table.",
      "Curatorial Context": "Sri Aurobindo is the absent lineage source for this curatorial family.",
      "Museum Section Impact": "Groups Dadaji Dilip Kumar Roy with Sri Mirra Alfassa and Indira Devi under CUR-FAM-AUROBINDO-INTEGRAL-YOGA."
    },
    {
      "Relationship Type": "Guru-disciple",
      "Disciple Record ID": "recXYK78omBVuEYQM",
      "Disciple Name": "Sri Indira Devi of Pune",
      "Guru Record ID": "recXXBTDJy7Tp8LoG",
      "Guru Name": "Sri Dadaji Dilip Kumar Roy of Pune",
      "Airtable Update Note": "Add Dadaji Dilip Kumar Roy to Indira Devi Master(s), and Indira Devi to Dadaji Dilip Kumar Roy Disciples.",
      "Curatorial Context": "Indira Devi belongs to the Sri Aurobindo curatorial family through Dadaji Dilip Kumar Roy.",
      "Museum Section Impact": "Keeps Indira Devi adjacent to Dadaji and Sri Mirra Alfassa even though the base geography points to Pune/Maharashtra."
    },
    {
      "Relationship Type": "Spiritual partner/coworker",
      "Disciple Record ID": "recvXsFbwopnW8RTA",
      "Disciple Name": "Sri Mirra Alfassa of Auroville, near Puducherry, Tamil Nadu",
      "Guru Record ID": "",
      "Guru Name": "Sri Aurobindo",
      "Airtable Update Note": "Represent Sri Mirra Alfassa as Sri Aurobindo's spiritual partner/coworker in family/museum notes. There is no Sri Aurobindo saint row to link because relics are not in the table.",
      "Curatorial Context": "Sri Mirra Alfassa should be a featured saint for the Sri Aurobindo curatorial family.",
      "Museum Section Impact": "Moves Sri Mirra Alfassa from a Tamil geography-led placement into CUR-FAM-AUROBINDO-INTEGRAL-YOGA."
    }
  ],
  [
    "Relationship Type",
    "Disciple Record ID",
    "Disciple Name",
    "Guru Record ID",
    "Guru Name",
    "Airtable Update Note",
    "Curatorial Context",
    "Museum Section Impact"
  ]
);

writeCsv(
  duplicateUpdatesPath,
  [
    {
      "Airtable Record ID": "recNPByqGwt8AEDAr",
      "Name": "Sri Hathiram Baba",
      "Potential Duplicate Record ID": "recjmxp3rHz88F4Zz",
      "Potential Duplicate Name": "Sri Hatiram Baba of Tirupati, Andhra Pradesh",
      "Update Note": "Archival review notes these are duplicate Hathiram/Hatiram Baba records; keep both sectioned as Sri Vaishnava & South Indian Vaishnava Traditions pending merge review."
    },
    {
      "Airtable Record ID": "recjmxp3rHz88F4Zz",
      "Name": "Sri Hatiram Baba of Tirupati, Andhra Pradesh",
      "Potential Duplicate Record ID": "recNPByqGwt8AEDAr",
      "Potential Duplicate Name": "Sri Hathiram Baba",
      "Update Note": "Archival review notes these are duplicate Hathiram/Hatiram Baba records; keep both sectioned as Sri Vaishnava & South Indian Vaishnava Traditions pending merge review."
    }
  ],
  [
    "Airtable Record ID",
    "Name",
    "Potential Duplicate Record ID",
    "Potential Duplicate Name",
    "Update Note"
  ]
);

writeCsv(
  sectionLinksPath,
  [
    {
      "Section Link": "Five Perfect Masters / Meher Baba Era",
      "Primary Section": "Maharashtra Guru Lineages",
      "Linked Sections": "",
      "Curatorial Family": "CUR-FAM-FIVE-PERFECT-MASTERS",
      "Featured Saints": "Sri Shirdi Sai Baba of Shirdi; Sri Upasani Maharaj of Shirdi; Sri Hazrat Babajan of Pune; Sri Tajuddin Baba (Auliya) of Nagpur; Sri Narayan Maharaj of Khedgoan Bed",
      "Related Saints": "Sri Meher Baba of Pune",
      "Placement Note": "Use this as an internal bridge inside Maharashtra Guru Lineages. Shirdi, Sakori, Pune, Nagpur, and Khedgoan Bed can be interpreted as related Maharashtra guru centers rather than separate top-level museum sections. Meher Baba is linked through Hazrat Babajan and Upasani Maharaj."
    },
    {
      "Section Link": "Sri Aurobindo / Integral Yoga Family",
      "Primary Section": "Bengal Shakta, Baul & Modern Saints",
      "Linked Sections": "Shaiva Siddhanta & Tamil Traditions; Maharashtra Guru Lineages",
      "Curatorial Family": "CUR-FAM-AUROBINDO-INTEGRAL-YOGA",
      "Featured Saints": "Sri Mirra Alfassa of Auroville, near Puducherry, Tamil Nadu",
      "Related Saints": "Sri Dadaji Dilip Kumar Roy of Pune; Sri Indira Devi of Pune",
      "Placement Note": "Use this as a family-led bridge from Sri Aurobindo's Bengal/Pondicherry context to Auroville and Pune. Keep the family together; use Tamil and Maharashtra sections as alternatives or adjacent physical context."
    },
    {
      "Section Link": "Swaminarayan / BAPS Guru Succession",
      "Primary Section": "Gujarat & Swaminarayan Traditions",
      "Linked Sections": "",
      "Curatorial Family": "CUR-FAM-SWAMINARAYAN-BAPS-GURUS",
      "Featured Saints": "Sri Bhagavan Sri Swaminarayan of Gujarat; Sri Yogiji Maharaj; Sri Pramukh Swami Maharaj",
      "Related Saints": "",
      "Placement Note": "Use this as an internal featured subgroup inside Gujarat & Swaminarayan Traditions. Records for Gunatitanand Swami, Shastri Yagnapurushdas/Shastriji Maharaj, and Mahant Swami Maharaj were not found in the current export and should be omitted unless added later."
    }
  ],
  [
    "Section Link",
    "Primary Section",
    "Linked Sections",
    "Curatorial Family",
    "Featured Saints",
    "Related Saints",
    "Placement Note"
  ]
);

writeCsv(
  curatorialFamiliesPath,
  [
    {
      "Curatorial Family": "CUR-FAM-RAMANANDACHARYA",
      "Primary Museum Section": "Ramanandi",
      "Linked Sections": "Kashi & Ascetic Lineages; Rama & Avadh; Gujarat & Swaminarayan Traditions",
      "Featured Saints": "Sri Ravidas of Varanasi; Sri Kabhir Devji of Varanasi",
      "Secondary Saints": "Sri Mira Bai of Rajasthan",
      "Rationale": "Ramanandacharya is the common guru of Ravidas and Kabhir Devji and the founder of the Ramanandi Sampradaya, but is not a saint row because relics are not in the table."
    },
    {
      "Curatorial Family": "CUR-FAM-FIVE-PERFECT-MASTERS",
      "Primary Museum Section": "Maharashtra Guru Lineages",
      "Linked Sections": "",
      "Featured Saints": "Sri Shirdi Sai Baba of Shirdi; Sri Upasani Maharaj of Shirdi; Sri Hazrat Babajan of Pune; Sri Tajuddin Baba (Auliya) of Nagpur; Sri Narayan Maharaj of Khedgoan Bed",
      "Secondary Saints": "Sri Meher Baba of Pune",
      "Rationale": "Groups the five perfect masters associated with Meher Baba's era as an internal subgroup of Maharashtra Guru Lineages. Meher Baba is linked through Hazrat Babajan and Upasani Maharaj."
    },
    {
      "Curatorial Family": "CUR-FAM-AUROBINDO-INTEGRAL-YOGA",
      "Primary Museum Section": "Bengal Shakta, Baul & Modern Saints",
      "Linked Sections": "Shaiva Siddhanta & Tamil Traditions; Maharashtra Guru Lineages",
      "Featured Saints": "Sri Mirra Alfassa of Auroville, near Puducherry, Tamil Nadu",
      "Secondary Saints": "Sri Dadaji Dilip Kumar Roy of Pune; Sri Indira Devi of Pune",
      "Rationale": "Sri Aurobindo is the absent guru/source figure for this family. Dadaji Dilip Kumar Roy is treated as Sri Aurobindo's disciple and Indira Devi's guru; Sri Mirra Alfassa is treated as Sri Aurobindo's spiritual partner/coworker and featured anchor."
    },
    {
      "Curatorial Family": "CUR-FAM-SWAMINARAYAN-BAPS-GURUS",
      "Primary Museum Section": "Gujarat & Swaminarayan Traditions",
      "Linked Sections": "",
      "Featured Saints": "Sri Bhagavan Sri Swaminarayan of Gujarat; Sri Yogiji Maharaj; Sri Pramukh Swami Maharaj",
      "Secondary Saints": "",
      "Rationale": "Groups present records for key Swaminarayan/BAPS gurus and proposes adding Swaminarayan sampradaya where the source export currently says no sampradaya. Gunatitanand Swami, Shastri Yagnapurushdas/Shastriji Maharaj, and Mahant Swami Maharaj were not found in the current export."
    }
  ],
  [
    "Curatorial Family",
    "Primary Museum Section",
    "Linked Sections",
    "Featured Saints",
    "Secondary Saints",
    "Rationale"
  ]
);

writeCsv(
  sampradayaUpdatesPath,
  [
    {
      "Airtable Record ID": "recasMrurmAu0iQ8J",
      "Saint": "Sri Bhagavan Sri Swaminarayan of Gujarat (Sri Sahajanand Swami - Neelkanth Varuni)",
      "Current Sampradaya": "(No Sampradaya)",
      "Proposed Sampradaya": "Swaminarayan",
      "Curatorial Family": "CUR-FAM-SWAMINARAYAN-BAPS-GURUS",
      "Update Note": "Key Swaminarayan founder/anchor; tag with Swaminarayan sampradaya and keep in Gujarat & Swaminarayan Traditions."
    },
    {
      "Airtable Record ID": "recjvIW2squH6mA0M",
      "Saint": "Sri Yogiji Maharaj(BAPS-4th Guru after Swaminarayn)",
      "Current Sampradaya": "(No Sampradaya)",
      "Proposed Sampradaya": "Swaminarayan",
      "Curatorial Family": "CUR-FAM-SWAMINARAYAN-BAPS-GURUS",
      "Update Note": "Key BAPS guru succession row; tag with Swaminarayan sampradaya and keep grouped with Bhagwan Swaminarayan and Pramukh Swami Maharaj."
    },
    {
      "Airtable Record ID": "recotj9QaQaUUzAbE",
      "Saint": "Sri Pramukh Swami Maharaj (BAPS-5th Guru after Swaminarayan) of Gujarat",
      "Current Sampradaya": "(No Sampradaya)",
      "Proposed Sampradaya": "Swaminarayan",
      "Curatorial Family": "CUR-FAM-SWAMINARAYAN-BAPS-GURUS",
      "Update Note": "Key BAPS guru succession row; tag with Swaminarayan sampradaya and keep grouped with Bhagwan Swaminarayan and Yogiji Maharaj."
    }
  ],
  [
    "Airtable Record ID",
    "Saint",
    "Current Sampradaya",
    "Proposed Sampradaya",
    "Curatorial Family",
    "Update Note"
  ]
);

const cleanupFlags = proposals
  .filter((row) => isNonSaintName(row.Saint))
  .map((row) => ({
    "Airtable Record ID": row["Saint ID"],
    "Name": row.Saint,
    "Issue": "Name appears to be a URL or raw Airtable record ID, not a saint name.",
    "Current Family ID": row["Family ID"],
    "Suggested Action": "Review Airtable row. Move URL into a source/reference field or rename the saint record if it represents a real saint."
  }));

writeCsv(
  cleanupFlagsPath,
  cleanupFlags,
  ["Airtable Record ID", "Name", "Issue", "Current Family ID", "Suggested Action"]
);

console.log(`Wrote ${proposals.length} proposals to ${proposalPath}`);
console.log(`Wrote ${proposals.length} Airtable update rows to ${updatesPath}`);
console.log(`Wrote ${summary.length} summary rows to ${summaryPath}`);
console.log(`Wrote manual relationship update notes to ${relationshipUpdatesPath}`);
console.log(`Wrote section links to ${sectionLinksPath}`);
console.log(`Wrote curatorial families to ${curatorialFamiliesPath}`);
console.log(`Wrote sampradaya updates to ${sampradayaUpdatesPath}`);
console.log(`Wrote ${cleanupFlags.length} cleanup flags to ${cleanupFlagsPath}`);
