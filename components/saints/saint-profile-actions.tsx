"use client";

import { useState } from "react";
import { ArrowDown, Instagram } from "lucide-react";
import { InstagramCarouselViewer, getViewerState } from "@/components/instagram/instagram-embed-grid";
import { Button } from "@/components/ui/button";
import type { PublicInstagramItem } from "@/lib/public-contracts";

export function SaintProfileActions({ hasBiography, latestPost, saintName }: { hasBiography: boolean; latestPost?: PublicInstagramItem; saintName: string }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const viewerState = latestPost ? getViewerState(latestPost, selectedIndex) : null;

  return (
    <>
      <div className="saint-profile-actions">
        {viewerState ? (
          <button className="button button--primary" onClick={() => setViewerOpen(true)} type="button">
            <Instagram size={18} aria-hidden="true" />
            View the Post
          </button>
        ) : null}
        {hasBiography ? (
          <Button href="#biography" variant="secondary" icon={<ArrowDown size={18} aria-hidden="true" />} iconPosition="end">
            Dive deeper
          </Button>
        ) : null}
      </div>
      {viewerOpen && viewerState ? (
        <InstagramCarouselViewer
          onClose={() => setViewerOpen(false)}
          onSelect={setSelectedIndex}
          saintName={saintName}
          state={viewerState}
        />
      ) : null}
    </>
  );
}
