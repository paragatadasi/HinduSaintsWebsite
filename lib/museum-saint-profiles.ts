import { db } from "@/lib/db";
import { formatSaintDate, formatSaintEraLabel } from "@/lib/public-date-format";
import { getPublicImageVariants } from "@/lib/responsive-images";
import type { MuseumSaintProfile } from "@/lib/museum-saint-profile";

// Private reader. The section route enforces access_museum before requesting profiles.
// Fetch only the section's saints, not galleries for the whole museum catalogue.
export async function readMuseumSaintProfiles(ids: string[]): Promise<Record<string, MuseumSaintProfile>> {
  if (!ids.length) return {};
  const saints = await db.saint.findMany({
    where: { id: { in: [...new Set(ids)] }, status: { not: "archived" } },
    select: {
      id: true, displayName: true, slug: true, status: true,
      shortDescription: true, biographySummary: true, eraLabel: true,
      birthDateRaw: true, birthYear: true, birthMonth: true, birthDay: true, birthDatePrecision: true,
      samadhiDateRaw: true, samadhiYear: true, samadhiMonth: true, samadhiDay: true, samadhiDatePrecision: true,
      primaryImage: true,
      galleryImages: { where: { publicVisible: true }, include: { mediaAsset: true }, orderBy: { sortOrder: "asc" } },
      places: { include: { place: true }, orderBy: { placeType: "asc" } },
      traditions: { where: { tradition: { status: { not: "archived" } } }, include: { tradition: true }, orderBy: { isPrimary: "desc" } },
      instagramItems: {
        where: { matchStatus: { in: ["matched", "published"] }, instagramItem: { status: { in: ["matched", "published"] } } },
        orderBy: { instagramItem: { postedAt: "desc" } }, take: 1,
        select: { instagramItem: { select: { instagramUrl: true } } }
      }
    }
  });
  return Object.fromEntries(saints.map(s => {
    const images = [s.primaryImage, ...s.galleryImages.map(i => i.mediaAsset)].filter(i => i !== null);
    const facts = [
      { label: "Era", value: s.eraLabel ? formatSaintEraLabel(s.eraLabel) : "" },
      { label: "Birth date", value: formatSaintDate({ raw: s.birthDateRaw, year: s.birthYear, month: s.birthMonth, day: s.birthDay, precision: s.birthDatePrecision }) || "" },
      { label: "Samadhi date", value: formatSaintDate({ raw: s.samadhiDateRaw, year: s.samadhiYear, month: s.samadhiMonth, day: s.samadhiDay, precision: s.samadhiDatePrecision }) || "" },
      { label: "Places", value: [...new Set(s.places.map(p => p.place.name))].join(" · ") },
      { label: "Tradition", value: s.traditions.map(t => t.tradition.name).join(" · ") }
    ].filter(f => f.value);
    return [s.id, {
      name: s.displayName,
      description: s.shortDescription || s.biographySummary || "",
      facts,
      images: images.filter((image, index) => images.findIndex(i => i.url === image.url) === index).map(i => ({
        url: i.url, alt: i.altText || `${s.displayName} portrait`,
        width: i.width || undefined, height: i.height || undefined,
        variants: getPublicImageVariants(i.variants), focalPoint: { x: i.focalX, y: i.focalY }
      })),
      publicSlug: s.status === "published" ? s.slug : undefined,
      postUrl: s.instagramItems[0]?.instagramItem.instagramUrl
    }];
  }));
}
