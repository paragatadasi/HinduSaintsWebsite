import type { MetadataRoute } from "next";
import { getPublishedPlaceSlugs } from "@/lib/public-places";
import { getPublishedSaintSlugs } from "@/lib/public-saints";
import { getPublicTraditionSummaries } from "@/lib/public-traditions";
import { getSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const [saints, traditions, places] = await Promise.all([
    getPublishedSaintSlugs(),
    getPublicTraditionSummaries(),
    getPublishedPlaceSlugs()
  ]);
  const paths = [
    "",
    "/about",
    "/contact",
    "/saints",
    "/traditions",
    "/map",
    ...saints.map(({ slug }) => `/saints/${slug}`),
    ...traditions.map(({ slug }) => `/traditions/${slug}`),
    ...places.map(({ slug }) => `/places/${slug}`)
  ];

  return paths.map((path) => ({ url: new URL(path || "/", base).toString() }));
}
