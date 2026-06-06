import { ArrowRight, Instagram, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SaintCard } from "@/components/saints/saint-card";
import { SampradayaCard } from "@/components/sampradayas/sampradaya-card";
import { getFeaturedSaints, getPublishedSampradayas } from "@/lib/sample-data";

export default function HomePage() {
  const saints = getFeaturedSaints();
  const sampradayas = getPublishedSampradayas();

  return (
    <main>
      <section className="page-shell hero">
        <div>
          <div className="eyebrow">Hindu Saints Archive</div>
          <h1>A source-backed home for saints, stories, and living traditions.</h1>
          <p>
            A public archive for the @hindu_saints project, bringing together devotional profiles,
            biographies, tradition pages, and related Instagram posts.
          </p>
          <div className="cluster hero-actions">
            <Button href="/saints" icon={<Search size={18} />}>Explore saints</Button>
            <Button href="https://www.instagram.com/hindu_saints/" variant="secondary" icon={<Instagram size={18} />}>
              Instagram
            </Button>
          </div>
        </div>
        <div className="hero-media" aria-label="Devotional archive visual" />
      </section>

      <section className="section">
        <div className="page-shell site-grid">
          <div>
            <div className="eyebrow">Featured saints</div>
            <h2>Launch profiles</h2>
          </div>
          <div className="card-grid">
            {saints.map((saint) => <SaintCard key={saint.slug} saint={saint} />)}
          </div>
        </div>
      </section>

      <section className="section section-muted">
        <div className="page-shell site-grid">
          <div>
            <div className="eyebrow">Traditions</div>
            <h2>Sampradayas and lineages</h2>
          </div>
          <div className="card-grid">
            {sampradayas.map((sampradaya) => <SampradayaCard key={sampradaya.slug} sampradaya={sampradaya} />)}
          </div>
          <Button href="/sampradayas" variant="secondary" icon={<ArrowRight size={18} />}>View all traditions</Button>
        </div>
      </section>
    </main>
  );
}
