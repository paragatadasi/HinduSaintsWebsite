import { Prisma, type ContentStatus, type PlaceType } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";
import { buildEraLabel, parseImportedDate } from "@/lib/import-dates";
import { getKnownPlaceScope, getKnownStateSlug } from "@/lib/place-taxonomy";
import { toSlug } from "@/lib/slugs";

type AirtableFields = Record<string, unknown>;

type Attachment = {
  url?: string;
  filename?: string;
  type?: string;
  width?: number;
  height?: number;
  thumbnails?: {
    large?: { url?: string; width?: number; height?: number };
    full?: { url?: string; width?: number; height?: number };
  };
};

type ImportPlan = {
  recordId: string;
  externalId: string;
  originalName: string;
  displayName: string;
  canonicalName: string;
  baseSlug: string;
  rawFieldsJson: Prisma.JsonValue;
  rawPayloadJson?: Prisma.JsonValue;
  biographySummary?: string;
  birth: ReturnType<typeof parseImportedDate>;
  samadhi: ReturnType<typeof parseImportedDate>;
  dateNotes?: string;
  places: Array<{ name: string; placeType: PlaceType; notes?: string }>;
  traditions: string[];
  images: Attachment[];
  links: string[];
};

type ImportResult =
  | { status: "created"; saintId: string }
  | { status: "skipped_existing_external"; saintId?: string | null }
  | { status: "skipped_collision"; saint: SaintReference; reason: AirtableImportCollisionDetail["reason"]; message: string };

type SaintReference = {
  id: string;
  slug: string;
  name: string;
};

type GuruRelationshipPlan = {
  discipleRecordId: string;
  discipleName?: string;
  discipleSaint?: SaintReference;
  guruRecordId: string;
  guruName?: string;
  guruSaint?: SaintReference;
};

export type AirtableImportCollisionDetail = {
  recordId: string;
  airtableName?: string;
  existingSaintId?: string;
  existingSaintSlug?: string;
  existingSaintName?: string;
  reason: "slug_collision" | "name_collision";
  message: string;
};

export type AirtableGuruRelationshipIssueDetail = {
  discipleRecordId: string;
  discipleName?: string;
  discipleSaintSlug?: string;
  discipleSaintName?: string;
  guruRecordId: string;
  guruName?: string;
  guruSaintSlug?: string;
  guruSaintName?: string;
  reason: "unmapped_disciple" | "unmapped_guru";
  message: string;
};

export type AirtableSelfSkippedGuruRelationshipDetail = {
  discipleRecordId: string;
  discipleName?: string;
  guruRecordId: string;
  guruName?: string;
  saintSlug?: string;
  saintName?: string;
  message: string;
};

export type AirtableImportErrorDetail = {
  recordId: string;
  airtableName?: string;
  discipleRecordId?: string;
  discipleName?: string;
  guruRecordId?: string;
  guruName?: string;
  message: string;
};

export type AirtableImportMode = "check" | "import_missing_drafts" | "import_guru_relationships";

export type AirtableSaintImportSummary = {
  mode: "check" | "import_missing_drafts";
  mirrorRowsChecked: number;
  existingCmsSaintsSkipped: number;
  newDraftSaintsCreated: number;
  slugNameCollisionsSkipped: number;
  collisions: AirtableImportCollisionDetail[];
  errors: AirtableImportErrorDetail[];
};

export type AirtableGuruRelationshipSummary = {
  mode: "check" | "import_guru_relationships";
  mirrorRowsChecked: number;
  guruRelationshipsCreated: number;
  guruRelationshipsExisting: number;
  guruRelationshipsUnresolved: number;
  skippedSelfRelationships: number;
  unresolvedGuruRelationships: AirtableGuruRelationshipIssueDetail[];
  selfSkippedGuruRelationships: AirtableSelfSkippedGuruRelationshipDetail[];
  errors: AirtableImportErrorDetail[];
};

