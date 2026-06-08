export type SitePageStatus = "draft" | "needs_review" | "published" | "hidden" | "archived";
export type HomeLayoutVariant = "archive" | "devotional";

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
  contextTitle: string;
  emptySaintsMessage: string;
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
};

export const siteDesignConfig: SiteDesignConfig = {
  homeLayout: "devotional"
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
  eyebrow: "Places",
  title: "Places",
  description: "Explore locations associated with published saint profiles."
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
  contextTitle: "Place context",
  emptySaintsMessage: "Associated saints will appear here after editorial review."
};

export const instagramSectionContent: InstagramSectionContent = {
  eyebrow: "Instagram",
  title: "Related posts and reels",
  linkLabel: "View on Instagram"
};

export const aboutPageContent: AboutPageContent = {
  slug: "about",
  status: "published",
  eyebrow: "About",
  title: "A devotional archive built for careful discovery.",
  introduction:
    "Hindu Saints Archive is the website home for the @hindu_saints project: a searchable, source-backed collection of saint profiles, biographies, traditions, and related media.",
  sections: [
    {
      title: "What this archive is for",
      body:
        "The site is being built to help readers discover Hindu saints through clear profiles, respectful biographies, tradition context, sources, and further reading. Public pages show reviewed and published content, while the admin CMS supports drafting, review, and reconciliation before publication."
    },
    {
      title: "How content is handled",
      body:
        "Airtable, Instagram, CSV files, and manual editorial notes can all inform the archive, but the website database is the source of truth. Imported records are preserved for review and debugging, and conflicts are routed into reconciliation instead of silently overwriting human edits."
    },
    {
      title: "Where the project is going",
      body:
        "The MVP focuses on saints, aliases, traditions, biographies, sources, Instagram items, and reconciliation workflows. Over time, the archive can support richer relationship graphs, lineage views, source trails, and editorial tools for contributors and reviewers."
    }
  ]
};

export const footerContent = {
  summary: "Hindu Saints Archive. Public pages show only reviewed and published content."
};

export function getHomeHeroContent() {
  return homeHeroContent;
}

export function getHomeSectionContent(key: HomeSectionContent["key"]) {
  return homeSectionContent[key];
}

export function getHomeLayoutVariant(): HomeLayoutVariant {
  const requestedLayout = process.env.NEXT_PUBLIC_HOME_LAYOUT;

  if (requestedLayout === "archive" || requestedLayout === "devotional") {
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

export function getInstagramSectionContent() {
  return instagramSectionContent;
}

export function getAboutPageContent() {
  return aboutPageContent.status === "published" ? aboutPageContent : null;
}

export function getFooterContent() {
  return footerContent;
}
