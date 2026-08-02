import { notFound } from "next/navigation";
import { ExternalLink, MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Prose } from "@/components/content/prose";
import { SaintCard } from "@/components/saints/saint-card";
import { SaintEncounter } from "@/components/saints/saint-encounter";
import { SaintHeroGallery } from "@/components/saints/saint-hero-gallery";
import { SaintProfileActions } from "@/components/saints/saint-profile-actions";
import { SaintProfileSummary } from "@/components/saints/saint-profile-summary";
import { Button } from "@/components/ui/button";
import { ScrollRail } from "@/components/ui/scroll-rail";
import { TaxonomyLinkList } from "@/components/ui/taxonomy-link-list";
import { getPublishedSaintBySlug, getRelatedPublishedSaints } from "@/lib/public-saints";
import { getSaintDetailTemplateContent } from "@/lib/site-content";
import type { PublicImage, PublicSourceSummary } from "@/lib/public-contracts";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const saint = await getPublishedSaintBySlug(slug);
  if (!saint) return {};
  return { title: saint.seo?.title ?? saint.displayName, description: saint.seo?.description ?? saint.shortDescription };
}

export default async function SaintDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const template = getSaintDetailTemplateContent();
  const [saint, relatedSaints] = await Promise.all([
    getPublishedSaintBySlug(slug),
    getRelatedPublishedSaints(slug)
  ]);
  if (!saint) notFound();

  const hasBiography = Boolean(saint.biography?.bodyMarkdown.trim() || saint.biography?.summary?.trim());
  const keyFacts = saint.facts.filter(({ label }) => !["primary place", "places", "tradition", "traditions"].includes(label.toLowerCase()));
  const latestPost = [...saint.instagramItems].sort((left, right) =>
    (right.postedAt ? Date.parse(right.postedAt) : 0) - (left.postedAt ? Date.parse(left.postedAt) : 0)
  )[0];
  const gallery = uniqueImages([saint.heroImage, ...(saint.gallery ?? [])]);

  return (
    <main className="saint-profile">
      <section className="saint-profile-hero">
        <div className="page-shell saint-profile-hero__inner">
          <div className="saint-profile-hero__content">
            <FactGrid
              className="saint-profile-stats"
              facts={[
                ...(keyFacts.length > 0 ? keyFacts : [{ label: template.factLabels.era, value: saint.eraLabel }]),
                ...(saint.placeLinks?.length ? [{ label: "Places", value: <TaxonomyLinkList items={saint.placeLinks.map((place) => ({ href: `/places/${place.slug}`, label: place.name }))} label={`Places associated with ${saint.displayName}`} /> }] : []),
                ...(saint.traditions.length ? [{ label: template.factLabels.tradition, value: <TaxonomyLinkList items={saint.traditions.map((tradition) => ({ href: `/traditions/${tradition.slug}`, label: tradition.name }))} label={`Traditions associated with ${saint.displayName}`} /> }] : [])
              ]}
            />
            <h1>{saint.displayName}</h1>
            {saint.shortDescription ? <SaintProfileSummary>{saint.shortDescription}</SaintProfileSummary> : null}
            {hasBiography || latestPost ? <SaintProfileActions hasBiography={hasBiography} latestPost={latestPost} saintName={saint.displayName} /> : null}
          </div>
          <SaintHeroGallery images={gallery} saintName={saint.displayName} />
        </div>
      </section>

      {hasBiography && saint.biography ? (
        <section className="page-shell section saint-profile-biography" id="biography">
          <article className="saint-detail-main">
            <div className="eyebrow">{template.biographyEyebrow}</div>
            <h2>{saint.biography.title}</h2>
            {saint.biography.summary ? <p className="lede">{saint.biography.summary}</p> : null}
            <Prose markdown={saint.biography.bodyMarkdown} />
          </article>
        </section>
      ) : null}

      {relatedSaints.length > 0 ? (
        <section className="saint-profile-related section">
          <div className="page-shell">
            <div className="section-heading"><h2>Related Saints</h2></div>
            <ScrollRail ariaLabel="related saints" controls="always">
              {relatedSaints.map((related) => <SaintCard key={related.slug} saint={related} variant="portrait" />)}
            </ScrollRail>
          </div>
        </section>
      ) : null}

      <section className="page-shell section saint-profile-encounter">
        <SaintEncounter />
      </section>

      {hasBiography && saint.sources.length > 0 ? (
        <section className="page-shell section saint-profile-sources"><SourceList title="Sources" sources={saint.sources} /></section>
      ) : null}

      {hasBiography ? (
        <section className="page-shell section section--last saint-profile-feedback">
          <Button href={`/contact?type=saint&slug=${encodeURIComponent(saint.slug)}`} variant="secondary" icon={<MessageSquare size={18} aria-hidden="true" />}>Send feedback</Button>
        </section>
      ) : null}
    </main>
  );
}

function FactGrid({ className, facts }: { className?: string; facts: Array<{ label: string; value: ReactNode }> }) {
  return <div className={["fact-grid", className].filter(Boolean).join(" ")}>{facts.map((fact, index) => <div className="fact" key={`${fact.label}-${index}`}><strong>{fact.label}</strong><div className="fact__value">{fact.value}</div></div>)}</div>;
}

function SourceList({ title, sources }: { title: string; sources: PublicSourceSummary[] }) {
  return <section className="source-section"><div className="eyebrow">References</div><h2>{title}</h2><ul className="source-list">{sources.map((source) => <li key={`${source.title}-${source.author ?? source.publisher ?? ""}`}><SourceTitle source={source} /><SourceMeta source={source} />{source.note ? <p>{source.note}</p> : null}</li>)}</ul></section>;
}

function SourceTitle({ source }: { source: PublicSourceSummary }) {
  return source.url ? <h3><a href={source.url}><span>{source.title}</span><ExternalLink size={16} aria-hidden="true" /></a></h3> : <h3>{source.title}</h3>;
}

function SourceMeta({ source }: { source: PublicSourceSummary }) {
  const meta = [source.author, source.publisher, source.publicationYear].filter(Boolean).join(" · ");
  return meta ? <p className="source-meta">{meta}</p> : null;
}

function uniqueImages(images: Array<PublicImage | undefined>) {
  const seen = new Set<string>();
  const unique: PublicImage[] = [];
  for (const image of images) {
    if (!image || seen.has(image.url)) continue;
    seen.add(image.url);
    unique.push(image);
  }
  return unique;
}
