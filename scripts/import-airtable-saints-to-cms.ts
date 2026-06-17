import { Prisma, type ContentStatus, type PlaceType } from "../lib/generated/prisma/client";
import { db } from "../lib/db";
import { parseImportedDate, buildEraLabel } from "../lib/import-dates";
import { getKnownPlaceScope, getKnownStateSlug } from "../lib/place-taxonomy";
import { toSlug } from "../lib/slugs";

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
  biographySummary?: string;
  birth: ReturnType<typeof parseImportedDate>;
  samadhi: ReturnType<typeof parseImportedDate>;
  dateNotes?: string;
  places: Array<{ name: string; placeType: PlaceType; notes?: string }>;
  traditions: string[];
  images: Attachment[];
  links: string[];
  trackerMatchCount: number;
};

const AIRTABLE_TABLE = "Saints";
const IMPORTER_SOURCE = "airtable_saints_cms_import";
const RAMANA_AIRTABLE_RECORD_ID = "recnTSlt2x2pAPPAA";
const MOCK_RAMANA_SLUG = "sri-ramana-maharshi";
const STATUS: ContentStatus = "needs_review";

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

function parseArgs(argv: string[]) {
  return {
    dryRun: !argv.includes("--write"),
    limit: numberArg(argv, "--limit")
  };
}

function numberArg(argv: string[], key: string) {
  const inline = argv.find((arg) => arg.startsWith(`${key}=`));
  const value = inline ? inline.split("=", 2)[1] : argv[argv.indexOf(key) + 1];
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
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

function buildPlan(row: {
  baseId: string;
  recordId: string;
  rawFieldsJson: Prisma.JsonValue;
  instagramTrackerMatchCount: number;
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
    biographySummary: stringField(fields, "Bio/Info"),
    birth,
    samadhi,
    dateNotes: noteFromDates(birth, samadhi) || undefined,
    places: uniqueByNormalized([...airtablePlaces, ...phrasePlaces], (place) => place.name),
    traditions: stringArrayField(fields, "Sampradaya"),
    images: attachmentField(fields, "Picture(s) of Saint").filter((image) => image.url),
    links: parseLinks(stringField(fields, "Links")),
    trackerMatchCount: row.instagramTrackerMatchCount
  };
}

async function uniqueSlug(baseSlug: string, currentSaintId?: string, suffix?: string) {
  const root = baseSlug || "saint";
  const candidates = [
    root,
    suffix ? `${root}-${suffix}` : undefined
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const existing = await db.saint.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === currentSaintId) return candidate;
  }

  let counter = 2;
  while (true) {
    const candidate = `${root}-${counter}`;
    const existing = await db.saint.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === currentSaintId) return candidate;
    counter += 1;
  }
}

async function deleteMockRamanaIfNeeded(plans: ImportPlan[], dryRun: boolean) {
  if (!plans.some((plan) => plan.recordId === RAMANA_AIRTABLE_RECORD_ID)) return { deleted: false, dryRun };

  const mock = await db.saint.findUnique({
    where: { slug: MOCK_RAMANA_SLUG },
    select: {
      id: true,
      canonicalName: true,
      displayName: true,
      status: true,
      _count: { select: { instagramItems: true } }
    }
  });
  if (!mock) return { deleted: false, dryRun };

  const linkedExternal = await db.externalRecord.findFirst({
    where: { entityType: "Saint", entityId: mock.id },
    select: { id: true }
  });
  const looksLikeSeedMock = /ramana maharshi/i.test(`${mock.canonicalName} ${mock.displayName}`) && !linkedExternal;
  if (!looksLikeSeedMock) return { deleted: false, dryRun };

  if (dryRun) return { deleted: true, dryRun };

  await db.$transaction(async (tx) => {
    await tx.instagramItemSaint.deleteMany({ where: { saintId: mock.id } });
    await tx.saint.delete({ where: { id: mock.id } });
    await tx.instagramItem.deleteMany({
      where: {
        instagramUrl: "https://www.instagram.com/p/example/",
        saints: { none: {} }
      }
    });
  });

  return { deleted: true, dryRun };
}