export type AirtableSaintImportOptions = {
  dryRun?: boolean;
  limit?: number;
};

const AIRTABLE_TABLE = "Saints";
const IMPORTER_SOURCE = "airtable_saints_cms_import";
const MISSING_DRAFT_STATUS: ContentStatus = "draft";
const GURU_IMPORTER_NOTE = "Imported from Airtable Master(s) field; pending editorial review.";

const HONORIFIC_PREFIXES = [
  "108",
  "acharya",
  "bhagat",
  "brahmachari",
  "guru",
  "mahant",
  "maharaj",
  "maharaja",
  "maharishi",
  "maharshi",
  "paramahamsa",
  "paramahansa",
  "saint",
  "sant",
  "shri",
  "sri",
  "srila",
  "swami"
];

export async function createAirtableImportJob({
  createdByEmail,
  mode
}: {
  createdByEmail?: string | null;
  mode: AirtableImportMode;
}) {
  return db.airtableImportJob.create({
    data: {
      mode,
      status: "queued",
      sourceName: "Airtable mirror",
      createdByEmail: createdByEmail ?? undefined,
      message: `Queued ${formatMode(mode)}.`
    }
  });
}

export async function runAirtableImportJob(jobId: string) {
  const job = await db.airtableImportJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("Airtable import job was not found.");
  if (job.status === "running") return;

  await updateAirtableJob(jobId, {
    status: "running",
    startedAt: new Date(),
    message: `Running ${formatMode(job.mode)}.`
  });

  try {
    if (job.mode === "import_guru_relationships") {
      const summary = await runAirtableGuruRelationshipImport({ dryRun: false });
      await completeAirtableJob(jobId, summary);
      return;
    }

    const summary = await runAirtableSaintsMissingDraftImport({
      dryRun: job.mode !== "import_missing_drafts"
    });
    await completeAirtableJob(jobId, summary);
  } catch (error) {
    await updateAirtableJob(jobId, {
      status: "failed",
      completedAt: new Date(),
      error: error instanceof Error ? error.message : "Airtable import failed.",
      message: "Airtable import failed."
    });
    throw error;
  }
}

export async function runAirtableSaintsMissingDraftImport(options: AirtableSaintImportOptions = {}) {
  const dryRun = options.dryRun ?? true;
  const rows = await findAirtableSaintRows(options.limit);
  const plans = rows.map(buildPlan).filter((plan): plan is ImportPlan => Boolean(plan));
  const summary = emptySaintImportSummary(dryRun ? "check" : "import_missing_drafts", rows.length);

  for (const plan of plans) {
    try {
      const result = dryRun ? await classifyMissingDraftPlan(plan) : await importMissingDraftPlan(plan);
      addImportResult(summary, result, plan);
    } catch (error) {
      summary.errors.push(formatImportError(plan.recordId, plan.displayName, error));
    }
  }

  return summary;
}

async function completeAirtableJob(
  jobId: string,
  summary: AirtableSaintImportSummary | AirtableGuruRelationshipSummary
) {
  const isGuruSummary = "guruRelationshipsCreated" in summary;
  await updateAirtableJob(jobId, {
    status: "completed",
    completedAt: new Date(),
    mirrorRowsChecked: summary.mirrorRowsChecked,
    existingCmsSaintsSkipped: isGuruSummary ? undefined : summary.existingCmsSaintsSkipped,
    newDraftSaintsCreated: isGuruSummary ? undefined : summary.newDraftSaintsCreated,
    slugNameCollisionsSkipped: isGuruSummary ? undefined : summary.slugNameCollisionsSkipped,
    guruRelationshipsCreated: isGuruSummary ? summary.guruRelationshipsCreated : undefined,
    guruRelationshipsExisting: isGuruSummary ? summary.guruRelationshipsExisting : undefined,
    guruRelationshipsUnresolved: isGuruSummary ? summary.guruRelationshipsUnresolved : undefined,
    skippedSelfRelationships: isGuruSummary ? summary.skippedSelfRelationships : undefined,
    failedRows: summary.errors.length,
    rawSummary: toInputJson(summary),
    error: summary.errors.length > 0 ? summary.errors.map((item) => `${item.recordId}: ${item.message}`).join("\n") : null,
    message: getCompletedJobMessage(summary)
  });
}

