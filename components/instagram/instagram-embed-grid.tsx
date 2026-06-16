"use client";

import { useEffect, useState } from "react";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Heart,
  Images,
  Instagram,
  MessageCircle,
  MoreHorizontal,
  PlayCircle,
  Send,
  X
} from "lucide-react";
import { getInstagramLinkProps } from "@/lib/external-links";
import { getInstagramSectionContent } from "@/lib/site-content";
import type { PublicInstagramItem } from "@/lib/public-contracts";

type InstagramEmbedGridProps = {
  items?: PublicInstagramItem[];
  urls?: string[];
  saintName: string;
};

export function InstagramEmbedGrid({ items = [], urls = [], saintName }: InstagramEmbedGridProps) {
  const posts = items.length > 0 ? items : urls.map((url) => ({ url, type: "unknown" as const }));
  const [activeCarousel, setActiveCarousel] = useState<CarouselViewerState | null>(null);
  if (posts.length === 0) return null;

  const content = getInstagramSectionContent();

  return (
    <section className="section">
      <div className="eyebrow">{content.eyebrow}</div>
      <h2>{content.title}</h2>
      <div className="instagram-post-grid">
        {posts.map((post) => (
          <InstagramPostCard
            content={content}
            key={post.url}
            onOpenCarousel={(images) => setActiveCarousel({ images, post, selectedIndex: 0 })}
            post={post}
            saintName={saintName}
          />
        ))}
      </div>
      {activeCarousel ? (
        <InstagramCarouselViewer
          onClose={() => setActiveCarousel(null)}
          onSelect={(selectedIndex) => setActiveCarousel({ ...activeCarousel, selectedIndex })}
          saintName={saintName}
          state={activeCarousel}
        />
      ) : null}
    </section>
  );
}

type CarouselViewerState = {
  images: string[];
  post: PublicInstagramItem;
  selectedIndex: number;
};

function InstagramPostCard({
  content,
  onOpenCarousel,
  post,
  saintName
}: {
  content: ReturnType<typeof getInstagramSectionContent>;
  onOpenCarousel: (images: string[]) => void;
  post: PublicInstagramItem;
  saintName: string;
}) {
  const postedAt = formatPostedAt(post.postedAt);
  const postLabel = formatPostType(post.type);
  const carouselImages = getCarouselImages(post);

  return (
    <article className="instagram-post-card">
      <header className="instagram-post-card__header">
        <a className="instagram-post-card__account" href="https://www.instagram.com/hindu_saints/" {...getInstagramLinkProps("https://www.instagram.com/hindu_saints/")}>
          <span className="instagram-post-card__avatar" aria-hidden="true">
            <Instagram size={18} />
          </span>
          <span>
            <strong>hindu_saints</strong>
            <small>{saintName}</small>
          </span>
        </a>
        <a className="instagram-post-card__icon-link" href={post.url} aria-label={content.linkLabel} {...getInstagramLinkProps(post.url)}>
          <MoreHorizontal size={20} aria-hidden="true" />
        </a>
      </header>

      <div className="instagram-post-card__media">
        <a className="instagram-post-card__media-link interactive-image-link" href={post.url} {...getInstagramLinkProps(post.url)}>
          {post.thumbnailUrl ? (
            <img src={post.thumbnailUrl} alt={getInstagramAlt(post, saintName)} />
          ) : (
            <span className="instagram-post-card__media-fallback">
              {post.type === "reel" ? <PlayCircle size={42} aria-hidden="true" /> : <Instagram size={42} aria-hidden="true" />}
              <span>{postLabel}</span>
            </span>
          )}
        </a>
        {post.type === "carousel" ? (
          <button
            aria-label={`Open ${postLabel.toLowerCase()} images`}
            className="instagram-post-card__type instagram-post-card__type-button"
            onClick={() => onOpenCarousel(carouselImages)}
            type="button"
          >
            <Images size={18} aria-hidden="true" />
          </button>
        ) : (
          <span className="instagram-post-card__type" aria-label={postLabel}>
            {post.type === "reel" ? <PlayCircle size={18} aria-hidden="true" /> : <Instagram size={18} aria-hidden="true" />}
          </span>
        )}
      </div>

      <div className="instagram-post-card__body">
        <div className="instagram-post-card__actions" aria-label="Instagram post actions">
          <span aria-label="Like">
            <Heart size={21} />
          </span>
          <span aria-label="Comment">
            <MessageCircle size={21} />
          </span>
          <span aria-label="Share">
            <Send size={21} />
          </span>
          <span aria-label="Save">
            <Bookmark size={21} />
          </span>
        </div>

        <div className="instagram-post-card__caption">
          <strong>hindu_saints</strong>
          <InstagramCaption caption={post.caption} fallback={`Related ${postLabel.toLowerCase()} for ${saintName}.`} />
        </div>

        <footer className="instagram-post-card__footer">
          <span>{postedAt ?? postLabel}</span>
          <a href={post.url} {...getInstagramLinkProps(post.url)}>
            {content.linkLabel}
            <ExternalLink size={15} aria-hidden="true" />
          </a>
        </footer>
      </div>
    </article>
  );
}

