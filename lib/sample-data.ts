import {
  isPublishedSaint,
  isPublishedTradition,
  type PublicImage,
  type PublicSourceSummary,
  type PublicSaintSummary,
  type PublicTraditionSummary,
  type SaintRecord,
  type TraditionRecord
} from "@/lib/public-contracts";

export type SaintSummary = PublicSaintSummary;
export type TraditionSummary = PublicTraditionSummary;

const portraitPlaceholder: PublicImage = {
  url: "/images/devotional-archive-placeholder.svg",
  alt: "Decorative devotional archive illustration used until a reviewed portrait is available.",
  caption: "Launch placeholder shown while editors review public portrait assets.",
  credit: "Hindu Saints Archive"
};

const ramakrishnaGospel: PublicSourceSummary = {
  title: "The Gospel of Sri Ramakrishna",
  author: "Mahendranath Gupta",
  publisher: "Ramakrishna-Vivekananda Center",
  publicationYear: "1942",
  sourceType: "book",
  note: "A widely used English rendering of conversations and reminiscences recorded by M."
};

const ramanaCollectedWorks: PublicSourceSummary = {
  title: "The Collected Works of Ramana Maharshi",
  publisher: "Sri Ramanasramam",
  sourceType: "book",
  note: "Primary teachings, verses, and short prose works associated with Ramana Maharshi."
};