async function updateAirtableJob(jobId: string, data: Prisma.AirtableImportJobUpdateInput) {
  await db.airtableImportJob.update({
    where: { id: jobId },
    data
  });
}

export async function runAirtableGuruRelationshipImport(options: AirtableSaintImportOptions = {}) {
  const dryRun = options.dryRun ?? true;
  const rows = await findAirtableSaintRows(options.limit);
  const plans = await buildGuruRelationshipPlans(rows);
  const summary = emptyGuruRelationshipSummary(dryRun ? "check" : "import_guru_relationships", rows.length);

  for (const plan of plans) {
    try {
      const classification = await classifyGuruRelationshipPlan(plan);
      addGuruClassification(summary, classification, plan);

      if (!dryRun && classification === "create" && plan.discipleSaint && plan.guruSaint) {
        await db.saintRelationship.create({
          data: {
            fromSaintId: plan.discipleSaint.id,
            toSaintId: plan.guruSaint.id,
            relationshipType: "guru",
            confidence: "medium",
            notes: GURU_IMPORTER_NOTE
          }
        });
      }
    } catch (error) {
      summary.errors.push(formatGuruImportError(plan, error));
    }
  }

  return summary;
}

async function findAirtableSaintRows(limit?: number) {
  return db.airtableMirrorRecord.findMany({
    where: { tableIdOrName: AIRTABLE_TABLE },
    take: limit,
    orderBy: { recordId: "asc" },
    select: {
      baseId: true,
      recordId: true,
      rawFieldsJson: true,
      rawPayloadJson: true
    }
  });
}

function buildPlan(row: {
  baseId: string;
  recordId: string;
  rawFieldsJson: Prisma.JsonValue;
  rawPayloadJson?: Prisma.JsonValue;
}): ImportPlan | undefined {
  const fields = asObject(row.rawFieldsJson);
  const originalName = stringField(fields, "Name");
  if (!originalName) return undefined;

  const { displayName, locationPhrase } = cleanDisplayName(originalName);
  const canonicalName = canonicalizeName(displayName);
  const birth = parseImportedDate(stringField(fields, "Birth (YYYY-MM-DD)"));
  const samadhi = parseImportedDate(stringField(fields, "Samadhi (YYYY-MM-DD)"));
  const airtablePlaces = stringArrayField(fields, "Place").map((name, index) => ({
    name,
    placeType: index === 0 ? "primary" as PlaceType : inferPlaceType(name),
    notes: "Imported from Airtable Place field."
  }));
  const phrasePlaces = splitLocationPhrase(locationPhrase).map((name) => ({
    name,
    placeType: inferPlaceType(name),
    notes: "Parsed from Airtable name suffix."
  }));

  return {
    recordId: row.recordId,
    externalId: `${row.baseId}:${AIRTABLE_TABLE}:${row.recordId}`,
    originalName,
    displayName,
    canonicalName,
    baseSlug: toSlug(displayName || canonicalName),
    rawFieldsJson: row.rawFieldsJson,
    rawPayloadJson: row.rawPayloadJson,
    biographySummary: stringField(fields, "Bio/Info"),
    birth,
    samadhi,
    dateNotes: noteFromDates(birth, samadhi) || undefined,
    places: uniqueByNormalized([...airtablePlaces, ...phrasePlaces], (place) => place.name),
    traditions: stringArrayField(fields, "Sampradaya"),
    images: attachmentField(fields, "Picture(s) of Saint").filter((image) => image.url),
    links: parseLinks(stringField(fields, "Links"))
  };
}

