"use client";

import { useEffect, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from "react";
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

const iconSize = {
  action: "var(--size-icon-action)",
  fallback: "var(--size-icon-fallback)",
  lg: "var(--size-icon-lg)",
  md: "var(--size-icon-md)",
  nav: "var(--size-icon-nav)",
  sm: "var(--size-icon-sm)",
  xs: "var(--size-icon-xs)"
} as const;

const visibleThumbnailCount = 7;
const viewerCaptionPreviewLength = 360;

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
            onOpenPost={() => setActiveCarousel(getViewerState(post, 0))}
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

export type CarouselViewerState = {
  images: string[];
  post: PublicInstagramItem;
  selectedIndex: number;
};

export function InstagramPostCard({
  className,
  content,
  onOpenPost,
  post,
  saintName
}: {
  className?: string;
  content: ReturnType<typeof getInstagramSectionContent>;
  onOpenPost: () => void;
  post: PublicInstagramItem;
  saintName: string;
}) {
  const postedAt = formatPostedAt(post.postedAt);
  const postLabel = formatPostType(post.type);

  function handleCardKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (isInteractiveEventTarget(event.target)) return;
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    onOpenPost();
  }

  function stopCardClick(event: ReactMouseEvent) {
    event.stopPropagation();
  }

  return (
    <article
      aria-label={`Open ${postLabel.toLowerCase()} viewer for ${saintName}`}
      className={["instagram-post-card instagram-post-card--interactive", className].filter(Boolean).join(" ")}
      onClick={onOpenPost}
      onKeyDown={handleCardKeyDown}
      role="button"
      tabIndex={0}
    >
      <header className="instagram-post-card__header">
        <a
          className="instagram-post-card__account"
          href="https://www.instagram.com/hindu_saints/"
          onClick={stopCardClick}
          {...getInstagramLinkProps("https://www.instagram.com/hindu_saints/")}
        >
          <span className="instagram-post-card__avatar" aria-hidden="true">
            <Instagram size={iconSize.sm} />
          </span>
          <span>
            <strong>hindu_saints</strong>
            <small>{saintName}</small>
          </span>
        </a>
        <a className="instagram-post-card__icon-link" href={post.url} aria-label={content.linkLabel} onClick={stopCardClick} {...getInstagramLinkProps(post.url)}>
          <MoreHorizontal size={iconSize.md} aria-hidden="true" />
        </a>
      </header>

      <div className="instagram-post-card__media">
        <div className="instagram-post-card__media-link">
          {post.thumbnailUrl ? (
            <img src={post.thumbnailUrl} alt={getInstagramAlt(post, saintName)} />
          ) : (
            <span className="instagram-post-card__media-fallback">
              {post.type === "reel" ? <PlayCircle size={iconSize.fallback} aria-hidden="true" /> : <Instagram size={iconSize.fallback} aria-hidden="true" />}
              <span>{postLabel}</span>
            </span>
          )}
        </div>
        {post.type === "carousel" ? (
          <button
            aria-label={`Open ${postLabel.toLowerCase()} images`}
            className="instagram-post-card__type instagram-post-card__type-button"
            onClick={(event) => {
              event.stopPropagation();
              onOpenPost();
            }}
            type="button"
          >
            <Images size={iconSize.sm} aria-hidden="true" />
          </button>
        ) : (
          <span className="instagram-post-card__type" aria-label={postLabel}>
            {post.type === "reel" ? <PlayCircle size={iconSize.sm} aria-hidden="true" /> : <Instagram size={iconSize.sm} aria-hidden="true" />}
          </span>
        )}
      </div>

      <div className="instagram-post-card__body">
        <div className="instagram-post-card__actions" aria-label="Instagram post actions">
          <span aria-label="Like">
            <Heart size={iconSize.action} />
          </span>
          <span aria-label="Comment">
            <MessageCircle size={iconSize.action} />
          </span>
          <span aria-label="Share">
            <Send size={iconSize.action} />
          </span>
          <span aria-label="Save">
            <Bookmark size={iconSize.action} />
          </span>
        </div>

        <div className="instagram-post-card__caption">
          <strong>hindu_saints</strong>
          <InstagramCaption caption={post.caption} fallback={`Related ${postLabel.toLowerCase()} for ${saintName}.`} />
        </div>

        <footer className="instagram-post-card__footer">
          <span>{postedAt ?? postLabel}</span>
          <a href={post.url} onClick={stopCardClick} {...getInstagramLinkProps(post.url)}>
            {content.linkLabel}
            <ExternalLink size={iconSize.xs} aria-hidden="true" />
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
          onClick={(event) => {
            event.stopPropagation();
            setExpanded(!expanded);
          }}
          type="button"
        >
          {expanded ? "less" : "more"}
        </button>
      ) : null}
    </span>
  );
}

