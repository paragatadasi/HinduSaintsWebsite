import type { ContentStatus, PublicationStatus, TeamVisibility } from "@/lib/generated/prisma/client";

type PublicationCompatibilityData = {
  status: ContentStatus;
  publicationStatus: PublicationStatus;
  teamVisibility?: TeamVisibility;
};

/**
 * Keeps the legacy combined status and the new publication model aligned while
 * review surfaces migrate chunk-by-chunk. Publishing always makes the record
 * available to the wider team; other transitions preserve team visibility.
 */
export function publicationCompatibilityData(status: ContentStatus): PublicationCompatibilityData {
  if (status === "published") {
    return { status, publicationStatus: "published", teamVisibility: "public" };
  }
  if (status === "archived") {
    return { status, publicationStatus: "archived" };
  }
  return { status, publicationStatus: "unpublished" };
}

export function saintPublicationCompatibilityData(status: ContentStatus): PublicationCompatibilityData {
  return publicationCompatibilityData(status);
}

export function traditionPublicationCompatibilityData(status: ContentStatus): PublicationCompatibilityData {
  return publicationCompatibilityData(status);
}
