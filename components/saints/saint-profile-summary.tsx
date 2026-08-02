"use client";

import { useEffect, useRef, useState } from "react";

export function SaintProfileSummary({ children }: { children: string }) {
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
      if (!overflows) { setCollapsedText(children); return; }
      let low = 1;
      let high = words.length;
      let best = words[0] ?? "";
      while (low <= high) {
        const midpoint = Math.floor((low + high) / 2);
        const candidate = `${words.slice(0, midpoint).join(" ")}…`;
        text.textContent = candidate;
        if (element.scrollHeight <= maximumHeight) { best = candidate; low = midpoint + 1; }
        else { high = midpoint - 1; }
      }
      setCollapsedText(best);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(measurementElement);
    return () => observer.disconnect();
  }, [children]);

  return (
    <div className="saint-profile-summary">
      <p className="saint-profile-hero__summary" id="saint-profile-summary">
        <span>{expanded ? children : collapsedText}</span>
        {canExpand ? <>{" "}<button aria-controls="saint-profile-summary" aria-expanded={expanded} className="saint-profile-summary__toggle" onClick={() => setExpanded((current) => !current)} type="button">{expanded ? "less" : "more"}</button></> : null}
      </p>
      <p aria-hidden="true" className="saint-profile-hero__summary saint-profile-summary__measure" ref={measureRef}>
        <span data-summary-text>{children}</span>{" "}<button className="saint-profile-summary__toggle" tabIndex={-1} type="button">more</button>
      </p>
    </div>
  );
}
