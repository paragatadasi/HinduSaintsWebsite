import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, MapPinned, MessageSquare, Network } from "lucide-react";
import { Prose } from "@/components/content/prose";
import { Button } from "@/components/ui/button";
import type { TraditionDetailTemplateContent } from "@/lib/site-content";
import type {
  PublicImage,
  PublicPlaceLink,
  PublicSaintSummary,
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

export function TraditionPageLayouts({ tradition, template }: TraditionPageLayoutsProps) {
  const historyMarkdown = tradition.introductionMarkdown ?? template.placeholderMarkdown;
  const featuredSaints = getLineageSaints(tradition);
  const founder = getFounderSaint(tradition);

  return (
    <main className="tradition-detail">
      <TraditionHero tradition={tradition} />
      <div className="page-shell tradition-detail__divider" />
      <div className="page-shell tradition-detail__content">
        <article className="tradition-detail__main">
          <NarrativeSection
            title="Founding Acharya"
            body={getFoundingSummary(tradition, founder, historyMarkdown)}
          />
          <LineageTree saints={featuredSaints} founderName={tradition.founder} />
          <section className="tradition-section tradition-section--history">
            <h2>History</h2>
            <Prose markdown={historyMarkdown} />
          </section>
          <NarrativeSection
            title="Key Teachings"
            body={getTeachingSummary(tradition)}
          />
        </article>
        <aside className="tradition-detail__aside" aria-label={`${tradition.name} context`}>
          <TraditionOverviewPanel tradition={tradition} founder={founder} />
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
      <p>{body}</p>
    </section>
  );
}

function LineageTree({
  saints,
  founderName
}: {
  saints: PublicSaintSummary[];
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
  saint: PublicSaintSummary;
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
          <small>{saint.eraLabel}</small>
        </span>
      ) : null}
    </Link>
  );
}

function TraditionOverviewPanel({
  tradition,
  founder
}: {
  tradition: PublicTraditionDetail;
  founder?: PublicSaintSummary;
}) {
  const facts = [
    ["Founder", tradition.founder ?? "In review"],
    ["Origin", founder?.primaryLocation ?? tradition.relatedPlaces[0]?.name ?? "In review"],
    ["Era", founder?.eraLabel ?? "In review"],
    ["Focus", getFocusLabel(tradition)],
    ["Scriptural Basis", getSourceSummary(tradition)]
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
    </section>
  );
}

function RelatedTraditions({ traditions }: { traditions: PublicTraditionLink[] }) {
  return (
    <section className="tradition-panel">
      <h2>Related Traditions</h2>
      {traditions.length > 0 ? (
        <>
          <div className="tradition-context-thumbs">
            {traditions.slice(0, 2).map((tradition) => (
              <Link key={tradition.slug} href={`/traditions/${tradition.slug}`} aria-label={tradition.name}>
                <img src={IMAGE_PLACEHOLDER.url} alt="" />
              </Link>
            ))}
          </div>
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

function getFounderSaint(tradition: PublicTraditionDetail) {
  if (!tradition.founder) return undefined;
  return tradition.saints.find((saint) => saint.displayName === tradition.founder);
}

function getLineageSaints(tradition: PublicTraditionDetail) {
  const saints = [...tradition.saints];
  if (!tradition.founder) return saints;

  return saints.sort((first, second) => {
    if (first.displayName === tradition.founder) return -1;
    if (second.displayName === tradition.founder) return 1;
    return first.displayName.localeCompare(second.displayName);
  });
}

function getFoundingSummary(
  tradition: PublicTraditionDetail,
  founder: PublicSaintSummary | undefined,
  markdown: string
) {
  if (founder) {
    return `${tradition.name} is associated with ${founder.displayName}, whose profile is currently connected to ${founder.primaryLocation} and the era ${founder.eraLabel}. ${tradition.shortDescription}`;
  }

  return getFirstParagraph(markdown) || tradition.shortDescription;
}

function getTeachingSummary(tradition: PublicTraditionDetail) {
  if (tradition.sources && tradition.sources.length > 0) {
    return `Editorial sources for ${tradition.name} are being used to refine a concise teaching summary. Current source coverage includes ${getSourceSummary(tradition)}.`;
  }

  return "A concise teaching summary is in review. Published tradition pages will keep this section focused on reviewed doctrine, practice, lineage, and source-backed context.";
}

function getFocusLabel(tradition: PublicTraditionDetail) {
  const sentence = tradition.shortDescription.split(/[.!?]/)[0]?.trim();
  return sentence || "In review";
}

function getSourceSummary(tradition: PublicTraditionDetail) {
  const sources = tradition.sources ?? [];
  if (sources.length === 0) return "In review";

  return sources.slice(0, 2).map((source) => source.title).join(", ");
}

function getFirstParagraph(markdown: string) {
  return markdown
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/^#+\s*/, "").trim())
    .find(Boolean);
}
