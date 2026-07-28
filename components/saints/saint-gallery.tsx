"use client";

import { useEffect, useRef, useState } from "react";
import type { TouchEvent as ReactTouchEvent } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { FocalImage } from "@/components/ui/focal-image";
import type { PublicImage } from "@/lib/public-contracts";

const iconSize = {
  lg: "var(--size-icon-lg)",
  nav: "var(--size-icon-nav)"
} as const;

const swipeThreshold = 48;

type SaintGalleryProps = {
  images: PublicImage[];
  saintName: string;
};

export function SaintGallery({ images, saintName }: SaintGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const thumbnailRailRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isViewerOpen = selectedIndex !== null;
  const selectedImage = selectedIndex === null ? null : images[selectedIndex];
  const hasPrevious = selectedIndex !== null && selectedIndex > 0;
  const hasNext = selectedIndex !== null && selectedIndex < images.length - 1;

  useEffect(() => {
    if (!isViewerOpen || selectedIndex === null) return;
    const currentIndex = selectedIndex;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft" && currentIndex > 0) {
        event.preventDefault();
        setSelectedIndex(currentIndex - 1);
      }

      if (event.key === "ArrowRight" && currentIndex < images.length - 1) {
        event.preventDefault();
        setSelectedIndex(currentIndex + 1);
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setSelectedIndex(null);
      }

      if (event.key === "Tab") {
        const focusableElements = getFocusableElements(panelRef.current);
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length, isViewerOpen, selectedIndex]);

  useEffect(() => {
    if (!isViewerOpen) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const scrollPosition = window.scrollY;
    const previousBodyStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width
    };

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollPosition}px`;
    document.body.style.width = "100%";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousBodyStyles.overflow;
      document.body.style.position = previousBodyStyles.position;
      document.body.style.top = previousBodyStyles.top;
      document.body.style.width = previousBodyStyles.width;
      window.scrollTo(0, scrollPosition);
      previouslyFocused?.focus();
    };
  }, [isViewerOpen]);

  useEffect(() => {
    if (selectedIndex === null) return;

    const selectedThumbnail = thumbnailRailRef.current?.querySelector<HTMLElement>('[aria-current="true"]');
    selectedThumbnail?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [selectedIndex]);

  function selectPrevious() {
    if (selectedIndex === null || selectedIndex <= 0) return;
    setSelectedIndex(selectedIndex - 1);
  }

  function selectNext() {
    if (selectedIndex === null || selectedIndex >= images.length - 1) return;
    setSelectedIndex(selectedIndex + 1);
  }

  function handleTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    touchStartRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  }

  function handleTouchEnd(event: ReactTouchEvent<HTMLDivElement>) {
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];
    touchStartRef.current = null;
    if (!start || !touch) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < swipeThreshold || Math.abs(deltaX) <= Math.abs(deltaY)) return;

    if (deltaX > 0) selectPrevious();
    if (deltaX < 0) selectNext();
  }

  return (
    <>
      <div className="media-grid saint-gallery" aria-label={`Gallery images for ${saintName}`}>
        {images.map((image, index) => (
          <figure className="image-with-credit saint-gallery__item" key={`${image.url}-${image.alt}`}>
            <button
              className="saint-gallery__trigger"
              aria-label={`Open image ${index + 1} of ${images.length}: ${image.alt}`}
              onClick={() => setSelectedIndex(index)}
              type="button"
            >
              <FocalImage
                src={image.url}
                alt={image.alt}
                width={image.width}
                height={image.height}
                focalPoint={image.focalPoint}
              />
            </button>
            {image.caption || image.credit ? (
              <figcaption>
                {image.caption ? <span>{image.caption}</span> : null}
                {image.credit ? <small>{image.credit}</small> : null}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>

      {selectedImage && selectedIndex !== null ? (
        <div
          className="saint-gallery-viewer"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedIndex(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`Gallery image viewer for ${saintName}`}
        >
          <div className="saint-gallery-viewer__panel" ref={panelRef}>
            <header className="saint-gallery-viewer__header">
              <div>
                <strong>{saintName}</strong>
                <span>{selectedIndex + 1} of {images.length}</span>
              </div>
              <button
                className="saint-gallery-viewer__control saint-gallery-viewer__close"
                aria-label="Close gallery viewer"
                onClick={() => setSelectedIndex(null)}
                ref={closeButtonRef}
                type="button"
              >
                <X size={iconSize.lg} aria-hidden="true" />
              </button>
            </header>

            <div
              className="saint-gallery-viewer__stage"
              onTouchEnd={handleTouchEnd}
              onTouchStart={handleTouchStart}
            >
              <button
                className="saint-gallery-viewer__control"
                aria-label="Previous image"
                disabled={!hasPrevious}
                onClick={selectPrevious}
                type="button"
              >
                <ChevronLeft size={iconSize.nav} aria-hidden="true" />
              </button>
              <img
                src={selectedImage.url}
                alt={selectedImage.alt}
                width={selectedImage.width}
                height={selectedImage.height}
              />
              <button
                className="saint-gallery-viewer__control"
                aria-label="Next image"
                disabled={!hasNext}
                onClick={selectNext}
                type="button"
              >
                <ChevronRight size={iconSize.nav} aria-hidden="true" />
              </button>
            </div>

            <footer className="saint-gallery-viewer__footer">
              <div className="saint-gallery-viewer__details">
                <strong>{selectedImage.caption ?? selectedImage.alt}</strong>
                {selectedImage.credit ? <span>{selectedImage.credit}</span> : null}
              </div>
              <div className="saint-gallery-viewer__thumbs" aria-label="Gallery image picker" ref={thumbnailRailRef}>
                {images.map((image, index) => (
                  <button
                    aria-current={index === selectedIndex ? "true" : undefined}
                    aria-label={`Show image ${index + 1}`}
                    key={`${image.url}-viewer-${index}`}
                    onClick={() => setSelectedIndex(index)}
                    type="button"
                  >
                    <FocalImage
                      src={image.url}
                      alt=""
                      width={image.width}
                      height={image.height}
                      focalPoint={image.focalPoint}
                    />
                  </button>
                ))}
              </div>
            </footer>
          </div>
        </div>
      ) : null}
    </>
  );
}

function getFocusableElements(container: HTMLElement | null) {
  if (!container) return [];

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");
}