async function importPlan(plan: ImportPlan) {
  const existingExternal = await db.externalRecord.findUnique({
    where: { sourceType_externalId: { sourceType: "airtable", externalId: plan.externalId } },
    select: { id: true, entityId: true, rawPayloadJson: true }
  });
  const linkedSaint = existingExternal?.entityId
    ? await db.saint.findUnique({ where: { id: existingExternal.entityId } })
    : undefined;
  const fallbackSaint = linkedSaint ? undefined : await findUnlinkedImporterSaint(plan.baseSlug);
  const existingSaint = linkedSaint ?? fallbackSaint;
  const slug = await uniqueSlug(plan.baseSlug, existingSaint?.id, plan.recordId.slice(-6).toLowerCase());
  const eraLabel = buildEraLabel(plan.birth, plan.samadhi);

  const saint = await db.saint.upsert({
    where: { id: existingSaint?.id ?? "__missing__" },
    create: {
      slug,
      canonicalName: plan.canonicalName,
      displayName: plan.displayName,
      biographySummary: plan.biographySummary,
      status: STATUS,
      launchMvp: true,
      hasInstagramContent: true,
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
    },
    update: {
      slug,
      canonicalName: plan.canonicalName,
      displayName: plan.displayName,
      biographySummary: plan.biographySummary,
      launchMvp: true,
      hasInstagramContent: true,
      eraLabel,
      birthDateRaw: plan.birth.raw,
      birthYear: plan.birth.year,
      birthMonth: plan.birth.month,
      birthDay: plan.birth.day,
      birthDatePrecision: plan.birth.precision === "empty" ? null : plan.birth.precision,
      samadhiDateRaw: plan.samadhi.raw,
      samadhiYear: plan.samadhi.year,
      samadhiMonth: plan.samadhi.month,
      samadhiDay: plan.samadhi.day,
      samadhiDatePrecision: plan.samadhi.precision === "empty" ? null : plan.samadhi.precision,
      dateNotes: plan.dateNotes
    }
  });

  await db.saintAlias.deleteMany({ where: { saintId: saint.id, source: `${IMPORTER_SOURCE}:${plan.recordId}` } });
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

  await syncPlaces(saint.id, plan);
  await syncTraditions(saint.id, plan);
  const primaryImageId = await syncImages(saint.id, plan);
  if (primaryImageId) {
    await db.saint.update({ where: { id: saint.id }, data: { primaryImageId } });
  }
  await syncSources(saint.id, plan);

  await db.externalRecord.upsert({
    where: { sourceType_externalId: { sourceType: "airtable", externalId: plan.externalId } },
    create: {
      sourceType: "airtable",
      externalId: plan.externalId,
      entityType: "Saint",
      entityId: saint.id,
      rawPayloadJson: { importedBy: IMPORTER_SOURCE, recordId: plan.recordId },
      importedAt: new Date(),
      lastSeenAt: new Date()
    },
    update: {
      entityType: "Saint",
      entityId: saint.id,
      lastSeenAt: new Date()
    }
  });

  return saint;
}

async function findUnlinkedImporterSaint(slug: string) {
  const saint = await db.saint.findUnique({ where: { slug } });
  if (!saint || saint.status !== STATUS || !saint.hasInstagramContent) return undefined;

  const linkedExternal = await db.externalRecord.findFirst({
    where: { entityType: "Saint", entityId: saint.id },
    select: { id: true }
  });

  return linkedExternal ? undefined : saint;
}

async function syncPlaces(saintId: string, plan: ImportPlan) {
  await db.saintPlace.deleteMany({ where: { saintId } });
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

function titleizeSlug(slug: string) {
  return slug
    .split("-")
    .map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : part)
    .join(" ");
}

async function syncTraditions(saintId: string, plan: ImportPlan) {
  await db.saintTradition.deleteMany({ where: { saintId } });
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
  await db.saintGalleryImage.deleteMany({ where: { saintId } });
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
  await db.contentSource.deleteMany({ where: { entityType: "Saint", entityId: saintId, notes: IMPORTER_SOURCE } });
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

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const rows = await db.airtableMirrorRecord.findMany({
    where: { tableIdOrName: AIRTABLE_TABLE, hasInstagramContent: true },
    take: options.limit,
    orderBy: { recordId: "asc" },
    select: {
      baseId: true,
      recordId: true,
      rawFieldsJson: true,
      instagramTrackerMatchCount: true
    }
  });
  const plans = rows.map(buildPlan).filter((plan): plan is ImportPlan => Boolean(plan));
  const ramanaCleanup = await deleteMockRamanaIfNeeded(plans, options.dryRun);

  if (options.dryRun) {
    console.log(`Dry run: would import ${plans.length} Airtable mirror saints with Instagram content.`);
    console.log(`Would remove seed Ramana mock: ${ramanaCleanup.deleted ? "yes" : "no"}`);
    console.log(`Places to upsert: ${uniqueByNormalized(plans.flatMap((plan) => plan.places), (place) => place.name).length}`);
    console.log(`Traditions to upsert: ${uniqueByNormalized(plans.flatMap((plan) => plan.traditions), (name) => name).length}`);
    console.log(`Saint image attachments to link: ${plans.reduce((sum, plan) => sum + plan.images.length, 0)}`);
    console.table(plans.slice(0, 10).map((plan) => ({
      recordId: plan.recordId,
      displayName: plan.displayName,
      canonicalName: plan.canonicalName,
      birth: plan.birth.raw,
      samadhi: plan.samadhi.raw,
      places: plan.places.map((place) => `${place.name} (${place.placeType})`).join("; ")
    })));
    return;
  }

  let imported = 0;
  for (const plan of plans) {
    await importPlan(plan);
    imported += 1;
  }

  console.log(`Imported ${imported} Airtable mirror saints into CMS as ${STATUS}.`);
  console.log(`Removed seed Ramana mock: ${ramanaCleanup.deleted ? "yes" : "no"}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
