import Link from "next/link";
import { notFound } from "next/navigation";
import type { Route } from "next";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { mergeTraditions, updateTradition, updateTraditionReviewStatus } from "../actions";

type AdminTraditionEditorPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminTraditionEditorPage({ params }: AdminTraditionEditorPageProps) {
  const { id } = await params;
  const tradition = await getTradition(id);

  if (!tradition) notFound();

  const allTraditions = await db.tradition.findMany({
    where: { id: { not: tradition.id } },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { saints: true, childTraditions: true } }
    }
  });

  return (
    <div className="admin-stack">
      <div className="admin-toolbar">
        <div>
          <div className="eyebrow">Editing tradition</div>
          <h1>{tradition.name}</h1>
          <div className="review-meta">
            <StatusBadge label={formatStatus(tradition.status)} />
            <StatusBadge label={`${tradition._count.saints} saints`} />
            {tradition.parentTradition ? <StatusBadge label={`parent: ${tradition.parentTradition.name}`} /> : null}
          </div>
        </div>
        <div className="review-actions">
          <Link className="button button--secondary" href="/admin/traditions">Back to traditions</Link>
          {tradition.status === "published" ? (
            <Link className="button button--secondary" href={`/traditions/${tradition.slug}` as Route}>View public page</Link>
          ) : null}
        </div>
      </div>

      <div className="review-detail-grid">
        <section className="review-panel">
          <h2>Public fields</h2>
          <form action={updateTradition} className="form-stack">
            <input name="traditionId" type="hidden" value={tradition.id} />
            <label>
              Name
              <input name="name" defaultValue={tradition.name} required maxLength={200} />
            </label>
            <label>
              Alternate names
              <textarea name="alternateNames" defaultValue={tradition.alternateNames.join("\n")} />
            </label>
            <label>
              Parent tradition
              <select name="parentTraditionId" defaultValue={tradition.parentTraditionId ?? ""}>
                <option value="">No parent tradition</option>
                {allTraditions.map((option) => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select name="status" defaultValue={tradition.status}>
                {contentStatuses.map((status) => (
                  <option key={status} value={status}>{formatStatus(status)}</option>
                ))}
              </select>
            </label>
            <label>
              Short description
              <textarea name="shortDescription" defaultValue={tradition.shortDescription ?? ""} maxLength={500} />
            </label>
            <div className="form-stack__field">
              <label htmlFor="tradition-overview">Page overview</label>
              <MarkdownEditor
                defaultValue={tradition.longIntroductionMarkdown ?? ""}
                maxLength={20000}
                name="longIntroductionMarkdown"
                textareaId="tradition-overview"
              />
            </div>
            <label>
              SEO title
              <input name="seoTitle" defaultValue={tradition.seoTitle ?? ""} maxLength={120} />
            </label>
            <label>
              SEO description
              <textarea name="seoDescription" defaultValue={tradition.seoDescription ?? ""} maxLength={300} />
            </label>
            <div className="review-actions">
              <button className="admin-form-button" type="submit">Save tradition</button>
            </div>
          </form>
        </section>

        <aside className="review-panel">
          <h2>Publication</h2>
          <p>Publish reviewed tradition pages to make them visible on the public home page, index, and detail routes.</p>
          <div className="review-actions">
            <StatusForm traditionId={tradition.id} status="published" label="Publish tradition" />
            <StatusForm traditionId={tradition.id} status="needs_review" label="Return to review" variant="secondary" />
            <StatusForm traditionId={tradition.id} status="archived" label="Archive" variant="warning" />
          </div>

          <div className="review-panel__subsection">
          <h2>Merge duplicate</h2>
          <p>Move saint relationships, source links, and child tradition links from another record into this tradition.</p>
          <form action={mergeTraditions} className="form-stack">
            <input name="targetTraditionId" type="hidden" value={tradition.id} />
            <label>
              Duplicate tradition
              <select name="sourceTraditionId" required>
                <option value="">Select duplicate</option>
                {allTraditions.map((option) => (
                  <option key={option.id} value={option.id}>{option.name} ({option._count.saints} saints)</option>
                ))}
              </select>
            </label>
            <div className="review-actions">
              <button className="admin-form-button admin-form-button--warning" type="submit">Merge into this tradition</button>
            </div>
          </form>
          </div>

          <div className="review-panel__subsection">
            <h3>Child traditions</h3>
            {tradition.childTraditions.length > 0 ? (
              <div className="review-list">
                {tradition.childTraditions.map((child) => (
                  <Link className="admin-text-link" href={`/admin/traditions/${child.slug}` as Route} key={child.id}>
                    {child.name}
                  </Link>
                ))}
              </div>
            ) : (
              <p>No child traditions are attached.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

async function getTradition(slugOrId: string) {
  return db.tradition.findFirst({
    where: {
      OR: [
        { slug: slugOrId },
        { id: slugOrId }
      ]
    },
    include: {
      parentTradition: { select: { id: true, name: true, slug: true } },
      childTraditions: {
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true }
      },
      _count: { select: { saints: true } }
    }
  });
}

const contentStatuses = ["draft", "needs_review", "published", "archived"] as const;

function StatusForm({
  traditionId,
  status,
  label,
  variant = "primary"
}: {
  traditionId: string;
  status: "needs_review" | "published" | "archived";
  label: string;
  variant?: "primary" | "secondary" | "warning";
}) {
  const className = [
    "admin-form-button",
    variant === "secondary" ? "admin-form-button--secondary" : null,
    variant === "warning" ? "admin-form-button--warning" : null
  ].filter(Boolean).join(" ");

  return (
    <form action={updateTraditionReviewStatus}>
      <input name="traditionId" type="hidden" value={traditionId} />
      <input name="status" type="hidden" value={status} />
      <button className={className} type="submit">{label}</button>
    </form>
  );
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}
