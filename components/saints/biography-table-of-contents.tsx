"use client";

import { useEffect, useState } from "react";

export type BiographyTableOfContentsItem = {
  id: string;
  label: string;
};

export function BiographyTableOfContents({ items }: { items: BiographyTableOfContentsItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const targets = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => Boolean(element));
    if (targets.length === 0) return;

    let frame = 0;
    const updateActiveSection = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const readingLine = window.innerHeight * 0.32;
        let active = targets[0];
        for (const target of targets) {
          if (target.getBoundingClientRect().top <= readingLine) active = target;
        }
        if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
          active = targets.at(-1) ?? active;
        }
        setActiveId(active.id);
      });
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [items]);

  return (
    <nav aria-label="Biography sections" className="saint-biography-toc">
      <div className="saint-biography-toc__label">On this page</div>
      <ol>
        {items.map((item) => (
          <li key={item.id}>
            <a aria-current={activeId === item.id ? "location" : undefined} href={`#${item.id}`}>{item.label}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
