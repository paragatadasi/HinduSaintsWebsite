"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FocalImage } from "@/components/ui/focal-image";
import { IMAGE_CROP_ASPECT } from "@/lib/image-crop-config";
import type { PublicImage } from "@/lib/public-contracts";

export function SaintHeroGallery({ images, saintName }: { images: PublicImage[]; saintName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const image = images[activeIndex];

  if (!image) return <div className="saint-hero-gallery saint-hero-gallery--empty">Reviewed public image pending</div>;

  function move(offset: number) {
    setActiveIndex((index) => (index + offset + images.length) % images.length);
  }

  return (
    <div className="saint-hero-gallery" aria-label={`Gallery for ${saintName}`}>
      <div className="saint-hero-gallery__stage">
        <FocalImage
          src={image.url}
          alt={image.alt}
          width={image.width}
          height={image.height}
          cropAspect={IMAGE_CROP_ASPECT.saintWide}
          focalPoint={image.focalPoint}
          variants={image.variants}
          sizes="(max-width: 760px) 92vw, 520px"
          loading="eager"
          fetchPriority="high"
        />
        {images.length > 1 ? (
          <div className="saint-hero-gallery__controls">
            <button aria-label="Previous gallery image" onClick={() => move(-1)} type="button"><ChevronLeft aria-hidden="true" /></button>
            <button aria-label="Next gallery image" onClick={() => move(1)} type="button"><ChevronRight aria-hidden="true" /></button>
          </div>
        ) : null}
      </div>
      {images.length > 1 ? (
        <div className="saint-hero-gallery__dots" aria-label="Choose gallery image">
          {images.map((item, index) => (
            <button
              aria-current={index === activeIndex ? "true" : undefined}
              aria-label={`Show image ${index + 1}`}
              key={`${item.url}-${index}`}
              onClick={() => setActiveIndex(index)}
              type="button"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
