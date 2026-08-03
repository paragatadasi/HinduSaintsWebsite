import Link from "next/link";
import { FocalImage } from "@/components/ui/focal-image";
import type { PublicImage, PublicTraditionSummary } from "@/lib/public-contracts";

type FeaturedTraditionCardProps = {
  bannerImage?: PublicImage;
  focalArea: {
    x: number;
    y: number;
  };
  tradition: PublicTraditionSummary;
};

export function FeaturedTraditionCard({ bannerImage, focalArea, tradition }: FeaturedTraditionCardProps) {
  return (
    <article className={bannerImage ? "home-featured-tradition-card home-featured-tradition-card--with-image interactive-surface" : "home-featured-tradition-card interactive-surface"}>
      <Link href={`/traditions/${tradition.slug}`}>
        {bannerImage ? (
          <FocalImage
            alt=""
            aria-hidden="true"
            className="home-featured-tradition-card__image"
            focalPoint={focalArea}
            sizes="(max-width: 760px) 92vw, 720px"
            src={bannerImage.url}
            variants={bannerImage.variants}
          />
        ) : null}
        <div className="home-featured-tradition-card__content">
          <h3>{tradition.name}</h3>
          {tradition.status === "published" ? <p>{tradition.shortDescription}</p> : null}
        </div>
      </Link>
    </article>
  );
}
