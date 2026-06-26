"use client";

import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

type CollapsibleReviewCardProps = {
  cardId: string;
  title: string;
  eyebrow?: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
};

type CollapsibleReviewSectionProps = {
  cardId: string;
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
};

export function CollapsibleReviewCard({
  cardId,
  title,
  eyebrow,
  description,
  defaultOpen = false,
  children,
  className
}: CollapsibleReviewCardProps) {
  const pathname = usePathname();
  const storageKey = useMemo(() => `admin-review-card:${pathname}:${cardId}`, [cardId, pathname]);
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    const storedValue = window.sessionStorage.getItem(storageKey);
    if (storedValue === "open") setIsOpen(true);
    if (storedValue === "closed") setIsOpen(false);
  }, [storageKey]);

  function toggleOpen() {
    setIsOpen((current) => {
      const next = !current;
      window.sessionStorage.setItem(storageKey, next ? "open" : "closed");
      return next;
    });
  }

  return (
    <section className={clsx("review-panel review-panel--collapsible", className)} data-open={isOpen ? "true" : "false"}>
      <button
        aria-expanded={isOpen}
        className="review-collapsible__trigger"
        type="button"
        onClick={toggleOpen}
      >
        <span className="review-collapsible__heading">
          {eyebrow ? <span className="review-collapsible__eyebrow">{eyebrow}</span> : null}
          <span className="review-collapsible__title">{title}</span>
          {description ? <span className="review-collapsible__description">{description}</span> : null}
        </span>
        <ChevronDown aria-hidden="true" className="review-collapsible__icon" size={18} />
      </button>
      {isOpen ? <div className="review-collapsible__content">{children}</div> : null}
    </section>
  );
}

export function CollapsibleReviewSection({
  cardId,
  title,
  icon,
  defaultOpen = false,
  children,
  className
}: CollapsibleReviewSectionProps) {
  const { isOpen, toggleOpen } = useSessionOpenState(cardId, defaultOpen);

  return (
    <section className={clsx("review-workflow__section review-workflow__section--collapsible", className)} data-open={isOpen ? "true" : "false"}>
      <button
        aria-expanded={isOpen}
        className="review-workflow__section-trigger"
        type="button"
        onClick={toggleOpen}
      >
        <span className="review-workflow__section-title">
          {icon}
          <h3>{title}</h3>
        </span>
        <ChevronDown aria-hidden="true" className="review-collapsible__icon" size={18} />
      </button>
      {isOpen ? <div className="review-workflow__section-content">{children}</div> : null}
    </section>
  );
}

function useSessionOpenState(cardId: string, defaultOpen: boolean) {
  const pathname = usePathname();
  const storageKey = useMemo(() => `admin-review-card:${pathname}:${cardId}`, [cardId, pathname]);
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    const storedValue = window.sessionStorage.getItem(storageKey);
    if (storedValue === "open") setIsOpen(true);
    if (storedValue === "closed") setIsOpen(false);
  }, [storageKey]);

  function toggleOpen() {
    setIsOpen((current) => {
      const next = !current;
      window.sessionStorage.setItem(storageKey, next ? "open" : "closed");
      return next;
    });
  }

  return { isOpen, toggleOpen };
}
