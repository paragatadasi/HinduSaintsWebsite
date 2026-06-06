import type { Metadata } from "next";
import "@/styles/globals.css";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: {
    default: "Hindu Saints Archive",
    template: "%s | Hindu Saints Archive"
  },
  description: "A devotional archive of Hindu saints, traditions, biographies, sources, and related Instagram posts."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