function InstagramCaption({ caption, fallback }: { caption?: string; fallback: string }) {
  const [expanded, setExpanded] = useState(false);
  if (!caption) return <span> {fallback}</span>;

  const normalized = caption.trim().replace(/\s+/g, " ");
  const shouldClamp = normalized.length > 132;
  const displayCaption = expanded || !shouldClamp ? normalized : `${normalized.slice(0, 132)}...`;

  return (
    <span>
      {" "}
      {displayCaption}
      {shouldClamp ? (
        <button
          className="instagram-post-card__caption-toggle"
          onClick={() => setExpanded(!expanded)}
          type="button"
        >
          {expanded ? "less" : "more"}
        </button>
      ) : null}
    </span>
  );
}

function InstagramCarouselViewer({
  onClose,
  onSelect,
  saintName,
  state
}: {
  onClose: () => void;
  onSelect: (selectedIndex: number) => void;
  saintName: string;
  state: CarouselViewerState;
}) {
  const image = state.images[state.selectedIndex];
  const hasPrevious = state.selectedIndex > 0;
  const hasNext = state.selectedIndex < state.images.length - 1;
  const visibleThumbs = getVisibleCarouselThumbs(state.images, state.selectedIndex);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft" && hasPrevious) {
        event.preventDefault();
        onSelect(state.selectedIndex - 1);
      }

      if (event.key === "ArrowRight" && hasNext) {
        event.preventDefault();
        onSelect(state.selectedIndex + 1);
      }

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasNext, hasPrevious, onClose, onSelect, state.selectedIndex]);

  return (
    <div className="instagram-carousel-viewer" role="dialog" aria-modal="true" aria-label={`Carousel images for ${saintName}`}>
      <div className="instagram-carousel-viewer__panel">
        <header className="instagram-carousel-viewer__header">
          <div>
            <strong>{saintName}</strong>
            <span>{state.selectedIndex + 1} of {state.images.length}</span>
          </div>
          <button aria-label="Close carousel viewer" onClick={onClose} type="button">
            <X size={22} aria-hidden="true" />
          </button>
        </header>

        <div className="instagram-carousel-viewer__stage">
          <button
            aria-label="Previous image"
            disabled={!hasPrevious}
            onClick={() => onSelect(state.selectedIndex - 1)}
            type="button"
          >
            <ChevronLeft size={26} aria-hidden="true" />
          </button>
          {image ? (
            <img src={image} alt={`Instagram carousel image ${state.selectedIndex + 1} for ${saintName}`} />
          ) : (
            <span>No carousel image available</span>
          )}
          <button
            aria-label="Next image"
            disabled={!hasNext}
            onClick={() => onSelect(state.selectedIndex + 1)}
            type="button"
          >
            <ChevronRight size={26} aria-hidden="true" />
          </button>
        </div>

        <div className="instagram-carousel-viewer__thumb-nav">
          <button
            aria-label="Previous thumbnail"
            disabled={!hasPrevious}
            onClick={() => onSelect(state.selectedIndex - 1)}
            type="button"
          >
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <div className="instagram-carousel-viewer__thumbs" aria-label="Carousel image picker">
            {visibleThumbs.map(({ index, url }) => (
              <button
                aria-current={index === state.selectedIndex ? "true" : undefined}
                aria-label={`Show image ${index + 1}`}
                key={`${url}-${index}`}
                onClick={() => onSelect(index)}
                type="button"
              >
                <img src={url} alt="" />
              </button>
            ))}
          </div>
          <button
            aria-label="Next thumbnail"
            disabled={!hasNext}
            onClick={() => onSelect(state.selectedIndex + 1)}
            type="button"
          >
            <ChevronRight size={22} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

function getInstagramAlt(post: PublicInstagramItem, saintName: string) {
  return post.caption ? `Instagram post about ${saintName}: ${post.caption.slice(0, 80)}` : `Instagram ${formatPostType(post.type).toLowerCase()} about ${saintName}`;
}

function getCarouselImages(post: PublicInstagramItem) {
  const images = post.carouselImageUrls?.length ? post.carouselImageUrls : [post.thumbnailUrl].filter(Boolean);
  return Array.from(new Set(images)) as string[];
}

function getVisibleCarouselThumbs(images: string[], selectedIndex: number) {
  const visibleCount = 7;
  const halfWindow = Math.floor(visibleCount / 2);
  const start = Math.min(Math.max(selectedIndex - halfWindow, 0), Math.max(images.length - visibleCount, 0));
  return images.slice(start, start + visibleCount).map((url, offset) => ({ index: start + offset, url }));
}

function formatPostedAt(postedAt?: string) {
  if (!postedAt) return undefined;
  const date = new Date(postedAt);
  if (Number.isNaN(date.getTime())) return undefined;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function formatPostType(type: PublicInstagramItem["type"]) {
  if (type === "reel") return "Reel";
  if (type === "carousel") return "Carousel";
  if (type === "post") return "Post";
  return "Instagram post";
}
