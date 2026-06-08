export type ContentStatus = "draft" | "review" | "published" | "archived";

export type PublicImage = {
  url: string;
  alt: string;
  caption?: string;
  credit?: string;
  sourceUrl?: string;
  width?: number;
  height?: number;
  focalPoint?: {
    x: number;
    y: number;
  };
};

export type PublicSourceSummary = {
  title: string;
  sourceType: "book" | "article" | "website" | "scripture" | "oral_tradition" | "other";
  author?: string;
  publisher?: string;
  publicationYear?: string;
  url?: string;
  note?: string;
};

export type PublicFurtherReadingItem = PublicSourceSummary & {
  label?: string;
};

export type PublicBiographySection = {
  title: string;
  summary?: string;
  bodyMarkdown: string;
  sources?: PublicSourceSummary[];
};

export type PublicTraditionLink = {
  slug: string;
  name: string;
  shortDescription?: string;
};

export type PublicSaintSummary = {
  slug: string;
  displayName: string;
  canonicalName: string;
  shortDescription: string;
  eraLabel: string;
  primaryLocation: string;
  tradition: string;
  featured: boolean;
  instagramUrls: string[];
  status: "published";
};

export type PublicSaintDetail = PublicSaintSummary & {
  heroImage?: PublicImage;
  gallery?: PublicImage[];
  aliases: string[];
  traditions: PublicTraditionLink[];
  facts: Array<{
    label: string;
    value: string;
  }>;
  places: string[];
  biography?: PublicBiographySection;
  sources: PublicSourceSummary[];
  furtherReading: PublicFurtherReadingItem[];
  seo?: {
    title?: string;
    description?: string;
  };
};

export type SaintRecord = Omit<PublicSaintDetail, "status"> & {
  status: ContentStatus;
};

export type PublicTraditionSummary = {
  slug: string;
  name: string;
  shortDescription: string;
  founder?: string;
  status: "published";
};

export type PublicPlaceSummary = {
  slug: string;
  name: string;
  shortDescription: string;
  saintCount: number;
  status: "published";
};

export type PublicPlaceDetail = PublicPlaceSummary & {
  saints: PublicSaintSummary[];
  traditions: string[];
  eras: string[];
};

export type PublicPlaceMapSaint = {
  slug: string;
  displayName: string;
  eraLabel: string;
  birthYear?: number;
  samadhiYear?: number;
  tradition: string;
  placeType: "primary" | "birth" | "samadhi" | "sadhana" | "associated" | "other";
  routeOrder?: number;
  routeLabel?: string;
  routeConfidence?: "low" | "medium" | "high";
  image?: PublicImage;
};

export type PublicPlaceMapPoint = {
  slug: string;
  name: string;
  region?: string;
  country?: string;
  placeScope: "state" | "place";
  stateSlug?: string;
  latitude: number;
  longitude: number;
  saintCount: number;
  saints: PublicPlaceMapSaint[];
};

export type PublicPlaceMapData = {
  points: PublicPlaceMapPoint[];
  yearRange?: {
    min: number;
    max: number;
  };
};

export type PublicTraditionDetail = PublicTraditionSummary & {
  alternateNames?: string[];
  introductionMarkdown?: string;
  heroImage?: PublicImage;
  saints: PublicSaintSummary[];
  sources?: PublicSourceSummary[];
  furtherReading?: PublicFurtherReadingItem[];
  seo?: {
    title?: string;
    description?: string;
  };
};

export type TraditionRecord = Omit<PublicTraditionDetail, "status"> & {
  status: ContentStatus;
};

export function isPublishedSaint(saint: SaintRecord): saint is PublicSaintDetail {
  return saint.status === "published";
}

export function isPublishedTradition(
  tradition: TraditionRecord
): tradition is PublicTraditionDetail {
  return tradition.status === "published";
}
