import type { Confidence, InstagramDerivedClaim, InstagramDerivedClaimType, MatchStatus, PlaceType, Prisma } from "@/lib/generated/prisma/client";
import { parseImportedDate } from "@/lib/import-dates";
import { compactMetadata, parseInstagramFirstPageMetadata, splitKeyPlaces, type InstagramFirstPageMetadata } from "@/lib/instagram-metadata";
import { toSlug } from "@/lib/slugs";

type Tx = Prisma.TransactionClient;

type ClaimInput = {
  instagramItemId: string;
  claimType: InstagramDerivedClaimType;
  rawValue: string;
  sourceField?: string;
  targetEntityType?: string;
  targetEntityId?: string;
  confidence?: Confidence;
  status?: MatchStatus;
  appliedSaintId?: string;
  notes?: string;
};

type ApplyClaimOptions = {
  replaceConflictingDates?: boolean;
};

export async function acceptInstagramDerivedClaim(tx: Tx, input: ClaimInput) {
  const claim = await upsertInstagramDerivedClaim(tx, {
    ...input,
    status: input.status ?? "matched"
  });
  const primarySaintId = await getPrimaryMatchedSaintId(tx, input.instagramItemId);

  if (!primarySaintId) return claim;

  await applyInstagramClaimToSaint(tx, claim, primarySaintId);
  return claim;
}

export async function createDirectInstagramClaimsForSaint(tx: Tx, instagramItemId: string, saintId: string) {
  const item = await tx.instagramItem.findUnique({
    where: { id: instagramItemId },
    select: {
      firstPageText: true,
      firstPageMetadata: true
    }
  });
  if (!item) return;

  const metadata = getStoredFirstPageMetadata(item.firstPageMetadata, item.firstPageText);
  type DirectClaimInput = {
    claimType: InstagramDerivedClaimType;
    rawValue: string;
    sourceField: string;
  };
  const directClaimCandidates: Array<DirectClaimInput | undefined> = [
    metadata.displayName ? {
      claimType: "alias" as const,
      rawValue: metadata.displayName,
      sourceField: "displayName"
    } : undefined,
    metadata.born ? {
      claimType: "birth_date" as const,
      rawValue: metadata.born,
      sourceField: "born"
    } : undefined,
    metadata.samadhi ? {
      claimType: "samadhi_date" as const,
      rawValue: metadata.samadhi,
      sourceField: "samadhi"
    } : undefined,
    metadata.tradition ? {
      claimType: "tradition" as const,
      rawValue: metadata.tradition,
      sourceField: "tradition"
    } : undefined
  ];
  const directClaims = directClaimCandidates.filter((claim): claim is DirectClaimInput => Boolean(claim));

  for (const claim of directClaims) {
    await upsertInstagramDerivedClaim(tx, {
      instagramItemId,
      claimType: claim.claimType,
      rawValue: claim.rawValue,
      sourceField: claim.sourceField,
      status: "needs_review",
      confidence: "medium",
      appliedSaintId: saintId,
      notes: "Piped to saint review from matched Instagram first-page biodata."
    });
  }

  await createInstagramPlaceClaimsForSaint(tx, instagramItemId, saintId, metadata, {
    autoApplyExactMatches: false,
    exactMatchNote: "Matched CMS location candidate from matched Instagram first-page biodata.",
    ambiguousMatchNote: "Multiple exact CMS location matches found in matched Instagram first-page biodata.",
    unmatchedNote: "No exact CMS location match found in matched Instagram first-page biodata."
  });
}

export async function connectInstagramPlacesToSaintDraft(tx: Tx, instagramItemId: string, saintId: string) {
  const item = await tx.instagramItem.findUnique({
    where: { id: instagramItemId },
    select: {
      firstPageText: true,
      firstPageMetadata: true
    }
  });
  if (!item) return;

  const metadata = getStoredFirstPageMetadata(item.firstPageMetadata, item.firstPageText);
  await createInstagramPlaceClaimsForSaint(tx, instagramItemId, saintId, metadata, {
    autoApplyExactMatches: true,
    exactMatchNote: "Automatically matched while creating a saint draft from Instagram biodata.",
    ambiguousMatchNote: "Multiple exact place matches found while creating a saint draft.",
    unmatchedNote: "No exact place match found while creating a saint draft."
  });
}

