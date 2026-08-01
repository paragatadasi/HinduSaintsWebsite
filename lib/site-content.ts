export type SitePageStatus = "draft" | "needs_review" | "published" | "archived";
export type HomeLayoutVariant = "archive" | "devotional" | "cosmic";
export const ABOUT_PAGE_SECTION_LIMIT = 20;
export const ABOUT_DISCOVERY_ITEM_LIMIT = 8;

export type SiteDesignConfig = {
  homeLayout: HomeLayoutVariant;
};

export type HomeHeroContent = {
  eyebrow: string;
  title: string;
  body: string;
  primaryAction: {
    label: string;
    href: string;
  };
  secondaryAction: {
    label: string;
    href: string;
  };
};

export type HomeSectionContent = {
  key: "featuredSaints" | "traditions";
  eyebrow: string;
  title: string;
  action?: {
    label: string;
    href: string;
  };
};

export type HomeQuoteContent = {
  eyebrow: string;
  quote: string;
  attribution: string;
  attributionHref?: `/saints/${string}`;
};

export type PageIntroContent = {
  eyebrow: string;
  title: string;
  description: string;
};

export type SaintDetailTemplateContent = {
  factLabels: {
    era: string;
    location: string;
    tradition: string;
  };
  biographyEyebrow: string;
  biographyPlaceholderMarkdown: string;
};

export type TraditionDetailTemplateContent = {
  eyebrow: string;
  placeholderMarkdown: string;
};

export type PlaceDetailTemplateContent = {
  eyebrow: string;
  associatedSaintsTitle: string;
  emptySaintsMessage: string;
};

export type PlacesMapContent = {
  eyebrow: string;
  title: string;
  description: string;
  promptTitle: string;
  promptBody: string;
  exploreActionLabel: string;
};

export type InstagramSectionContent = {
  eyebrow: string;
  title: string;
  linkLabel: string;
};

export type AboutPageContent = {
  slug: "about";
  status: SitePageStatus;
  eyebrow: string;
  title: string;
  introduction: string;
  sections: Array<{
    title: string;
    body: string;
  }>;
  discovery: {
    title: string;
    items: Array<{
      title: string;
      body: string;
      href: string;
      icon: "sparkles" | "book" | "map" | "flame";
    }>;
  };
};

export type FooterContent = {
  copyright: string;
  imprint: {
    label: string;
    href: string;
  };
  privacyPolicy: {
    label: string;
    href: string;
  };
};

export const siteDesignConfig: SiteDesignConfig = {
  homeLayout: "cosmic"
};

export const homeHeroContent: HomeHeroContent = {
  eyebrow: "\u0950",
  title: "Honoring saints from the Hindu tradition and beyond.",
  body:
    "A living archive of the lives, teachings, and traditions of the saints.",
  primaryAction: {
    label: "Search saints by name, era, location, guru...",
    href: "/saints"
  },
  secondaryAction: {
    label: "Instagram",
    href: "https://www.instagram.com/hindu_saints/"
  }
};

export const homeSectionContent: Record<HomeSectionContent["key"], HomeSectionContent> = {
  featuredSaints: {
    key: "featuredSaints",
    eyebrow: "",
    title: "Featured Saints",
    action: {
      label: "View all saints",
      href: "/saints"
    }
  },
  traditions: {
    key: "traditions",
    eyebrow: "",
    title: "Explore Traditions",
    action: {
      label: "View all traditions",
      href: "/traditions"
    }
  }
};

export const saintsIndexContent: PageIntroContent = {
  eyebrow: "Saints",
  title: "Saints Archive",
  description: "Explore our rich collection of saints from the Hindu tradition and beyond."
};

export const traditionsIndexContent: PageIntroContent = {
  eyebrow: "Traditions",
  title: "Traditions",
  description: "Dive into the traditions of the saints."
};

export const placesIndexContent: PageIntroContent = {
  eyebrow: "Map",
  title: "Map",
  description: "Explore where published saints lived, traveled, practiced, and taught."
};

export const saintDetailTemplateContent: SaintDetailTemplateContent = {
  factLabels: {
    era: "Era",
    location: "Location",
    tradition: "Tradition"
  },
  biographyEyebrow: "Biography",
  biographyPlaceholderMarkdown:
    "This launch profile is ready for a reviewed biography. The CMS will store long-form content as safe Markdown and reuse this public rendering component for previews."
};

export const traditionDetailTemplateContent: TraditionDetailTemplateContent = {
  eyebrow: "Tradition",
  placeholderMarkdown:
    "This page is the launch template for tradition introductions. Founder, associated saints, sources, and longer Markdown content will be managed in the CMS."
};

