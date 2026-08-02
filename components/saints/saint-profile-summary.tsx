"use client";

import { useEffect, useRef, useState } from "react";

export function SaintProfileSummary({ children }: { children: string }) {
  const summaryRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  useEffect(() => {
    const summary = summaryRef.current;
    if (!summary) return;

    function measure() {
      if (!summaryRef.current || expanded) return;
      setCanExpand(summaryRef.current.scrollHeight > summaryRef.current.clientHeight + 1);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(summary);
    return () => observer.disconnect();
  }, [children, expanded]);

  return (
    <div className="saint-profile-summary">
      <p
        className={expanded ? "saint-profile-hero__summary saint-profile-hero__summary--expanded" : "saint-profile-hero__summary"}
        id="saint-profile-summary"
        ref={summaryRef}
      >
        {children}
      </p>
      {canExpand || expanded ? (
        <button
          aria-controls="saint-profile-summary"
          aria-expanded={expanded}
          className="saint-profile-summary__toggle"
          onClick={() => setExpanded((current) => !current)}
          type="button"
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}
