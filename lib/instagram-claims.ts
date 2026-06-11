import type { Confidence, InstagramDerivedClaim, InstagramDerivedClaimType, MatchStatus, PlaceType, Prisma } from "@prisma/client";
import { parseImportedDate } from "@/lib/import-dates";
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
  const normalizedValue = toSlug(rawValue);
  const existing = await tx.instagramDerivedClaim.findFirst({
    where: {
      instagramItemId: input.instagramItemId,
      claimType: input.claimType,
      rawValue,
      targetEntityType: input.targetEntityType ?? null,
      targetEntityId: input.targetEntityId ?? null
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
    notes: input.notes
  };

  if (existing) {
    return tx.instagramDerivedClaim.update({
      where: { id: existing.id },
      data
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
  if (claim.appliedSaintId === saintId) return;

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
    const parsed = parseImportedDate(claim.rawValue);
    await tx.saint.update({
      where: { id: saintId },
      data: kind === "birth"
        ? {
            birthDateRaw: parsed.raw,
            birthYear: parsed.year,
            birthMonth: parsed.month,
            birthDay: parsed.day,
            birthDatePrecision: parsed.precision === "empty" ? undefined : parsed.precision
          }
        : {
            samadhiDateRaw: parsed.raw,
            samadhiYear: parsed.year,
            samadhiMonth: parsed.month,
            samadhiDay: parsed.day,
            samadhiDatePrecision: parsed.precision === "empty" ? undefined : parsed.precision
          }
    });
    return;
  }

  if (normalizeComparable(currentValue) === normalizeComparable(claim.rawValue)) return;

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

async function applyPlaceClaim(tx: Tx, saintId: string, placeId: string, placeType: PlaceType, claim: InstagramDerivedClaim) {
  const existing = await tx.saintPlace.findFirst({
    where: { saintId, placeId, placeType }
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