async function classifyMissingDraftPlan(plan: ImportPlan): Promise<ImportResult> {
  const existingExternal = await db.externalRecord.findUnique({
    where: { sourceType_externalId: { sourceType: "airtable", externalId: plan.externalId } },
    select: { entityId: true }
  });
  if (existingExternal?.entityId) return { status: "skipped_existing_external", saintId: existingExternal.entityId };

  const slugCollision = await db.saint.findUnique({
    where: { slug: getPlanSlug(plan) },
    select: { id: true, displayName: true, slug: true }
  });
  if (slugCollision) {
    return {
      status: "skipped_collision",
      saint: saintReference(slugCollision),
      reason: "slug_collision",
      message: "Slug already exists"
    };
  }

  const nameCollision = await db.saint.findFirst({
    where: {
      OR: [
        { displayName: { equals: plan.displayName, mode: "insensitive" } },
        { canonicalName: { equals: plan.canonicalName, mode: "insensitive" } }
      ]
    },
    select: { id: true, displayName: true, slug: true }
  });
  if (nameCollision) {
    return {
      status: "skipped_collision",
      saint: saintReference(nameCollision),
      reason: "name_collision",
      message: "Name matches existing saint"
    };
  }

  return { status: "created", saintId: "" };
}

function saintReference(saint: { id: string; displayName: string; slug: string }): SaintReference {
  return {
    id: saint.id,
    slug: saint.slug,
    name: saint.displayName
  };
}

async function importMissingDraftPlan(plan: ImportPlan): Promise<ImportResult> {
  const classification = await classifyMissingDraftPlan(plan);
  if (classification.status !== "created") return classification;

  const saint = await createSaintFromPlan(plan, MISSING_DRAFT_STATUS);
  await syncPlaces(saint.id, plan);
  await syncTraditions(saint.id, plan);
  const primaryImageId = await syncImages(saint.id, plan);
  if (primaryImageId) {
    await db.saint.update({ where: { id: saint.id }, data: { primaryImageId } });
  }
  await syncSources(saint.id, plan);
  await linkExternalRecordToSaint(plan, saint.id);

  return { status: "created", saintId: saint.id };
}

async function createSaintFromPlan(plan: ImportPlan, status: ContentStatus) {
  const eraLabel = buildEraLabel(plan.birth, plan.samadhi);

  const saint = await db.saint.create({
    data: {
      slug: getPlanSlug(plan),
      canonicalName: plan.canonicalName,
      displayName: plan.displayName,
      biographySummary: plan.biographySummary,
      status,
      launchMvp: true,
      eraLabel,
      birthDateRaw: plan.birth.raw,
      birthYear: plan.birth.year,
      birthMonth: plan.birth.month,
      birthDay: plan.birth.day,
      birthDatePrecision: plan.birth.precision === "empty" ? undefined : plan.birth.precision,
      samadhiDateRaw: plan.samadhi.raw,
      samadhiYear: plan.samadhi.year,
      samadhiMonth: plan.samadhi.month,
      samadhiDay: plan.samadhi.day,
      samadhiDatePrecision: plan.samadhi.precision === "empty" ? undefined : plan.samadhi.precision,
      dateNotes: plan.dateNotes
    }
  });

  if (plan.originalName !== plan.displayName) {
    await db.saintAlias.create({
      data: {
        saintId: saint.id,
        alias: plan.originalName,
        aliasType: "airtable_name",
        source: `${IMPORTER_SOURCE}:${plan.recordId}`
      }
    });
  }

  return saint;
}

function getPlanSlug(plan: ImportPlan) {
  return plan.baseSlug || "saint";
}

