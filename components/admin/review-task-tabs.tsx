"use client";

import clsx from "clsx";

export type ReviewTaskTab = {
  cardId: string;
  label: string;
  count?: number;
};

export function ReviewTaskTabs({ label = "Review sections", tabs }: { label?: string; tabs: ReviewTaskTab[] }) {
  function openCard(event: React.MouseEvent<HTMLAnchorElement>, cardId: string) {
    if (event.defaultPrevented) return;
    window.dispatchEvent(new CustomEvent("admin-review-card:open", { detail: { cardId } }));
    window.requestAnimationFrame(() => {
      const card = document.getElementById(`review-card-${cardId}`);
      if (!card) return;
      card.tabIndex = -1;
      card.focus({ preventScroll: true });
    });
  }

  return (
    <nav aria-label={label} className="review-task-tabs">
      {tabs.map((tab, index) => (
        <a
          className={clsx("review-task-tab", index === 0 && "review-task-tab--primary")}
          href={`#review-card-${tab.cardId}`}
          key={tab.cardId}
          onClick={(event) => openCard(event, tab.cardId)}
        >
          <span>{tab.label}</span>
          {typeof tab.count === "number" ? <span className="review-task-tab__count">{tab.count}</span> : null}
        </a>
      ))}
    </nav>
  );
}
