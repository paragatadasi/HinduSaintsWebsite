"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function SaintProfileSummary({ children, variant = "compact" }: { children: string; variant?: "compact" | "editorial" }) {
  const summaryId = useId();
  const measureRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const [collapsedText, setCollapsedText] = useState(children);

  useEffect(() => {
    const measurementElement = measureRef.current;
    if (!measurementElement) return;

    function measure() {
      const element = measureRef.current;
      const text = element?.querySelector<HTMLElement>("[data-summary-text]");
      if (!element || !text) return;
      const lineHeight = Number.parseFloat(window.getComputedStyle(element).lineHeight);
      const maximumHeight = lineHeight * 3 + 1;
      const words = children.trim().split(/\s+/);
      text.textContent = children;
      const overflows = element.scrollHeight > maximumHeight;
      setCanExpand(overflows);
      if (!overflows) {
        setCollapsedText(children);
        return;
      }

      let low = 1;
      let high = words.length;
      let best = words[0] ?? "";
      while (low <= high) {
        const midpoint = Math.floor((low + high) / 2);
        const candidate = `${words.slice(0, midpoint).join(" ")}…`;
        text.textContent = candidate;
        if (element.scrollHeight <= maximumHeight) {
          best = candidate;
          low = midpoint + 1;
        } else {
          high = midpoint - 1;
        }
      }
      setCollapsedText(best);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(measurementElement);
    return () => observer.disconnect();
  }, [children, variant]);

  if (variant === "editorial") {
    return (
      <div className="saint-profile-summary saint-profile-summary--editorial">
        <div className="saint-profile-hero__summary" id={summaryId}>
          {expanded ? children.split(/\n\s*\n/).filter((paragraph) => paragraph.trim()).map((paragraph, index) => <p key={index}>{paragraph}</p>) : <p>{collapsedText}</p>}
        </div>
        {canExpand ? (
          <button aria-controls={summaryId} aria-expanded={expanded} className="saint-profile-summary__toggle" onClick={() => setExpanded((current) => !current)} type="button">
            {expanded ? "Read less" : "Read more"}
            {expanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
          </button>
        ) : null}
        <p aria-hidden="true" className="saint-profile-hero__summary saint-profile-summary__measure" ref={measureRef}><span data-summary-text>{children}</span></p>
      </div>
    );
  }

  return (
    <div className="saint-profile-summary">
      <p className="saint-profile-hero__summary" id={summaryId}>
        <span>{expanded ? children : collapsedText}</span>
        {canExpand ? (
          <>
            {" "}
            <button
              aria-controls={summaryId}
              aria-expanded={expanded}
              className="saint-profile-summary__toggle"
              onClick={() => setExpanded((current) => !current)}
              type="button"
            >
              {expanded ? "less" : "more"}
            </button>
          </>
        ) : null}
      </p>
      <p aria-hidden="true" className="saint-profile-hero__summary saint-profile-summary__measure" ref={measureRef}>
        <span data-summary-text>{children}</span>{" "}<button className="saint-profile-summary__toggle" tabIndex={-1} type="button">more</button>
      </p>
    </div>
  );
}