export const placeDetailTemplateContent: PlaceDetailTemplateContent = {
  eyebrow: "Place",
  associatedSaintsTitle: "Associated saints",
  emptySaintsMessage: "Associated saints will appear here after editorial review."
};

export const placesMapContent: PlacesMapContent = {
  eyebrow: "Map",
  title: "Saints Across India",
  description:
    "Explore Indian places connected to published saints. Use the time filter to see which saints may have lived during the same period.",
  promptTitle: "Choose a place on the map",
  promptBody:
    "Click any point to view associated saints, eras, traditions, and a link to the place page.",
  exploreActionLabel: "Explore"
};

export const instagramSectionContent: InstagramSectionContent = {
  eyebrow: "Instagram",
  title: "Related posts and reels",
  linkLabel: "View on Instagram"
};

export const homeQuoteContent: HomeQuoteContent = {
  eyebrow: "Quote of the Day",
  quote: "The highest wisdom is humility; the highest devotion is service; the highest life is love for all.",
  attribution: "Sri Ramakrishna Paramahamsa"
};

export const aboutPageContent: AboutPageContent = {
  slug: "about",
  status: "published",
  eyebrow: "A living devotional archive",
  title: "The stories of saints, carried forward.",
  introduction:
    "Hindu Saints brings together lives, traditions, places and teachings in one contemplative home—made for seekers, students and the simply curious.",
  sections: [
    {
      title: "A quiet place to learn, remember and return.",
      body:
        "This is our vision: a one-stop hub for everything saints. Biographies, teachings, relationships, stories and the connections between them.\n\nA single place where inspired seekers can meet and fall in love with saints from across the vast span of Sanātana Dharma—and follow the trail of love to their own Sadguru."
    },
    {
      title: "Built from devotion, shaped by curiosity.",
      body:
        "Hindu Saints began as a personal archive—a way to understand how gurus, lineages and places meet across generations. It has grown into a carefully researched, freely accessible home for stories that deserve to remain alive."
    },
    {
      title: "Grounded in grace.",
      body:
        "This project is offered in devotion to our beloved Guruji, Paramahamsa Vishwananda. His simple message—Just Love—guides everything we do."
    }
  ],
  discovery: {
    title: "Three ways into a vast tradition",
    items: [
      { title: "Saints", body: "Explore the lives of realised souls from across traditions.", href: "/saints", icon: "sparkles" },
      { title: "Traditions", body: "Enter living lineages and the teachings they carry.", href: "/traditions", icon: "book" },
      { title: "Sacred Map", body: "Discover places connected to saints and seekers.", href: "/map", icon: "map" }
    ]
  }
};

export const footerContent: FooterContent = {
  copyright: "© 2026 Bhakti Marga Yoga gGmbH. All rights reserved.",
  imprint: {
    label: "Imprint",
    href: "https://back.bhaktimarga.org/wp-content/uploads/2024/07/Bhakti-Marga-Yoga-gGmbH-impressum.pdf"
  },
  privacyPolicy: {
    label: "Privacy Policy",
    href: "https://bhaktimarga.org/privacy-policy"
  }
};

export function getHomeHeroContent() {
  return homeHeroContent;
}

export function getHomeSectionContent(key: HomeSectionContent["key"]) {
  return homeSectionContent[key];
}

export function getHomeQuoteContent() {
  return homeQuoteContent;
}

export function getHomeLayoutVariant(): HomeLayoutVariant {
  const requestedLayout = process.env.NEXT_PUBLIC_HOME_LAYOUT;

  if (requestedLayout === "archive" || requestedLayout === "devotional" || requestedLayout === "cosmic") {
    return requestedLayout;
  }

  return siteDesignConfig.homeLayout;
}

export function getSaintsIndexContent() {
  return saintsIndexContent;
}

export function getTraditionsIndexContent() {
  return traditionsIndexContent;
}

export function getPlacesIndexContent() {
  return placesIndexContent;
}

export function getSaintDetailTemplateContent() {
  return saintDetailTemplateContent;
}

export function getTraditionDetailTemplateContent() {
  return traditionDetailTemplateContent;
}

export function getPlaceDetailTemplateContent() {
  return placeDetailTemplateContent;
}

export function getPlacesMapContent() {
  return placesMapContent;
}

export function getInstagramSectionContent() {
  return instagramSectionContent;
}

export function getAboutPageContent() {
  return aboutPageContent.status === "published" ? aboutPageContent : null;
}

export function getFooterContent() {
  return footerContent;
}
