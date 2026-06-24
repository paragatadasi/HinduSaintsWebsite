"use client";

import { useMemo, useState } from "react";
import { InstagramCarouselViewer, getCarouselImages, type CarouselViewerState } from "@/components/instagram/instagram-embed-grid";
import { InstagramPreviewLink } from "@/components/instagram/instagram-preview-link";
import { ScrollRail } from "@/components/ui/scroll-rail";
import type { PublicInstagramCarouselPreview } from "@/lib/public-instagram";
import type { PublicInstagramItem } from "@/lib/public-contracts";

type HomeInstagramRailProps = {
  previews: PublicInstagramCarouselPreview[];
};

export function HomeInstagramRail({ previews }: HomeInstagramRailProps) {
  const posts = useMemo(() => previews.map(toInstagramPost), [previews]);
  const [activeState, setActiveState] = useState<CarouselViewerState | null>(null);

  if (posts.length === 0) return null;

  return (
    <div className="home-instagram">
      <ScrollRail ariaLabel="Instagram previews" className="instagram-rail" controls="always">
        {previews.map((preview, index) => {
          const post = posts[index];

          return (
            <InstagramPreviewLink
              alt={preview.alt}
              imageUrl={preview.imageUrl}
              imageUrls={preview.imageUrls}
              isSelected={preview.url === activeState?.post.url}
              key={preview.url}
              onSelect={() => setActiveState(post ? getViewerState(post, 0) : null)}
              url={preview.url}
            />
          );
        })}
      </ScrollRail>
      {activeState ? (
        <InstagramCarouselViewer
          onClose={() => setActiveState(null)}
          onSelect={(selectedIndex) => setActiveState({
            ...activeState,
            selectedIndex: Math.min(Math.max(selectedIndex, 0), activeState.images.length - 1)
          })}
          saintName="hindu_saints"
          state={activeState}
        />
      ) : null}
    </div>
  );
}

function toInstagramPost(preview: PublicInstagramCarouselPreview): PublicInstagramItem {
  return {
    url: preview.url,
    type: "carousel",
    caption: preview.caption,
    thumbnailUrl: preview.imageUrl,
    carouselImageUrls: preview.imageUrls,
    postedAt: preview.postedAt
  };
}

function getViewerState(post: PublicInstagramItem, selectedIndex: number): CarouselViewerState | null {
  const images = getCarouselImages(post);
  if (images.length === 0) return null;

  return {
    images,
    post,
    selectedIndex: Math.min(selectedIndex, images.length - 1)
  };
}
