import type { PublicImage, PublicSaintDetail, PublicTraditionDetail } from "@/lib/public-contracts";

export const specimenImage: PublicImage = {
  url: "/images/devotional-archive-placeholder.svg",
  alt: "Design specimen placeholder artwork",
  width: 800,
  height: 1000,
  focalPoint: { x: 0.5, y: 0.3 }
};

export const specimenMarkdown = `## A life of devotion

This is invented layout copy for design review, not a historical biography. It includes **emphasis**, *a contrasting voice*, and a [public directory link](/saints).

> A quotation provides a pause in the reading rhythm.

### Practice and community

- A short teaching
- A longer teaching that wraps naturally at narrow widths

The next paragraph tests spacing after a list. Readable paragraphs should retain a calm rhythm across different screen sizes.`;

export const specimenSaint: PublicSaintDetail = {
  slug: "design-specimen", displayName: "Sample Saint — An Intentionally Long Display Name",
  canonicalName: "Design specimen", shortDescription: "This invented overview tests the reading experience with a longer introduction. It is not a historical account. The summary should remain comfortable to read, preserve the existing public typography, and reveal the rest through its own Read more control when the text exceeds the collapsed space. A second sentence gives the narrow preview enough content to demonstrate expansion without changing the underlying text.",
  image: specimenImage, heroImage: specimenImage, gallery: [specimenImage],
  eraLabel: "19th–20th century", primaryLocation: "Sample place, India", tradition: "Sample tradition",
  featured: false, instagramUrls: [], instagramItems: [{ url: "https://www.instagram.com/hindu_saints/", type: "carousel", thumbnailUrl: specimenImage.url, carouselImageUrls: [specimenImage.url, "/images/hindu-saints-share.jpg"], caption: "Invented design-review post. No live Instagram content is loaded." }],
  status: "published", aliases: [], traditions: [{ slug: "design-specimen", name: "Sample tradition" }],
  facts: [{ label: "Era", value: "19th–20th century" }], places: ["Sample place"], placeLinks: [{ slug: "design-specimen", name: "Sample place" }],
  biography: { title: "A sample biography", bodyMarkdown: specimenMarkdown },
  sources: [{ id: "specimen-source", title: "An Example Source with a Longer Title", sourceType: "book", author: "Example author", publicationYear: "1900", note: "Invented reference for typography review.", url: "https://example.org" }, { title: "A source without an external link", sourceType: "article" }],
  furtherReading: []
};

export const specimenSaints = Array.from({ length: 8 }, (_, index) => ({
  ...specimenSaint, slug: `design-specimen-${index}`, displayName: index === 0 ? specimenSaint.displayName : `Sample Saint ${index + 1}`,
  image: index === 1 ? undefined : specimenImage
}));

export const specimenTradition: PublicTraditionDetail = {
  slug: "design-specimen", name: "Sample Tradition", shortDescription: "Invented copy for reviewing public tradition layouts.",
  saintCount: 8, founder: "Sample founder", status: "published", heroImage: specimenImage,
  overviewFacts: { eraLabel: "19th century", origin: "Sample region", focus: "Devotional practice" },
  foundingAcharyaMarkdown: specimenMarkdown, historyMarkdown: specimenMarkdown, keyTeachingsMarkdown: "A short sample section.",
  lineageSaints: specimenSaints.slice(0, 3), scripturalBasis: [], saints: specimenSaints,
  relatedTraditions: [], relatedPlaces: []
};
