import type { ComponentProps } from "react";
import type { Button } from "@/components/ui/button";
import type { SaintCard } from "@/components/saints/saint-card";
import type { TraditionCard } from "@/components/traditions/tradition-card";
import type { SaintEncounterCard } from "@/components/saints/saint-encounter-card";
import type { SaintProfileSummary } from "@/components/saints/saint-profile-summary";
import type { ScrollRail } from "@/components/ui/scroll-rail";

export const publicVariants = {
  button: ["primary", "secondary", "text"] satisfies NonNullable<ComponentProps<typeof Button>["variant"]>[],
  saintCard: ["summary", "portrait"] satisfies NonNullable<ComponentProps<typeof SaintCard>["variant"]>[],
  traditionCard: ["summary", "icon"] satisfies NonNullable<ComponentProps<typeof TraditionCard>["variant"]>[],
  encounter: ["catalog", "hero", "profile", "rail"] satisfies ComponentProps<typeof SaintEncounterCard>["variant"][],
  summary: ["compact", "editorial"] satisfies NonNullable<ComponentProps<typeof SaintProfileSummary>["variant"]>[],
  rail: ["auto", "always"] satisfies NonNullable<ComponentProps<typeof ScrollRail>["controls"]>[]
} as const;

export type PublicDesignEntry = {
  id: string;
  name: string;
  source: string;
  family: "Controls" | "Discovery" | "Editorial" | "Media" | "Composition" | "Shell";
  variants: readonly string[];
  default: string;
  use: string;
  coverage: "specimen" | "composition" | "integration";
  example: string;
};

