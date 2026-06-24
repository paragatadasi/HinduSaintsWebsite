"use client";

import { useMemo, useState } from "react";
import { InstagramCarouselViewer, InstagramPostCard, getViewerState, type CarouselViewerState } from "@/components/instagram/instagram-embed-grid";
import { ScrollRail } from "@/components/ui/scroll-rail";
import { getInstagramSectionContent } from "@/lib/site-content";
import type { PublicInstagramCarouselPreview } from "@/lib/public-instagram";
import type { PublicInstagramItem } from "@/lib/public-contracts";

type HomeInstagramRailProps = {
  previews: PublicInstagramCarouselPreview[];
};

export function HomeInstagramRail({ previews }: HomeInstagramRailProps) {
  const posts = useMemo(() => previews.map(toInstagramPost), [previews]);
  const [activeState, setActiveState] = useState<CarouselViewerState | null>(null);
  const content = getInstagramSectionContent();

  if (posts.length === 0) return null;

  return (
    <div className="home-instagram">
      <ScrollRail ariaLabel="Instagram previews" className="home-instagram__rail" controls="always">
        {posts.map((post) => (
          <InstagramPostCard
            className="rail-card"
            content={content}
            key={post.url}
            onOpenPost={() => setActiveState(getViewerState(post, 0))}
            post={post}
            saintName="hindu_saints"
          />
        ))}
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
