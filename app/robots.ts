import type { MetadataRoute } from "next";
import { shouldBlockSearchIndexing } from "@/lib/deployment-environment";
import { getSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  if (shouldBlockSearchIndexing(siteUrl.hostname)) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/"
      },
      host: siteUrl.origin
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/museumadmin", "/api/"]
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
    host: siteUrl.origin
  };
}
