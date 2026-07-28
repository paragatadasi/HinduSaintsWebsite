import { getPublicFooterContent } from "@/lib/site-config";

export async function SiteFooter() {
  const content = await getPublicFooterContent();

  return (
    <footer className="site-footer">
      <div className="page-shell">
        <p className="site-footer__legal">
          {content.copyright}{" "}
          <a href={content.imprint.href}>{content.imprint.label}</a>.{" "}
          <a href={content.privacyPolicy.href}>{content.privacyPolicy.label}</a>.
        </p>
      </div>
    </footer>
  );
}
