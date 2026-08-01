import type { ComponentType } from "react";
import type { Metadata } from "next";
import { BookOpen, MapPinned, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { Prose } from "@/components/content/prose";
import type { PublicImage } from "@/lib/public-contracts";
import { getPublicAboutPageContent } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "About",
  description: "Discover the vision and story behind the Hindu Saints devotional archive."
};

const defaultHeroImage: PublicImage = {
  url: "/about-hero.png",
  alt: "A devotee meditating beside a sacred river at night"
};

const discoveryIcons: Record<string, ComponentType<{ size?: number; "aria-hidden"?: boolean }>> = {
  sparkles: Sparkles,
  book: BookOpen,
  map: MapPinned
};

export default async function AboutPage() {
  const content = await getPublicAboutPageContent();
  if (!content) notFound();

  const sectionImages: Array<PublicImage | undefined> = [
    content.visionImage ?? defaultHeroImage,
    content.storyImage,
    content.guruImage
  ];

  return (
    <main className="about-page">
      <div className="page-shell about-page__frame">
        <section className="about-hero">
          <img className="about-hero__image" src={(content.heroImage ?? defaultHeroImage).url} alt={(content.heroImage ?? defaultHeroImage).alt} />
          <div className="about-hero__overlay" />
          <div className="about-hero__content">
            <div className="eyebrow">{content.eyebrow}</div>
            <h1>{content.title}</h1>
            <Prose className="about-hero__introduction" markdown={content.introduction} />
            <a className="about-text-link" href="#about-story">Discover our purpose <span aria-hidden="true">{"\u2193"}</span></a>
          </div>
        </section>

        <div id="about-story">
          {content.sections[0] ? <StorySection section={content.sections[0]} image={sectionImages[0]} index={0} /> : null}

          <section className="about-discovery">
            <div className="about-discovery__heading">
              <div className="eyebrow">What you’ll find here</div>
              <h2>{content.discovery.title}</h2>
            </div>
            <div className="about-discovery__grid">
              {content.discovery.items.map((item, index) => {
                const Icon = discoveryIcons[item.icon] ?? Sparkles;
                return (
                  <a className="about-discovery-card interactive-surface" href={item.href} key={`${item.title}-${index}`}>
                    <span className="about-discovery-card__number">0{index + 1}</span>
                    <Icon size={32} aria-hidden={true} />
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                    <span className="about-discovery-card__action">Explore <span aria-hidden="true">{"\u2197"}</span></span>
                  </a>
                );
              })}
            </div>
          </section>

          {content.sections.slice(1).map((section, offset) => (
            <StorySection section={section} image={sectionImages[offset + 1]} index={offset + 1} key={`${section.title}-${offset + 1}`} />
          ))}
        </div>

        <section className="about-closing">
          <span aria-hidden="true">{"\u0950"}</span>
          <p>May every story become a doorway.</p>
        </section>
      </div>
    </main>
  );
}

function StorySection({ section, image, index }: { section: { title: string; body: string }; image?: PublicImage; index: number }) {
  const { teaser, remainder } = splitExpandableMarkdown(section.body);
  return (
    <section className={`about-story-section about-story-section--${index % 2 === 0 ? "text-first" : "image-first"}`}>
      <div className="about-story-section__copy">
        <div className="eyebrow">{sectionLabel(index)}</div>
        <h2>{section.title}</h2>
        <Prose markdown={teaser} />
        {remainder ? (
          <details className="about-read-more">
            <summary>Read more <span aria-hidden="true">{"\u2192"}</span></summary>
            <Prose markdown={remainder} />
          </details>
        ) : null}
      </div>
      <figure className="about-story-section__media about-story-section__media--arch">
        {image ? (
          <div className="about-story-section__window">
            <img src={image.url} alt={image.alt} />
          </div>
        ) : (
          <div className="about-story-section__placeholder" aria-hidden="true"><span>{"\u0950"}</span></div>
        )}
        {image?.caption ? <figcaption>{image.caption}</figcaption> : null}
      </figure>
    </section>
  );
}

function splitExpandableMarkdown(body: string) {
  const normalized = body.trim();
  if (normalized.length <= 360) return { teaser: normalized, remainder: "" };
  const paragraphs = normalized.split(/\n\s*\n/);
  if (paragraphs.length > 1 && paragraphs[0].length <= 360) {
    return { teaser: paragraphs[0], remainder: paragraphs.slice(1).join("\n\n") };
  }
  const sentenceBreak = normalized.lastIndexOf(". ", 320);
  const splitAt = sentenceBreak >= 170 ? sentenceBreak + 1 : normalized.lastIndexOf(" ", 300);
  return { teaser: normalized.slice(0, splitAt).trim(), remainder: normalized.slice(splitAt).trim() };
}

function sectionLabel(index: number) {
  if (index === 0) return "Our vision";
  if (index === 1) return "Our story";
  if (index === 2) return "Our Guruji";
  return `Chapter ${index + 1}`;
}
