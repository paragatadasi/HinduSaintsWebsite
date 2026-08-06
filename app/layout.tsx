import type { Metadata } from "next";
import "@/styles/globals.css";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";
import { RouteTransition } from "@/components/layout/route-transition";
import { DEFAULT_SOCIAL_IMAGE, getSiteUrl, SITE_NAME } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`
  },
  description: "A devotional archive of Hindu saints, traditions, biographies, sources, and related Instagram posts.",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: "A devotional archive of Hindu saints, traditions, biographies, sources, and related Instagram posts.",
    images: [DEFAULT_SOCIAL_IMAGE]
  },
  twitter: { card: "summary_large_image", images: [DEFAULT_SOCIAL_IMAGE] }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="nocturne">
      <body>
        <RouteTransition />
        <SiteHeader />
        {children}
        <SiteFooter />
        <PageViewTracker />
      </body>
    </html>
  );
}
