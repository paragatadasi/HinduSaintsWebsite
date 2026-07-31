import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Prose } from "@/components/content/prose";
import { getPublicAboutPageContent } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "About",
  description: "Discover the vision and story behind the Hindu Saints devotional archive."
};

const defaultImage = {
  url: "/about-hero.png",
  alt: "A devotee meditating beside a sacred river at night",
  caption: undefined
};

export default async function AboutPage() {
  const content = await getPublicAboutPageContent();
  if (!content) notFound();

  const heroImage = content.heroImage ?? defaultImage;
  const sectionImages = [
    content.visionImage ?? defaultImage,
    content.storyImage ?? defaultImage,
    content.guruImage ?? defaultImage
  ];

  return (
    <main className="about-page">
      <section className="about-hero">
        <img className="about-hero__image" src={heroImage.url} alt={heroImage.alt} />
        <div className="about-hero__overlay" />
        <div className="page-shell about-hero__content">
          <div className="eyebrow">{content.eyebrow}</div>
          <h1>{content.title}</h1>
          <Prose className="about-hero__introduction" markdown={content.introduction} />
          <a className="about-text-link" href="#about-story">Discover our purpose <span aria-hidden="true">↓</span></a>
        </div>
      </section>

      <div id="about-story">
        {content.sections.map((section, index) => {
          const image = sectionImages[index % sectionImages.length];
          return (
            <section className={`about-story-section about-story-section--${index % 2 === 0 ? "text-first" : "image-first"}`} key={`${section.title}-${index}`}>
              <div className="about-story-section__copy">
                <div className="eyebrow">{sectionLabel(index)}</div>
                <h2>{section.title}</h2>
                <Prose markdown={section.body} />
              </div>
              <figure className="about-story-section__media">
                <img src={image.url} alt={image.alt} />
                <span className="about-story-section__arch" aria-hidden="true" />
                {image.caption ? <figcaption>{image.caption}</figcaption> : null}
              </figure>
            </section>
          );
        })}
      </div>

      <section className="about-closing">
        <span aria-hidden="true">ॐ</span>
        <p>May every story become a doorway.</p>
      </section>
    </main>
  );
}

function sectionLabel(index: number) {
  if (index === 0) return "Our vision";
  if (index === 1) return "Our story";
  if (index === 2) return "Our Guruji";
  return `Chapter ${index + 1}`;
}