export const publicDesignRegistry: readonly PublicDesignEntry[] = [
  { id: "button", name: "Button", source: "components/ui/button.tsx", family: "Controls", variants: publicVariants.button, default: "primary; iconPosition=start", use: "Navigation styled as an action. Use a native button for state changes; this component requires href.", coverage: "specimen", example: "controls" },
  { id: "search", name: "PublicSearchField", source: "components/ui/public-search-field.tsx", family: "Controls", variants: [], default: "search input and submit", use: "Public search inside a form. HeaderSearch owns the global search experience.", coverage: "specimen", example: "controls" },
  { id: "taxonomy", name: "TaxonomyLinkList", source: "components/ui/taxonomy-link-list.tsx", family: "Controls", variants: [], default: "labeled link group", use: "Compact linked places or traditions in facts; use cards for discovery collections.", coverage: "specimen", example: "controls" },
  { id: "era", name: "SaintEraRange", source: "components/saints/saint-era-range.tsx", family: "Controls", variants: [], default: "start/end from props", use: "Two-ended era filter, inside a catalog form.", coverage: "specimen", example: "controls" },
  { id: "catalog-select", name: "SaintCatalogSelect", source: "components/saints/saint-catalog-select.tsx", family: "Controls", variants: ["name=location", "name=tradition"], default: "value from props", use: "Public catalog filters; automatically submits its parent form.", coverage: "specimen", example: "controls" },
  { id: "card", name: "Card", source: "components/ui/card.tsx", family: "Discovery", variants: [], default: "article.card", use: "Surface primitive; prefer a domain card when showing a saint, tradition, or place.", coverage: "composition", example: "cards" },
  { id: "saint-card", name: "SaintCard", source: "components/saints/saint-card.tsx", family: "Discovery", variants: publicVariants.saintCard, default: "summary", use: "Summary for catalog grids; portrait for discovery rails. Missing images use the shared placeholder.", coverage: "specimen", example: "cards" },
  { id: "tradition-card", name: "TraditionCard", source: "components/traditions/tradition-card.tsx", family: "Discovery", variants: publicVariants.traditionCard, default: "summary; showSaintCount=false", use: "Summary for description or count; icon for compact rails. FeaturedTraditionCard owns image-led homepage features.", coverage: "specimen", example: "cards" },
  { id: "place-card", name: "PlaceCard", source: "components/places/place-card.tsx", family: "Discovery", variants: [], default: "place summary", use: "Place discovery; use TaxonomyLinkList for compact facts.", coverage: "specimen", example: "cards" },
  { id: "rail", name: "ScrollRail", source: "components/ui/scroll-rail.tsx", family: "Discovery", variants: publicVariants.rail, default: "controls=auto", use: "Horizontal collections; always keeps controls visible, auto shows controls on overflow. Use card-grid for catalogs.", coverage: "specimen", example: "rails" },
  { id: "encounter", name: "SaintEncounterCard", source: "components/saints/saint-encounter-card.tsx", family: "Discovery", variants: publicVariants.encounter, default: "required variant", use: "Invitation to random discovery. Choose the enclosing context; do not replace related saints with this card.", coverage: "specimen", example: "encounter" },
  { id: "encounter-wrapper", name: "SaintEncounter", source: "components/saints/saint-encounter.tsx", family: "Discovery", variants: [], default: "profile encounter", use: "Compatibility composition of SaintEncounterCard profile; use the card for explicit contexts.", coverage: "composition", example: "encounter" },
  { id: "prose", name: "Prose", source: "components/content/prose.tsx", family: "Editorial", variants: [], default: "sanitized Markdown", use: "Reviewed rich text, citations and definitions. Use SaintProfileSummary for expandable plain-text overviews.", coverage: "specimen", example: "editorial" },
  { id: "summary", name: "SaintProfileSummary", source: "components/saints/saint-profile-summary.tsx", family: "Editorial", variants: publicVariants.summary, default: "compact", use: "Editorial on public saint profiles; compact remains available for dense contexts. Never invent paragraph breaks.", coverage: "specimen", example: "editorial" },
  { id: "biography", name: "SaintBiography", source: "components/saints/saint-biography.tsx", family: "Editorial", variants: [], default: "reading panel and contents", use: "Full saint biography with sources; Prose alone for generic rich text.", coverage: "composition", example: "saint-page" },
  { id: "contents", name: "BiographyTableOfContents", source: "components/saints/biography-table-of-contents.tsx", family: "Editorial", variants: [], default: "heading links", use: "Biography section navigation; supplied by SaintBiography.", coverage: "composition", example: "saint-page" },
  { id: "image", name: "FocalImage", source: "components/ui/focal-image.tsx", family: "Media", variants: [], default: "responsive image; optional cropAspect/focalPoint", use: "Shared crop geometry and responsive sources; do not implement a separate object-position calculation.", coverage: "composition", example: "media" },
  { id: "hero-gallery", name: "SaintHeroGallery", source: "components/saints/saint-hero-gallery.tsx", family: "Media", variants: [], default: "first image; empty fallback", use: "Saint hero image switching; SaintGallery supplies the full-image viewer.", coverage: "specimen", example: "media" },
  { id: "gallery", name: "SaintGallery", source: "components/saints/saint-gallery.tsx", family: "Media", variants: [], default: "thumbnails and modal viewer", use: "Additional images and full-image inspection.", coverage: "specimen", example: "media" },
  { id: "instagram", name: "InstagramEmbedGrid / InstagramPostCard / InstagramCarouselViewer", source: "components/instagram/instagram-embed-grid.tsx", family: "Media", variants: ["layout=section|sidebar", "presentation=modal|inline", "viewer mode=modal|inline"], default: "layout=section; presentation=modal; viewer mode=modal", use: "Public post cards and image viewer; use HomeInstagramRail for the homepage composition.", coverage: "specimen", example: "instagram" },
  { id: "instagram-preview", name: "InstagramPreviewLink", source: "components/instagram/instagram-preview-link.tsx", family: "Media", variants: ["link", "onSelect button"], default: "link; isSelected=false", use: "Small preview with image fallbacks; onSelect turns it into a selection control.", coverage: "specimen", example: "instagram" },
  { id: "home-instagram", name: "HomeInstagramRail", source: "components/instagram/home-instagram-rail.tsx", family: "Media", variants: [], default: "always-visible rail controls", use: "Homepage post discovery with shared viewer; hidden for zero previews.", coverage: "integration", example: "/" },
  { id: "featured-tradition", name: "FeaturedTraditionCard", source: "components/traditions/featured-tradition-card.tsx", family: "Discovery", variants: ["with bannerImage", "without bannerImage"], default: "optional image", use: "Homepage tradition feature; basic records suppress editorial description.", coverage: "specimen", example: "cards" },
  { id: "saint-page", name: "SaintDetailPageContent", source: "components/saints/saint-detail-page.tsx", family: "Composition", variants: ["rootElement=main|div"], default: "main", use: "Shared saint template, including facts, sources and related/fallback rails. Do not fork per saint.", coverage: "specimen", example: "saint-page" },
  { id: "profile-actions", name: "SaintProfileActions", source: "components/saints/saint-profile-actions.tsx", family: "Composition", variants: ["with/without biography", "with/without post"], default: "data-dependent actions", use: "Saint post viewer, biography jump, share and feedback. View the Post remains primary.", coverage: "composition", example: "saint-page" },
  { id: "tradition-page", name: "TraditionPageLayouts", source: "components/traditions/tradition-page-layouts.tsx", family: "Composition", variants: ["rootElement=main|div"], default: "main", use: "Reviewed tradition detail with lineage/context panels; basic traditions follow their restricted route rendering.", coverage: "specimen", example: "tradition-page" },
  { id: "place-page", name: "PlaceDetailPageContent", source: "components/places/place-detail-page.tsx", family: "Composition", variants: ["rootElement=main|div"], default: "main", use: "Place overview and associated saints, including empty state.", coverage: "specimen", example: "place-page" },
  { id: "map", name: "IndiaSaintsMap", source: "components/places/india-saints-map.tsx", family: "Composition", variants: [], default: "map data and state geometry required", use: "Geographic exploration with filters and saint routes; verify with real reviewed map data at /map.", coverage: "integration", example: "/map" },
  { id: "index-hero", name: "IndexPageHero", source: "components/layout/index-page-hero.tsx", family: "Composition", variants: ["with image", "without image"], default: "optional image", use: "Directory page heading and optional search; not the saint profile hero.", coverage: "specimen", example: "index-hero" },
  { id: "header", name: "SiteHeader", source: "components/layout/site-header.tsx", family: "Shell", variants: [], default: "public navigation", use: "Root public header, visible in the specimen frame.", coverage: "composition", example: "shell" },
  { id: "header-search", name: "HeaderSearch", source: "components/layout/header-search.tsx", family: "Shell", variants: [], default: "global search", use: "Root header search; test full search against published records separately.", coverage: "integration", example: "/" },
  { id: "footer", name: "SiteFooter", source: "components/layout/site-footer.tsx", family: "Shell", variants: [], default: "published footer configuration", use: "Root footer and privacy/contact controls; visible in the specimen frame.", coverage: "composition", example: "shell" },
  { id: "contact", name: "FooterContactDialog", source: "components/layout/footer-contact-dialog.tsx", family: "Shell", variants: [], default: "closed", use: "Production contact workflow. Review submissions separately; do not submit sample feedback.", coverage: "integration", example: "/" },
  { id: "transition", name: "RouteTransition", source: "components/layout/route-transition.tsx", family: "Shell", variants: [], default: "idle; navigation-driven", use: "Root navigation progress and reduced-motion behavior; verify real route changes.", coverage: "integration", example: "/" }
];
