import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Instagram, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HomeInstagramRail } from "@/components/instagram/home-instagram-rail";
import { IndiaSaintsMap } from "@/components/places/india-saints-map";
import { ScrollRail } from "@/components/ui/scroll-rail";
import { FocalImage } from "@/components/ui/focal-image";
import { PublicSearchField } from "@/components/ui/public-search-field";
import { SaintCard } from "@/components/saints/saint-card";
import { TraditionCard } from "@/components/traditions/tradition-card";
import { FeaturedTraditionCard } from "@/components/traditions/featured-tradition-card";
import { getPublicHomePageConfig } from "@/lib/home-page-config";
import { INDIA_STATE_MAP_SHAPES, type IndiaStateMapShape } from "@/lib/india-state-map-shapes";
import { getRecentInstagramCarouselPreviews } from "@/lib/public-instagram";
import { getIndiaPlaceMapData } from "@/lib/public-places";
import { getFeaturedSaintSummaries, getPublishedSaintSummaries } from "@/lib/public-saints";
import { getPublishedTraditionSummaries } from "@/lib/public-traditions";
import type { PublicImage, PublicPlaceMapData } from "@/lib/public-contracts";
import { getHomeLayoutVariant, getPlacesMapContent, type HomeHeroContent, type HomeSectionContent, type HomeQuoteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const layout = getHomeLayoutVariant();
  const [homeConfig, featuredSaints, publishedSaints, traditions, instagramPreviews, mapData] = await Promise.all([
    getPublicHomePageConfig(),
    getFeaturedSaintSummaries(),
    getPublishedSaintSummaries(),
    getPublishedTraditionSummaries(),
    getRecentInstagramCarouselPreviews(),
    getIndiaPlaceMapData()
  ]);
  const hero = homeConfig.hero;
  const quote = homeConfig.quote;
  const { featuredSaints: featuredSaintsSection, instagram: instagramSection, map: mapSection, traditions: traditionsSection } = homeConfig.sections;
  const configuredFeaturedSaints = homeConfig.featuredSaints.length > 0 ? homeConfig.featuredSaints : featuredSaints;
  const configuredTraditions = homeConfig.featuredTraditions.length > 0 ? homeConfig.featuredTraditions : traditions;
  const configuredTraditionPlacements = homeConfig.featuredTraditionPlacements.length > 0
    ? homeConfig.featuredTraditionPlacements
    : configuredTraditions.slice(0, 5).map((tradition) => ({
        tradition,
        bannerImage: undefined,
        focalArea: { x: 50, y: 50, width: 60, height: 60 }
      }));
  const saints = uniqueSaintsBySlug([
    ...configuredFeaturedSaints,
    ...publishedSaints
  ]).slice(0, 6);

  if (layout === "archive") {
    return (
      <ArchiveHomePage
        hero={hero}
        featuredSaintsSection={featuredSaintsSection}
        traditionsSection={traditionsSection}
        instagramSection={instagramSection}
        saints={saints}
        traditions={configuredTraditions}
        bannerImage={homeConfig.bannerImage}
      />
    );
  }

  if (layout === "cosmic") {
    return (
      <CosmicHomePage
        hero={hero}
        featuredSaintsSection={featuredSaintsSection}
        traditionsSection={traditionsSection}
        instagramSection={instagramSection}
        mapSection={mapSection}
        quote={quote}
        saints={saints}
        traditions={configuredTraditions}
        traditionPlacements={configuredTraditionPlacements}
        instagramPreviews={instagramPreviews}
        mapData={mapData}
        bannerImage={homeConfig.bannerImage}
        bannerFocalArea={homeConfig.bannerFocalArea}
      />
    );
  }

  return (
    <main className="home home--devotional">
      <section className="hero">
        <div className="page-shell hero__inner">
          <div className="hero__content">
            <div className="hero__symbol" aria-hidden="true">{hero.eyebrow}</div>
            <h1>{hero.title}</h1>
            <p>{hero.body}</p>
            <form action={hero.primaryAction.href}>
              <PublicSearchField
                id="home-search"
                label="Search saints"
                placeholder={hero.primaryAction.label}
              />
            </form>
          </div>
          <HomeHeroImage image={homeConfig.bannerImage} className="hero-media" />
        </div>
      </section>

      <section className="section">
        <div className="page-shell">
          <div className="section-heading">
            <div>
              {featuredSaintsSection.eyebrow ? <div className="eyebrow">{featuredSaintsSection.eyebrow}</div> : null}
              <h2>{featuredSaintsSection.title}</h2>
            </div>
            {featuredSaintsSection.action ? (
              <Button href={featuredSaintsSection.action.href} variant="text" icon={<ArrowRight size={16} />} iconPosition="end">
                {featuredSaintsSection.action.label}
              </Button>
            ) : null}
          </div>
          <ScrollRail ariaLabel="featured saints" controls="always">
            {saints.map((saint) => <SaintCard key={saint.slug} saint={saint} variant="portrait" />)}
          </ScrollRail>
        </div>
      </section>

      <section className="section section--surface">
        <div className="page-shell">
          <div className="section-heading">
            <div>
              {traditionsSection.eyebrow ? <div className="eyebrow">{traditionsSection.eyebrow}</div> : null}
              <h2>{traditionsSection.title}</h2>
            </div>
            {traditionsSection.action ? (
              <Button href={traditionsSection.action.href} variant="text" icon={<ArrowRight size={16} />} iconPosition="end">
                {traditionsSection.action.label}
              </Button>
            ) : null}
          </div>
          {configuredTraditions.length > 0 ? (
            <ScrollRail ariaLabel="traditions" controls="always">
              {configuredTraditions.map((tradition) => <TraditionCard key={tradition.slug} tradition={tradition} variant="icon" />)}
            </ScrollRail>
          ) : (
            <p className="empty-note">Published traditions will appear here after editorial review.</p>
          )}
        </div>
      </section>

      <section className="section section--last">
        <div className="page-shell">
          <div className="section-heading">
            <div>
              {instagramSection.eyebrow ? <div className="eyebrow">{instagramSection.eyebrow}</div> : null}
              <h2>{instagramSection.title}</h2>
            </div>
            <Button href={hero.secondaryAction.href} variant="text" icon={<ArrowRight size={16} />} iconPosition="end">
              Follow @hindu_saints
            </Button>
          </div>
          {instagramPreviews.length > 0 ? (
            <HomeInstagramRail previews={instagramPreviews} />
          ) : (
            <p className="empty-note">Instagram carousel posts will appear here after import.</p>
          )}
        </div>
      </section>
    </main>
  );
}

