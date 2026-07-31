import assert from "node:assert/strict";
import test from "node:test";
import type { InstagramDerivedClaim, Prisma } from "./generated/prisma/client";
import { acceptInstagramDerivedClaim, acceptSaintInstagramClaim, createDirectInstagramClaimsForSaint } from "./instagram-claims";

const now = new Date("2026-07-27T12:00:00.000Z");

function makeClaim(overrides: Partial<InstagramDerivedClaim>): InstagramDerivedClaim {
  return {
    id: "claim-1",
    instagramItemId: "instagram-item-1",
    claimType: "place",
    rawValue: "Rishikesh",
    normalizedValue: "rishikesh",
    sourceField: "keyPlace",
    targetEntityType: "Place",
    targetEntityId: "place-1",
    confidence: "high",
    status: "matched",
    appliedSaintId: null,
    appliedAt: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

test("accepting a place suggestion attaches the place to the matched saint", async () => {
  const createdPlaceLinks: unknown[] = [];
  const claim = makeClaim({});
  const tx = {
    instagramDerivedClaim: {
      findFirst: async () => null,
      create: async () => claim,
      update: async () => claim
    },
    instagramItemSaint: {
      findFirst: async () => ({ saintId: "saint-1" })
    },
    saintPlace: {
      findFirst: async () => null,
      create: async ({ data }: { data: unknown }) => {
        createdPlaceLinks.push(data);
        return data;
      }
    }
  } as unknown as Prisma.TransactionClient;

  await acceptInstagramDerivedClaim(tx, {
    instagramItemId: "instagram-item-1",
    claimType: "place",
    rawValue: "Rishikesh",
    sourceField: "keyPlace",
    targetEntityType: "Place",
    targetEntityId: "place-1",
    confidence: "high"
  });

  assert.deepEqual(createdPlaceLinks, [{
    saintId: "saint-1",
    placeId: "place-1",
    placeType: "associated",
    routeConfidence: "high",
    notes: "Accepted from Instagram first-page biodata: Rishikesh"
  }]);
});

test("approving an existing key-place candidate on Instagram attaches it to the saint", async () => {
  const createdPlaceLinks: unknown[] = [];
  const claimUpdates: unknown[] = [];
  const pendingClaim = makeClaim({
    status: "needs_review",
    appliedSaintId: "saint-1"
  });
  const matchedClaim = makeClaim({
    status: "matched",
    appliedSaintId: null
  });
  const tx = {
    instagramDerivedClaim: {
      findFirst: async () => pendingClaim,
      update: async (input: unknown) => {
        claimUpdates.push(input);
        return matchedClaim;
      }
    },
    instagramItemSaint: {
      findFirst: async () => ({ saintId: "saint-1" })
    },
    saintPlace: {
      findFirst: async () => null,
      create: async ({ data }: { data: unknown }) => {
        createdPlaceLinks.push(data);
        return data;
      }
    }
  } as unknown as Prisma.TransactionClient;

  await acceptInstagramDerivedClaim(tx, {
    instagramItemId: "instagram-item-1",
    claimType: "place",
    rawValue: "Rishikesh",
    sourceField: "keyPlace",
    targetEntityType: "Place",
    targetEntityId: "place-1",
    confidence: "high"
  });

  assert.deepEqual(claimUpdates[0], {
    where: { id: "claim-1" },
    data: {
      rawValue: "Rishikesh",
      normalizedValue: "rishikesh",
      sourceField: "keyPlace",
      targetEntityType: "Place",
      targetEntityId: "place-1",
      status: "matched",
      confidence: "high",
      appliedSaintId: undefined,
      notes: undefined
    }
  });
  assert.deepEqual(createdPlaceLinks, [{
    saintId: "saint-1",
    placeId: "place-1",
    placeType: "associated",
    routeConfidence: "high",
    notes: "Accepted from Instagram first-page biodata: Rishikesh"
  }]);
  assert.equal(claimUpdates.some((input) => (
    (input as { data?: { appliedSaintId?: string; appliedAt?: Date } }).data?.appliedSaintId === "saint-1"
    && (input as { data?: { appliedAt?: Date } }).data?.appliedAt instanceof Date
  )), true);
});

test("accepting a guru suggestion creates an approved guru connection", async () => {
  const createdRelationships: unknown[] = [];
  const claim = makeClaim({
    claimType: "guru",
    rawValue: "Swami Sivananda",
    normalizedValue: "swami-sivananda",
    targetEntityType: "Saint",
    targetEntityId: "guru-1"
  });
  const tx = {
    instagramDerivedClaim: {
      findFirst: async () => null,
      create: async () => claim,
      update: async () => claim
    },
    instagramItemSaint: {
      findFirst: async () => ({ saintId: "saint-1" })
    },
    saintRelationship: {
      findFirst: async () => null,
      create: async ({ data }: { data: unknown }) => {
        createdRelationships.push(data);
        return data;
      }
    }
  } as unknown as Prisma.TransactionClient;

  await acceptInstagramDerivedClaim(tx, {
    instagramItemId: "instagram-item-1",
    claimType: "guru",
    rawValue: "Swami Sivananda",
    sourceField: "guru",
    targetEntityType: "Saint",
    targetEntityId: "guru-1",
    confidence: "high"
  });

  assert.deepEqual(createdRelationships, [{
    fromSaintId: "saint-1",
    toSaintId: "guru-1",
    relationshipType: "guru",
    status: "published",
    confidence: "high",
    notes: "Accepted from Instagram first-page biodata: Swami Sivananda"
  }]);
});

test("accepting a guru suggestion approves an existing candidate connection", async () => {
  const relationshipUpdates: unknown[] = [];
  const claim = makeClaim({
    claimType: "guru",
    rawValue: "Swami Sivananda",
    normalizedValue: "swami-sivananda",
    targetEntityType: "Saint",
    targetEntityId: "guru-1"
  });
  const tx = {
    instagramDerivedClaim: {
      findFirst: async () => null,
      create: async () => claim,
      update: async () => claim
    },
    instagramItemSaint: {
      findFirst: async () => ({ saintId: "saint-1" })
    },
    saintRelationship: {
      findFirst: async () => ({ id: "relationship-1", status: "needs_review" }),
      update: async (input: unknown) => {
        relationshipUpdates.push(input);
        return input;
      },
      create: async () => {
        throw new Error("An existing guru connection must not be duplicated.");
      }
    }
  } as unknown as Prisma.TransactionClient;

  await acceptInstagramDerivedClaim(tx, {
    instagramItemId: "instagram-item-1",
    claimType: "guru",
    rawValue: "Swami Sivananda",
    sourceField: "guru",
    targetEntityType: "Saint",
    targetEntityId: "guru-1",
    confidence: "high"
  });

  assert.deepEqual(relationshipUpdates, [{
    where: { id: "relationship-1" },
    data: { status: "published" }
  }]);
});

test("accepting an unmatched tradition candidate creates a draft tradition and attaches it", async () => {
  const claim = makeClaim({
    claimType: "tradition",
    rawValue: "Varkari",
    normalizedValue: "varkari",
    targetEntityType: null,
    targetEntityId: null,
    status: "matched",
    appliedSaintId: "saint-1",
    appliedAt: now
  });
  const createdTraditions: unknown[] = [];
  const claimUpdates: unknown[] = [];
  const traditionLinks: unknown[] = [];
  const resolvedIssues: unknown[] = [];
  const tx = {
    instagramDerivedClaim: {
      update: async (input: { data: unknown }) => {
        claimUpdates.push(input);
        return claim;
      }
    },
    tradition: {
      findMany: async () => [],
      findUnique: async () => null,
      create: async ({ data }: { data: unknown }) => {
        createdTraditions.push(data);
        return {
          id: "tradition-1",
          name: "Varkari",
          alternateNames: []
        };
      }
    },
    saintTradition: {
      findFirst: async () => null,
      upsert: async (input: unknown) => {
        traditionLinks.push(input);
        return input;
      }
    },
    reconciliationIssue: {
      updateMany: async (input: unknown) => {
        resolvedIssues.push(input);
        return { count: 1 };
      }
    }
  } as unknown as Prisma.TransactionClient;

  await acceptSaintInstagramClaim(tx, claim.id, "saint-1");

  assert.deepEqual(createdTraditions, [{
    name: "Varkari",
    slug: "varkari",
    alternateNames: [],
    status: "draft"
  }]);
  assert.deepEqual(traditionLinks, [{
    where: {
      saintId_traditionId: {
        saintId: "saint-1",
        traditionId: "tradition-1"
      }
    },
    create: {
      saintId: "saint-1",
      traditionId: "tradition-1",
      isPrimary: true,
      notes: "Accepted from Instagram first-page biodata: Varkari"
    },
    update: {
      notes: "Accepted from Instagram first-page biodata: Varkari"
    }
  }]);
  assert.equal(claimUpdates.some((input) => (
    (input as { data?: { targetEntityId?: string } }).data?.targetEntityId === "tradition-1"
  )), true);
  assert.equal(claimUpdates.some((input) => (
    (input as { data?: { appliedAt?: Date } }).data?.appliedAt instanceof Date
  )), true);
  assert.equal(resolvedIssues.length, 1);
});

test("accepting a conflicting date on the saint review replaces the current date", async () => {
  const claim = makeClaim({
    claimType: "samadhi_date",
    rawValue: "1700",
    normalizedValue: "1700",
    targetEntityType: null,
    targetEntityId: null,
    status: "matched",
    appliedSaintId: "saint-1",
    appliedAt: now
  });
  const saintUpdates: unknown[] = [];
  const claimUpdates: unknown[] = [];
  const resolvedIssues: unknown[] = [];
  const tx = {
    instagramDerivedClaim: {
      update: async (input: unknown) => {
        claimUpdates.push(input);
        return claim;
      }
    },
    saint: {
      findUnique: async () => ({
        displayName: "Sant Tukaram",
        birthDateRaw: null,
        samadhiDateRaw: "1678"
      }),
      update: async (input: unknown) => {
        saintUpdates.push(input);
        return input;
      }
    },
    reconciliationIssue: {
      updateMany: async (input: unknown) => {
        resolvedIssues.push(input);
        return { count: 1 };
      }
    }
  } as unknown as Prisma.TransactionClient;

  await acceptSaintInstagramClaim(tx, claim.id, "saint-1");

  assert.deepEqual(saintUpdates, [{
    where: { id: "saint-1" },
    data: {
      samadhiDateRaw: "1700",
      samadhiYear: 1700,
      samadhiYearEnd: undefined,
      samadhiMonth: undefined,
      samadhiDay: undefined,
      samadhiDatePrecision: "year"
    }
  }]);
  assert.equal(claimUpdates.some((input) => (
    (input as { data?: { appliedAt?: Date } }).data?.appliedAt instanceof Date
  )), true);
  assert.equal(resolvedIssues.length, 1);
  assert.deepEqual(
    (resolvedIssues[0] as { where: { rawValue: string; status: string }; data: { status: string } }),
    {
      where: {
        issueType: "instagram_samadhi_date_conflict",
        entityType: "Saint",
        entityId: "saint-1",
        rawValue: "1678",
        suggestedValue: JSON.stringify({
          instagramItemId: "instagram-item-1",
          claimId: "claim-1",
          sourceValue: "1700"
        }),
        status: "open"
      },
      data: {
        status: "resolved",
        resolvedAt: (resolvedIssues[0] as { data: { resolvedAt: Date } }).data.resolvedAt
      }
    }
  );
});

test("creating direct claims for a matched saint includes key-place candidates", async () => {
  const createdClaims: Array<Record<string, unknown>> = [];
  const claimUpdates: unknown[] = [];
  const tx = {
    instagramItem: {
      findUnique: async () => ({
        firstPageText: null,
        firstPageMetadata: {
          displayName: "Sri Rajyalakshmi Devi",
          keyPlace: "Mysuru"
        }
      })
    },
    place: {
      findMany: async () => [{
        id: "place-1",
        name: "Mysuru",
        alternateNames: ["Mysore"],
        region: "Karnataka",
        country: "India"
      }]
    },
    instagramDerivedClaim: {
      findFirst: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        createdClaims.push(data);
        return makeClaim({
          id: `claim-${createdClaims.length}`,
          claimType: data.claimType as InstagramDerivedClaim["claimType"],
          rawValue: data.rawValue as string,
          normalizedValue: data.normalizedValue as string,
          sourceField: data.sourceField as string,
          targetEntityType: (data.targetEntityType as string | undefined) ?? null,
          targetEntityId: (data.targetEntityId as string | undefined) ?? null,
          confidence: data.confidence as InstagramDerivedClaim["confidence"],
          status: data.status as InstagramDerivedClaim["status"],
          notes: (data.notes as string | undefined) ?? null
        });
      },
      update: async (input: unknown) => {
        claimUpdates.push(input);
        return input;
      }
    }
  } as unknown as Prisma.TransactionClient;

  await createDirectInstagramClaimsForSaint(tx, "instagram-item-1", "saint-1");

  const placeClaim = createdClaims.find((claim) => claim.claimType === "place");
  assert.deepEqual(placeClaim, {
    instagramItemId: "instagram-item-1",
    claimType: "place",
    rawValue: "Mysuru",
    normalizedValue: "mysuru",
    sourceField: "keyPlace",
    targetEntityType: "Place",
    targetEntityId: "place-1",
    status: "needs_review",
    confidence: "high",
    appliedSaintId: undefined,
    notes: "Matched CMS location candidate from matched Instagram first-page biodata."
  });
  assert.equal(claimUpdates.some((input) => (
    (input as { where?: { id?: string }; data?: { appliedSaintId?: string } }).where?.id === "claim-2"
    && (input as { data?: { appliedSaintId?: string } }).data?.appliedSaintId === "saint-1"
  )), true);
});
