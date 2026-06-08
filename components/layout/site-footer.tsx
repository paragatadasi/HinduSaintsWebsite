import { getFooterContent } from "@/lib/site-content";

export function SiteFooter() {
  const content = getFooterContent();

  return (
    <footer className="site-footer">
      <div className="page-shell">
        <p>{content.summary}</p>
      </div>
    </footer>
  );
}
