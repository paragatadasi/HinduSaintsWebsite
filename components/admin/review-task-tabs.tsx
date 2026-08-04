"use client";

import clsx from "clsx";

export type ReviewTaskTab = {
  cardId: string;
  label: string;
  count?: number;
};

export function ReviewTaskTabs({ label = "Review sections", tabs }: { label?: string; tabs: ReviewTaskTab[] }) {
  function openCard(cardId: string) {
    window.dispatchEvent(new CustomEvent("admin-review-card:open", { detail: { cardId } }));
  }

  return (
    <nav aria-label={label} className="review-task-tabs">
      {tabs.map((tab, index) => (
        <a
          className={clsx("review-task-tab", index === 0 && "review-task-tab--primary")}
          href={`#review-card-${tab.cardId}`}
          key={tab.cardId}
          onClick={() => openCard(tab.cardId)}
        >
          <span>{tab.label}</span>
          {typeof tab.count === "number" ? <span className="review-task-tab__count">{tab.count}</span> : null}
        </a>
      ))}
    </nav>
  );
}
