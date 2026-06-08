import { db } from "../lib/db";

type AirtableFields = Record<string, unknown>;

type AirtableUpdateResponse = {
  id?: string;
  fields?: AirtableFields;
  error?: {
    type?: string;
    message?: string;
  };
};

type MergePlan = {
  issueId: string;
  matchKey: string;
  primaryRecordId: string;
  duplicateRecordIds: string[];
  mergedFields: AirtableFields;
  mergeNotes: string[];
};

const AIRTABLE_API_URL = "https://api.airtable.com/v0";
const AIRTABLE_TABLE = "Saints";

const APPROVED_MATCH_KEY_PATTERNS = [
  "amaresh kumar ganguly / date 1995",
  "brahmananda of puri orissa",
  "bupathiraju venkata lakshmi narasimha raju garu nanna garu of andhra pradesh",
  "dasnam goswami keshavpuri",
  "lakshman das of sarva muni ashram chitrakoot",
  "namdev / date 1350",
  "rajarshi banamali roy of vrindavan",
  "ramana maharishi of arunachala",
  "ram harshan dasji of ayodhya",
  "sitaram of sidh sot kangari haridwar",
  "yogmaya devi of puri vrindavan"
];

function parseArgs(argv: string[]) {
  return {
    write: argv.includes("--write")
  };
}

function getAirtableConfig() {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const token =
    process.env.AIRTABLE_ACCESS_TOKEN ??
    process.env.AIRTABLE_PAT ??
    process.env.AIRTABLE_API_KEY;

  if (!baseId) throw new Error("Missing AIRTABLE_BASE_ID.");
  if (!token) throw new Error("Missing AIRTABLE_ACCESS_TOKEN, AIRTABLE_PAT, or AIRTABLE_API_KEY.");

  return { baseId, token };
}

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as AirtableFields)
    : {};
}

