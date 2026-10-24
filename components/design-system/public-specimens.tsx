import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { PublicSearchField } from "@/components/ui/public-search-field";
import { TaxonomyLinkList } from "@/components/ui/taxonomy-link-list";
import { ScrollRail } from "@/components/ui/scroll-rail";
import { SaintCard } from "@/components/saints/saint-card";
import { SaintEncounterCard } from "@/components/saints/saint-encounter-card";
import { SaintProfileSummary } from "@/components/saints/saint-profile-summary";
import { SaintEraRange } from "@/components/saints/saint-era-range";
import { SaintCatalogSelect } from "@/components/saints/saint-catalog-select";
import { SaintHeroGallery } from "@/components/saints/saint-hero-gallery";
import { SaintGallery } from "@/components/saints/saint-gallery";
import { SaintDetailPageContent } from "@/components/saints/saint-detail-page";
import { TraditionCard } from "@/components/traditions/tradition-card";
import { FeaturedTraditionCard } from "@/components/traditions/featured-tradition-card";
import { TraditionPageLayouts } from "@/components/traditions/tradition-page-layouts";
import { PlaceCard } from "@/components/places/place-card";
import { PlaceDetailPageContent } from "@/components/places/place-detail-page";
import { IndexPageHero } from "@/components/layout/index-page-hero";
import { InstagramEmbedGrid } from "@/components/instagram/instagram-embed-grid";
import { InstagramPreviewLink } from "@/components/instagram/instagram-preview-link";
import { Prose } from "@/components/content/prose";
import { SpecimenBoundary, SelectableInstagramSpecimen } from "@/components/design-system/specimen-boundary";
import { specimenImage, specimenMarkdown, specimenSaint, specimenSaints, specimenTradition } from "@/lib/design-system/fixtures";
import { publicVariants } from "@/lib/design-system/public-registry";
import tokens from "@/lib/design-system/tokens.generated.json";
import { saintDetailTemplateContent, traditionDetailTemplateContent, placeDetailTemplateContent } from "@/lib/site-content";

const place = { slug: "design-specimen", name: "Sample Place", shortDescription: "Invented place description for layout review.", saintCount: 8, status: "published" as const };
const sections = ["foundations", "controls", "cards", "rails", "encounter", "editorial", "media", "instagram", "index-hero", "saint-page", "tradition-page", "place-page"];