type PlaceClaimOptions = {
  autoApplyExactMatches: boolean;
  exactMatchNote: string;
  ambiguousMatchNote: string;
  unmatchedNote: string;
};

async function createInstagramPlaceClaimsForSaint(
  tx: Tx,
  instagramItemId: string,
  saintId: string,
  metadata: InstagramFirstPageMetadata,
  options: PlaceClaimOptions
) {
  const rawPlaces = metadata.keyPlaces?.length ? metadata.keyPlaces : splitKeyPlaces(metadata.keyPlace);
  if (rawPlaces.length === 0) return;

  const places = await tx.place.findMany({
    select: {
      id: true,
      name: true,
      alternateNames: true,
      region: true,
      country: true
    }
  });

  for (const rawValue of rawPlaces) {
    const normalizedRawValue = toSlug(rawValue);
    const matches = places.filter((place) => getPlaceMatchKeys(place).has(normalizedRawValue));

    if (matches.length === 1) {
      const [place] = matches;
      const claim = await upsertInstagramDerivedClaim(tx, {
        instagramItemId,
        claimType: "place",
        rawValue,
        sourceField: "keyPlace",
        targetEntityType: "Place",
        targetEntityId: place.id,
        confidence: "high",
        status: options.autoApplyExactMatches ? "matched" : "needs_review",
        notes: options.exactMatchNote
      });
      if (options.autoApplyExactMatches) {
        await applyInstagramClaimToSaint(tx, claim, saintId);
      } else {
        await tx.instagramDerivedClaim.update({
          where: { id: claim.id },
          data: { appliedSaintId: saintId }
        });
      }
      continue;
    }

    const claim = await upsertInstagramDerivedClaim(tx, {
      instagramItemId,
      claimType: "place",
      rawValue,
      sourceField: "keyPlace",
      confidence: matches.length > 1 ? "medium" : "low",
      status: "needs_review",
      notes: matches.length > 1
        ? options.ambiguousMatchNote
        : options.unmatchedNote
    });
    await tx.instagramDerivedClaim.update({
      where: { id: claim.id },
      data: { appliedSaintId: saintId }
    });
  }
}

export async function acceptSaintInstagramClaim(tx: Tx, claimId: string, saintId: string) {
  const claim = await tx.instagramDerivedClaim.update({
    where: { id: claimId },
    data: {
      status: "matched",
      appliedSaintId: saintId
    }
  });

  await applyInstagramClaimToSaint(tx, claim, saintId, {
    replaceConflictingDates: true
  });
}

export async function pipeAcceptedInstagramClaimsToSaint(tx: Tx, instagramItemId: string, saintId: string) {
  const claims = await tx.instagramDerivedClaim.findMany({
    where: {
      instagramItemId,
      status: { in: ["matched", "published"] }
    },
    orderBy: { createdAt: "asc" }
  });

  for (const claim of claims) {
    await applyInstagramClaimToSaint(tx, claim, saintId);
  }
}

async function upsertInstagramDerivedClaim(tx: Tx, input: ClaimInput) {
  const rawValue = input.rawValue.trim();
  const normalizedValue = getNormalizedClaimValue(input.claimType, rawValue);
  const existing = await tx.instagramDerivedClaim.findFirst({
    where: {
      instagramItemId: input.instagramItemId,
      claimType: input.claimType,
      targetEntityType: input.targetEntityType ?? null,
      targetEntityId: input.targetEntityId ?? null,
      ...(input.appliedSaintId ? { appliedSaintId: input.appliedSaintId } : {}),
      OR: [
        { rawValue },
        { normalizedValue }
      ]
    }
  });

  const data = {
    rawValue,
    normalizedValue,
    sourceField: input.sourceField,
    targetEntityType: input.targetEntityType,
    targetEntityId: input.targetEntityId,
    status: input.status ?? "suggested",
    confidence: input.confidence ?? "medium",
    appliedSaintId: input.appliedSaintId,
    notes: input.notes
  };

  if (existing) {
    return tx.instagramDerivedClaim.update({
      where: { id: existing.id },
      data: existing.status === "matched" || existing.status === "published"
        ? {
            ...data,
            status: existing.status,
            appliedAt: existing.appliedAt
          }
        : data
    });
  }

  return tx.instagramDerivedClaim.create({
    data: {
      instagramItemId: input.instagramItemId,
      claimType: input.claimType,
      ...data
    }
  });
}

