import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { StatusBadge } from "@/components/ui/status-badge";

export function EditorialRevisionPreviewFrame({
  backHref,
  children,
  entityType,
  revisionStatus,
  title
}: {
  backHref: string;
  children: ReactNode;
  entityType: string;
  revisionStatus: "draft" | "needs_review";
  title: string;
}) {
  return (
    <div className="admin-preview-workspace">
      <header className="review-panel admin-preview-toolbar">
        <div>
          <div className="eyebrow">Private page preview</div>
          <h1>Previewing {title}</h1>
          <p>This renders the public {entityType} page with the pending narrative revision. The live page remains unchanged until publication.</p>
          <div className="review-meta">
            <StatusBadge label={revisionStatus === "needs_review" ? "Submitted for review" : "Draft revision"} />
            <StatusBadge label="Noindex" />
          </div>
        </div>
        <Link className="button button--secondary" href={backHref as Route}>Back to review</Link>
      </header>
      <div className="admin-preview-canvas" aria-label={`Public page preview for ${title}`}>
        {children}
      </div>
    </div>
  );
}
