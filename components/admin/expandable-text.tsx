"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";

type ExpandableTextProps = {
  children: string;
  collapsedLines?: number;
};

export function ExpandableText({ children, collapsedLines = 4 }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const paragraphs = useMemo(() => splitParagraphs(children), [children]);

  if (paragraphs.length === 0) return <p>No text imported yet.</p>;

  return (
    <div
      className="expandable-text"
      data-expanded={isExpanded ? "true" : "false"}
      style={{ "--expandable-lines": collapsedLines } as CSSProperties & Record<"--expandable-lines", number>}
    >
      <div className="expandable-text__content">
        {paragraphs.map((paragraph, index) => (
          <p key={`${paragraph}-${index}`}>{paragraph}</p>
        ))}
      </div>
      <button className="admin-text-link expandable-text__toggle" type="button" onClick={() => setIsExpanded((current) => !current)}>
        {isExpanded ? "Show less" : "Show more"}
      </button>
    </div>
  );
}

function splitParagraphs(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}|\n(?=#)/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
