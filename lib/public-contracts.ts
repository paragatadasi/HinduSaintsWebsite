export type ContentStatus = "draft" | "review" | "published" | "archived";

export type PublicSaintSummary = {
  slug: string;
  displayName: string;
  canonicalName: string;
  shortDescription: string;
  eraLabel: string;
  primaryLocation: string;
  sampradaya: string;
  featured: boolean;
  instagramUrls: string[];
  status: "published";
};

export type SaintRecord = Omit<PublicSaintSummary, "status"> & {
  status: ContentStatus;
};

export type PublicSampradayaSummary = {
  slug: string;
  name: string;
  shortDescription: string;
  founder?: string;
  status: "published";
};

export type SampradayaRecord = Omit<PublicSampradayaSummary, "status"> & {
  status: ContentStatus;
};

export function isPublishedSaint(saint: SaintRecord): saint is PublicSaintSummary {
  return saint.status === "published";
}

export function isPublishedSampradaya(
  sampradaya: SampradayaRecord
): sampradaya is PublicSampradayaSummary {
  return sampradaya.status === "published";
}
