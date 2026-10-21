"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FocalImage } from "@/components/ui/focal-image";
import { IMAGE_CROP_ASPECT } from "@/lib/image-crop-config";
import type { PublicImage } from "@/lib/public-contracts";

export function SaintHeroGallery({ images, saintName }: { images: PublicImage[]; saintName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const [cropAspect, setCropAspect] = useState<number>(IMAGE_CROP_ASPECT.saintPortrait);
  const image = images[activeIndex];

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    // The same gallery also appears in differently sized private museum panels.
    // Match the actual frame rather than guessing its aspect from a breakpoint.
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setCropAspect(width / height);
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [image?.url]);

  if (!image) return <div className="saint-hero-gallery saint-hero-gallery--empty">Reviewed public image pending</div>;

  function move(offset: number) {
    setActiveIndex((index) => (index + offset + images.length) % images.length);
  }

  return (
    <div className="saint-hero-gallery" aria-label={`Gallery for ${saintName}`}>
      <div className="saint-hero-gallery__stage" ref={stageRef}>
        <FocalImage
          src={image.url}
          alt={image.alt}
          width={image.width}
          height={image.height}
          cropAspect={cropAspect}
          focalPoint={image.focalPoint}
          variants={image.variants}
          sizes="(max-width: 760px) 92vw, 520px"
          loading="eager"
          fetchPriority="high"
        />
        {images.length > 1 ? (
          <div className="saint-hero-gallery__controls">
            <button aria-label="Previous gallery image" data-telemetry-event="saint_gallery_previous" onClick={() => move(-1)} type="button"><ChevronLeft aria-hidden="true" /></button>
            <button aria-label="Next gallery image" data-telemetry-event="saint_gallery_next" onClick={() => move(1)} type="button"><ChevronRight aria-hidden="true" /></button>
          </div>
        ) : null}
      </div>
      {images.length > 1 ? (
        <div className="saint-hero-gallery__dots" aria-label="Choose gallery image">
          {images.map((item, index) => (
            <button
              aria-current={index === activeIndex ? "true" : undefined}
              aria-label={`Show image ${index + 1}`}
              data-telemetry-event="saint_gallery_open"
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
