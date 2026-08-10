import { Prose } from "@/components/content/prose";
import { SaintCard } from "@/components/saints/saint-card";
import type { PublicPlaceDetail } from "@/lib/public-contracts";
import type { PlaceDetailTemplateContent } from "@/lib/site-content";

export function PlaceDetailPageContent({
  place,
  rootElement: Root = "main",
  template
}: {
  place: PublicPlaceDetail;
  rootElement?: "main" | "div";
  template: PlaceDetailTemplateContent;
}) {
  return (
    <Root className="page-shell section site-grid">
      <div>
        <div className="eyebrow">{template.eyebrow}</div>
        <h1 className="page-title">{place.name}</h1>
        <p className="lede">{place.shortDescription}</p>
      </div>
      {place.overviewMarkdown ? <Prose markdown={place.overviewMarkdown} /> : null}
      <section className="saint-detail-main">
        <h2>{template.associatedSaintsTitle}</h2>
        {place.saints.length > 0 ? (
          <div className="card-grid">
            {place.saints.map((saint) => <SaintCard key={saint.slug} saint={saint} />)}
          </div>
        ) : (
          <p className="empty-note">{template.emptySaintsMessage}</p>
        )}
      </section>
    </Root>
  );
}