async function getPrimaryMatchedSaintId(tx: Tx, instagramItemId: string) {
  const link = await tx.instagramItemSaint.findFirst({
    where: {
      instagramItemId,
      matchStatus: { in: ["matched", "published"] }
    },
    orderBy: [{ isPrimary: "desc" }, { reviewedAt: "desc" }],
    select: { saintId: true }
  });

  return link?.saintId;
}

async function applyInstagramClaimToSaint(
  tx: Tx,
  claim: InstagramDerivedClaim,
  saintId: string,
  options: ApplyClaimOptions = {}
) {
  let handled = false;

  if (claim.claimType === "alias") {
    await applyAliasClaim(tx, saintId, claim.rawValue);
    handled = true;
  }

  if (claim.claimType === "birth_date") {
    handled = await applyDateClaim(tx, claim, saintId, "birth", options.replaceConflictingDates);
  }

  if (claim.claimType === "samadhi_date") {
    handled = await applyDateClaim(tx, claim, saintId, "samadhi", options.replaceConflictingDates);
  }

  if (claim.claimType === "place" && claim.targetEntityType === "Place" && claim.targetEntityId) {
    await applyPlaceClaim(tx, saintId, claim.targetEntityId, "associated", claim);
    handled = true;
  }

  if (claim.claimType === "guru" && claim.targetEntityType === "Saint" && claim.targetEntityId) {
    await applyGuruClaim(tx, saintId, claim.targetEntityId, claim);
    handled = true;
  }

  if (claim.claimType === "tradition" && claim.targetEntityType === "Tradition" && claim.targetEntityId) {
    await applyTraditionClaim(tx, saintId, claim.targetEntityId, claim);
    handled = true;
  }

  if (claim.claimType === "tradition" && !claim.targetEntityId) {
    await applyRawTraditionClaim(tx, saintId, claim);
    handled = true;
  }

  if (!handled) return;

  await tx.instagramDerivedClaim.update({
    where: { id: claim.id },
    data: {
      appliedSaintId: saintId,
      appliedAt: new Date()
    }
  });
}

async function applyAliasClaim(tx: Tx, saintId: string, rawValue: string) {
  const normalized = toSlug(rawValue);
  const saint = await tx.saint.findUnique({
    where: { id: saintId },
    select: {
      canonicalName: true,
      displayName: true,
      aliases: { select: { alias: true } }
    }
  });
  if (!saint || !normalized) return;

  const knownNames = [saint.canonicalName, saint.displayName, ...saint.aliases.map((alias) => alias.alias)];
  if (knownNames.some((name) => toSlug(name) === normalized)) return;

  await tx.saintAlias.create({
    data: {
      saintId,
      alias: rawValue,
      aliasType: "instagram_name",
      source: "Instagram first-page biodata"
    }
  });
}

async function applyDateClaim(
  tx: Tx,
  claim: InstagramDerivedClaim,
  saintId: string,
  kind: "birth" | "samadhi",
  replaceConflict = false
) {
  const claimDate = parseImportedDate(claim.rawValue);
  const saint = await tx.saint.findUnique({
    where: { id: saintId },
    select: {
      displayName: true,
      birthDateRaw: true,
      samadhiDateRaw: true
    }
  });
  if (!saint) return false;

  const currentValue = kind === "birth" ? saint.birthDateRaw : saint.samadhiDateRaw;
  const currentDate = parseImportedDate(currentValue);
  const valuesMatch = Boolean(
    currentValue?.trim()
    && (areDatePartsCompatible(currentDate, claimDate) || normalizeComparable(currentValue) === normalizeComparable(claim.rawValue))
  );
  const dateData = kind === "birth"
    ? {
        birthDateRaw: claimDate.raw,
        birthYear: claimDate.year,
        birthYearEnd: claimDate.endYear,
        birthMonth: claimDate.month,
        birthDay: claimDate.day,
        birthDatePrecision: claimDate.precision === "empty" ? undefined : claimDate.precision
      }
    : {
        samadhiDateRaw: claimDate.raw,
        samadhiYear: claimDate.year,
        samadhiYearEnd: claimDate.endYear,
        samadhiMonth: claimDate.month,
        samadhiDay: claimDate.day,
        samadhiDatePrecision: claimDate.precision === "empty" ? undefined : claimDate.precision
      };

  if (!currentValue?.trim() || (replaceConflict && !valuesMatch)) {
    await tx.saint.update({
      where: { id: saintId },
      data: dateData
    });
    if (currentValue?.trim()) {
      await resolveDateConflictIssue(tx, claim, saintId, kind, currentValue);
    }
    return true;
  }

  if (valuesMatch) return true;

  await createOpenReconciliationIssue(tx, {
    issueType: `instagram_${kind}_date_conflict`,
    severity: "medium",
    entityType: "Saint",
    entityId: saintId,
    message: `Instagram first-page biodata suggests a different ${kind} date for ${saint.displayName}.`,
    rawValue: currentValue,
    suggestedValue: JSON.stringify({
      instagramItemId: claim.instagramItemId,
      claimId: claim.id,
      sourceValue: claim.rawValue
    })
  });
  return false;
}

