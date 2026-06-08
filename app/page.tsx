import { ArrowRight, Instagram, Play, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollRail } from "@/components/ui/scroll-rail";
import { SaintCard } from "@/components/saints/saint-card";
import { TraditionCard } from "@/components/traditions/tradition-card";
import { getPublishedTraditions } from "@/lib/sample-data";
import { getFeaturedSaintSummaries, getPublishedSaintSummaries } from "@/lib/public-saints";
import { getHomeHeroContent, getHomeLayoutVariant, getHomeSectionContent } from "@/lib/site-content";

export default async function HomePage() {
  const layout = getHomeLayoutVariant();
  const hero = getHomeHeroContent();
  const featuredSaintsSection = getHomeSectionContent("featuredSaints");
  const traditionsSection = getHomeSectionContent("traditions");
  const [featuredSaints, publishedSaints] = await Promise.all([
    getFeaturedSaintSummaries(),
    getPublishedSaintSummaries()
  ]);
  const saints = [...featuredSaints, ...publishedSaints.filter((saint) => !saint.featured)].slice(0, 6);
  const traditions = getPublishedTraditions();
  const instagramPreviews = [
    "Temple lights",
    "Teachings",
    "Pilgrimage",
    "Lineage",
    "Saint stories"
  ];

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

      <section className="section">
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
          <ScrollRail ariaLabel="traditions" controls="always">
            {traditions.map((tradition) => <TraditionCard key={tradition.slug} tradition={tradition} variant="icon" />)}
          </ScrollRail>
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
          <ScrollRail ariaLabel="Instagram previews" className="instagram-rail" controls="always">
            {instagramPreviews.map((preview, index) => (
              <a className={`instagram-preview instagram-preview--${index + 1}`} href={hero.secondaryAction.href} key={preview}>
                <span className="instagram-preview__play" aria-hidden="true">
                  <Play size={16} />
                </span>
                <span>{preview}</span>
              </a>
            ))}
          </ScrollRail>
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
  traditions: ReturnType<typeof getPublishedTraditions>;
};

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

      <section className="section section-muted">
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
          <div className="card-grid">
            {traditions.map((tradition) => <TraditionCard key={tradition.slug} tradition={tradition} />)}
          </div>
        </div>
      </section>
    </main>
  );
}