export const saints: SaintRecord[] = [
  {
    slug: "sri-ramakrishna",
    displayName: "Sri Ramakrishna",
    canonicalName: "Ramakrishna Paramahamsa",
    shortDescription: "A 19th-century mystic whose life drew seekers from many paths toward direct God-realization.",
    eraLabel: "1836-1886",
    primaryLocation: "Dakshineswar, Bengal",
    tradition: "Ramakrishna tradition",
    featured: true,
    instagramUrls: ["https://www.instagram.com/p/example/"],
    instagramItems: [
      {
        url: "https://www.instagram.com/p/example/",
        type: "post",
        caption: "Fixture Instagram post for the public saint detail layout.",
        postedAt: "2026-01-01T00:00:00.000Z"
      }
    ],
    heroImage: {
      ...portraitPlaceholder,
      alt: "Archival-style portrait placeholder for Sri Ramakrishna.",
      caption: "Reviewed portrait pending; this public placeholder preserves the page layout.",
      focalPoint: { x: 50, y: 42 }
    },
    gallery: [
      {
        ...portraitPlaceholder,
        alt: "Devotional archive image placeholder for Dakshineswar context.",
        caption: "Context image slot for reviewed Dakshineswar or temple imagery."
      }
    ],
    aliases: ["Ramakrishna Paramahamsa", "Gadadhar Chattopadhyay", "Thakur"],
    traditions: [
      {
        slug: "ramakrishna-tradition",
        name: "Ramakrishna Tradition",
        shortDescription: "A modern spiritual movement shaped by Sri Ramakrishna, Holy Mother, and Swami Vivekananda."
      },
      {
        slug: "bhakti-traditions",
        name: "Bhakti Traditions"
      }
    ],
    facts: [
      { label: "Era", value: "1836-1886" },
      { label: "Primary place", value: "Dakshineswar, Bengal" },
      { label: "Birth name", value: "Gadadhar Chattopadhyay" },
      { label: "Public profile status", value: "Published launch profile" }
    ],
    places: ["Kamarpukur", "Dakshineswar", "Kolkata"],
    biography: {
      title: "Life and teaching",
      summary:
        "Sri Ramakrishna is remembered for intense spiritual practice, ecstatic devotion, and a teaching life that welcomed seekers from multiple paths.",
      bodyMarkdown:
        "Born in Kamarpukur in 1836, Sri Ramakrishna became closely associated with the Kali temple at Dakshineswar, where his devotional life and spiritual disciplines drew a growing circle of devotees.\n\nHis public memory rests on a striking combination of simplicity, direct spiritual experience, and reverence for many approaches to God. Later disciples, including Swami Vivekananda, helped carry his message into a modern global setting.",
      sources: [ramakrishnaGospel]
    },
    sources: [ramakrishnaGospel],
    furtherReading: [
      {
        title: "Sri Ramakrishna and His Divine Play",
        author: "Swami Chetanananda",
        sourceType: "book",
        label: "Modern biography"
      }
    ],
    status: "published"
  },
  {
    slug: "sri-anandamayi-ma",
    displayName: "Sri Anandamayi Ma",
    canonicalName: "Anandamayi Ma",
    shortDescription: "A revered saint known for spontaneous wisdom, devotion, and a life of luminous presence.",
    eraLabel: "1896-1982",
    primaryLocation: "Bengal, Varanasi, Haridwar",
    tradition: "Non-sectarian",
    featured: true,
    instagramUrls: [],
    instagramItems: [],
    heroImage: {
      ...portraitPlaceholder,
      alt: "Archival-style portrait placeholder for Sri Anandamayi Ma.",
      caption: "Reviewed portrait pending; fixture includes credit and caption fields."
    },
    aliases: ["Anandamayi Ma", "Nirmala Sundari Devi", "Ma"],
    traditions: [
      {
        slug: "bhakti-traditions",
        name: "Bhakti Traditions",
        shortDescription: "Devotional lineages centered on love, surrender, chanting, service, and remembrance."
      }
    ],
    facts: [
      { label: "Era", value: "1896-1982" },
      { label: "Primary places", value: "Bengal, Varanasi, Haridwar" },
      { label: "Birth name", value: "Nirmala Sundari Devi" }
    ],
    places: ["Kheora", "Varanasi", "Haridwar"],
    biography: {
      title: "A life of spontaneous presence",
      summary:
        "Sri Anandamayi Ma was revered across regions and communities for devotional presence, concise teaching, and a life that resisted narrow categorization.",
      bodyMarkdown:
        "Sri Anandamayi Ma was born Nirmala Sundari Devi in 1896. Devotees later described her life as one of spontaneous spiritual absorption, compassion, and direct guidance.\n\nHer public profile intentionally keeps tradition context broad while editors continue adding reviewed sources and detailed chronology."
    },
    sources: [
      {
        title: "Anandamayi Ma: An Introduction",
        sourceType: "website",
        publisher: "Anandamayi Ma Ashram",
        note: "Public-facing source summary fixture awaiting canonical source matching."
      }
    ],
    furtherReading: [],
    status: "published"
  },
  {
    slug: "sri-ramana-maharshi",
    displayName: "Sri Ramana Maharshi",
    canonicalName: "Ramana Maharshi",
    shortDescription: "A sage of Arunachala whose teaching centered on self-inquiry and abiding in the Self.",
    eraLabel: "1879-1950",
    primaryLocation: "Tiruvannamalai, Tamil Nadu",
    tradition: "Advaita Vedanta",
    featured: true,
    instagramUrls: [],
    instagramItems: [],
    heroImage: {
      ...portraitPlaceholder,
      alt: "Archival-style portrait placeholder for Sri Ramana Maharshi.",
      caption: "Portrait slot for a reviewed Sri Ramanasramam-approved image.",
      focalPoint: { x: 50, y: 38 }
    },
    aliases: ["Ramana Maharshi", "Bhagavan Sri Ramana", "Venkataraman Iyer"],
    traditions: [
      {
        slug: "advaita-vedanta",
        name: "Advaita Vedanta",
        shortDescription: "A non-dual Vedantic tradition emphasizing the identity of Atman and Brahman."
      }
    ],
    facts: [
      { label: "Era", value: "1879-1950" },
      { label: "Primary place", value: "Tiruvannamalai, Tamil Nadu" },
      { label: "Associated mountain", value: "Arunachala" },
      { label: "Central teaching", value: "Self-inquiry" }
    ],
    places: ["Tiruchuzhi", "Madurai", "Tiruvannamalai"],
    biography: {
      title: "Arunachala and self-inquiry",
      summary:
        "Sri Ramana Maharshi's public teaching centered on self-inquiry and direct recognition of the Self.",
      bodyMarkdown:
        "After a profound death experience as a teenager, Ramana Maharshi left home for Arunachala and remained in Tiruvannamalai for the rest of his life.\n\nHis teaching is often summarized through the question **\"Who am I?\"** The page fixture keeps the biography concise while supporting longer Markdown, source attachments, and public-safe image sections.",
      sources: [ramanaCollectedWorks]
    },
    sources: [ramanaCollectedWorks],
    furtherReading: [
      {
        title: "Talks with Sri Ramana Maharshi",
        publisher: "Sri Ramanasramam",
        sourceType: "book",
        label: "Recorded conversations"
      }
    ],
    status: "published"
  },
  {
    slug: "sri-chaitanya-mahaprabhu",
    displayName: "Sri Chaitanya Mahaprabhu",
    canonicalName: "Chaitanya Mahaprabhu",
    shortDescription: "A Vaishnava saint whose ecstatic devotion helped spread nama-sankirtana and love of Krishna.",
    eraLabel: "1486-1534",
    primaryLocation: "Nabadwip and Puri",
    tradition: "Gaudiya Vaishnavism",
    featured: false,
    instagramUrls: [],
    instagramItems: [],
    aliases: ["Chaitanya Mahaprabhu", "Gauranga", "Nimai"],
    traditions: [
      {
        slug: "gaudiya-vaishnavism",
        name: "Gaudiya Vaishnavism",
        shortDescription: "A Krishna-centered Vaishnava tradition emphasizing bhakti, kirtan, and devotion to Radha-Krishna."
      },
      {
        slug: "bhakti-traditions",
        name: "Bhakti Traditions"
      }
    ],
    facts: [
      { label: "Era", value: "1486-1534" },
      { label: "Primary places", value: "Nabadwip and Puri" },
      { label: "Devotional focus", value: "Radha-Krishna bhakti" }
    ],
    places: ["Nabadwip", "Puri", "Vrindavan"],
    biography: {
      title: "Ecstatic devotion and kirtan",
      summary:
        "Sri Chaitanya Mahaprabhu is remembered for ecstatic devotion to Krishna and the spread of congregational chanting.",
      bodyMarkdown:
        "Sri Chaitanya Mahaprabhu's life is central to Gaudiya Vaishnava memory. Public tradition accounts emphasize nama-sankirtana, devotion to Radha-Krishna, and a theology of divine love.\n\nEditors can later attach lineage sources and longer reviewed biography sections without changing this page template."
    },
    sources: [
      {
        title: "Chaitanya Charitamrita",
        author: "Krishnadasa Kaviraja",
        sourceType: "book",
        note: "Traditional hagiographical source used here as a public source summary fixture."
      }
    ],
    furtherReading: [],
    status: "published"
  },
  {
    slug: "sant-tukaram",
    displayName: "Sant Tukaram",
    canonicalName: "Tukaram Maharaj",
    shortDescription: "A Marathi bhakti poet-saint remembered for abhangas of devotion, humility, and surrender to Vithoba.",
    eraLabel: "c. 1608-1649",
    primaryLocation: "Dehu, Maharashtra",
    tradition: "Varkari Sampradaya",
    featured: false,
    instagramUrls: [],
    instagramItems: [],
    heroImage: {
      ...portraitPlaceholder,
      alt: "Devotional placeholder for Sant Tukaram.",
      caption: "Fixture image for a saint with poetry and pilgrimage context."
    },
    aliases: ["Tukaram Maharaj", "Tuka", "Sant Tukoba"],
    traditions: [
      {
        slug: "varkari-sampradaya",
        name: "Varkari Sampradaya",
        shortDescription: "A Maharashtrian bhakti tradition centered on Vithoba, pilgrimage, abhangas, and devotional remembrance."
      },
      {
        slug: "bhakti-traditions",
        name: "Bhakti Traditions"
      }
    ],
    facts: [
      { label: "Era", value: "c. 1608-1649" },
      { label: "Primary place", value: "Dehu, Maharashtra" },
      { label: "Literary form", value: "Abhanga" }
    ],
    places: ["Dehu", "Pandharpur"],
    biography: {
      title: "Abhangas of devotion",
      bodyMarkdown:
        "Sant Tukaram is celebrated for Marathi abhangas that speak with directness, humility, and intimate devotion to Vithoba.\n\nThis fixture includes a biography body without a separate summary so the frontend can handle that missing-data case gracefully."
    },
    sources: [],
    furtherReading: [
      {
        title: "Tukaram: The Poet of Maharashtra",
        sourceType: "book",
        label: "Further reading fixture"
      }
    ],
    status: "published"
  },
  {
    slug: "basavanna",
    displayName: "Basavanna",
    canonicalName: "Basava",
    shortDescription: "A philosopher, poet, and social reformer whose vachanas shaped the devotional Lingayat tradition.",
    eraLabel: "c. 1131-1167",
    primaryLocation: "Karnataka",
    tradition: "Lingayat Tradition",
    featured: false,
    instagramUrls: [],
    instagramItems: [],
    aliases: ["Basava", "Basaveshwara"],
    traditions: [
      {
        slug: "lingayat-tradition",
        name: "Lingayat Tradition",
        shortDescription: "A Shaiva devotional tradition associated with Basavanna, vachana literature, and worship of the ishtalinga."
      }
    ],
    facts: [
      { label: "Era", value: "c. 1131-1167" },
      { label: "Region", value: "Karnataka" },
      { label: "Literary form", value: "Vachana" }
    ],
    places: ["Basavana Bagewadi", "Kalyana", "Karnataka"],
    sources: [],
    furtherReading: [],
    status: "published"
  }
];

