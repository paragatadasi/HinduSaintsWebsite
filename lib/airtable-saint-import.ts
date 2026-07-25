import { Prisma, type Confidence, type ContentStatus, type PlaceType, type RelationshipType } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";
import { cacheExternalImage } from "@/lib/external-image-cache";
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

type AirtableSaintRow = Awaited<ReturnType<typeof findAirtableSaintRows>>[number];

type ExternalSaintReference = SaintReference & {
  externalRecordId: string;
  externalId: string;
};

type CleanupRelationshipPlan = {
  sourceRecordId: string;
  sourceName?: string;
  fromRecordId: string;
  fromName?: string;
  fromSaint?: ExternalSaintReference;
  toRecordId: string;
  toName?: string;
  toSaint?: ExternalSaintReference;
  relationshipType: RelationshipType;
  sourceField: string;
};

type CleanupFamilyPlan = {
  recordId: string;
  airtableName?: string;
  saint?: ExternalSaintReference;
  familyId: string;
};

type CleanupDuplicatePlan = {
  sourceRecordId: string;
  sourceName?: string;
  sourceSaint?: ExternalSaintReference;
  candidateRecordId: string;
  candidateName?: string;
  candidateSaint?: ExternalSaintReference;
  sourceExternalId: string;
};

type CleanupMuseumSectionPlan = {
  recordId: string;
  airtableName?: string;
  saint?: ExternalSaintReference;
  sectionName: string;
  assignmentType: "primary" | "alternative";
  tier: "featured" | "secondary" | "tertiary";
  confidence: Confidence;
  rationale?: string;
  internalPlacementNote?: string;
};