type ArchiveHomePageProps = {
  hero: HomeHeroContent;
  featuredSaintsSection: HomeSectionContent;
  traditionsSection: HomeSectionContent;
  instagramSection: HomeSectionContent;
  saints: Awaited<ReturnType<typeof getPublishedSaintSummaries>>;
  traditions: Awaited<ReturnType<typeof getPublishedTraditionSummaries>>;
  bannerImage?: PublicImage;
};

type CosmicHomePageProps = {
  hero: HomeHeroContent;
  featuredSaintsSection: HomeSectionContent;
  traditionsSection: HomeSectionContent;
  instagramSection: HomeSectionContent;
  mapSection: HomeSectionContent;
  quote: HomeQuoteContent;
  saints: Awaited<ReturnType<typeof getPublishedSaintSummaries>>;
  traditions: Awaited<ReturnType<typeof getPublishedTraditionSummaries>>;
  traditionPlacements: Awaited<ReturnType<typeof getPublicHomePageConfig>>["featuredTraditionPlacements"];
  instagramPreviews: Awaited<ReturnType<typeof getRecentInstagramCarouselPreviews>>;
  mapData: PublicPlaceMapData;
  bannerImage?: PublicImage;
  bannerFocalArea: Awaited<ReturnType<typeof getPublicHomePageConfig>>["bannerFocalArea"];
};

