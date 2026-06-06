export type SaintSummary = {
  slug: string;
  displayName: string;
  canonicalName: string;
  shortDescription: string;
  eraLabel: string;
  primaryLocation: string;
  sampradaya: string;
  featured: boolean;
  instagramUrls: string[];
};

export type SampradayaSummary = {
  slug: string;
  name: string;
  shortDescription: string;
  founder?: string;
};

export const saints: SaintSummary[] = [
  {
    slug: "sri-ramakrishna",
    displayName: "Sri Ramakrishna",
    canonicalName: "Ramakrishna Paramahamsa",
    shortDescription: "A 19th-century mystic whose life drew seekers from many paths toward direct God-realization.",
    eraLabel: "1836-1886",
    primaryLocation: "Dakshineswar, Bengal",
    sampradaya: "Ramakrishna tradition",
    featured: true,
    instagramUrls: ["https://www.instagram.com/p/example/"]
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
    instagramUrls: []
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
    instagramUrls: []
  }
];

export const sampradayas: SampradayaSummary[] = [
  {
    slug: "advaita-vedanta",
    name: "Advaita Vedanta",
    shortDescription: "A non-dual Vedantic tradition emphasizing the identity of Atman and Brahman.",
    founder: "Adi Shankaracharya"
  },
  {
    slug: "bhakti-traditions",
    name: "Bhakti Traditions",
    shortDescription: "Devotional lineages centered on love, surrender, chanting, service, and remembrance."
  },
  {
    slug: "ramakrishna-tradition",
    name: "Ramakrishna Tradition",
    shortDescription: "A modern spiritual movement shaped by Sri Ramakrishna, Holy Mother, and Swami Vivekananda.",
    founder: "Sri Ramakrishna"
  }
];

export function getFeaturedSaints() {
  return saints.filter((saint) => saint.featured);
}

export function getPublishedSaints() {
  return saints;
}

export function getSaintBySlug(slug: string) {
  return saints.find((saint) => saint.slug === slug);
}

export function getPublishedSampradayas() {
  return sampradayas;
}

export function getSampradayaBySlug(slug: string) {
  return sampradayas.find((sampradaya) => sampradaya.slug === slug);
}
