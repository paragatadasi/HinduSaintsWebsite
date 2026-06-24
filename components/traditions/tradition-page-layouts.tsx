import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, MapPinned, MessageSquare, Network } from "lucide-react";
import { Prose } from "@/components/content/prose";
import { Button } from "@/components/ui/button";
import type { TraditionDetailTemplateContent } from "@/lib/site-content";
import type {
  PublicImage,
  PublicPlaceLink,
  PublicTraditionLineageSaint,
  PublicTraditionDetail,
  PublicTraditionLink
} from "@/lib/public-contracts";

type TraditionPageLayoutsProps = {
  tradition: PublicTraditionDetail;
  template: TraditionDetailTemplateContent;
};

const IMAGE_PLACEHOLDER: PublicImage = {
  url: "/images/devotional-archive-placeholder.svg",
  alt: "Reviewed public image pending"
};
const SECTION_IN_REVIEW = "Editorial copy for this section is in review.";

export function TraditionPageLayouts({ tradition, template }: TraditionPageLayoutsProps) {
  const historyMarkdown = tradition.historyMarkdown ?? tradition.introductionMarkdown ?? SECTION_IN_REVIEW;
  const foundingAcharyaMarkdown = tradition.foundingAcharyaMarkdown ?? SECTION_IN_REVIEW;
  const keyTeachingsMarkdown = tradition.keyTeachingsMarkdown ?? SECTION_IN_REVIEW;

  return (
    <main className="tradition-detail">
      <TraditionHero tradition={tradition} />
      <div className="page-shell tradition-detail__divider" />
      <div className="page-shell tradition-detail__content">
        <article className="tradition-detail__main">
          <NarrativeSection
            title="Founding Acharya"
            body={foundingAcharyaMarkdown}
          />
          <LineageTree saints={tradition.lineageSaints} founderName={tradition.founder} />
          <section className="tradition-section tradition-section--history">
            <h2>History</h2>
            <Prose markdown={historyMarkdown} />
          </section>
          <NarrativeSection
            title="Key Teachings"
            body={keyTeachingsMarkdown}
          />
        </article>
        <aside className="tradition-detail__aside" aria-label={`${tradition.name} context`}>
          <TraditionOverviewPanel tradition={tradition} />
          <RelatedTraditions traditions={tradition.relatedTraditions} />
          <RelatedPlaces places={tradition.relatedPlaces} />
        </aside>
      </div>
    </main>
  );
}

function TraditionHero({ tradition }: { tradition: PublicTraditionDetail }) {
  const image = tradition.heroImage ?? IMAGE_PLACEHOLDER;

  return (
    <section className="tradition-hero">
      <div className="page-shell tradition-hero__inner">
        <div className="tradition-hero__content">
          <nav className="tradition-breadcrumb" aria-label="Breadcrumb">
            <Link href="/traditions">Traditions</Link>
            <span aria-hidden="true">/</span>
            <span>{tradition.name}</span>
          </nav>
          <h1>{tradition.name}</h1>
          <p>{tradition.shortDescription}</p>
          {tradition.alternateNames && tradition.alternateNames.length > 0 ? (
            <div className="chip-list" aria-label="Alternate names">
              {tradition.alternateNames.map((name) => <span className="chip" key={name}>{name}</span>)}
            </div>
          ) : null}
          <div className="tradition-hero__actions">
            <Button href="#tradition-lineage" variant="primary" icon={<Network size={18} aria-hidden="true" />}>
              Explore Saints
            </Button>
            <Button href="/map" variant="secondary" icon={<MapPinned size={18} aria-hidden="true" />}>
              View on Map
            </Button>
            <Button href="/contact" variant="secondary" icon={<MessageSquare size={18} aria-hidden="true" />}>
              Send feedback
            </Button>
          </div>
        </div>
        <figure className="tradition-hero__image">
          <img src={image.url} alt={image.alt} width={image.width} height={image.height} />
          {!tradition.heroImage ? <figcaption>{image.alt}</figcaption> : null}
          <span className="tradition-hero__image-arc tradition-hero__image-arc--left" aria-hidden="true" />
          <span className="tradition-hero__image-arc tradition-hero__image-arc--right" aria-hidden="true" />
          <span className="tradition-hero__image-arc tradition-hero__image-arc--base" aria-hidden="true" />
        </figure>
      </div>
    </section>
  );
}

function NarrativeSection({ title, body }: { title: string; body: string }) {
  return (
    <section className="tradition-section">
      <h2>{title}</h2>
      <Prose markdown={body} />
    </section>
  );
}