function Specimen({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return <section className="design-system-specimen" id={id}><div className="page-shell"><header className="section-heading"><h2>{title}</h2><a href="#specimen-index">Back to index</a></header>{children}</div></section>;
}

export function PublicDesignSpecimens() {
  return <main className="design-system-specimens">
    <header className="page-shell section" id="specimen-index"><div className="eyebrow">Private design review · Nocturne</div><h1 className="page-title">Public Design System</h1><p className="lede">Production components, invented content, and current variants. Use Tab to review focus states. Resize the frame to review wrapping.</p><nav className="design-system-toolbar" aria-label="Specimen sections">{sections.map((id) => <a href={`#${id}`} key={id}>{id.replaceAll("-", " ")}</a>)}</nav></header>
    <Specimen id="foundations" title="Foundations">
      <p>Current tokens come from styles/tokens.css. The inventory records declarations, including theme overrides; it does not measure accessibility conformance.</p>
      <div className="design-system-swatches">{["background", "surface", "text", "muted", "gold", "border"].map((role) => <div className={`design-system-swatch design-system-swatch--${role}`} key={role}>{role}</div>)}</div>
      <h2>Serif editorial heading</h2><p className="eyebrow">Sans editorial label</p><p>Body text with <strong>emphasis</strong> and <em>contrast</em>.</p>
      <details><summary>Token declarations ({tokens.length})</summary><div className="design-system-table-scroll"><table className="design-system-inventory"><thead><tr><th scope="col">Layer</th><th scope="col">Token</th><th scope="col">Value</th></tr></thead><tbody>{tokens.map((token, index) => <tr key={index}><td>{token.selector}</td><th scope="row"><code>{token.name}</code></th><td><code>{token.value}</code></td></tr>)}</tbody></table></div></details>
    </Specimen>
    <SpecimenBoundary>
      <Specimen id="controls" title="Controls and linked facts">
        <div className="design-system-toolbar">{publicVariants.button.map((variant) => <Button href="/saints" key={variant} variant={variant}>{variant} navigation</Button>)}</div>
        <form className="design-system-example-stack"><PublicSearchField id="specimen-search" label="Search specimen" placeholder="Search saints" /><SaintEraRange min={1000} max={2000} start={1200} end={1800} />{(["location", "tradition"] as const).map((name) => <SaintCatalogSelect key={name} name={name} label={name} allLabel={`All ${name}s`} options={["Sample", "A long sample option"]} value="" />)}</form>
        <TaxonomyLinkList label="Sample places" items={[{ href: "/places/sample", label: "A long place name, India" }, { href: "/places/other", label: "Another place" }]} />
      </Specimen>
      <Specimen id="cards" title="Domain cards">
        <div className="card-grid">{publicVariants.saintCard.map((variant) => <SaintCard key={variant} saint={specimenSaint} variant={variant} prefetch={false} />)}<SaintCard saint={{ ...specimenSaint, image: undefined, displayName: "Missing portrait" }} prefetch={false} />
          {publicVariants.traditionCard.map((variant) => <TraditionCard key={variant} tradition={specimenTradition} variant={variant} />)}<TraditionCard tradition={specimenTradition} showSaintCount /><PlaceCard place={place} />
          <FeaturedTraditionCard tradition={specimenTradition} focalArea={{ x: 0.5, y: 0.5 }} /><FeaturedTraditionCard tradition={{ ...specimenTradition, status: "basic" }} bannerImage={specimenImage} focalArea={{ x: 0.5, y: 0.5 }} />
        </div>
      </Specimen>
      <Specimen id="rails" title="Eight saints and rail controls">{publicVariants.rail.map((controls) => <div key={controls}><h3>controls={controls}</h3><ScrollRail ariaLabel={`Eight sample saints, ${controls} controls`} controls={controls}>{specimenSaints.map((saint) => <SaintCard key={saint.slug} saint={saint} variant="portrait" prefetch={false} />)}</ScrollRail></div>)}</Specimen>
      <Specimen id="encounter" title="Creative invitation in four contexts"><div className="card-grid">{publicVariants.encounter.map((variant) => <SaintEncounterCard key={variant} variant={variant} />)}</div></Specimen>
      <Specimen id="editorial" title="Editorial text"><Prose markdown={specimenMarkdown} />{publicVariants.summary.map((variant) => <div key={variant}><h3>{variant} summary</h3><SaintProfileSummary variant={variant}>{specimenSaint.shortDescription}</SaintProfileSummary></div>)}</Specimen>
      <Specimen id="media" title="Images and galleries"><div className="card-grid"><SaintHeroGallery images={[specimenImage, { ...specimenImage, url: "/images/hindu-saints-share.jpg" }]} saintName="Design specimen" /><SaintHeroGallery images={[]} saintName="Missing image specimen" /></div><SaintGallery images={[specimenImage, { ...specimenImage, url: "/images/hindu-saints-share.jpg" }]} saintName="Design specimen" /></Specimen>
      <Specimen id="instagram" title="Instagram presentations"><div className="card-grid"><InstagramPreviewLink alt="Design specimen" imageUrl={specimenImage.url} url="https://www.instagram.com/hindu_saints/" /><SelectableInstagramSpecimen imageUrl={specimenImage.url} /></div>{(["section", "sidebar"] as const).map((layout) => <div key={layout}><h3>{layout} · modal</h3><InstagramEmbedGrid items={specimenSaint.instagramItems} saintName="Design specimen" layout={layout} /></div>)}<h3>Inline presentation</h3><InstagramEmbedGrid items={specimenSaint.instagramItems} saintName="Design specimen" presentation="inline" /></Specimen>
      <Specimen id="index-hero" title="Directory headings"><IndexPageHero eyebrow="Directory" title="Explore the saints" description="An example without a banner." /><IndexPageHero eyebrow="Directory" title="Explore the traditions" description="An example with a banner." image={specimenImage} /></Specimen>
      <section id="saint-page"><div className="page-shell"><h2>Complete saint composition</h2><p>Includes biography, sources, facts and eight related saints.</p></div><SaintDetailPageContent rootElement="div" saint={specimenSaint} relatedSaints={specimenSaints} featuredSaints={[]} template={saintDetailTemplateContent} /></section>
      <section><div className="page-shell"><h2>Sparse saint and featured fallback</h2></div><SaintDetailPageContent rootElement="div" saint={{ ...specimenSaint, displayName: "Sparse sample profile", heroImage: undefined, gallery: [], biography: undefined, sources: [], instagramItems: [], shortDescription: "A short, invented overview." }} relatedSaints={[]} featuredSaints={specimenSaints} template={saintDetailTemplateContent} /></section>
      <section id="tradition-page"><div className="page-shell"><h2>Complete tradition composition</h2></div><TraditionPageLayouts rootElement="div" tradition={specimenTradition} template={traditionDetailTemplateContent} /></section>
      <section id="place-page"><div className="page-shell"><h2>Place composition · empty collection</h2></div><PlaceDetailPageContent rootElement="div" place={{ ...place, saintCount: 0, saints: [], traditions: [], eras: [] }} template={placeDetailTemplateContent} /></section>
    </SpecimenBoundary>
  </main>;
}