async function linkExternalRecordToSaint(plan: ImportPlan, saintId: string) {
  await db.externalRecord.upsert({
    where: { sourceType_externalId: { sourceType: "airtable", externalId: plan.externalId } },
    create: {
      sourceType: "airtable",
      externalId: plan.externalId,
      entityType: "Saint",
      entityId: saintId,
      rawPayloadJson: externalPayloadForPlan(plan),
      importedAt: new Date(),
      lastSeenAt: new Date()
    },
    update: {
      entityType: "Saint",
      entityId: saintId,
      rawPayloadJson: externalPayloadForPlan(plan),
      lastSeenAt: new Date()
    }
  });
}

function externalPayloadForPlan(plan: ImportPlan): Prisma.InputJsonValue {
  return {
    importedBy: IMPORTER_SOURCE,
    recordId: plan.recordId,
    rawFieldsJson: plan.rawFieldsJson as Prisma.InputJsonValue,
    rawPayloadJson: (plan.rawPayloadJson ?? Prisma.JsonNull) as Prisma.InputJsonValue
  };
}

async function syncPlaces(saintId: string, plan: ImportPlan) {
  for (const placePlan of plan.places) {
    const placeSlug = toSlug(placePlan.name);
    const placeScope = getKnownPlaceScope(placeSlug);
    const stateSlug = getKnownStateSlug(placeSlug);
    const parentState = placeScope === "locality" && stateSlug
      ? await db.place.upsert({
          where: { slug: stateSlug },
          create: { slug: stateSlug, name: titleizeSlug(stateSlug), alternateNames: [], placeScope: "state" },
          update: { placeScope: "state", parentStateId: null }
        })
      : null;
    const place = await db.place.upsert({
      where: { slug: placeSlug },
      create: {
        slug: placeSlug,
        name: placePlan.name,
        alternateNames: [],
        placeScope,
        parentStateId: parentState?.id
      },
      update: {
        placeScope,
        parentStateId: placeScope === "state" ? null : parentState?.id
      }
    });
    await db.saintPlace.create({
      data: {
        saintId,
        placeId: place.id,
        placeType: placePlan.placeType,
        notes: placePlan.notes
      }
    });
  }
}

async function syncTraditions(saintId: string, plan: ImportPlan) {
  for (let index = 0; index < plan.traditions.length; index += 1) {
    const traditionName = plan.traditions[index];
    const tradition = await db.tradition.upsert({
      where: { slug: toSlug(traditionName) },
      create: { slug: toSlug(traditionName), name: traditionName, alternateNames: [], status: "needs_review" },
      update: {}
    });
    await db.saintTradition.create({
      data: {
        saintId,
        traditionId: tradition.id,
        isPrimary: index === 0
      }
    });
  }
}

async function syncImages(saintId: string, plan: ImportPlan) {
  let primaryImageId: string | undefined;

  for (let index = 0; index < plan.images.length; index += 1) {
    const image = plan.images[index];
    if (!image.url) continue;
    const preferredUrl = image.thumbnails?.large?.url ?? image.url;
    const media = await findOrCreateMediaAsset(image, preferredUrl, plan.displayName);
    await db.saintGalleryImage.create({
      data: {
        saintId,
        mediaAssetId: media.id,
        sortOrder: index
      }
    });
    if (index === 0) primaryImageId = media.id;
  }

  return primaryImageId;
}

async function findOrCreateMediaAsset(image: Attachment, preferredUrl: string, displayName: string) {
  const existing = await db.mediaAsset.findFirst({ where: { sourceUrl: image.url } });
  if (existing) return existing;

  return db.mediaAsset.create({
    data: {
      url: preferredUrl,
      sourceUrl: image.url,
      altText: displayName,
      caption: image.filename,
      mimeType: image.type,
      width: image.thumbnails?.large?.width ?? image.width,
      height: image.thumbnails?.large?.height ?? image.height
    }
  });
}

