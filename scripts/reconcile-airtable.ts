import { db } from "../lib/db";

type AirtableSaintCandidate = {
  recordId: string;
  name: string;
  place?: unknown;
  birth?: unknown;
  birthYear?: string;
  samadhi?: unknown;
  samadhiYear?: string;
  relics?: unknown;
};

type DuplicateCluster = {
  normalizedName: string;
  matchKind: "normalized_name" | "date_informed_identity";
  candidates: AirtableSaintCandidate[];
};

const HUMAN_REJECTED_DUPLICATE_PAIRS = [
  ["recAuyUpWJwYAe09C", "recBRjhdw2jf5P23S"]
];

const HUMAN_CONFIRMED_DUPLICATE_PAIRS = [
  ["recf7vlRhEe9AnHT8", "recoFDxvENFFnNBOo"]
];

const HONORIFICS = new Set([
  "108",
  "baba",
  "bhagat",
  "ji",
  "mahant",
  "maharaj",
  "maharaja",
  "paramahamsa",
  "paramahansa",
  "saint",
  "sant",
  "shri",
  "sri",
  "srila",
  "swami"
]);

function parseArgs(argv: string[]) {
  return {
    write: argv.includes("--write"),
    limit: getNumericArg(argv, "--limit")
  };
}

function getNumericArg(argv: string[], key: string) {
  const inline = argv.find((arg) => arg.startsWith(`${key}=`));
  const value = inline?.split("=", 2)[1] ?? argv[argv.indexOf(key) + 1];
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function normalizeSaintName(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((token) => token && !HONORIFICS.has(token))
    .join(" ")
    .trim();
}

function normalizeCoreIdentity(value: unknown) {
  return String(value ?? "")
    .replace(/\([^)]*\)/g, " ")
    .split(/\s+of\s+/i)[0]
    .trim();
}

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function extractYear(value: unknown) {
  const match = String(value ?? "").match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
  return match?.[1];
}

function pairKey(recordIds: string[]) {
  return recordIds.slice().sort().join("|");
}

function isHumanRejectedCluster(candidates: AirtableSaintCandidate[]) {
  const candidateKey = pairKey(candidates.map((candidate) => candidate.recordId));
  return HUMAN_REJECTED_DUPLICATE_PAIRS.some((pair) => pairKey(pair) === candidateKey);
}

function isHumanConfirmedCluster(candidates: AirtableSaintCandidate[]) {
  const candidateKey = pairKey(candidates.map((candidate) => candidate.recordId));
  return HUMAN_CONFIRMED_DUPLICATE_PAIRS.some((pair) => pairKey(pair) === candidateKey);
}

function isDateInformedCandidateEligible(candidates: AirtableSaintCandidate[], normalizedCoreName: string) {
  if (isHumanConfirmedCluster(candidates)) return true;

  const hasExplicitCopyMarker = candidates.some((candidate) => /\bcopy\b/i.test(candidate.name));
  if (hasExplicitCopyMarker) return true;

  return normalizedCoreName.split(/\s+/).length >= 2;
}

function stableClusterKey(cluster: DuplicateCluster) {
  if (cluster.matchKind === "normalized_name") {
    return JSON.stringify({
      normalizedName: cluster.normalizedName,
      recordIds: cluster.candidates.map((candidate) => candidate.recordId).sort()
    });
  }

  return JSON.stringify({
    matchKind: cluster.matchKind,
    normalizedName: cluster.normalizedName,
    recordIds: cluster.candidates.map((candidate) => candidate.recordId).sort()
  });
}

function buildMessage(cluster: DuplicateCluster) {
  const names = cluster.candidates.map((candidate) => candidate.name).join(" | ");
  const qualifier =
    cluster.matchKind === "date_informed_identity"
      ? "date-informed identity match"
      : "normalized name match";

  return `Possible duplicate Airtable saint records for "${cluster.normalizedName}" (${qualifier}): ${names}`;
}

function pickSuggestedValue(cluster: DuplicateCluster) {
  const [primary, ...duplicates] = cluster.candidates;

  return JSON.stringify({
    suggestedPrimaryRecordId: primary.recordId,
    duplicateRecordIds: duplicates.map((candidate) => candidate.recordId),
    matchKind: cluster.matchKind,
    reviewAction: "Review records in Airtable copy before merging or linking in CMS."
  });
}

async function findDuplicateSaintClusters(limit?: number) {
  const rows = await db.airtableMirrorRecord.findMany({
    where: { tableIdOrName: "Saints" },
    orderBy: { recordId: "asc" },
    select: {
      recordId: true,
      rawFieldsJson: true
    }
  });
  const candidates: AirtableSaintCandidate[] = [];

  for (const row of rows) {
    const fields = asObject(row.rawFieldsJson);
    const name = String(fields.Name ?? "").trim();

    if (!name) continue;

    candidates.push({
      recordId: row.recordId,
      name,
      place: fields.Place,
      birth: fields["Birth (YYYY-MM-DD)"],
      birthYear: extractYear(fields["Birth (YYYY-MM-DD)"]),
      samadhi: fields["Samadhi (YYYY-MM-DD)"],
      samadhiYear: extractYear(fields["Samadhi (YYYY-MM-DD)"]),
      relics: fields.Relics
    });
  }

  const clusters = [
    ...findNormalizedNameClusters(candidates),
    ...findDateInformedIdentityClusters(candidates)
  ];
  const uniqueClusters = new Map<string, DuplicateCluster>();
  const seenPairs = new Set<string>();

  for (const cluster of clusters) {
    if (isHumanRejectedCluster(cluster.candidates)) continue;
    const clusterPairKey = pairKey(cluster.candidates.map((candidate) => candidate.recordId));
    if (seenPairs.has(clusterPairKey)) continue;
    seenPairs.add(clusterPairKey);
    uniqueClusters.set(stableClusterKey(cluster), cluster);
  }

  const sortedClusters = Array.from(uniqueClusters.values())
    .sort((left, right) => {
      const byCount = right.candidates.length - left.candidates.length;
      return byCount || left.normalizedName.localeCompare(right.normalizedName);
    });

  return limit ? sortedClusters.slice(0, limit) : sortedClusters;
}

