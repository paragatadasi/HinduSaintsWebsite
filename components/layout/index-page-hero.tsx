import { FocalImage } from "@/components/ui/focal-image";
import type { PublicImage } from "@/lib/public-contracts";

export function IndexPageHero({ description, eyebrow, image, title }: { description: string; eyebrow: string; image?: PublicImage; title: string }) {
  return <header className="index-page-hero">{image ? <FocalImage alt={image.alt} className="index-page-hero__image" cropAspect={3} focalPoint={image.focalPoint} height={image.height} loading="eager" sizes="(max-width: 760px) 100vw, 1180px" src={image.url} variants={image.variants} width={image.width} /> : null}<div className="index-page-hero__overlay" aria-hidden="true" /><div className="index-page-hero__content"><div className="eyebrow">{eyebrow}</div><h1 className="page-title">{title}</h1><p className="lede">{description}</p></div></header>;
}
