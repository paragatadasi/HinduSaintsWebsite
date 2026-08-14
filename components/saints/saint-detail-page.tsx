import { ArrowRight, BookOpen, ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { SaintCard } from "@/components/saints/saint-card";
import { SaintBiography } from "@/components/saints/saint-biography";
import { SaintEncounter } from "@/components/saints/saint-encounter";
import { SaintHeroGallery } from "@/components/saints/saint-hero-gallery";
import { SaintProfileActions } from "@/components/saints/saint-profile-actions";
import { SaintProfileSummary } from "@/components/saints/saint-profile-summary";
import { Button } from "@/components/ui/button";
import { ScrollRail } from "@/components/ui/scroll-rail";
import { TaxonomyLinkList } from "@/components/ui/taxonomy-link-list";
import type { PublicImage, PublicRelatedSaintSummary, PublicSaintDetail, PublicSourceSummary } from "@/lib/public-contracts";
import { getSourceDisplayTitle } from "@/lib/source-display";
import type { SaintDetailTemplateContent } from "@/lib/site-content";

export function SaintDetailPageContent({
  relatedSaints,
  rootElement: Root = "main",
  saint,
  template
}: {
  relatedSaints: PublicRelatedSaintSummary[];
  rootElement?: "main" | "div";
  saint: PublicSaintDetail;
  template: SaintDetailTemplateContent;
}) {
  const hasBiography = Boolean(saint.biography?.bodyMarkdown.trim() || saint.biography?.summary?.trim());
  const hasSources = hasBiography && saint.sources.length > 0;
  const keyFacts = saint.facts.filter(({ label }) => !["primary place", "places", "tradition", "traditions"].includes(label.toLowerCase()));
  const latestPost = [...saint.instagramItems].sort((left, right) =>
    (right.postedAt ? Date.parse(right.postedAt) : 0) - (left.postedAt ? Date.parse(left.postedAt) : 0)
  )[0];
  const gallery = uniqueImages([saint.heroImage, ...(saint.gallery ?? [])]);

  return (
    <Root className="saint-profile">
      <section className="saint-profile-hero">
        <div className="page-shell saint-profile-hero__inner">
          <div className="saint-profile-hero__content">
            <h1>{saint.displayName}</h1>
            <FactGrid
              className="saint-profile-stats"
              facts={[
                ...(keyFacts.length > 0 ? keyFacts : [{ label: template.factLabels.era, value: saint.eraLabel }]),
                ...(saint.placeLinks?.length ? [{ label: "Places", value: <TaxonomyLinkList items={saint.placeLinks.map((place) => ({ href: `/places/${place.slug}`, label: place.name }))} label={`Places associated with ${saint.displayName}`} /> }] : []),
                ...(saint.traditions.length ? [{ label: template.factLabels.tradition, value: <TaxonomyLinkList items={saint.traditions.map((tradition) => ({ href: `/traditions/${tradition.slug}`, label: tradition.name }))} label={`Traditions associated with ${saint.displayName}`} /> }] : [])
              ]}
            />
            {saint.shortDescription ? <SaintProfileSummary>{saint.shortDescription}</SaintProfileSummary> : null}
            <SaintProfileActions
              feedbackHref={`/contact?type=saint&slug=${encodeURIComponent(saint.slug)}`}
              hasBiography={hasBiography}
              latestPost={latestPost}
              saintName={saint.displayName}
            />
          </div>
          <SaintHeroGallery images={gallery} saintName={saint.displayName} />
        </div>
      </section>

      {hasBiography && saint.biography ? (
        <SaintBiography biography={saint.biography} eyebrow={template.biographyEyebrow} sources={saint.sources} />
      ) : null}

      {relatedSaints.length > 0 ? (
        <section className={`saint-profile-related section${hasSources ? "" : " section--last"}`}>
          <div className="page-shell">
            <div className="section-heading">
              <h2>Related Saints</h2>
              <Button href="/saints" variant="text" icon={<ArrowRight size={16} />} iconPosition="end">
                View all saints
              </Button>
            </div>
            <ScrollRail ariaLabel="related saints" controls="always">
              {relatedSaints.map((related) => (
                <SaintCard imageTag={related.relationshipLabel} key={related.slug} prefetch={false} saint={related} variant="portrait" />
              ))}
            </ScrollRail>
          </div>
        </section>
      ) : null}

      {relatedSaints.length === 0 ? (
        <section className={`page-shell section saint-profile-encounter${hasSources ? "" : " section--last"}`}>
          <SaintEncounter />
        </section>
      ) : null}

      {hasSources ? (
        <section className="section section--last saint-profile-sources">
          <div className="page-shell"><SourceList sources={saint.sources} /></div>
        </section>
      ) : null}
    </Root>
  );
}

function FactGrid({ className, facts }: { className?: string; facts: Array<{ label: string; value: ReactNode }> }) {
  return <div className={["fact-grid", className].filter(Boolean).join(" ")}>{facts.map((fact, index) => <div className="fact" key={`${fact.label}-${index}`}><strong>{fact.label}</strong><div className="fact__value">{fact.value}</div></div>)}</div>;
}

function SourceList({ sources }: { sources: PublicSourceSummary[] }) {
  return <section className="source-section"><h2>Sources &amp; Further Reading</h2><ul className="source-list">{sources.map((source) => <SourceItem key={`${source.id ?? source.title}-${source.author ?? source.publisher ?? ""}`} source={source} />)}</ul></section>;
}

function SourceItem({ source }: { source: PublicSourceSummary }) {
  const title = getSourceDisplayTitle(source);
  const content = <><BookOpen className="source-list__book" size={30} strokeWidth={1.6} aria-hidden="true" /><div className="source-list__content"><h3>{title}</h3>{source.note ? <p>{source.note}</p> : null}<SourceMeta source={source} /></div>{source.url ? <ExternalLink className="source-list__external" size={24} strokeWidth={1.8} aria-hidden="true" /> : null}</>;
  return <li id={source.id ? `source-${source.id}` : undefined}>{source.url ? <a className="source-list__link" href={source.url} rel="noreferrer" target="_blank" aria-label={`${title} (opens in a new tab)`}>{content}</a> : <div className="source-list__link">{content}</div>}</li>;
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
