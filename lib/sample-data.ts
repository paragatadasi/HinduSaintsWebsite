import {
  isPublishedSaint,
  isPublishedSampradaya,
  type PublicSaintSummary,
  type PublicSampradayaSummary,
  type SaintRecord,
  type SampradayaRecord
} from "@/lib/public-contracts";

export type SaintSummary = PublicSaintSummary;
export type SampradayaSummary = PublicSampradayaSummary;

export const saints: SaintRecord[] = [
  {
    slug: "sri-ramakrishna",
    displayName: "Sri Ramakrishna",
    canonicalName: "Ramakrishna Paramahamsa",
    shortDescription: "A 19th-century mystic whose life drew seekers from many paths toward direct God-realization.",
    eraLabel: "1836-1886",
    primaryLocation: "Dakshineswar, Bengal",
    sampradaya: "Ramakrishna tradition",
    featured: true,
    instagramUrls: ["https://www.instagram.com/p/example/"],
    status: "published"
  },
  {
    slug: "sri-anandamayi-ma",
    displayName: "Sri Anandamayi Ma",
    canonicalName: "Anandamayi Ma",
    shortDescription: "A revered saint known for spontaneous wisdom, devotion, and a life of luminous presence.",
    eraLabel: "1896-1982",
    primaryLocation: "Bengal, Varanasi, Haridwar",
    sampradaya: "Non-sectarian",
    featured: true,
    instagramUrls: [],
    status: "published"
  },
  {
    slug: "sri-ramana-maharshi",
    displayName: "Sri Ramana Maharshi",
    canonicalName: "Ramana Maharshi",
    shortDescription: "A sage of Arunachala whose teaching centered on self-inquiry and abiding in the Self.",
    eraLabel: "1879-1950",
    primaryLocation: "Tiruvannamalai, Tamil Nadu",
    sampradaya: "Advaita Vedanta",
    featured: true,
    instagramUrls: [],
    status: "published"
  }
];

export const sampradayas: SampradayaRecord[] = [
  {
    slug: "advaita-vedanta",
    name: "Advaita Vedanta",
    shortDescription: "A non-dual Vedantic tradition emphasizing the identity of Atman and Brahman.",
    founder: "Adi Shankaracharya",
    status: "published"
  },
  {
    slug: "bhakti-traditions",
    name: "Bhakti Traditions",
    shortDescription: "Devotional lineages centered on love, surrender, chanting, service, and remembrance.",
    status: "published"
  },
  {
    slug: "ramakrishna-tradition",
    name: "Ramakrishna Tradition",
    shortDescription: "A modern spiritual movement shaped by Sri Ramakrishna, Holy Mother, and Swami Vivekananda.",
    founder: "Sri Ramakrishna",
    status: "published"
  }
];

export function getFeaturedSaints() {
  return getPublishedSaints().filter((saint) => saint.featured);
}

export function getPublishedSaints() {
  return saints.filter(isPublishedSaint);
}

export function getSaintBySlug(slug: string) {
  return getPublishedSaints().find((saint) => saint.slug === slug);
}

export function getPublishedSampradayas() {
  return sampradayas.filter(isPublishedSampradaya);
}

export function getSampradayaBySlug(slug: string) {
  return getPublishedSampradayas().find((sampradaya) => sampradaya.slug === slug);
}
