"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

const scrollRailIconSize = "var(--size-scroll-button-icon)";

type ScrollRailProps = {
  children: ReactNode;
  ariaLabel: string;
  className?: string;
  controls?: "auto" | "always";
};

export function ScrollRail({ children, ariaLabel, className, controls: controlsMode = "auto" }: ScrollRailProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [controls, setControls] = useState({
    hasOverflow: false,
    canScrollPrevious: false,
    canScrollNext: false
  });

  function updateControls() {
    const rail = railRef.current;
    if (!rail) return;

    const maxScroll = rail.scrollWidth - rail.clientWidth;
    setControls({
      hasOverflow: maxScroll > 1,
      canScrollPrevious: rail.scrollLeft > 1,
      canScrollNext: rail.scrollLeft < maxScroll - 1
    });
  }

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const animationFrame = window.requestAnimationFrame(updateControls);
    const resizeObserver = new ResizeObserver(updateControls);

    resizeObserver.observe(rail);
    Array.from(rail.children).forEach((child) => resizeObserver.observe(child));
    window.addEventListener("resize", updateControls);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateControls);
    };
  }, [children]);

  const shouldShowControls = controlsMode === "always" || controls.hasOverflow;

  function scroll(direction: "previous" | "next") {
    const rail = railRef.current;
    if (!rail) return;

    rail.scrollBy({
      left: (direction === "next" ? 1 : -1) * rail.clientWidth * 0.86,
      behavior: "smooth"
    });
  }

  return (
    <div className={["scroll-section", className].filter(Boolean).join(" ")}>
      {shouldShowControls ? (
        <button
          className="scroll-button scroll-button--previous"
          type="button"
          aria-label={`Previous ${ariaLabel}`}
          disabled={!controls.canScrollPrevious}
          onClick={() => scroll("previous")}
        >
          <ArrowLeft size={scrollRailIconSize} />
        </button>
      ) : null}
      <div ref={railRef} className="scroll-rail" aria-label={ariaLabel} onScroll={updateControls}>
        {children}
      </div>
      {shouldShowControls ? (
        <button
          className="scroll-button scroll-button--next"
          type="button"
          aria-label={`Next ${ariaLabel}`}
          disabled={!controls.canScrollNext}
          onClick={() => scroll("next")}
        >
          <ArrowRight size={scrollRailIconSize} />
        </button>
      ) : null}
    </div>
  );
}