async function resolveDateConflictIssue(
  tx: Tx,
  claim: InstagramDerivedClaim,
  saintId: string,
  kind: "birth" | "samadhi",
  previousValue: string
) {
  await tx.reconciliationIssue.updateMany({
    where: {
      issueType: `instagram_${kind}_date_conflict`,
      entityType: "Saint",
      entityId: saintId,
      rawValue: previousValue,
      suggestedValue: JSON.stringify({
        instagramItemId: claim.instagramItemId,
        claimId: claim.id,
        sourceValue: claim.rawValue
      }),
      status: "open"
    },
    data: {
      status: "resolved",
      resolvedAt: new Date()
    }
  });
}

function areDatePartsCompatible(left: ReturnType<typeof parseImportedDate>, right: ReturnType<typeof parseImportedDate>) {
  if (left.year && right.year && left.year !== right.year) return false;
  if (left.month && right.month && left.month !== right.month) return false;
  if (left.day && right.day && left.day !== right.day) return false;

  return Boolean(left.year && right.year);
}

async function applyPlaceClaim(tx: Tx, saintId: string, placeId: string, placeType: PlaceType, claim: InstagramDerivedClaim) {
  const existing = await tx.saintPlace.findFirst({
    where: { saintId, placeId }
  });
  if (existing) return;

  await tx.saintPlace.create({
    data: {
      saintId,
      placeId,
      placeType,
      routeConfidence: claim.confidence,
      notes: `Accepted from Instagram first-page biodata: ${claim.rawValue}`
    }
  });
}

async function applyGuruClaim(tx: Tx, saintId: string, guruSaintId: string, claim: InstagramDerivedClaim) {
  if (saintId === guruSaintId) {
    await createOpenReconciliationIssue(tx, {
      issueType: "instagram_guru_self_reference",
      severity: "medium",
      entityType: "Saint",
      entityId: saintId,
      message: "Instagram first-page biodata suggested the matched saint as their own guru.",
      rawValue: claim.rawValue,
      suggestedValue: JSON.stringify({
        instagramItemId: claim.instagramItemId,
        claimId: claim.id,
        targetSaintId: guruSaintId
      })
    });
    return;
  }

  const existing = await tx.saintRelationship.findFirst({
    where: {
      fromSaintId: saintId,
      toSaintId: guruSaintId,
      relationshipType: "guru"
    },
    select: {
      id: true,
      status: true
    }
  });
  if (existing) {
    if (existing.status !== "published") {
      await tx.saintRelationship.update({
        where: { id: existing.id },
        data: { status: "published" }
      });
    }
    return;
  }

  await tx.saintRelationship.create({
    data: {
      fromSaintId: saintId,
      toSaintId: guruSaintId,
      relationshipType: "guru",
      status: "published",
      confidence: claim.confidence,
      notes: `Accepted from Instagram first-page biodata: ${claim.rawValue}`
    }
  });
}

async function applyTraditionClaim(tx: Tx, saintId: string, traditionId: string, claim: InstagramDerivedClaim) {
  const existingTradition = await tx.saintTradition.findFirst({
    where: { saintId },
    select: { id: true }
  });

  await tx.saintTradition.upsert({
    where: {
      saintId_traditionId: {
        saintId,
        traditionId
      }
    },
    create: {
      saintId,
      traditionId,
      isPrimary: !existingTradition,
      notes: `Accepted from Instagram first-page biodata: ${claim.rawValue}`
    },
    update: {
      notes: `Accepted from Instagram first-page biodata: ${claim.rawValue}`
    }
  });
}

