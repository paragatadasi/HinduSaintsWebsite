import type { Metadata } from "next";
import "@/styles/globals.css";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Hindu Saints Archive",
    template: "%s | Hindu Saints Archive"
  },
  description: "A devotional archive of Hindu saints, traditions, biographies, sources, and related Instagram posts."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="nocturne">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
        <PageViewTracker />
      </body>
    </html>
  );
}
