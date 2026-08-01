import { FocalImage } from "@/components/ui/focal-image";
import type { ReactNode } from "react";
import type { PublicImage } from "@/lib/public-contracts";

type IndexPageHeroProps = { children?: ReactNode; description: string; eyebrow: string; image?: PublicImage; title: string };

export function IndexPageHero({ children, description, eyebrow, image, title }: IndexPageHeroProps) {
  return (
    <header className="index-page-hero">
      {image ? <FocalImage alt={image.alt} className="index-page-hero__image" cropAspect={3} focalPoint={image.focalPoint} height={image.height} loading="eager" sizes="(max-width: 760px) 100vw, 1180px" src={image.url} variants={image.variants} width={image.width} /> : null}
      <div className="index-page-hero__content">
        <div className="index-page-hero__heading"><div className="eyebrow">{eyebrow}</div><h1 className="page-title">{title}</h1><p className="lede">{description}</p></div>
        {children}
      </div>
    </header>
  );
}
