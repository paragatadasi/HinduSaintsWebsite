export const SAINT_MERGE_FIELD_GROUPS = [
  {
    id: "identity",
    label: "Identity and public profile",
    description: "Choose the reviewed name, public summary, primary image, and feature settings that the surviving record should keep.",
    fields: [
      ["displayName", "Display name"],
      ["canonicalName", "Canonical name"],
      ["shortDescription", "Short description"],
      ["biographySummary", "Biography summary"],
      ["primaryImageId", "Primary image"],
      ["featured", "Featured"],
      ["launchMvp", "Launch collection"],
      ["hasInstagramContent", "Has Instagram content"]
    ]
  },
  {
    id: "dates",
    label: "Dates and discovery",
    description: "Resolve historical date ranges, editorial date notes, and search metadata without rewriting either source record silently.",
    fields: [
      ["eraLabel", "Era label"],
      ["birthDateRaw", "Birth date display"],
      ["birthYear", "Birth year"],
      ["birthYearEnd", "Birth year end"],
      ["birthMonth", "Birth month"],
      ["birthDay", "Birth day"],
      ["birthDatePrecision", "Birth date precision"],
      ["samadhiDateRaw", "Samadhi date display"],
      ["samadhiYear", "Samadhi year"],
      ["samadhiYearEnd", "Samadhi year end"],
      ["samadhiMonth", "Samadhi month"],
      ["samadhiDay", "Samadhi day"],
      ["samadhiDatePrecision", "Samadhi date precision"],
      ["dateNotes", "Date notes"],
      ["seoTitle", "SEO title"],
      ["seoDescription", "SEO description"]
    ]
  },
  {
    id: "workflow",
    label: "Publishing and workflow state",
    description: "Choose the final editorial state. Published content is always kept Public and legacy publication fields remain synchronized.",
    fields: [
      ["status", "Legacy content status"],
      ["teamVisibility", "Team visibility"],
      ["publicationStatus", "Publication status"],
      ["workflowStatus", "Workflow status"],
      ["publishedAt", "Published at"],
      ["reviewedAt", "Reviewed at"]
    ]
  }
] as const;

export type SaintMergeFieldKey = typeof SAINT_MERGE_FIELD_GROUPS[number]["fields"][number][0];
export type SaintMergeRecord = { id: string } & Record<SaintMergeFieldKey, unknown>;
export type SaintMergeChoices = Partial<Record<SaintMergeFieldKey, string>>;

export type SaintMergeConflict = {
  field: SaintMergeFieldKey;
  label: string;
  leftValue: unknown;
  rightValue: unknown;
  recommendedRecordId: string;
};

export const SAINT_MERGE_SCALAR_SELECT = {
  id: true,
  displayName: true,
  canonicalName: true,
  shortDescription: true,
  biographySummary: true,
  primaryImageId: true,
  featured: true,
  launchMvp: true,
  hasInstagramContent: true,
  eraLabel: true,
  birthDateRaw: true,
  birthYear: true,
  birthYearEnd: true,
  birthMonth: true,
  birthDay: true,
  birthDatePrecision: true,
  samadhiDateRaw: true,
  samadhiYear: true,
  samadhiYearEnd: true,
  samadhiMonth: true,
  samadhiDay: true,
  samadhiDatePrecision: true,
  dateNotes: true,
  seoTitle: true,
  seoDescription: true,
  status: true,
  teamVisibility: true,
  publicationStatus: true,
  workflowStatus: true,
  publishedAt: true,
  reviewedAt: true
} as const;

export function getSaintMergeConflicts(left: SaintMergeRecord, right: SaintMergeRecord) {
  const conflicts = new Map<string, SaintMergeConflict[]>();

  for (const group of SAINT_MERGE_FIELD_GROUPS) {
    const groupConflicts = group.fields.flatMap(([field, label]) => {
      const leftValue = left[field];
      const rightValue = right[field];
      if (mergeValuesEqual(leftValue, rightValue)) return [];
      return [{
        field,
        label,
        leftValue,
        rightValue,
        recommendedRecordId: isMergeValueBlank(leftValue) && !isMergeValueBlank(rightValue) ? right.id : left.id
      }];
    });
    if (groupConflicts.length > 0) conflicts.set(group.id, groupConflicts);
  }

  return conflicts;
}

export function resolveSaintMergeFields(
  left: SaintMergeRecord,
  right: SaintMergeRecord,
  survivorId: string,
  choices: SaintMergeChoices
) {
  if (survivorId !== left.id && survivorId !== right.id) throw new Error("The surviving Saint must be one of the confirmed duplicate records.");
  const records = new Map([[left.id, left], [right.id, right]]);
  const survivor = records.get(survivorId)!;
  const data = {} as Record<SaintMergeFieldKey, unknown>;

  for (const group of SAINT_MERGE_FIELD_GROUPS) {
    for (const [field] of group.fields) {
      const selectedId = choices[field];
      const selected = selectedId ? records.get(selectedId) : undefined;
      if (selectedId && !selected) throw new Error(`Invalid merge choice for ${field}.`);
      if (selected) {
        data[field] = selected[field];
      } else {
        const other = survivorId === left.id ? right : left;
        data[field] = isMergeValueBlank(survivor[field]) && !isMergeValueBlank(other[field])
          ? other[field]
          : survivor[field];
      }
    }
  }

  return enforceSaintPublicationCompatibility(data);
}

export function mergeChoiceInputName(field: SaintMergeFieldKey) {
  return `mergeField:${field}`;
}

export function formatSaintMergeValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Not recorded";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value instanceof Date) return value.toLocaleString();
  return String(value).replaceAll("_", " ");
}

function enforceSaintPublicationCompatibility(data: Record<SaintMergeFieldKey, unknown>) {
  if (data.status === "published" || data.publicationStatus === "published") {
    data.status = "published";
    data.publicationStatus = "published";
    data.teamVisibility = "public";
  } else if (data.status === "archived" || data.publicationStatus === "archived") {
    data.status = "archived";
    data.publicationStatus = "archived";
  }
  return data;
}

function mergeValuesEqual(left: unknown, right: unknown) {
  if (left instanceof Date && right instanceof Date) return left.getTime() === right.getTime();
  return left === right || (isMergeValueBlank(left) && isMergeValueBlank(right));
}

function isMergeValueBlank(value: unknown) {
  return value === null || value === undefined || value === "";
}