function CosmicHomePage({
  hero,
  featuredSaintsSection,
  traditionsSection,
  instagramSection,
  mapSection,
  quote,
  saints,
  traditions,
  traditionPlacements,
  instagramPreviews,
  mapData,
  bannerImage,
  bannerFocalArea
}: CosmicHomePageProps) {
  const mapContent = getPlacesMapContent();
  const stateSaintCountsBySlug = getStateSaintCountsBySlug(mapData);

  return (
    <main className="home home--cosmic">
      <div className="page-shell home-cosmic__frame">
        <section className={bannerImage ? "home-cosmic-hero home-cosmic-hero--with-banner" : "home-cosmic-hero"}>
          {bannerImage ? (
            <HomeHeroImage
              image={bannerImage}
              className="home-cosmic-hero__banner"
              focalArea={bannerFocalArea}
              preserveFocalArea={shouldPreserveFullBannerArea(bannerFocalArea)}
            />
          ) : null}
          <div className="home-cosmic-hero__inner home-cosmic__section-inner">
            <div className="home-cosmic-hero__content">
              <div className="eyebrow">{hero.eyebrow}</div>
              <h1>{hero.title}</h1>
              <p>{hero.body}</p>
              <form action={hero.primaryAction.href}>
                <PublicSearchField
                  id="home-cosmic-search"
                  label="Search saints"
                  placeholder={hero.primaryAction.label}
                />
              </form>
            </div>
          </div>
        </section>

        <section className="home-cosmic-panel">
          <div className="home-cosmic__section-inner">
            <div className="section-heading home-cosmic-heading">
              <div>
                {featuredSaintsSection.eyebrow ? <div className="eyebrow">{featuredSaintsSection.eyebrow}</div> : null}
                <h2>{featuredSaintsSection.title}</h2>
              </div>
              {featuredSaintsSection.action ? (
                <Button href={featuredSaintsSection.action.href} variant="text" icon={<ArrowRight size={16} />} iconPosition="end">
                  {featuredSaintsSection.action.label}
                </Button>
              ) : null}
            </div>
            <ScrollRail ariaLabel="featured saints" className="home-cosmic-rail" controls="always">
              {saints.map((saint) => <SaintCard key={saint.slug} saint={saint} variant="portrait" />)}
            </ScrollRail>
          </div>
        </section>

        <section className="home-cosmic-panel home-cosmic-map-panel">
          <div className="home-cosmic__section-inner">
            <div className="section-heading home-cosmic-heading">
              <div>
                {mapSection.eyebrow ? <div className="eyebrow">{mapSection.eyebrow}</div> : null}
                <h2>{mapSection.title}</h2>
              </div>
              <Button href="/map" variant="text" icon={<ArrowRight size={16} />} iconPosition="end">
                Explore map
              </Button>
            </div>
            <IndiaSaintsMap
              content={mapContent}
              mapData={mapData}
              stateLayerMarkup={getIndiaStateLayerMarkup(stateSaintCountsBySlug)}
              stateNamesBySlug={getStateNamesBySlug()}
            />
          </div>
        </section>

        <section className="home-cosmic-panel home-cosmic-quote-panel">
          <aside className="home-quote-card">
            <div className="home-quote-card__label">{quote.eyebrow}</div>
            <blockquote>
              <p>{quote.quote}</p>
              <cite>
                {quote.attributionHref
                  ? <Link href={quote.attributionHref}>{quote.attribution}</Link>
                  : quote.attribution}
              </cite>
            </blockquote>
          </aside>
        </section>

        <section className="home-cosmic-panel home-cosmic-traditions-panel">
          <div className="home-cosmic__section-inner">
            <div className="section-heading home-cosmic-heading">
              <div>
                {traditionsSection.eyebrow ? <div className="eyebrow">{traditionsSection.eyebrow}</div> : null}
                <h2>{traditionsSection.title}</h2>
              </div>
              {traditionsSection.action ? (
                <Button href={traditionsSection.action.href} variant="text" icon={<ArrowRight size={16} />} iconPosition="end">
                  {traditionsSection.action.label}
                </Button>
              ) : null}
            </div>
            {traditionPlacements.length > 0 ? (
              <div className="home-tradition-mosaic">
                {traditionPlacements.slice(0, 5).map((placement) => (
                  <FeaturedTraditionCard
                    bannerImage={placement.bannerImage}
                    focalArea={placement.focalArea}
                    key={placement.tradition.slug}
                    tradition={placement.tradition}
                  />
                ))}
              </div>
            ) : (
              <p className="empty-note">Published traditions will appear here after editorial review.</p>
            )}
            </div>
        </section>

        <section className="home-cosmic-panel home-cosmic-panel--last">
          <div className="home-cosmic__section-inner">
          <div className="section-heading home-cosmic-heading">
            <div>
              {instagramSection.eyebrow ? <div className="eyebrow">{instagramSection.eyebrow}</div> : null}
              <h2>{instagramSection.title}</h2>
            </div>
            <Button href={hero.secondaryAction.href} variant="text" icon={<ArrowRight size={16} />} iconPosition="end">
              Follow @hindu_saints
            </Button>
          </div>
          {instagramPreviews.length > 0 ? (
            <HomeInstagramRail previews={instagramPreviews} />
          ) : (
            <p className="empty-note">Instagram carousel posts will appear here after import.</p>
          )}
          </div>
        </section>
      </div>
    </main>
  );
}

