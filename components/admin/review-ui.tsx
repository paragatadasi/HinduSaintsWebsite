"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

type ReviewWorkflowProps = {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  gridClassName?: string;
};

export function ReviewWorkflow({
  eyebrow,
  title,
  description,
  children,
  className,
  gridClassName
}: ReviewWorkflowProps) {
  return (
    <section className={clsx("review-panel review-panel--workflow", className)}>
      <div className="review-workflow__header">
        <div className="review-workflow__heading">
          <div className="review-workflow__eyebrow">{eyebrow}</div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
      </div>
      <div className={clsx("review-workflow__grid", gridClassName)}>
        {children}
      </div>
    </section>
  );
}

type ReviewSectionProps = {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function ReviewSection({ title, icon, children, className }: ReviewSectionProps) {
  return (
    <section className={clsx("review-workflow__section", className)}>
      <div className="review-workflow__section-title">
        {icon}
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}

type ReviewFact = {
  label: string;
  value?: ReactNode;
};

export function ReviewFactGrid({ facts }: { facts: ReviewFact[] }) {
  return (
    <div className="review-fact-grid">
      {facts.map((fact) => (
        <div className="review-fact" key={fact.label}>
          <strong>{fact.label}</strong>
          <span>{fact.value || "Not set"}</span>
        </div>
      ))}
    </div>
  );
}