export const traditions: TraditionRecord[] = [
  {
    slug: "advaita-vedanta",
    name: "Advaita Vedanta",
    shortDescription: "A non-dual Vedantic tradition emphasizing the identity of Atman and Brahman.",
    founder: "Adi Shankaracharya",
    saints: [],
    relatedTraditions: [],
    status: "published"
  },
  {
    slug: "bhakti-traditions",
    name: "Bhakti Traditions",
    shortDescription: "Devotional lineages centered on love, surrender, chanting, service, and remembrance.",
    saints: [],
    relatedTraditions: [],
    status: "published"
  },
  {
    slug: "ramakrishna-tradition",
    name: "Ramakrishna Tradition",
    shortDescription: "A modern spiritual movement shaped by Sri Ramakrishna, Holy Mother, and Swami Vivekananda.",
    founder: "Sri Ramakrishna",
    saints: [],
    relatedTraditions: [],
    status: "published"
  },
  {
    slug: "gaudiya-vaishnavism",
    name: "Gaudiya Vaishnavism",
    shortDescription: "A Krishna-centered Vaishnava tradition emphasizing bhakti, kirtan, and devotion to Radha-Krishna.",
    founder: "Sri Chaitanya Mahaprabhu",
    saints: [],
    relatedTraditions: [],
    status: "published"
  },
  {
    slug: "varkari-sampradaya",
    name: "Varkari Sampradaya",
    shortDescription: "A Maharashtrian bhakti tradition centered on Vithoba, pilgrimage, abhangas, and devotional remembrance.",
    saints: [],
    relatedTraditions: [],
    status: "published"
  },
  {
    slug: "lingayat-tradition",
    name: "Lingayat Tradition",
    shortDescription: "A Shaiva devotional tradition associated with Basavanna, vachana literature, and worship of the ishtalinga.",
    founder: "Basavanna",
    saints: [],
    relatedTraditions: [],
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

export function getPublishedTraditions() {
  return traditions.filter(isPublishedTradition);
}

export function getTraditionBySlug(slug: string) {
  return getPublishedTraditions().find((tradition) => tradition.slug === slug);
}