function isEmptyValue(value: unknown) {
  return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function uniqueLines(...values: unknown[]) {
  const lines = values
    .flatMap((value) => String(value ?? "").split(/\r?\n+/))
    .map((line) => line.trim())
    .filter(Boolean);
  return Array.from(new Map(lines.map((line) => [normalizeText(line), line])).values()).join("\n\n");
}

function unionArrays(left: unknown[], right: unknown[]) {
  const merged = new Map<string, unknown>();

  for (const item of [...left, ...right]) {
    const key = typeof item === "object" && item && "id" in item
      ? String((item as { id: unknown }).id)
      : JSON.stringify(item);
    merged.set(key, item);
  }

  return Array.from(merged.values());
}

function toAirtableArrayValue(value: unknown[]) {
  if (value.some((item) => typeof item === "object" && item && "url" in item)) {
    return value.map((item) => {
      if (typeof item === "object" && item && "url" in item) {
        const attachment = item as { url: unknown; filename?: unknown };
        return {
          url: String(attachment.url),
          filename: attachment.filename ? String(attachment.filename) : undefined
        };
      }

      return item;
    });
  }

  return value;
}

function mergeTextField(fieldName: string, primaryValue: unknown, duplicateValue: unknown) {
  if (isEmptyValue(primaryValue)) return { value: duplicateValue, note: `${fieldName}: filled from duplicate.` };
  if (isEmptyValue(duplicateValue) || normalizeText(primaryValue) === normalizeText(duplicateValue)) {
    return { value: primaryValue };
  }

  if (fieldName === "Links") {
    return { value: uniqueLines(primaryValue, duplicateValue), note: `${fieldName}: combined links.` };
  }

  if (fieldName === "Relics Description (move to other table)") {
    return {
      value: uniqueLines(String(primaryValue).replace(/;\s*/g, "\n"), String(duplicateValue).replace(/;\s*/g, "\n")),
      note: `${fieldName}: combined descriptions.`
    };
  }

  if (fieldName === "Bio/Info") {
    return {
      value: uniqueLines(primaryValue, `[Merged duplicate note] ${duplicateValue}`),
      note: `${fieldName}: appended duplicate note.`
    };
  }

  return { value: primaryValue, note: `${fieldName}: kept primary value; duplicate had "${String(duplicateValue)}".` };
}

function mergeName(primaryValue: unknown, duplicateValue: unknown) {
  const primaryName = String(primaryValue ?? "");
  const duplicateName = String(duplicateValue ?? "");

  if (/\bcopy\b/i.test(primaryName) && duplicateName && !/\bcopy\b/i.test(duplicateName)) {
    return { value: duplicateName, note: "Name: replaced copy-marked primary name with duplicate name." };
  }

  return { value: primaryValue };
}

function mergeFields(primaryFields: AirtableFields, duplicateFieldsList: AirtableFields[]) {
  const merged: AirtableFields = {};
  const notes: string[] = [];
  const fieldNames = new Set([
    ...Object.keys(primaryFields),
    ...duplicateFieldsList.flatMap((fields) => Object.keys(fields))
  ]);

  for (const fieldName of Array.from(fieldNames)) {
    let currentValue = primaryFields[fieldName];

    for (const duplicateFields of duplicateFieldsList) {
      const duplicateValue = duplicateFields[fieldName];

      if (fieldName === "Name") {
        const result = mergeName(currentValue, duplicateValue);
        currentValue = result.value;
        if (result.note) notes.push(result.note);
        continue;
      }

      if (Array.isArray(currentValue) || Array.isArray(duplicateValue)) {
        const unioned = unionArrays(
          Array.isArray(currentValue) ? currentValue : [],
          Array.isArray(duplicateValue) ? duplicateValue : []
        );
        currentValue = toAirtableArrayValue(unioned);
        if (!isEmptyValue(duplicateValue)) notes.push(`${fieldName}: unioned array values.`);
        continue;
      }

      if (typeof currentValue === "string" || typeof duplicateValue === "string") {
        const result = mergeTextField(fieldName, currentValue, duplicateValue);
        currentValue = result.value;
        if (result.note) notes.push(result.note);
        continue;
      }

      if (isEmptyValue(currentValue) && !isEmptyValue(duplicateValue)) {
        currentValue = duplicateValue;
        notes.push(`${fieldName}: filled from duplicate.`);
      }
    }

    if (!isEmptyValue(currentValue)) {
      merged[fieldName] = currentValue;
    }
  }

  return { merged, notes: Array.from(new Set(notes)) };
}

async function updateAirtableRecord(plan: MergePlan) {
  const { baseId, token } = getAirtableConfig();
  const response = await fetch(
    `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(AIRTABLE_TABLE)}/${plan.primaryRecordId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ fields: plan.mergedFields })
    }
  );
  const payload = (await response.json()) as AirtableUpdateResponse;

  if (!response.ok) {
    throw new Error(
      `Airtable update failed for ${plan.primaryRecordId}: ${payload.error?.message ?? response.statusText}`
    );
  }

  return payload;
}

async function buildMergePlans() {
  const issues = await db.reconciliationIssue.findMany({
    where: {
      issueType: "airtable_duplicate_saint_name",
      status: "open"
    },
    select: {
      id: true,
      message: true,
      suggestedValue: true
    }
  });
  const selectedIssues = issues.filter((issue) =>
    APPROVED_MATCH_KEY_PATTERNS.some((pattern) => issue.message.toLowerCase().includes(pattern.toLowerCase()))
  );
  const records = await db.airtableMirrorRecord.findMany({
    where: {
      recordId: {
        in: selectedIssues.flatMap((issue) => {
          const suggested = JSON.parse(issue.suggestedValue ?? "{}") as {
            suggestedPrimaryRecordId?: string;
            duplicateRecordIds?: string[];
          };
          return [suggested.suggestedPrimaryRecordId, ...(suggested.duplicateRecordIds ?? [])].filter(Boolean) as string[];
        })
      }
    },
    select: {
      recordId: true,
      rawFieldsJson: true
    }
  });
  const recordById = new Map(records.map((record) => [record.recordId, asObject(record.rawFieldsJson)]));

  return selectedIssues.map((issue) => {
    const suggested = JSON.parse(issue.suggestedValue ?? "{}") as {
      suggestedPrimaryRecordId: string;
      duplicateRecordIds: string[];
    };
    const primaryFields = recordById.get(suggested.suggestedPrimaryRecordId);
    const duplicateFieldsList = suggested.duplicateRecordIds.map((recordId) => recordById.get(recordId));

    if (!primaryFields || duplicateFieldsList.some((fields) => !fields)) {
      throw new Error(`Missing mirrored fields for issue ${issue.id}. Re-run import:airtable first.`);
    }

    const { merged, notes } = mergeFields(primaryFields, duplicateFieldsList as AirtableFields[]);
    const matchKey = issue.message.match(/"([^"]+)"/)?.[1] ?? issue.id;

    return {
      issueId: issue.id,
      matchKey,
      primaryRecordId: suggested.suggestedPrimaryRecordId,
      duplicateRecordIds: suggested.duplicateRecordIds,
      mergedFields: merged,
      mergeNotes: notes
    };
  });
}

async function markIssueResolved(plan: MergePlan) {
  await db.reconciliationIssue.update({
    where: { id: plan.issueId },
    data: {
      status: "resolved",
      resolvedAt: new Date(),
      suggestedValue: JSON.stringify({
        mergedPrimaryRecordId: plan.primaryRecordId,
        duplicateRecordIds: plan.duplicateRecordIds,
        mergeNotes: plan.mergeNotes
      })
    }
  });

  await db.auditEvent.create({
    data: {
      action: "airtable_duplicate_merged",
      entityType: "AirtableMirrorRecord",
      entityId: plan.primaryRecordId,
      afterJson: {
        issueId: plan.issueId,
        matchKey: plan.matchKey,
        primaryRecordId: plan.primaryRecordId,
        duplicateRecordIds: plan.duplicateRecordIds,
        mergeNotes: plan.mergeNotes
      }
    }
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const plans = await buildMergePlans();

  console.log(`Prepared ${plans.length} Airtable merge plan(s).`);

  for (const plan of plans) {
    console.log("");
    console.log(`- ${plan.matchKey}`);
    console.log(`  primary: ${plan.primaryRecordId}`);
    console.log(`  duplicates: ${plan.duplicateRecordIds.join(", ")}`);
    console.log(`  fields to write: ${Object.keys(plan.mergedFields).join(", ")}`);
    for (const note of plan.mergeNotes) {
      console.log(`  ${note}`);
    }

    if (options.write) {
      await updateAirtableRecord(plan);
      await markIssueResolved(plan);
      console.log("  Airtable primary updated; local issue resolved.");
    }
  }

  if (!options.write) {
    console.log("");
    console.log("Dry run only. Re-run with --write to update Airtable primary records and resolve local issues.");
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
