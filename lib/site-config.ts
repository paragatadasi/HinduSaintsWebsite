import { db } from "@/lib/db";
import { getFooterContent, type FooterContent } from "@/lib/site-content";

export const SITE_CONFIG_ID = "site";

export async function getPublicFooterContent(): Promise<FooterContent> {
  const fallback = getFooterContent();
  const config = await db.siteConfig.findUnique({
    where: { id: SITE_CONFIG_ID },
    select: {
      imprintUrl: true,
      privacyPolicyUrl: true
    }
  });

  return {
    ...fallback,
    imprint: {
      ...fallback.imprint,
      href: config?.imprintUrl || fallback.imprint.href
    },
    privacyPolicy: {
      ...fallback.privacyPolicy,
      href: config?.privacyPolicyUrl || fallback.privacyPolicy.href
    }
  };
}
