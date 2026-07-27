import assert from "node:assert/strict";
import test from "node:test";
import type { InstagramDerivedClaim, Prisma } from "./generated/prisma/client";
import { acceptInstagramDerivedClaim } from "./instagram-claims";

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
