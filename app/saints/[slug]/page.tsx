import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink, MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { InstagramEmbedGrid } from "@/components/instagram/instagram-embed-grid";
import { Prose } from "@/components/content/prose";
import { Button } from "@/components/ui/button";
import { getPublishedSaintBySlug } from "@/lib/public-saints";
import { getSaintDetailTemplateContent } from "@/lib/site-content";
import type { PublicFurtherReadingItem, PublicImage, PublicSourceSummary } from "@/lib/public-contracts";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const saint = await getPublishedSaintBySlug(slug);

  if (!saint) return {};

  return {
    title: saint.seo?.title ?? saint.displayName,
    description: saint.seo?.description ?? saint.shortDescription
  };
}

export default async function SaintDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const template = getSaintDetailTemplateContent();
  const saint = await getPublishedSaintBySlug(slug);

  if (!saint) notFound();

  const hasBiography = Boolean(
    saint.biography?.bodyMarkdown.trim() || saint.biography?.summary?.trim()
  );
  const placeLinks = saint.placeLinks ?? [];
  const keyFacts = saint.facts.filter(
    ({ label }) => !["primary place", "places", "tradition", "traditions"].includes(label.toLowerCase())
  );
  const hasSources = saint.sources.length > 0;
  const hasFurtherReading = saint.furtherReading.length > 0;
  const hasInstagram = saint.instagramItems.length > 0 || saint.instagramUrls.length > 0;

  return (
    <main>
      <section className="saint-detail-hero">
        <div className="page-shell saint-detail-hero__inner">
          <div className="saint-detail-hero__content">
            <div className="eyebrow">{saint.tradition}</div>
            <h1>{saint.displayName}</h1>
            <p>{saint.shortDescription}</p>
            <div className="saint-detail-actions">
              <Button
                href={`/contact?saint=${encodeURIComponent(saint.displayName)}&page=${encodeURIComponent(`/saints/${saint.slug}`)}`}
                variant="secondary"
                icon={<MessageSquare size={18} aria-hidden="true" />}
              >
                Send feedback
              </Button>
            </div>
            {saint.aliases.length > 0 ? (
              <div className="chip-list" aria-label="Aliases">
                {saint.aliases.map((alias) => (
                  <span className="chip" key={alias}>{alias}</span>
                ))}
              </div>
            ) : null}
          </div>
          <ImageWithCredit image={saint.heroImage} label={`${saint.displayName} portrait`} />
        </div>
      </section>

      <section className="page-shell section">
        <FactGrid
          facts={[
            ...(keyFacts.length > 0 ? keyFacts : [{ label: template.factLabels.era, value: saint.eraLabel }]),
            ...(placeLinks.length > 0 ? [{
              label: "Places",
              value: (
                <span className="fact-links">
                  {placeLinks.map((place) => (
                    <Link href={`/places/${place.slug}`} key={place.slug}>{place.name}</Link>
                  ))}
                </span>
              )
            }] : []),
            ...(saint.traditions.length > 0 ? [{
              label: template.factLabels.tradition,
              value: (
                <span className="fact-links">
                  {saint.traditions.map((tradition) => (
                    <Link href={`/traditions/${tradition.slug}`} key={tradition.slug}>{tradition.name}</Link>
                  ))}
                </span>
              )
            }] : [])
          ]}
        />
      </section>

      {hasBiography || hasInstagram ? (
        <section className="page-shell section saint-detail-layout">
          {hasBiography && saint.biography ? (
            <article className="saint-detail-main">
              <div className="eyebrow">{template.biographyEyebrow}</div>
              <h2>{saint.biography.title}</h2>
              {saint.biography.summary ? <p className="lede">{saint.biography.summary}</p> : null}
              <Prose markdown={saint.biography.bodyMarkdown} />
            </article>
          ) : null}
          {hasInstagram ? (
            <aside className="saint-detail-aside saint-detail-aside--instagram" aria-label={`Instagram posts about ${saint.displayName}`}>
              <InstagramEmbedGrid
                items={saint.instagramItems}
                layout="sidebar"
                saintName={saint.displayName}
                urls={saint.instagramUrls}
              />
            </aside>
          ) : null}
        </section>
      ) : null}

      {saint.gallery && saint.gallery.length > 1 ? (
        <section className="page-shell section">
          <div className="section-heading section-heading--text">
            <div>
              <div className="eyebrow">Media</div>
              <h2>Reviewed Images</h2>
            </div>
          </div>
          <div className="media-grid">
            {saint.gallery.map((image) => (
              <ImageWithCredit image={image} key={`${image.url}-${image.alt}`} label={image.alt} />
            ))}
          </div>
        </section>
      ) : null}

      {hasSources || hasFurtherReading ? (
        <section className="page-shell section saint-detail-layout section--last">
          {hasSources ? <SourceList title="Sources" sources={saint.sources} /> : null}
          {hasFurtherReading ? <FurtherReading items={saint.furtherReading} /> : null}
        </section>
      ) : null}
    </main>
  );
}

function FactGrid({ facts }: { facts: Array<{ label: string; value: ReactNode }> }) {
  return (
    <div className="fact-grid">
      {facts.map((fact) => (
        <div className="fact" key={`${fact.label}-${fact.value}`}>
          <strong>{fact.label}</strong>
          <p>{fact.value}</p>
        </div>
      ))}
    </div>
  );
}

function ImageWithCredit({ image, label }: { image?: PublicImage; label: string }) {
  if (!image) {
    return (
      <div className="image-with-credit image-with-credit--empty" aria-label={label}>
        <p>Reviewed public image pending</p>
      </div>
    );
  }

  return (
    <figure className="image-with-credit">
      <img src={image.url} alt={image.alt} width={image.width} height={image.height} />
      {image.caption || image.credit ? (
        <figcaption>
          {image.caption ? <span>{image.caption}</span> : null}
          {image.credit ? <small>{image.credit}</small> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}

function SourceList({ title, sources }: { title: string; sources: PublicSourceSummary[] }) {
  return (
    <section className="source-section">
      <div className="eyebrow">References</div>
      <h2>{title}</h2>
      <ul className="source-list">
        {sources.map((source) => (
          <li key={`${source.title}-${source.author ?? source.publisher ?? ""}`}>
            <SourceTitle source={source} />
            <SourceMeta source={source} />
            {source.note ? <p>{source.note}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function FurtherReading({ items }: { items: PublicFurtherReadingItem[] }) {
  return (
    <section className="source-section">
      <div className="eyebrow">Further Reading</div>
      <h2>Continue Exploring</h2>
      <ul className="source-list">
        {items.map((item) => (
          <li key={`${item.title}-${item.label ?? ""}`}>
            {item.label ? <span className="source-label">{item.label}</span> : null}
            <SourceTitle source={item} />
            <SourceMeta source={item} />
            {item.note ? <p>{item.note}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function SourceTitle({ source }: { source: PublicSourceSummary }) {
  if (!source.url) return <h3>{source.title}</h3>;

  return (
    <h3>
      <a href={source.url}>
        {source.title}
        <ExternalLink size={16} aria-hidden="true" />
      </a>
    </h3>
  );
}

function SourceMeta({ source }: { source: PublicSourceSummary }) {
  const meta = [source.author, source.publisher, source.publicationYear].filter(Boolean).join(" · ");

  return meta ? <p className="source-meta">{meta}</p> : null;
}