type CleanupPlacePlan = {
  recordId: string;
  airtableName?: string;
  saint?: ExternalSaintReference;
  placeName: string;
  spiritualRegions: string[];
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

export type AirtableCleanupIssueDetail = {
  recordId: string;
  airtableName?: string;
  relatedRecordId?: string;
  relatedName?: string;
  field: string;
  reason: "unmapped_saint" | "unmapped_related_saint" | "self_relationship" | "missing_value";
  message: string;
};

export type AirtableImportMode = "check" | "import_missing_drafts" | "import_airtable_cleanup";

export type AirtableSaintImportSummary = {
  mode: "check" | "import_missing_drafts";
  mirrorRowsChecked: number;
  existingCmsSaintsSkipped: number;
  newDraftSaintsCreated: number;
  slugNameCollisionsSkipped: number;
  collisions: AirtableImportCollisionDetail[];
  errors: AirtableImportErrorDetail[];
};

export type AirtableCleanupImportSummary = {
  mode: "import_airtable_cleanup";
  mirrorRowsChecked: number;
  relationshipCandidatesCreated: number;
  relationshipCandidatesExisting: number;
  relationshipCandidatesUnresolved: number;
  placeRelationshipsCreated: number;
  placeRelationshipsExisting: number;
  familyGroupsCreated: number;
  familyGroupsExisting: number;
  familyMembershipsCreated: number;
  familyMembershipsExisting: number;
  duplicateCandidatesCreated: number;
  duplicateCandidatesExisting: number;
  museumSectionAssignmentsCreated: number;
  museumSectionAssignmentsExisting: number;
  skippedSelfRelationships: number;
  issues: AirtableCleanupIssueDetail[];
  errors: AirtableImportErrorDetail[];
};

export type AirtableSaintImportOptions = {
  dryRun?: boolean;
  limit?: number;
};

const AIRTABLE_TABLE = "Saints";
const IMPORTER_SOURCE = "airtable_saints_cms_import";
const MISSING_DRAFT_STATUS: ContentStatus = "draft";
const CLEANUP_IMPORTER_NOTE = "Imported from Airtable cleanup fields; pending editorial review.";

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
    if (job.mode === "import_airtable_cleanup") {
      const summary = await runAirtableCleanupImport({ dryRun: false });
      await completeAirtableJob(jobId, summary);
      return;
    }

    if (job.mode !== "check" && job.mode !== "import_missing_drafts") {
      throw new Error(`Unsupported Airtable import mode: ${job.mode}.`);
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
  summary: AirtableSaintImportSummary | AirtableCleanupImportSummary
) {
  const isCleanupSummary = "relationshipCandidatesCreated" in summary;
  await updateAirtableJob(jobId, {
    status: "completed",
    completedAt: new Date(),
    mirrorRowsChecked: summary.mirrorRowsChecked,
    existingCmsSaintsSkipped: isCleanupSummary ? undefined : summary.existingCmsSaintsSkipped,
    newDraftSaintsCreated: isCleanupSummary ? undefined : summary.newDraftSaintsCreated,
    slugNameCollisionsSkipped: isCleanupSummary ? undefined : summary.slugNameCollisionsSkipped,
    guruRelationshipsCreated: undefined,
    guruRelationshipsExisting: undefined,
    guruRelationshipsUnresolved: undefined,
    relationshipCandidatesCreated: isCleanupSummary ? summary.relationshipCandidatesCreated : undefined,
    relationshipCandidatesExisting: isCleanupSummary ? summary.relationshipCandidatesExisting : undefined,
    relationshipCandidatesUnresolved: isCleanupSummary ? summary.relationshipCandidatesUnresolved : undefined,
    placeRelationshipsCreated: isCleanupSummary ? summary.placeRelationshipsCreated : undefined,
    placeRelationshipsExisting: isCleanupSummary ? summary.placeRelationshipsExisting : undefined,
    familyGroupsCreated: isCleanupSummary ? summary.familyGroupsCreated : undefined,
    familyMembershipsCreated: isCleanupSummary ? summary.familyMembershipsCreated : undefined,
    duplicateCandidatesCreated: isCleanupSummary ? summary.duplicateCandidatesCreated : undefined,
    museumSectionAssignmentsCreated: isCleanupSummary ? summary.museumSectionAssignmentsCreated : undefined,
    skippedSelfRelationships: isCleanupSummary ? summary.skippedSelfRelationships : undefined,
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

export async function runAirtableCleanupImport(options: AirtableSaintImportOptions = {}) {
  const dryRun = options.dryRun ?? true;
  const rows = await findAirtableSaintRows(options.limit);
  const context = await buildCleanupContext(rows);
  const summary = emptyCleanupImportSummary(rows.length);

  for (const plan of buildCleanupRelationshipPlans(rows, context)) {
    try {
      await applyCleanupRelationshipPlan(summary, plan, dryRun);
    } catch (error) {
      summary.errors.push(formatImportError(`${plan.fromRecordId}:${plan.toRecordId}`, plan.fromName, error));
    }
  }

  for (const plan of buildCleanupPlacePlans(rows, context)) {
    try {
      await applyCleanupPlacePlan(summary, plan, dryRun);
    } catch (error) {
      summary.errors.push(formatImportError(plan.recordId, plan.airtableName, error));
    }
  }

  for (const plan of buildCleanupFamilyPlans(rows, context)) {
    try {
      await applyCleanupFamilyPlan(summary, plan, dryRun);
    } catch (error) {
      summary.errors.push(formatImportError(plan.recordId, plan.airtableName, error));
    }
  }

  for (const plan of buildCleanupDuplicatePlans(rows, context)) {
    try {
      await applyCleanupDuplicatePlan(summary, plan, dryRun);
    } catch (error) {
      summary.errors.push(formatImportError(`${plan.sourceRecordId}:${plan.candidateRecordId}`, plan.sourceName, error));
    }
  }

  for (const plan of buildCleanupMuseumSectionPlans(rows, context)) {
    try {
      await applyCleanupMuseumSectionPlan(summary, plan, dryRun);
    } catch (error) {
      summary.errors.push(formatImportError(plan.recordId, plan.airtableName, error));
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
  if (existing?.storageKey) return existing;

  try {
    const cached = await cacheExternalImage({
      fileName: image.filename ?? `${displayName}-airtable-image`,
      folder: "airtable-media",
      sourceUrls: [preferredUrl, image.url]
    });

    if (existing) {
      return db.mediaAsset.update({
        where: { id: existing.id },
        data: {
          url: cached.url,
          storageKey: cached.storageKey,
          mimeType: cached.mimeType
        }
      });
    }

    return db.mediaAsset.create({
      data: {
        url: cached.url,
        storageKey: cached.storageKey,
        sourceUrl: image.url,
        altText: displayName,
        caption: image.filename,
        mimeType: cached.mimeType,
        width: image.thumbnails?.large?.width ?? image.width,
        height: image.thumbnails?.large?.height ?? image.height
      }
    });
  } catch (error) {
    console.warn(
      `Could not cache Airtable image ${image.filename ?? image.url}: ${error instanceof Error ? error.message : "unknown error"}`
    );

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

async function buildCleanupContext(rows: AirtableSaintRow[]) {
  return {
    nameByRecordId: buildAirtableNameMap(rows),
    saintByExternalId: await buildExternalSaintRecordMap(rows)
  };
}

function buildCleanupRelationshipPlans(
  rows: AirtableSaintRow[],
  context: Awaited<ReturnType<typeof buildCleanupContext>>
) {
  const plans: CleanupRelationshipPlan[] = [];

  for (const row of rows) {
    const fields = asObject(row.rawFieldsJson);
    const rowExternalId = airtableExternalId(row.baseId, row.recordId);
    const rowSaint = context.saintByExternalId.get(rowExternalId);
    const rowName = context.nameByRecordId.get(row.recordId);

    for (const guruRecordId of linkedRecordIds(fields, "Master(s)")) {
      plans.push({
        sourceRecordId: row.recordId,
        sourceName: rowName,
        fromRecordId: row.recordId,
        fromName: rowName,
        fromSaint: rowSaint,
        toRecordId: guruRecordId,
        toName: context.nameByRecordId.get(guruRecordId),
        toSaint: context.saintByExternalId.get(airtableExternalId(row.baseId, guruRecordId)),
        relationshipType: "guru",
        sourceField: "Master(s)"
      });
    }

    for (const discipleRecordId of linkedRecordIds(fields, "Disciples")) {
      plans.push({
        sourceRecordId: row.recordId,
        sourceName: rowName,
        fromRecordId: discipleRecordId,
        fromName: context.nameByRecordId.get(discipleRecordId),
        fromSaint: context.saintByExternalId.get(airtableExternalId(row.baseId, discipleRecordId)),
        toRecordId: row.recordId,
        toName: rowName,
        toSaint: rowSaint,
        relationshipType: "guru",
        sourceField: "Disciples"
      });
    }

    for (const partnerRecordId of linkedRecordIds(fields, "Partner")) {
      plans.push(symmetricRelationshipPlan({
        row,
        rowName,
        rowSaint,
        relatedRecordId: partnerRecordId,
        relatedName: context.nameByRecordId.get(partnerRecordId),
        relatedSaint: context.saintByExternalId.get(airtableExternalId(row.baseId, partnerRecordId)),
        relationshipType: "partner",
        sourceField: "Partner"
      }));
    }

    for (const incarnationRecordId of linkedRecordIds(fields, "Incarnation")) {
      plans.push(symmetricRelationshipPlan({
        row,
        rowName,
        rowSaint,
        relatedRecordId: incarnationRecordId,
        relatedName: context.nameByRecordId.get(incarnationRecordId),
        relatedSaint: context.saintByExternalId.get(airtableExternalId(row.baseId, incarnationRecordId)),
        relationshipType: "incarnation",
        sourceField: "Incarnation"
      }));
    }
  }

  return uniqueByNormalized(plans, (plan) => [
    plan.relationshipType,
    plan.fromRecordId,
    plan.toRecordId,
    plan.sourceField
  ].join(":"));
}

function symmetricRelationshipPlan({
  row,
  rowName,
  rowSaint,
  relatedRecordId,
  relatedName,
  relatedSaint,
  relationshipType,
  sourceField
}: {
  row: AirtableSaintRow;
  rowName?: string;
  rowSaint?: ExternalSaintReference;
  relatedRecordId: string;
  relatedName?: string;
  relatedSaint?: ExternalSaintReference;
  relationshipType: RelationshipType;
  sourceField: string;
}): CleanupRelationshipPlan {
  const firstIsRow = row.recordId.localeCompare(relatedRecordId) <= 0;
  return {
    sourceRecordId: row.recordId,
    sourceName: rowName,
    fromRecordId: firstIsRow ? row.recordId : relatedRecordId,
    fromName: firstIsRow ? rowName : relatedName,
    fromSaint: firstIsRow ? rowSaint : relatedSaint,
    toRecordId: firstIsRow ? relatedRecordId : row.recordId,
    toName: firstIsRow ? relatedName : rowName,
    toSaint: firstIsRow ? relatedSaint : rowSaint,
    relationshipType,
    sourceField
  };
}

function buildCleanupPlacePlans(rows: AirtableSaintRow[], context: Awaited<ReturnType<typeof buildCleanupContext>>) {
  const plans: CleanupPlacePlan[] = [];
  for (const row of rows) {
    const fields = asObject(row.rawFieldsJson);
    const places = listField(fields, "Normalized places");
    const spiritualRegions = listField(fields, "Spiritual Region");
    if (places.length === 0 && spiritualRegions.length === 0) continue;
    for (const placeName of places.length > 0 ? places : spiritualRegions) {
      plans.push({
        recordId: row.recordId,
        airtableName: context.nameByRecordId.get(row.recordId),
        saint: context.saintByExternalId.get(airtableExternalId(row.baseId, row.recordId)),
        placeName,
        spiritualRegions
      });
    }
  }
  return uniqueByNormalized(plans, (plan) => `${plan.recordId}:${plan.placeName}`);
}

function buildCleanupFamilyPlans(rows: AirtableSaintRow[], context: Awaited<ReturnType<typeof buildCleanupContext>>) {
  return rows
    .map((row): CleanupFamilyPlan | undefined => {
      const fields = asObject(row.rawFieldsJson);
      const familyId = stringField(fields, "Family ID");
      if (!familyId) return undefined;
      return {
        recordId: row.recordId,
        airtableName: context.nameByRecordId.get(row.recordId),
        saint: context.saintByExternalId.get(airtableExternalId(row.baseId, row.recordId)),
        familyId
      };
    })
    .filter((plan): plan is CleanupFamilyPlan => Boolean(plan));
}

function buildCleanupDuplicatePlans(rows: AirtableSaintRow[], context: Awaited<ReturnType<typeof buildCleanupContext>>) {
  const plans: CleanupDuplicatePlan[] = [];
  for (const row of rows) {
    const fields = asObject(row.rawFieldsJson);
    const sourceName = context.nameByRecordId.get(row.recordId);
    const sourceSaint = context.saintByExternalId.get(airtableExternalId(row.baseId, row.recordId));
    for (const candidateRecordId of linkedRecordIds(fields, "Potential duplicate match")) {
      const pair = [row.recordId, candidateRecordId].sort();
      plans.push({
        sourceRecordId: row.recordId,
        sourceName,
        sourceSaint,
        candidateRecordId,
        candidateName: context.nameByRecordId.get(candidateRecordId),
        candidateSaint: context.saintByExternalId.get(airtableExternalId(row.baseId, candidateRecordId)),
        sourceExternalId: `${row.baseId}:${AIRTABLE_TABLE}:duplicate:${pair.join(":")}`
      });
    }
  }
  return uniqueByNormalized(plans, (plan) => plan.sourceExternalId);
}

function buildCleanupMuseumSectionPlans(rows: AirtableSaintRow[], context: Awaited<ReturnType<typeof buildCleanupContext>>) {
  const plans: CleanupMuseumSectionPlan[] = [];
  for (const row of rows) {
    const fields = asObject(row.rawFieldsJson);
    const base = {
      recordId: row.recordId,
      airtableName: context.nameByRecordId.get(row.recordId),
      saint: context.saintByExternalId.get(airtableExternalId(row.baseId, row.recordId)),
      tier: parseMuseumTier(stringField(fields, "Museum Section Tier")),
      confidence: parseConfidence(stringField(fields, "Museum Section Confidence")),
      rationale: stringField(fields, "Museum Section Rationale"),
      internalPlacementNote: stringField(fields, "Museum Section Internal Placement Note")
    };
    const primary = stringField(fields, "Primary Museum Section");
    if (primary) plans.push({ ...base, sectionName: primary, assignmentType: "primary" });
    for (const sectionName of listField(fields, "Alternative Museum Sections")) {
      plans.push({ ...base, sectionName, assignmentType: "alternative" });
    }
  }
  return uniqueByNormalized(plans, (plan) => `${plan.recordId}:${plan.assignmentType}:${plan.sectionName}`);
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

async function buildExternalSaintRecordMap(rows: Array<{ baseId: string; recordId: string }>) {
  const externalIds = rows.map((row) => airtableExternalId(row.baseId, row.recordId));
  const externalRecords = await db.externalRecord.findMany({
    where: {
      sourceType: "airtable",
      externalId: { in: externalIds },
      entityType: "Saint"
    },
    select: {
      id: true,
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
      .map((record) => {
        const saint = record.entityId ? saintById.get(record.entityId) : undefined;
        return saint ? [record.externalId, { ...saint, externalRecordId: record.id, externalId: record.externalId }] as const : undefined;
      })
      .filter((entry): entry is readonly [string, ExternalSaintReference] => Boolean(entry))
  );
}

function airtableExternalId(baseId: string, recordId: string) {
  return `${baseId}:${AIRTABLE_TABLE}:${recordId}`;
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

function emptyCleanupImportSummary(mirrorRowsChecked: number): AirtableCleanupImportSummary {
  return {
    mode: "import_airtable_cleanup",
    mirrorRowsChecked,
    relationshipCandidatesCreated: 0,
    relationshipCandidatesExisting: 0,
    relationshipCandidatesUnresolved: 0,
    placeRelationshipsCreated: 0,
    placeRelationshipsExisting: 0,
    familyGroupsCreated: 0,
    familyGroupsExisting: 0,
    familyMembershipsCreated: 0,
    familyMembershipsExisting: 0,
    duplicateCandidatesCreated: 0,
    duplicateCandidatesExisting: 0,
    museumSectionAssignmentsCreated: 0,
    museumSectionAssignmentsExisting: 0,
    skippedSelfRelationships: 0,
    issues: [],
    errors: []
  };
}

async function applyCleanupRelationshipPlan(summary: AirtableCleanupImportSummary, plan: CleanupRelationshipPlan, dryRun: boolean) {
  if (!plan.fromSaint) {
    addCleanupIssue(summary, {
      recordId: plan.fromRecordId,
      airtableName: plan.fromName,
      relatedRecordId: plan.toRecordId,
      relatedName: plan.toName,
      field: plan.sourceField,
      reason: "unmapped_saint",
      message: "Source saint is not linked to a CMS saint."
    });
    return;
  }
  if (!plan.toSaint) {
    addCleanupIssue(summary, {
      recordId: plan.fromRecordId,
      airtableName: plan.fromName,
      relatedRecordId: plan.toRecordId,
      relatedName: plan.toName,
      field: plan.sourceField,
      reason: "unmapped_related_saint",
      message: "Related saint is not linked to a CMS saint."
    });
    return;
  }
  if (plan.fromSaint.id === plan.toSaint.id) {
    summary.skippedSelfRelationships += 1;
    addCleanupIssue(summary, {
      recordId: plan.fromRecordId,
      airtableName: plan.fromName,
      relatedRecordId: plan.toRecordId,
      relatedName: plan.toName,
      field: plan.sourceField,
      reason: "self_relationship",
      message: "Relationship points to the same CMS saint."
    });
    return;
  }

  const existing = await db.saintRelationship.findFirst({
    where: {
      fromSaintId: plan.fromSaint.id,
      toSaintId: plan.toSaint.id,
      relationshipType: plan.relationshipType
    },
    select: { id: true }
  });
  if (existing) {
    summary.relationshipCandidatesExisting += 1;
    return;
  }

  summary.relationshipCandidatesCreated += 1;
  if (dryRun) return;

  await db.saintRelationship.create({
    data: {
      fromSaintId: plan.fromSaint.id,
      toSaintId: plan.toSaint.id,
      relationshipType: plan.relationshipType,
      confidence: "medium",
      evidenceStatus: "imported",
      status: "needs_review",
      publicVisible: false,
      notes: `${CLEANUP_IMPORTER_NOTE} Source field: ${plan.sourceField}.`,
      externalRecordId: plan.fromSaint.externalRecordId
    }
  });
}

async function applyCleanupPlacePlan(summary: AirtableCleanupImportSummary, plan: CleanupPlacePlan, dryRun: boolean) {
  if (!plan.saint) {
    addCleanupIssue(summary, {
      recordId: plan.recordId,
      airtableName: plan.airtableName,
      field: "Normalized places",
      reason: "unmapped_saint",
      message: "Place cleanup row is not linked to a CMS saint."
    });
    return;
  }

  const placeSlug = toSlug(plan.placeName);
  const regionSlugs = plan.spiritualRegions.map(toSlug);
  const existingPlace = await db.place.findUnique({ where: { slug: placeSlug }, select: { id: true } });
  const existingLink = existingPlace
    ? await db.saintPlace.findFirst({ where: { saintId: plan.saint.id, placeId: existingPlace.id }, select: { id: true } })
    : null;

  if (!dryRun) {
    const place = await db.place.upsert({
      where: { slug: placeSlug },
      create: {
        slug: placeSlug,
        name: plan.placeName,
        alternateNames: [],
        placeKind: "unknown",
        placeScope: "locality",
        notes: CLEANUP_IMPORTER_NOTE
      },
      update: {}
    });
    if (!existingLink) {
      await db.saintPlace.create({
        data: {
          saintId: plan.saint.id,
          placeId: place.id,
          placeType: "associated",
          notes: "Imported from Airtable Normalized places cleanup field."
        }
      });
    }

    for (let index = 0; index < plan.spiritualRegions.length; index += 1) {
      const regionName = plan.spiritualRegions[index];
      const region = await db.place.upsert({
        where: { slug: regionSlugs[index] },
        create: {
          slug: regionSlugs[index],
          name: regionName,
          alternateNames: [],
          placeKind: "spiritual_region",
          placeScope: "locality",
          notes: CLEANUP_IMPORTER_NOTE
        },
        update: { placeKind: "spiritual_region" }
      });
      const existingRelationship = await db.placeRelationship.findUnique({
        where: {
          fromPlaceId_toPlaceId_relationshipType: {
            fromPlaceId: place.id,
            toPlaceId: region.id,
            relationshipType: "associated_region"
          }
        },
        select: { id: true }
      });
      if (existingRelationship) {
        summary.placeRelationshipsExisting += 1;
      } else {
        await db.placeRelationship.create({
          data: {
            fromPlaceId: place.id,
            toPlaceId: region.id,
            relationshipType: "associated_region",
            confidence: "medium",
            notes: "Imported from Airtable Spiritual Region cleanup field."
          }
        });
        summary.placeRelationshipsCreated += 1;
      }
    }
    return;
  }

  for (const regionSlug of regionSlugs) {
    const region = await db.place.findUnique({ where: { slug: regionSlug }, select: { id: true } });
    if (existingPlace && region) {
      const existingRelationship = await db.placeRelationship.findUnique({
        where: {
          fromPlaceId_toPlaceId_relationshipType: {
            fromPlaceId: existingPlace.id,
            toPlaceId: region.id,
            relationshipType: "associated_region"
          }
        },
        select: { id: true }
      });
      if (existingRelationship) summary.placeRelationshipsExisting += 1;
      else summary.placeRelationshipsCreated += 1;
    } else {
      summary.placeRelationshipsCreated += 1;
    }
  }
}

async function applyCleanupFamilyPlan(summary: AirtableCleanupImportSummary, plan: CleanupFamilyPlan, dryRun: boolean) {
  if (!plan.saint) {
    addCleanupIssue(summary, {
      recordId: plan.recordId,
      airtableName: plan.airtableName,
      field: "Family ID",
      reason: "unmapped_saint",
      message: "Family row is not linked to a CMS saint."
    });
    return;
  }

  const slug = toSlug(plan.familyId);
  const existingFamily = await db.saintFamily.findUnique({ where: { slug }, select: { id: true } });
  if (existingFamily) summary.familyGroupsExisting += 1;
  else summary.familyGroupsCreated += 1;

  const existingMembership = existingFamily
    ? await db.saintFamilyMember.findUnique({
        where: { familyId_saintId: { familyId: existingFamily.id, saintId: plan.saint.id } },
        select: { id: true }
      })
    : null;
  if (existingMembership) summary.familyMembershipsExisting += 1;
  else summary.familyMembershipsCreated += 1;
  if (dryRun) return;

  const family = await db.saintFamily.upsert({
    where: { slug },
    create: {
      slug,
      displayName: plan.familyId,
      status: "needs_review",
      publicVisible: false,
      sourceExternalId: plan.familyId,
      computedFrom: "Airtable Family ID cleanup field",
      notes: CLEANUP_IMPORTER_NOTE
    },
    update: {}
  });
  await db.saintFamilyMember.upsert({
    where: { familyId_saintId: { familyId: family.id, saintId: plan.saint.id } },
    create: {
      familyId: family.id,
      saintId: plan.saint.id,
      role: "member",
      externalRecordId: plan.saint.externalRecordId,
      notes: CLEANUP_IMPORTER_NOTE
    },
    update: {}
  });
}

async function applyCleanupDuplicatePlan(summary: AirtableCleanupImportSummary, plan: CleanupDuplicatePlan, dryRun: boolean) {
  if (!plan.sourceSaint || !plan.candidateSaint) {
    addCleanupIssue(summary, {
      recordId: plan.sourceRecordId,
      airtableName: plan.sourceName,
      relatedRecordId: plan.candidateRecordId,
      relatedName: plan.candidateName,
      field: "Potential duplicate match",
      reason: plan.sourceSaint ? "unmapped_related_saint" : "unmapped_saint",
      message: "Duplicate candidate includes an Airtable row that is not linked to a CMS saint."
    });
    return;
  }
  const [entityId, candidateEntityId] = [plan.sourceSaint.id, plan.candidateSaint.id].sort();
  const existing = await db.duplicateCandidate.findFirst({
    where: { entityType: "Saint", entityId, candidateEntityId, sourceType: "airtable", sourceExternalId: plan.sourceExternalId },
    select: { id: true }
  });
  if (existing) {
    summary.duplicateCandidatesExisting += 1;
    return;
  }
  summary.duplicateCandidatesCreated += 1;
  if (dryRun) return;

  await db.duplicateCandidate.create({
    data: {
      entityType: "Saint",
      entityId,
      candidateEntityId,
      sourceType: "airtable",
      sourceExternalId: plan.sourceExternalId,
      confidence: "medium",
      message: "Imported from Airtable Potential duplicate match field.",
      evidenceJson: {
        sourceRecordId: plan.sourceRecordId,
        sourceName: plan.sourceName,
        candidateRecordId: plan.candidateRecordId,
        candidateName: plan.candidateName
      } satisfies Prisma.InputJsonValue
    }
  });
}

async function applyCleanupMuseumSectionPlan(summary: AirtableCleanupImportSummary, plan: CleanupMuseumSectionPlan, dryRun: boolean) {
  if (!plan.saint) {
    addCleanupIssue(summary, {
      recordId: plan.recordId,
      airtableName: plan.airtableName,
      field: "Primary Museum Section",
      reason: "unmapped_saint",
      message: "Museum section row is not linked to a CMS saint."
    });
    return;
  }

  const slug = toSlug(plan.sectionName);
  const existingSection = await db.museumSection.findUnique({ where: { slug }, select: { id: true } });
  const existingAssignment = existingSection
    ? await db.saintMuseumSection.findUnique({
        where: {
          saintId_museumSectionId_assignmentType: {
            saintId: plan.saint.id,
            museumSectionId: existingSection.id,
            assignmentType: plan.assignmentType
          }
        },
        select: { id: true }
      })
    : null;
  if (existingAssignment) {
    summary.museumSectionAssignmentsExisting += 1;
    return;
  }
  summary.museumSectionAssignmentsCreated += 1;
  if (dryRun) return;

  const section = await db.museumSection.upsert({
    where: { slug },
    create: {
      slug,
      name: plan.sectionName,
      status: "needs_review",
      publicVisible: false
    },
    update: {}
  });
  await db.saintMuseumSection.create({
    data: {
      saintId: plan.saint.id,
      museumSectionId: section.id,
      assignmentType: plan.assignmentType,
      tier: plan.tier,
      confidence: plan.confidence,
      rationale: plan.rationale,
      internalPlacementNote: plan.internalPlacementNote,
      status: "needs_review",
      externalRecordId: plan.saint.externalRecordId
    }
  });
}

function addCleanupIssue(summary: AirtableCleanupImportSummary, issue: AirtableCleanupIssueDetail) {
  summary.relationshipCandidatesUnresolved += issue.field === "Master(s)" || issue.field === "Disciples" || issue.field === "Partner" || issue.field === "Incarnation" ? 1 : 0;
  summary.issues.push(issue);
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

function toInputJson(value: AirtableSaintImportSummary | AirtableCleanupImportSummary): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function getCompletedJobMessage(summary: AirtableSaintImportSummary | AirtableCleanupImportSummary) {
  if ("relationshipCandidatesCreated" in summary) {
    return [
      "Completed cleanup import:",
      `${summary.relationshipCandidatesCreated} relationships created`,
      `${summary.familyMembershipsCreated} family memberships`,
      `${summary.duplicateCandidatesCreated} duplicate candidates`,
      `${summary.museumSectionAssignmentsCreated} museum assignments`,
      `${summary.relationshipCandidatesUnresolved} relationship issues`
    ].join(" ");
  }

  if (summary.mode === "check") {
    return `Check completed: ${summary.newDraftSaintsCreated} draft saints available, ${summary.existingCmsSaintsSkipped} existing skipped, ${summary.slugNameCollisionsSkipped} collisions.`;
  }

  return `Completed: ${summary.newDraftSaintsCreated} draft saints created, ${summary.existingCmsSaintsSkipped} existing skipped, ${summary.slugNameCollisionsSkipped} collisions.`;
}

function formatMode(mode: string) {
  return mode.replace(/_/g, " ");
}

function listField(fields: AirtableFields, key: string) {
  const value = fields[key];
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "").trim()).filter(Boolean);
  }
  if (typeof value !== "string") return [];
  return value
    .split(/\s*;\s*|\r?\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseConfidence(value: string | undefined): Confidence {
  const normalized = value?.toLowerCase();
  if (normalized === "high" || normalized === "low") return normalized;
  return "medium";
}

function parseMuseumTier(value: string | undefined): "featured" | "secondary" | "tertiary" {
  const normalized = value?.toLowerCase();
  if (normalized === "featured" || normalized === "tertiary") return normalized;
  return "secondary";
}