export function InstagramCarouselViewer({
  mode = "modal",
  onClose,
  onSelect,
  saintName,
  state
}: {
  mode?: "modal" | "inline";
  onClose: () => void;
  onSelect: (selectedIndex: number) => void;
  saintName: string;
  state: CarouselViewerState;
}) {
  const image = state.images[state.selectedIndex];
  const hasPrevious = state.selectedIndex > 0;
  const hasNext = state.selectedIndex < state.images.length - 1;
  const postedAt = formatPostedAt(state.post.postedAt);
  const postLabel = formatPostType(state.post.type);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const viewerCaption = getViewerCaption(state.post.caption, `Related ${postLabel.toLowerCase()} for ${saintName}.`, isCaptionExpanded);
  const [thumbnailStart, setThumbnailStart] = useState(() => getVisibleThumbnailStart(state.images, state.selectedIndex));
  const maxThumbnailStart = Math.max(state.images.length - visibleThumbnailCount, 0);
  const canScrollThumbnailsPrevious = thumbnailStart > 0;
  const canScrollThumbnailsNext = thumbnailStart < maxThumbnailStart;
  const visibleThumbs = getVisibleCarouselThumbs(state.images, thumbnailStart);

  useEffect(() => {
    setThumbnailStart((currentStart) => {
      const nextMaxStart = Math.max(state.images.length - visibleThumbnailCount, 0);
      const nextStart = Math.min(currentStart, nextMaxStart);

      if (state.selectedIndex < nextStart) return state.selectedIndex;
      if (state.selectedIndex >= nextStart + visibleThumbnailCount) {
        return Math.min(state.selectedIndex - visibleThumbnailCount + 1, nextMaxStart);
      }

      return nextStart;
    });
  }, [state.images.length, state.selectedIndex]);

  useEffect(() => {
    setIsCaptionExpanded(false);
  }, [state.post.url]);

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

      if (mode === "modal" && event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasNext, hasPrevious, mode, onClose, onSelect, state.selectedIndex]);

  const viewerProps = mode === "modal"
    ? { role: "dialog", "aria-modal": true, "aria-label": `Carousel images for ${saintName}` }
    : { role: "region", "aria-label": `Selected Instagram post images for ${saintName}` };

  return (
    <div className={`instagram-carousel-viewer instagram-carousel-viewer--${mode}`} {...viewerProps}>
      <div className="instagram-carousel-viewer__panel">
        <header className="instagram-carousel-viewer__header">
          <div>
            <strong>{saintName}</strong>
            <span>{state.selectedIndex + 1} of {state.images.length}</span>
          </div>
          {mode === "modal" ? (
            <button className="instagram-carousel-viewer__control" aria-label="Close carousel viewer" onClick={onClose} type="button">
              <X size={iconSize.lg} aria-hidden="true" />
            </button>
          ) : null}
        </header>

        <div className="instagram-carousel-viewer__content">
          <div className="instagram-carousel-viewer__media-column">
            <div className="instagram-carousel-viewer__stage">
              <button
                className="instagram-carousel-viewer__control"
                aria-label="Previous image"
                disabled={!hasPrevious}
                onClick={() => onSelect(state.selectedIndex - 1)}
                type="button"
              >
                <ChevronLeft size={iconSize.nav} aria-hidden="true" />
              </button>
              {image ? (
                <img src={image} alt={`Instagram carousel image ${state.selectedIndex + 1} for ${saintName}`} />
              ) : (
                <span>No carousel image available</span>
              )}
              <button
                className="instagram-carousel-viewer__control"
                aria-label="Next image"
                disabled={!hasNext}
                onClick={() => onSelect(state.selectedIndex + 1)}
                type="button"
              >
                <ChevronRight size={iconSize.nav} aria-hidden="true" />
              </button>
            </div>

            <div className="instagram-carousel-viewer__thumb-nav">
              <button
                className="instagram-carousel-viewer__control"
                aria-label="Previous thumbnail"
                disabled={!canScrollThumbnailsPrevious}
                onClick={() => setThumbnailStart(Math.max(thumbnailStart - 1, 0))}
                type="button"
              >
                <ChevronLeft size={iconSize.lg} aria-hidden="true" />
              </button>
              <div className="instagram-carousel-viewer__thumbs" aria-label="Carousel image picker">
                {visibleThumbs.map(({ index, url }) => (
                  <button
                    className="instagram-carousel-viewer__control"
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
                className="instagram-carousel-viewer__control"
                aria-label="Next thumbnail"
                disabled={!canScrollThumbnailsNext}
                onClick={() => setThumbnailStart(Math.min(thumbnailStart + 1, maxThumbnailStart))}
                type="button"
              >
                <ChevronRight size={iconSize.lg} aria-hidden="true" />
              </button>
            </div>
          </div>

          <aside className="instagram-carousel-viewer__details" aria-label="Instagram post caption">
            <a className="instagram-carousel-viewer__account" href="https://www.instagram.com/hindu_saints/" {...getInstagramLinkProps("https://www.instagram.com/hindu_saints/")}>
              <span className="instagram-post-card__avatar" aria-hidden="true">
                <Instagram size={iconSize.sm} />
              </span>
              <span>
                <strong>hindu_saints</strong>
                <small>{saintName}</small>
              </span>
            </a>
            <div className={["instagram-carousel-viewer__caption", isCaptionExpanded ? "instagram-carousel-viewer__caption--expanded" : null].filter(Boolean).join(" ")}>
              <p>
                {viewerCaption.text}
                {viewerCaption.shouldClamp ? (
                  <button
                    className="instagram-carousel-viewer__caption-toggle"
                    onClick={() => setIsCaptionExpanded(!isCaptionExpanded)}
                    type="button"
                  >
                    {isCaptionExpanded ? "less" : "more"}
                  </button>
                ) : null}
              </p>
            </div>
            <footer className="instagram-carousel-viewer__meta">
              <span>{postedAt ?? postLabel}</span>
              <a href={state.post.url} {...getInstagramLinkProps(state.post.url)}>
                View on Instagram
                <ExternalLink size={iconSize.xs} aria-hidden="true" />
              </a>
            </footer>
          </aside>
        </div>
      </div>
    </div>
  );
}

function getInstagramAlt(post: PublicInstagramItem, saintName: string) {
  return post.caption ? `Instagram post about ${saintName}: ${post.caption.slice(0, 80)}` : `Instagram ${formatPostType(post.type).toLowerCase()} about ${saintName}`;
}

function getViewerCaption(caption: string | undefined, fallback: string, isExpanded: boolean) {
  const text = caption?.trim() || fallback;
  const shouldClamp = text.length > viewerCaptionPreviewLength;

  return {
    shouldClamp,
    text: isExpanded || !shouldClamp ? text : `${text.slice(0, viewerCaptionPreviewLength)}...`
  };
}

function isInteractiveEventTarget(target: EventTarget) {
  return target instanceof Element && Boolean(target.closest("a, button"));
}

export function getCarouselImages(post: PublicInstagramItem) {
  const images = post.carouselImageUrls?.length ? post.carouselImageUrls : [post.thumbnailUrl].filter(Boolean);
  return Array.from(new Set(images)) as string[];
}

export function getViewerState(post: PublicInstagramItem, selectedIndex: number): CarouselViewerState {
  const images = getCarouselImages(post);

  return {
    images,
    post,
    selectedIndex: images.length > 0 ? Math.min(selectedIndex, images.length - 1) : 0
  };
}

function getVisibleThumbnailStart(images: string[], selectedIndex: number) {
  const halfWindow = Math.floor(visibleThumbnailCount / 2);
  return Math.min(Math.max(selectedIndex - halfWindow, 0), Math.max(images.length - visibleThumbnailCount, 0));
}

function getVisibleCarouselThumbs(images: string[], start: number) {
  return images.slice(start, start + visibleThumbnailCount).map((url, offset) => ({ index: start + offset, url }));
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
