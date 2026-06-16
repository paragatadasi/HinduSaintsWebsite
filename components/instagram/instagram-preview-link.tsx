"use client";

import { useState } from "react";
import { getInstagramLinkProps } from "@/lib/external-links";

type InstagramPreviewLinkProps = {
  alt: string;
  imageUrl: string;
  imageUrls?: string[];
  url: string;
};

export function InstagramPreviewLink({ alt, imageUrl, imageUrls = [], url }: InstagramPreviewLinkProps) {
  const candidates = getImageCandidates(imageUrl, imageUrls);
  const [imageIndex, setImageIndex] = useState(0);
  const currentImageUrl = candidates[imageIndex];

  return (
    <a className="instagram-preview interactive-media" href={url} {...getInstagramLinkProps(url)}>
      {currentImageUrl ? (
        <img
          src={currentImageUrl}
          alt={alt}
          onError={() => setImageIndex((currentIndex) => currentIndex + 1)}
        />
      ) : null}
    </a>
  );
}

function getImageCandidates(imageUrl: string, imageUrls: string[]) {
  return Array.from(new Set([imageUrl, ...imageUrls].map((url) => url.trim()).filter(Boolean)));
}