function getIndiaStateLayerMarkup(stateSaintCountsBySlug: Map<string, number>) {
  return INDIA_STATE_MAP_SHAPES.map((state) => {
    const activeSlug = getActiveStateSlug(state, stateSaintCountsBySlug);
    const saintCount = activeSlug ? stateSaintCountsBySlug.get(activeSlug) ?? 0 : 0;
    const isActive = saintCount > 0;
    const label = isActive ? `${state.name}, ${saintCount} ${saintCount === 1 ? "saint" : "saints"}` : state.name;
    const attributes = [
      `aria-label="${escapeSvgAttribute(label)}"`,
      `class="${isActive ? "places-map__state places-map__state--active" : "places-map__state"}"`,
      `d="${escapeSvgAttribute(state.path)}"`,
      activeSlug ? `data-state-slug="${escapeSvgAttribute(activeSlug)}"` : "",
      isActive ? `role="button"` : "",
      isActive ? `tabindex="0"` : ""
    ].filter(Boolean).join(" ");

    return `<path ${attributes}></path>`;
  }).join("");
}

function getStateSaintCountsBySlug(mapData: PublicPlaceMapData) {
  const saintSlugsByStateSlug = new Map<string, Set<string>>();
  for (const point of mapData.points) {
    const stateSlug = point.stateSlug ?? (point.placeScope === "state" ? point.slug : undefined);
    if (!stateSlug) continue;
    const saintSlugs = saintSlugsByStateSlug.get(stateSlug) ?? new Set<string>();
    point.saints.forEach((saint) => saintSlugs.add(saint.slug));
    saintSlugsByStateSlug.set(stateSlug, saintSlugs);
  }
  return new Map(Array.from(saintSlugsByStateSlug.entries()).map(([slug, saintSlugs]) => [slug, saintSlugs.size]));
}

function getStateNamesBySlug() {
  return Object.fromEntries(INDIA_STATE_MAP_SHAPES.flatMap((state) => [
    [state.slug, state.name],
    ...(state.aliases ?? []).map((alias) => [alias, state.name])
  ]));
}

function getActiveStateSlug(state: IndiaStateMapShape, stateSaintCountsBySlug: Map<string, number>) {
  if (stateSaintCountsBySlug.has(state.slug)) return state.slug;
  return state.aliases?.find((alias) => stateSaintCountsBySlug.has(alias));
}

function escapeSvgAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function ArchiveHomePage({ hero, featuredSaintsSection, traditionsSection, saints, traditions, bannerImage }: ArchiveHomePageProps) {
  return (
    <main className="home home--archive">
      <section className="page-shell hero">
        <div>
          <div className="eyebrow">{hero.eyebrow}</div>
          <h1>{hero.title}</h1>
          <p>{hero.body}</p>
          <div className="cluster hero-actions">
            <Button href={hero.primaryAction.href} icon={<Search size={18} />}>Explore saints</Button>
            <Button href={hero.secondaryAction.href} variant="secondary" icon={<Instagram size={18} />}>
              {hero.secondaryAction.label}
            </Button>
          </div>
        </div>
        <HomeHeroImage image={bannerImage} className="hero-media" />
      </section>

      <section className="section">
        <div className="page-shell">
          <div className="section-heading">
            <div>
              {featuredSaintsSection.eyebrow ? <div className="eyebrow">{featuredSaintsSection.eyebrow}</div> : null}
              <h2>{featuredSaintsSection.title}</h2>
            </div>
            {featuredSaintsSection.action ? (
              <Button href={featuredSaintsSection.action.href} variant="text" icon={<ArrowRight size={16} />} iconPosition="end">
                {featuredSaintsSection.action.label}
              </Button>
            ) : null}
          </div>
          <div className="card-grid">
            {saints.map((saint) => <SaintCard key={saint.slug} saint={saint} />)}
          </div>
        </div>
      </section>

      <section className="section section--surface">
        <div className="page-shell">
          <div className="section-heading">
            <div>
              {traditionsSection.eyebrow ? <div className="eyebrow">{traditionsSection.eyebrow}</div> : null}
              <h2>{traditionsSection.title}</h2>
            </div>
            {traditionsSection.action ? (
              <Button href={traditionsSection.action.href} variant="text" icon={<ArrowRight size={16} />} iconPosition="end">
                {traditionsSection.action.label}
              </Button>
            ) : null}
          </div>
          {traditions.length > 0 ? (
            <div className="card-grid">
              {traditions.map((tradition) => <TraditionCard key={tradition.slug} tradition={tradition} />)}
            </div>
          ) : (
            <p className="empty-note">Published traditions will appear here after editorial review.</p>
          )}
        </div>
      </section>
    </main>
  );
}

function HomeHeroImage({
  className,
  focalArea,
  image,
  preserveFocalArea = false
}: {
  className: string;
  focalArea?: { x: number; y: number };
  image?: PublicImage;
  preserveFocalArea?: boolean;
}) {
  const imageStyle = focalArea
    ? ({
        "--banner-object-position": `${focalArea.x}% ${focalArea.y}%`
      } as CSSProperties)
    : undefined;

  return (
    <div className={className} data-preserve-area={preserveFocalArea ? "true" : undefined} aria-label={image?.alt ?? "Devotional archive visual"}>
      {image ? (
        <>
          {preserveFocalArea ? (
            <FocalImage
              className="home-cosmic-hero__banner-backdrop"
              src={image.url}
              alt=""
              style={imageStyle}
              variants={image.variants}
              sizes="100vw"
            />
          ) : null}
          <FocalImage
            className="home-cosmic-hero__banner-image"
            src={image.url}
            alt=""
            style={imageStyle}
            variants={image.variants}
            sizes="100vw"
            loading="eager"
            fetchPriority="high"
          />
        </>
      ) : null}
    </div>
  );
}

function shouldPreserveFullBannerArea(focalArea: { width: number; height: number }) {
  return focalArea.width >= 86 || focalArea.height >= 86;
}

function uniqueSaintsBySlug(saints: Awaited<ReturnType<typeof getPublishedSaintSummaries>>) {
  return Array.from(new Map(saints.map((saint) => [saint.slug, saint])).values());
}
