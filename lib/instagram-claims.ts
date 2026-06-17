import type { Confidence, InstagramDerivedClaim, InstagramDerivedClaimType, MatchStatus, PlaceType, Prisma } from "@/lib/generated/prisma/client";
import { parseImportedDate } from "@/lib/import-dates";
import { compactMetadata, parseInstagramFirstPageMetadata, type InstagramFirstPageMetadata } from "@/lib/instagram-metadata";
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
}

export async function acceptSaintInstagramClaim(tx: Tx, claimId: string, saintId: string) {
  const claim = await tx.instagramDerivedClaim.update({
    where: { id: claimId },
    data: {
      status: "matched",
      appliedSaintId: saintId
    }
  });

  await applyInstagramClaimToSaint(tx, claim, saintId);
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

async function applyInstagramClaimToSaint(tx: Tx, claim: InstagramDerivedClaim, saintId: string) {
  if (claim.appliedSaintId === saintId && claim.appliedAt) return;

  let handled = false;

  if (claim.claimType === "alias") {
    await applyAliasClaim(tx, saintId, claim.rawValue);
    handled = true;
  }

  if (claim.claimType === "birth_date") {
    await applyDateClaim(tx, claim, saintId, "birth");
    handled = true;
  }

  if (claim.claimType === "samadhi_date") {
    await applyDateClaim(tx, claim, saintId, "samadhi");
    handled = true;
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

async function applyDateClaim(tx: Tx, claim: InstagramDerivedClaim, saintId: string, kind: "birth" | "samadhi") {
  const claimDate = parseImportedDate(claim.rawValue);
  const saint = await tx.saint.findUnique({
    where: { id: saintId },
    select: {
      displayName: true,
      birthDateRaw: true,
      samadhiDateRaw: true
    }
  });
  if (!saint) return;

  const currentValue = kind === "birth" ? saint.birthDateRaw : saint.samadhiDateRaw;
  if (!currentValue?.trim()) {
    await tx.saint.update({
      where: { id: saintId },
      data: kind === "birth"
        ? {
            birthDateRaw: claimDate.raw,
            birthYear: claimDate.year,
            birthMonth: claimDate.month,
            birthDay: claimDate.day,
            birthDatePrecision: claimDate.precision === "empty" ? undefined : claimDate.precision
          }
        : {
            samadhiDateRaw: claimDate.raw,
            samadhiYear: claimDate.year,
            samadhiMonth: claimDate.month,
            samadhiDay: claimDate.day,
            samadhiDatePrecision: claimDate.precision === "empty" ? undefined : claimDate.precision
          }
    });
    return;
  }

  const currentDate = parseImportedDate(currentValue);
  if (areDatePartsCompatible(currentDate, claimDate) || normalizeComparable(currentValue) === normalizeComparable(claim.rawValue)) return;

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
    }
  });
  if (existing) return;

  await tx.saintRelationship.create({
    data: {
      fromSaintId: saintId,
      toSaintId: guruSaintId,
      relationshipType: "guru",
      confidence: claim.confidence,
      notes: `Accepted from Instagram first-page biodata: ${claim.rawValue}`
    }
  });
}

async function applyTraditionClaim(tx: Tx, saintId: string, traditionId: string, claim: InstagramDerivedClaim) {
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
      notes: `Accepted from Instagram first-page biodata: ${claim.rawValue}`
    },
    update: {
      notes: `Accepted from Instagram first-page biodata: ${claim.rawValue}`
    }
  });
}

async function applyRawTraditionClaim(tx: Tx, saintId: string, claim: InstagramDerivedClaim) {
  const rawSlug = toSlug(claim.rawValue);
  const traditions = await tx.tradition.findMany({
    select: { id: true, name: true, alternateNames: true }
  });
  const tradition = traditions.find((candidate) => {
    const names = [candidate.name, ...candidate.alternateNames];
    return names.some((name) => toSlug(name) === rawSlug);
  });

  if (tradition) {
    await applyTraditionClaim(tx, saintId, tradition.id, claim);
    return;
  }

  await createOpenReconciliationIssue(tx, {
    issueType: "instagram_tradition_candidate",
    severity: "low",
    entityType: "Saint",
    entityId: saintId,
    message: "Instagram first-page biodata suggests a tradition that needs matching to a CMS tradition.",
    rawValue: claim.rawValue,
    suggestedValue: JSON.stringify({
      instagramItemId: claim.instagramItemId,
      claimId: claim.id,
      sourceValue: claim.rawValue
    })
  });
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
