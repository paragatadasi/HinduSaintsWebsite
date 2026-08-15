import { randomUUID } from "node:crypto";
import { FooterContactDialog } from "@/components/layout/footer-contact-dialog";
import { CookieNotice, CookieNoticeTrigger } from "@/components/privacy/cookie-notice";
import { getPublicFooterContent } from "@/lib/site-config";

export async function SiteFooter() {
  const content = await getPublicFooterContent();

  return (
    <>
      <footer className="site-footer">
        <div className="page-shell">
          <p className="site-footer__legal">
            {content.copyright}{" "}
            <a href={content.imprint.href} target="_blank" rel="noopener noreferrer">
              {content.imprint.label}
            </a>
            .{" "}
            <a href={content.privacyPolicy.href} target="_blank" rel="noopener noreferrer">
              {content.privacyPolicy.label}
            </a>
            . <CookieNoticeTrigger />.{" "}
            <FooterContactDialog
              privacyPolicyHref={content.privacyPolicy.href}
              submissionKey={randomUUID()}
            />.
          </p>
        </div>
      </footer>
      <CookieNotice privacyPolicyHref={content.privacyPolicy.href} />
    </>
  );
}