async function syncSources(saintId: string, plan: ImportPlan) {
  for (let index = 0; index < plan.links.length; index += 1) {
    const url = plan.links[index];
    const source = await findOrCreateSource(url);
    await db.contentSource.create({
      data: {
        sourceId: source.id,
        entityType: "Saint",
        entityId: saintId,
        notes: IMPORTER_SOURCE,
        sortOrder: index
      }
    });
  }
}

async function findOrCreateSource(url: string) {
  const existing = await db.source.findFirst({ where: { url } });
  if (existing) return existing;

  return db.source.create({
    data: {
      title: url,
      url,
      sourceType: "website"
    }
  });
}

async function buildGuruRelationshipPlans(rows: Awaited<ReturnType<typeof findAirtableSaintRows>>) {
  const saintByExternalId = await buildExternalSaintMap(rows);
  const nameByRecordId = buildAirtableNameMap(rows);
  const plans: GuruRelationshipPlan[] = [];

  for (const row of rows) {
    const fields = asObject(row.rawFieldsJson);
    const guruRecordIds = linkedRecordIds(fields, "Master(s)");
    if (guruRecordIds.length === 0) continue;

    const discipleSaint = saintByExternalId.get(`${row.baseId}:${AIRTABLE_TABLE}:${row.recordId}`);
    for (const guruRecordId of guruRecordIds) {
      plans.push({
        discipleRecordId: row.recordId,
        discipleName: nameByRecordId.get(row.recordId),
        discipleSaint,
        guruRecordId,
        guruName: nameByRecordId.get(guruRecordId),
        guruSaint: saintByExternalId.get(`${row.baseId}:${AIRTABLE_TABLE}:${guruRecordId}`)
      });
    }
  }

  return plans;
}

function buildAirtableNameMap(rows: Awaited<ReturnType<typeof findAirtableSaintRows>>) {
  return new Map(
    rows
      .map((row) => {
        const name = stringField(asObject(row.rawFieldsJson), "Name");
        return name ? [row.recordId, name] as const : undefined;
      })
      .filter((entry): entry is readonly [string, string] => Boolean(entry))
  );
}

async function buildExternalSaintMap(rows: Array<{ baseId: string; recordId: string }>) {
  const externalIds = rows.map((row) => `${row.baseId}:${AIRTABLE_TABLE}:${row.recordId}`);
  const externalRecords = await db.externalRecord.findMany({
    where: {
      sourceType: "airtable",
      externalId: { in: externalIds },
      entityType: "Saint"
    },
    select: {
      externalId: true,
      entityId: true
    }
  });
  const saintIds = externalRecords.map((record) => record.entityId).filter((id): id is string => Boolean(id));
  const saints = await db.saint.findMany({
    where: { id: { in: saintIds } },
    select: { id: true, displayName: true, slug: true }
  });
  const saintById = new Map(saints.map((saint) => [saint.id, saintReference(saint)]));

  return new Map(
    externalRecords
      .map((record) => [record.externalId, record.entityId ? saintById.get(record.entityId) : undefined] as const)
      .filter((entry): entry is readonly [string, SaintReference] => Boolean(entry[1]))
  );
}

async function classifyGuruRelationshipPlan(plan: GuruRelationshipPlan) {
  if (!plan.discipleSaint) return "skipped_unmapped_disciple" as const;
  if (!plan.guruSaint) return "skipped_unmapped_guru" as const;
  if (plan.discipleSaint.id === plan.guruSaint.id) return "skipped_self_relationship" as const;

  const existing = await db.saintRelationship.findFirst({
    where: {
      fromSaintId: plan.discipleSaint.id,
      toSaintId: plan.guruSaint.id,
      relationshipType: "guru"
    },
    select: { id: true }
  });

  return existing ? "existing" as const : "create" as const;
}

function emptySaintImportSummary(mode: AirtableSaintImportSummary["mode"], mirrorRowsChecked: number): AirtableSaintImportSummary {
  return {
    mode,
    mirrorRowsChecked,
    existingCmsSaintsSkipped: 0,
    newDraftSaintsCreated: 0,
    slugNameCollisionsSkipped: 0,
    collisions: [],
    errors: []
  };
}