function LineageTree({
  saints,
  founderName
}: {
  saints: PublicTraditionLineageSaint[];
  founderName?: string;
}) {
  const [rootSaint, ...descendants] = saints;
  const firstRow = descendants.slice(0, 6);
  const secondRow = descendants.slice(6, 11);

  return (
    <section className="tradition-lineage" id="tradition-lineage" aria-label="Associated saints lineage">
      {rootSaint ? (
        <>
          <LineageSaint saint={rootSaint} prominent />
          {firstRow.length > 0 ? (
            <ol className="tradition-lineage__row tradition-lineage__row--primary">
              {firstRow.map((saint) => (
                <li key={saint.slug}>
                  <LineageSaint saint={saint} />
                </li>
              ))}
            </ol>
          ) : null}
          {secondRow.length > 0 ? (
            <ol className="tradition-lineage__row tradition-lineage__row--secondary">
              {secondRow.map((saint) => (
                <li key={saint.slug}>
                  <LineageSaint saint={saint} compact />
                </li>
              ))}
            </ol>
          ) : null}
        </>
      ) : (
        <p className="empty-note">
          Associated saints will appear here after editorial review{founderName ? ` for ${founderName}` : ""}.
        </p>
      )}
    </section>
  );
}

function LineageSaint({
  saint,
  prominent = false,
  compact = false
}: {
  saint: PublicTraditionLineageSaint;
  prominent?: boolean;
  compact?: boolean;
}) {
  const image = saint.image ?? IMAGE_PLACEHOLDER;
  const className = [
    "tradition-lineage-saint",
    prominent ? "tradition-lineage-saint--prominent" : null,
    compact ? "tradition-lineage-saint--compact" : null
  ].filter(Boolean).join(" ");

  return (
    <Link className={className} href={`/saints/${saint.slug}`}>
      <span className="tradition-lineage-saint__portrait">
        <img src={image.url} alt={image.alt} width={image.width} height={image.height} />
      </span>
      {!compact ? (
        <span className="tradition-lineage-saint__text">
          <strong>{saint.displayName}</strong>
          <small>{saint.roleLabel ?? saint.eraLabel}</small>
        </span>
      ) : null}
    </Link>
  );
}

function TraditionOverviewPanel({
  tradition
}: {
  tradition: PublicTraditionDetail;
}) {
  const facts = [
    ["Founder", tradition.overviewFacts.founder ?? tradition.founder ?? "In review"],
    ["Origin", tradition.overviewFacts.origin ?? tradition.overviewFacts.originPlace?.name ?? "In review"],
    ["Era", tradition.overviewFacts.eraLabel ?? "In review"],
    ["Focus", tradition.overviewFacts.focus ?? "In review"]
  ];

  return (
    <section className="tradition-panel">
      <h2>Tradition Overview</h2>
      <dl className="tradition-facts">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {tradition.scripturalBasis.length > 0 ? (
        <dl className="tradition-facts tradition-facts--stacked">
          <div>
            <dt>Scriptural Basis</dt>
            <dd>
              <ul className="tradition-source-list">
                {tradition.scripturalBasis.map((item) => (
                  <li key={`${item.title}-${item.url ?? item.note ?? ""}`}>
                    {item.url ? <a href={item.url}>{item.title}</a> : <span>{item.title}</span>}
                    {item.note ? <small>{item.note}</small> : null}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
      ) : null}
    </section>
  );
}

function RelatedTraditions({ traditions }: { traditions: PublicTraditionLink[] }) {
  return (
    <section className="tradition-panel">
      <h2>Related Traditions</h2>
      {traditions.length > 0 ? (
        <>
          <ul className="tradition-place-list">
            {traditions.slice(0, 3).map((tradition) => (
              <li key={tradition.slug}>
                <Link href={`/traditions/${tradition.slug}`}>
                  <img src={IMAGE_PLACEHOLDER.url} alt="" />
                  <span>
                    <strong>{tradition.name}</strong>
                    <small>{tradition.shortDescription}</small>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <ContextLink href="/traditions" label="View all traditions" />
        </>
      ) : (
        <p className="empty-note">Related traditions will appear as the archive grows.</p>
      )}
    </section>
  );
}

function RelatedPlaces({ places }: { places: PublicPlaceLink[] }) {
  return (
    <section className="tradition-panel">
      <h2>Related Places</h2>
      {places.length > 0 ? (
        <>
          <ul className="tradition-place-list">
            {places.slice(0, 3).map((place) => (
              <li key={place.slug}>
                <Link href={`/places/${place.slug}`}>
                  <img src={IMAGE_PLACEHOLDER.url} alt="" />
                  <span>
                    <strong>{place.name}</strong>
                    <small>{place.shortDescription}</small>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <ContextLink href="/places" label="View all places" />
        </>
      ) : (
        <p className="empty-note">Related places will appear after published saints are linked.</p>
      )}
    </section>
  );
}

function ContextLink({ href, label }: { href: Route; label: string }) {
  return (
    <Link className="tradition-context-link" href={href}>
      {label}
      <ArrowRight size={16} aria-hidden="true" />
    </Link>
  );
}

