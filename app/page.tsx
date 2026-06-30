import { ArrowRight, Instagram, MapPinned, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HomeInstagramRail } from "@/components/instagram/home-instagram-rail";
import { ScrollRail } from "@/components/ui/scroll-rail";
import { SaintCard } from "@/components/saints/saint-card";
import { TraditionCard } from "@/components/traditions/tradition-card";
import { INDIA_STATE_MAP_SHAPES, type IndiaStateMapShape } from "@/lib/india-state-map-shapes";
import { getRecentInstagramCarouselPreviews } from "@/lib/public-instagram";
import { getIndiaPlaceMapData } from "@/lib/public-places";
import { getFeaturedSaintSummaries, getPublishedSaintSummaries } from "@/lib/public-saints";
import { getPublishedTraditionSummaries } from "@/lib/public-traditions";
import type { PublicPlaceMapData } from "@/lib/public-contracts";
import { getHomeHeroContent, getHomeLayoutVariant, getHomeQuoteContent, getHomeSectionContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const layout = getHomeLayoutVariant();
  const hero = getHomeHeroContent();
  const quote = getHomeQuoteContent();
  const featuredSaintsSection = getHomeSectionContent("featuredSaints");
  const traditionsSection = getHomeSectionContent("traditions");
  const [featuredSaints, publishedSaints, traditions, instagramPreviews, mapData] = await Promise.all([
    getFeaturedSaintSummaries(),
    getPublishedSaintSummaries(),
    getPublishedTraditionSummaries(),
    getRecentInstagramCarouselPreviews(),
    getIndiaPlaceMapData()
  ]);
  const saints = uniqueSaintsBySlug([
    ...featuredSaints,
    ...publishedSaints.filter((saint) => !saint.featured)
  ]).slice(0, 6);

  if (layout === "archive") {
    return (
      <ArchiveHomePage
        hero={hero}
        featuredSaintsSection={featuredSaintsSection}
        traditionsSection={traditionsSection}
        saints={saints}
        traditions={traditions}
      />
    );
  }

  if (layout === "cosmic") {
    return (
      <CosmicHomePage
        hero={hero}
        featuredSaintsSection={featuredSaintsSection}
        traditionsSection={traditionsSection}
        quote={quote}
        saints={saints}
        traditions={traditions}
        instagramPreviews={instagramPreviews}
        mapData={mapData}
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
            <form className="hero-search" action={hero.primaryAction.href}>
              <label className="sr-only" htmlFor="home-search">Search saints</label>
              <input id="home-search" name="q" placeholder={hero.primaryAction.label} />
              <button type="submit" aria-label="Search saints">
                <Search size={22} />
              </button>
            </form>
          </div>
          <div className="hero-media" aria-label="Devotional archive visual" />
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
          {traditions.length > 0 ? (
            <ScrollRail ariaLabel="traditions" controls="always">
              {traditions.map((tradition) => <TraditionCard key={tradition.slug} tradition={tradition} variant="icon" />)}
            </ScrollRail>
          ) : (
            <p className="empty-note">Published traditions will appear here after editorial review.</p>
          )}
        </div>
      </section>

      <section className="section section--last">
        <div className="page-shell">
          <div className="section-heading">
            <h2>From Instagram</h2>
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
  hero: ReturnType<typeof getHomeHeroContent>;
  featuredSaintsSection: ReturnType<typeof getHomeSectionContent>;
  traditionsSection: ReturnType<typeof getHomeSectionContent>;
  saints: Awaited<ReturnType<typeof getPublishedSaintSummaries>>;
  traditions: Awaited<ReturnType<typeof getPublishedTraditionSummaries>>;
};

type CosmicHomePageProps = {
  hero: ReturnType<typeof getHomeHeroContent>;
  featuredSaintsSection: ReturnType<typeof getHomeSectionContent>;
  traditionsSection: ReturnType<typeof getHomeSectionContent>;
  quote: ReturnType<typeof getHomeQuoteContent>;
  saints: Awaited<ReturnType<typeof getPublishedSaintSummaries>>;
  traditions: Awaited<ReturnType<typeof getPublishedTraditionSummaries>>;
  instagramPreviews: Awaited<ReturnType<typeof getRecentInstagramCarouselPreviews>>;
  mapData: PublicPlaceMapData;
};

function CosmicHomePage({
  hero,
  featuredSaintsSection,
  traditionsSection,
  quote,
  saints,
  traditions,
  instagramPreviews,
  mapData
}: CosmicHomePageProps) {
  const featuredTradition = traditions[0];
  const mappedSaintCount = new Set(mapData.points.flatMap((point) => point.saints.map((saint) => saint.slug))).size;

  return (
    <main className="home home--cosmic">
      <section className="home-cosmic-hero">
        <div className="page-shell home-cosmic-hero__inner">
          <div className="home-cosmic-hero__content">
            <h1>{hero.title}</h1>
            <p>{hero.body}</p>
            <form className="hero-search home-cosmic-search" action={hero.primaryAction.href}>
              <label className="sr-only" htmlFor="home-cosmic-search">Search saints</label>
              <input id="home-cosmic-search" name="q" placeholder={hero.primaryAction.label} />
              <button type="submit" aria-label="Search saints">
                <Search size={22} />
              </button>
            </form>
          </div>
          <div className="home-cosmic-hero__visual" aria-hidden="true">
            <div className="home-cosmic-hero__emblem">
              <span>{hero.eyebrow}</span>
            </div>
          </div>
          <nav className="home-cosmic-hero__index" aria-label="Homepage sections">
            {["Saints", "Traditions", "Places", "Wisdom", "Legacy"].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </nav>
        </div>
      </section>

      <section className="home-cosmic-panel home-cosmic-panel--split">
        <div className="page-shell home-cosmic-feature-grid">
          <div className="home-cosmic-feature-grid__saints">
            <div className="section-heading home-cosmic-heading">
              <h2>{featuredSaintsSection.title}</h2>
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

          <aside className="home-map-card">
            <div className="section-heading home-cosmic-heading">
              <h2>Explore the Map</h2>
              <Button href="/map" variant="text" icon={<ArrowRight size={16} />} iconPosition="end">
                Explore map
              </Button>
            </div>
            <div className="home-map-card__visual" aria-hidden="true">
              <HomeMapPreview mapData={mapData} />
            </div>
            <p>{mappedSaintCount} published saints across {mapData.points.length} mapped places.</p>
          </aside>
        </div>
      </section>

      <section className="home-cosmic-panel home-cosmic-panel--duo">
        <div className="page-shell home-cosmic-duo">
          <aside className="home-quote-card">
            <div className="eyebrow">{quote.eyebrow}</div>
            <blockquote>
              <p>{quote.quote}</p>
              <cite>{quote.attribution}</cite>
            </blockquote>
          </aside>

          <article className="home-tradition-feature">
            <div className="home-tradition-feature__header">
              <div className="eyebrow">Featured Tradition</div>
              {traditionsSection.action ? (
                <Button href={traditionsSection.action.href} variant="text" icon={<ArrowRight size={16} />} iconPosition="end">
                  {traditionsSection.action.label}
                </Button>
              ) : null}
            </div>
            <div className="home-tradition-feature__content">
              <div>
                <h2>{featuredTradition?.name ?? "Explore Traditions"}</h2>
                <p>{featuredTradition?.shortDescription ?? "Published traditions will appear here after editorial review."}</p>
                <Button
                  href={featuredTradition ? `/traditions/${featuredTradition.slug}` : "/traditions"}
                  variant="secondary"
                  icon={<ArrowRight size={16} />}
                  iconPosition="end"
                >
                  Explore tradition
                </Button>
              </div>
              <div className="home-tradition-feature__mark" aria-hidden="true">
                <MapPinned size={44} />
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="home-cosmic-panel home-cosmic-panel--last">
        <div className="page-shell">
          <div className="section-heading home-cosmic-heading">
            <h2>From Instagram</h2>
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

function HomeMapPreview({ mapData }: { mapData: PublicPlaceMapData }) {
  const activeStateSlugs = new Set(mapData.points.map((point) => point.stateSlug ?? (point.placeScope === "state" ? point.slug : "")).filter(Boolean));
  const points = mapData.points
    .filter((point) => point.placeScope !== "state")
    .slice(0, 42)
    .map((point) => ({ ...point, ...projectHomeMapCoordinate(point.latitude, point.longitude) }));

  return (
    <svg viewBox="0 0 720 640" role="img" aria-label="Map preview of Indian places associated with saints">
      <g className="home-map-card__states" dangerouslySetInnerHTML={{ __html: getHomeMapStateLayerMarkup(activeStateSlugs) }} />
      <g className="home-map-card__routes">
        {points.slice(0, 18).map((point, index) => {
          const nextPoint = points[(index + 7) % points.length];
          if (!nextPoint) return null;
          return <path d={`M ${point.x} ${point.y} Q ${(point.x + nextPoint.x) / 2} ${Math.min(point.y, nextPoint.y) - 28} ${nextPoint.x} ${nextPoint.y}`} key={`${point.slug}-${nextPoint.slug}`} />;
        })}
      </g>
      <g className="home-map-card__points">
        {points.map((point) => (
          <circle cx={point.x} cy={point.y} key={point.slug} r={Math.min(7, 3 + Math.sqrt(point.saintCount))} />
        ))}
      </g>
    </svg>
  );
}

function getHomeMapStateLayerMarkup(activeStateSlugs: Set<string>) {
  return INDIA_STATE_MAP_SHAPES.map((state) => {
    const isActive = Boolean(getActiveStateSlug(state, activeStateSlugs));
    const attributes = [
      `class="${isActive ? "home-map-card__state home-map-card__state--active" : "home-map-card__state"}"`,
      `d="${escapeSvgAttribute(state.path)}"`
    ].join(" ");

    return `<path ${attributes}></path>`;
  }).join("");
}

function getActiveStateSlug(state: IndiaStateMapShape, activeStateSlugs: Set<string>) {
  if (activeStateSlugs.has(state.slug)) return state.slug;
  return state.aliases?.find((alias) => activeStateSlugs.has(alias));
}

function escapeSvgAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function projectHomeMapCoordinate(latitude: number, longitude: number) {
  const bounds = {
    minLatitude: 6,
    maxLatitude: 37.6,
    minLongitude: 67.5,
    maxLongitude: 98
  };
  const padding = 48;
  const width = 720 - padding * 2;
  const height = 640 - padding * 2;

  return {
    x: padding + ((longitude - bounds.minLongitude) / (bounds.maxLongitude - bounds.minLongitude)) * width,
    y: padding + ((bounds.maxLatitude - latitude) / (bounds.maxLatitude - bounds.minLatitude)) * height
  };
}

function ArchiveHomePage({ hero, featuredSaintsSection, traditionsSection, saints, traditions }: ArchiveHomePageProps) {
  return (
    <main className="home home--archive">
      <section className="page-shell hero">
        <div>
          <div className="eyebrow">Hindu Saints Archive</div>
          <h1>{hero.title}</h1>
          <p>{hero.body}</p>
          <div className="cluster hero-actions">
            <Button href={hero.primaryAction.href} icon={<Search size={18} />}>Explore saints</Button>
            <Button href={hero.secondaryAction.href} variant="secondary" icon={<Instagram size={18} />}>
              {hero.secondaryAction.label}
            </Button>
          </div>
        </div>
        <div className="hero-media" aria-label="Devotional archive visual" />
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

function uniqueSaintsBySlug(saints: Awaited<ReturnType<typeof getPublishedSaintSummaries>>) {
  return Array.from(new Map(saints.map((saint) => [saint.slug, saint])).values());
}