function emptyGuruRelationshipSummary(mode: AirtableGuruRelationshipSummary["mode"], mirrorRowsChecked: number): AirtableGuruRelationshipSummary {
  return {
    mode,
    mirrorRowsChecked,
    guruRelationshipsCreated: 0,
    guruRelationshipsExisting: 0,
    guruRelationshipsUnresolved: 0,
    skippedSelfRelationships: 0,
    unresolvedGuruRelationships: [],
    selfSkippedGuruRelationships: [],
    errors: []
  };
}

function addImportResult(summary: AirtableSaintImportSummary, result: ImportResult, plan: ImportPlan) {
  if (result.status === "created") summary.newDraftSaintsCreated += 1;
  if (result.status === "skipped_existing_external") summary.existingCmsSaintsSkipped += 1;
  if (result.status === "skipped_collision") {
    summary.slugNameCollisionsSkipped += 1;
    summary.collisions.push({
      recordId: plan.recordId,
      airtableName: plan.displayName,
      existingSaintId: result.saint.id,
      existingSaintSlug: result.saint.slug,
      existingSaintName: result.saint.name,
      reason: result.reason,
      message: result.message
    });
  }
}

function addGuruClassification(
  summary: AirtableGuruRelationshipSummary,
  classification: Awaited<ReturnType<typeof classifyGuruRelationshipPlan>>,
  plan: GuruRelationshipPlan
) {
  if (classification === "create") summary.guruRelationshipsCreated += 1;
  if (classification === "existing") summary.guruRelationshipsExisting += 1;
  if (classification === "skipped_unmapped_disciple" || classification === "skipped_unmapped_guru") {
    summary.guruRelationshipsUnresolved += 1;
    summary.unresolvedGuruRelationships.push({
      discipleRecordId: plan.discipleRecordId,
      discipleName: plan.discipleName,
      discipleSaintSlug: plan.discipleSaint?.slug,
      discipleSaintName: plan.discipleSaint?.name,
      guruRecordId: plan.guruRecordId,
      guruName: plan.guruName,
      guruSaintSlug: plan.guruSaint?.slug,
      guruSaintName: plan.guruSaint?.name,
      reason: classification === "skipped_unmapped_disciple" ? "unmapped_disciple" : "unmapped_guru",
      message: classification === "skipped_unmapped_disciple" ? "Disciple not linked" : "Guru not linked"
    });
  }
  if (classification === "skipped_self_relationship") {
    summary.skippedSelfRelationships += 1;
    summary.selfSkippedGuruRelationships.push({
      discipleRecordId: plan.discipleRecordId,
      discipleName: plan.discipleName,
      guruRecordId: plan.guruRecordId,
      guruName: plan.guruName,
      saintSlug: plan.discipleSaint?.slug,
      saintName: plan.discipleSaint?.name,
      message: "Same saint on both sides"
    });
  }
}

function asObject(value: unknown): AirtableFields {
  return value && typeof value === "object" && !Array.isArray(value) ? value as AirtableFields : {};
}

function stringField(fields: AirtableFields, key: string) {
  const value = fields[key];
  return typeof value === "string" ? value.trim() : undefined;
}

function stringArrayField(fields: AirtableFields, key: string) {
  const value = fields[key];
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

function linkedRecordIds(fields: AirtableFields, key: string) {
  return stringArrayField(fields, key);
}

function attachmentField(fields: AirtableFields, key: string) {
  const value = fields[key];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Attachment => Boolean(item && typeof item === "object"));
}