async function applyRawTraditionClaim(tx: Tx, saintId: string, claim: InstagramDerivedClaim) {
  const name = claim.rawValue.trim();
  const rawSlug = toSlug(name);
  const traditions = await tx.tradition.findMany({
    select: { id: true, name: true, alternateNames: true }
  });
  let tradition = traditions.find((candidate) => {
    const names = [candidate.name, ...candidate.alternateNames];
    return names.some((name) => toSlug(name) === rawSlug);
  });

  if (!tradition) {
    const slug = await getUniqueTraditionSlug(tx, name);
    tradition = await tx.tradition.create({
      data: {
        name,
        slug,
        alternateNames: [],
        status: "draft"
      },
      select: { id: true, name: true, alternateNames: true }
    });
  }

  await tx.instagramDerivedClaim.update({
    where: { id: claim.id },
    data: {
      targetEntityType: "Tradition",
      targetEntityId: tradition.id
    }
  });

  await applyTraditionClaim(tx, saintId, tradition.id, claim);
  await tx.reconciliationIssue.updateMany({
    where: {
      issueType: "instagram_tradition_candidate",
      entityType: "Saint",
      entityId: saintId,
      rawValue: claim.rawValue,
      status: "open"
    },
    data: {
      status: "resolved",
      resolvedAt: new Date()
    }
  });
}

async function getUniqueTraditionSlug(tx: Tx, name: string) {
  const baseSlug = toSlug(name) || "tradition";
  let candidate = baseSlug;
  let suffix = 2;

  while (await tx.tradition.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

async function createOpenReconciliationIssue(
  tx: Tx,
  input: {
    issueType: string;
    severity: string;
    entityType: string;
    entityId: string;
    message: string;
    rawValue?: string | null;
    suggestedValue?: string | null;
  }
) {
  const existing = await tx.reconciliationIssue.findFirst({
    where: {
      issueType: input.issueType,
      entityType: input.entityType,
      entityId: input.entityId,
      rawValue: input.rawValue,
      suggestedValue: input.suggestedValue,
      status: "open"
    },
    select: { id: true }
  });
  if (existing) return;

  await tx.reconciliationIssue.create({ data: input });
}

function normalizeComparable(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function getNormalizedClaimValue(claimType: InstagramDerivedClaimType, rawValue: string) {
  if (claimType === "birth_date" || claimType === "samadhi_date") {
    const parsed = parseImportedDate(rawValue);
    if (parsed.year) {
      return [
        "date",
        parsed.year,
        parsed.month ?? "xx",
        parsed.day ?? "xx"
      ].join(":");
    }
  }

  return toSlug(rawValue);
}

function getPlaceMatchKeys(place: {
  name: string;
  alternateNames: string[];
  region: string | null;
  country: string | null;
}) {
  const names = [place.name, ...place.alternateNames];
  const contexts = [
    place.region,
    place.country,
    [place.region, place.country].filter(Boolean).join(", ")
  ].filter((value): value is string => Boolean(value));

  return new Set([
    ...names,
    ...names.flatMap((name) => contexts.map((context) => `${name}, ${context}`))
  ].map(toSlug).filter(Boolean));
}

function getStoredFirstPageMetadata(value: unknown, firstPageText: string | null) {
  const storedMetadata = getFirstPageMetadata(value);
  const parsedMetadata = parseInstagramFirstPageMetadata(firstPageText);

  return compactMetadata({
    ...parsedMetadata,
    ...storedMetadata
  });
}

function getFirstPageMetadata(value: unknown): InstagramFirstPageMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const metadata = value as Record<string, unknown>;

  return {
    displayName: getString(metadata.displayName),
    subtitle: getString(metadata.subtitle),
    born: getString(metadata.born),
    samadhi: getString(metadata.samadhi),
    keyPlace: getString(metadata.keyPlace),
    keyPlaces: getStringArray(metadata.keyPlaces),
    tradition: getString(metadata.tradition),
    guru: getString(metadata.guru),
    gurus: getStringArray(metadata.gurus)
  };
}

function getString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function getStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : undefined;
}
