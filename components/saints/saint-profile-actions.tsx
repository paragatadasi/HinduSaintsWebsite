"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import { ArrowDown, Check, Instagram, MessageCircle, Share2 } from "lucide-react";
import { InstagramCarouselViewer, getViewerState } from "@/components/instagram/instagram-embed-grid";
import { Button } from "@/components/ui/button";
import type { PublicInstagramItem } from "@/lib/public-contracts";

type SaintProfileActionsProps = {
  feedbackHref: string;
  hasBiography: boolean;
  latestPost?: PublicInstagramItem;
  saintName: string;
};

export function SaintProfileActions({ feedbackHref, hasBiography, latestPost, saintName }: SaintProfileActionsProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "error">("idle");
  const viewerState = latestPost ? getViewerState(latestPost, selectedIndex) : null;
  const shareLabel = shareStatus === "copied" ? "Link copied" : `Share ${saintName}`;

  async function shareProfile() {
    const shareData = {
      title: saintName,
      text: `Explore ${saintName} on the Hindu Saints Archive.`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShareStatus("idle");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareData.url);
      setShareStatus("copied");
    } catch {
      setShareStatus("error");
    }
  }

  return (
    <>
      <div className="saint-profile-actions">
        {viewerState || hasBiography ? (
          <div className="saint-profile-actions__main">
            {viewerState ? (
              <button className="button button--primary" data-telemetry-event="saint_instagram_open" onClick={() => setViewerOpen(true)} type="button">
                <Instagram size={18} aria-hidden="true" />
                View the Post
              </button>
            ) : null}
            {hasBiography ? (
              <Button href="#biography" telemetryEvent="saint_biography_open" variant="secondary" icon={<ArrowDown size={18} aria-hidden="true" />} iconPosition="end">
                Dive deeper
              </Button>
            ) : null}
          </div>
        ) : null}
        <div className="saint-profile-actions__utilities">
          <button
            aria-label={shareLabel}
            className="button button--secondary button--icon"
            onClick={shareProfile}
            title={shareLabel}
            type="button"
          >
            {shareStatus === "copied" ? <Check size={18} aria-hidden="true" /> : <Share2 size={18} aria-hidden="true" />}
          </button>
          <Link
            aria-label={`Submit feedback about ${saintName}`}
            className="button button--secondary button--icon"
            href={feedbackHref as Route}
            title="Submit feedback"
          >
            <MessageCircle size={18} aria-hidden="true" />
          </Link>
        </div>
        <span aria-live="polite" className="sr-only">
          {shareStatus === "copied" ? "Profile link copied to clipboard." : null}
          {shareStatus === "error" ? "Unable to share this profile. Copy the address from your browser instead." : null}
        </span>
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