function cleanDisplayName(originalName: string) {
  const trimmed = normalizeSpaces(originalName);
  const match = trimmed.match(/^(.+?)\s+(?:of|from)\s+(.+)$/i);
  if (!match) return { displayName: trimmed, locationPhrase: undefined };

  const candidateName = normalizeSpaces(match[1]);
  const locationPhrase = cleanupLocationPhrase(match[2]);
  if (tokenCount(candidateName) < 2 || tokenCount(locationPhrase) < 1) {
    return { displayName: trimmed, locationPhrase: undefined };
  }

  return { displayName: candidateName, locationPhrase };
}

function cleanupLocationPhrase(value: string) {
  return normalizeSpaces(value.replace(/[().]/g, " ").replace(/\s*,\s*/g, ", "));
}

function normalizeSpaces(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function tokenCount(value: string) {
  return value.split(/\s+/).filter(Boolean).length;
}

function canonicalizeName(displayName: string) {
  const tokens = displayName.split(/\s+/);
  while (tokens.length > 1 && HONORIFIC_PREFIXES.includes(tokens[0].toLowerCase().replace(/\.$/, ""))) {
    tokens.shift();
  }
  return tokens.join(" ").trim() || displayName;
}

function splitLocationPhrase(value: string | undefined) {
  if (!value) return [];
  return value
    .split(/\s*,\s*|\s+ and \s+/i)
    .map((place) => normalizeSpaces(place))
    .map((place) => place.replace(/^(near|in|at)\s+/i, ""))
    .filter((place) => place && tokenCount(place) <= 6);
}

function inferPlaceType(placeName: string): PlaceType {
  return /\b(ashram|math|mutt|tapovan|mandir|temple|gurudwara|vat|kutir)\b/i.test(placeName)
    ? "sadhana"
    : "associated";
}

function uniqueByNormalized<T>(values: T[], getKey: (value: T) => string) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = getKey(value).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseLinks(value: string | undefined) {
  if (!value) return [];
  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => line.match(/https?:\/\/\S+/g) ?? [])
    .map((url) => url.replace(/[),.;]+$/, ""));
}

function noteFromDates(birth: ImportPlan["birth"], samadhi: ImportPlan["samadhi"]) {
  return [birth.note, samadhi.note].filter(Boolean).join(" ");
}

function titleizeSlug(slug: string) {
  return slug
    .split("-")
    .map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : part)
    .join(" ");
}

function formatImportError(recordId: string, airtableName: string | undefined, error: unknown): AirtableImportErrorDetail {
  const message = error instanceof Error ? error.message : "Unknown import error.";
  return {
    recordId,
    airtableName,
    message
  };
}

function formatGuruImportError(plan: GuruRelationshipPlan, error: unknown): AirtableImportErrorDetail {
  const message = error instanceof Error ? error.message : "Unknown import error.";
  return {
    recordId: `${plan.discipleRecordId}:${plan.guruRecordId}`,
    airtableName: plan.discipleName,
    discipleRecordId: plan.discipleRecordId,
    discipleName: plan.discipleName,
    guruRecordId: plan.guruRecordId,
    guruName: plan.guruName,
    message
  };
}

function toInputJson(value: AirtableSaintImportSummary | AirtableGuruRelationshipSummary): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function getCompletedJobMessage(summary: AirtableSaintImportSummary | AirtableGuruRelationshipSummary) {
  if ("guruRelationshipsCreated" in summary) {
    return `Completed: ${summary.guruRelationshipsCreated} guru relationships created, ${summary.guruRelationshipsExisting} existing, ${summary.guruRelationshipsUnresolved} unresolved.`;
  }

  if (summary.mode === "check") {
    return `Check completed: ${summary.newDraftSaintsCreated} draft saints available, ${summary.existingCmsSaintsSkipped} existing skipped, ${summary.slugNameCollisionsSkipped} collisions.`;
  }

  return `Completed: ${summary.newDraftSaintsCreated} draft saints created, ${summary.existingCmsSaintsSkipped} existing skipped, ${summary.slugNameCollisionsSkipped} collisions.`;
}

function formatMode(mode: string) {
  return mode.replace(/_/g, " ");
}