function findNormalizedNameClusters(candidates: AirtableSaintCandidate[]) {
  const groups = new Map<string, AirtableSaintCandidate[]>();

  for (const candidate of candidates) {
    const normalizedName = normalizeSaintName(candidate.name);

    if (!normalizedName) continue;

    groups.set(normalizedName, [...(groups.get(normalizedName) ?? []), candidate]);
  }

  return Array.from(groups.entries())
    .filter(([, candidates]) => candidates.length > 1)
    .map(([normalizedName, candidates]) => ({
      normalizedName,
      matchKind: "normalized_name" as const,
      candidates
    }));
}

function findDateInformedIdentityClusters(candidates: AirtableSaintCandidate[]) {
  const groups = new Map<string, AirtableSaintCandidate[]>();

  for (const candidate of candidates) {
    const coreName = normalizeSaintName(normalizeCoreIdentity(candidate.name));
    const dateKey = candidate.samadhiYear ?? candidate.birthYear;

    if (!coreName || !dateKey) continue;

    groups.set(`${coreName}|${dateKey}`, [...(groups.get(`${coreName}|${dateKey}`) ?? []), candidate]);
  }

  return Array.from(groups.entries())
    .filter(([key, candidates]) => {
      const normalizedCoreName = key.split("|", 1)[0];
      return candidates.length > 1 && isDateInformedCandidateEligible(candidates, normalizedCoreName);
    })
    .map(([key, candidates]) => ({
      normalizedName: key.replace("|", " / date "),
      matchKind: "date_informed_identity" as const,
      candidates
    }));
}

async function upsertDuplicateIssue(cluster: DuplicateCluster) {
  const rawValue = stableClusterKey(cluster);
  const sortedRecordIds = cluster.candidates.map((candidate) => candidate.recordId).sort();
  const existing = await db.reconciliationIssue.findFirst({
    where: {
      issueType: "airtable_duplicate_saint_name",
      entityType: "AirtableMirrorRecord",
      rawValue
    }
  });
  const existingPairCandidates = existing
    ? []
    : await db.reconciliationIssue.findMany({
        where: {
          issueType: "airtable_duplicate_saint_name",
          entityType: "AirtableMirrorRecord",
          OR: sortedRecordIds.map((recordId) => ({
            rawValue: {
              contains: recordId
            }
          }))
        },
        orderBy: {
          createdAt: "desc"
        }
      });
  const samePairIssues = existingPairCandidates.filter((issue) =>
    sortedRecordIds.every((recordId) => issue.rawValue?.includes(recordId))
  );
  const existingForSamePair =
    samePairIssues.find((issue) => issue.status === "resolved" || issue.status === "ignored") ??
    samePairIssues[0];
  const data = {
    severity: "medium",
    message: buildMessage(cluster),
    suggestedValue: pickSuggestedValue(cluster)
  };

  const issueToReuse = existing ?? existingForSamePair;

  if (issueToReuse) {
    if (issueToReuse.status === "resolved" || issueToReuse.status === "ignored") {
      return `skipped ${issueToReuse.status}`;
    }

    await db.reconciliationIssue.update({
      where: { id: issueToReuse.id },
      data
    });
    return "updated";
  }

  await db.reconciliationIssue.create({
    data: {
      issueType: "airtable_duplicate_saint_name",
      entityType: "AirtableMirrorRecord",
      entityId: cluster.candidates[0]?.recordId,
      rawValue,
      ...data
    }
  });

  return "created";
}

async function ignoreHumanRejectedIssues() {
  let ignored = 0;

  for (const pair of HUMAN_REJECTED_DUPLICATE_PAIRS) {
    const rawValue = JSON.stringify({
      normalizedName: "namdev",
      recordIds: pair.slice().sort()
    });
    const result = await db.reconciliationIssue.updateMany({
      where: {
        issueType: "airtable_duplicate_saint_name",
        entityType: "AirtableMirrorRecord",
        rawValue,
        status: "open"
      },
      data: {
        status: "ignored",
        message:
          "Human review rejected this Airtable duplicate suggestion: Sri Namdev Maharaj and Sri Namdev Baba are distinct records."
      }
    });

    ignored += result.count;
  }

  return ignored;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const clusters = await findDuplicateSaintClusters(options.limit);

  console.log(`Found ${clusters.length} possible duplicate saint name cluster(s).`);

  for (const cluster of clusters) {
    console.log("");
    console.log(`- ${cluster.normalizedName}`);

    for (const candidate of cluster.candidates) {
      console.log(`  ${candidate.recordId}: ${candidate.name}`);
    }

    if (options.write) {
      const action = await upsertDuplicateIssue(cluster);
      console.log(`  reconciliation issue ${action}`);
    }
  }

  if (options.write) {
    const ignored = await ignoreHumanRejectedIssues();
    if (ignored > 0) {
      console.log("");
      console.log(`Ignored ${ignored} human-rejected duplicate issue(s).`);
    }
  }

  if (!options.write) {
    console.log("");
    console.log("Dry run only. Re-run with --write to create or update reconciliation issues.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
