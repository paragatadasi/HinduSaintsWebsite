"use client";

import { useState } from "react";
import { getInstagramLinkProps } from "@/lib/external-links";

type InstagramPreviewLinkProps = {
  alt: string;
  imageUrl: string;
  imageUrls?: string[];
  isSelected?: boolean;
  onSelect?: () => void;
  url: string;
};

export function InstagramPreviewLink({ alt, imageUrl, imageUrls = [], isSelected = false, onSelect, url }: InstagramPreviewLinkProps) {
  const candidates = getImageCandidates(imageUrl, imageUrls);
  const [imageIndex, setImageIndex] = useState(0);
  const currentImageUrl = candidates[imageIndex];
  const preview = currentImageUrl ? (
    <img
      src={currentImageUrl}
      alt={alt}
      onError={() => setImageIndex((currentIndex) => currentIndex + 1)}
    />
  ) : null;

  if (onSelect) {
    return (
      <button
        aria-label={`Show ${alt}`}
        aria-pressed={isSelected}
        className="instagram-preview instagram-preview--button interactive-media"
        onClick={onSelect}
        type="button"
      >
        {preview}
      </button>
    );
  }

  return (
    <a className="instagram-preview interactive-media" href={url} {...getInstagramLinkProps(url)}>
      {preview}
    </a>
  );
}

function getImageCandidates(imageUrl: string, imageUrls: string[]) {
  return Array.from(new Set([imageUrl, ...imageUrls].map((url) => url.trim()).filter(Boolean)));
}
