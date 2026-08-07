"use client";

import { useEffect, useState } from "react";

export type ReviewSectionLink = {
  cardId: string;
  count?: number;
  label: string;
};

export function ReviewSectionNav({
  label = "Review sections",
  links
}: {
  label?: string;
  links: ReviewSectionLink[];
}) {
  const [activeCardId, setActiveCardId] = useState<string>();

  useEffect(() => {
    const syncHash = () => setActiveCardId(window.location.hash.replace(/^#review-card-/, "") || undefined);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  function openCard(cardId: string) {
    setActiveCardId(cardId);
    window.dispatchEvent(new CustomEvent("admin-review-card:open", { detail: { cardId } }));
    window.requestAnimationFrame(() => {
      const card = document.getElementById(`review-card-${cardId}`);
      if (!card) return;
      card.tabIndex = -1;
      card.focus({ preventScroll: true });
    });
  }

  return (
    <nav aria-label={label} className="review-section-nav admin-tab-strip">
      {links.map((link) => (
        <a
          aria-current={activeCardId === link.cardId ? "location" : undefined}
          className="review-section-link admin-tab-strip__tab"
          href={`#review-card-${link.cardId}`}
          key={link.cardId}
          onClick={() => openCard(link.cardId)}
        >
          <span>{link.label}</span>
          {typeof link.count === "number" ? <span className="review-section-link__count">{link.count}</span> : null}
        </a>
      ))}
    </nav>
  );
}
