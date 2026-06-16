import Link from "next/link";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { mergeTraditions, updateTradition } from "./actions";

export default async function AdminTraditionsPage() {
  const traditions = await db.tradition.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { saints: true, childTraditions: true } }
    }
  });
  const traditionOptions = traditions.map((tradition) => ({
    id: tradition.id,
    label: `${tradition.name} (${tradition._count.saints} saints)`
  }));

  return (
    <div className="admin-stack">
      <div className="admin-toolbar">
        <div>
          <div className="eyebrow">Tradition editor</div>
          <h1>Traditions</h1>
          <p className="lede">Edit public tradition pages and consolidate duplicate tradition records.</p>
        </div>
      </div>

      <section className="review-panel">
        <h2>Consolidate duplicates</h2>
        <p>Move saint relationships, source links, and child tradition links from a duplicate record into the canonical tradition.</p>
        <form action={mergeTraditions} className="form-stack">
          <label>
            Duplicate tradition
            <select name="sourceTraditionId" required>
              <option value="">Select duplicate</option>
              {traditionOptions.map((tradition) => (
                <option key={tradition.id} value={tradition.id}>{tradition.label}</option>
              ))}
            </select>
          </label>
          <label>
            Canonical tradition
            <select name="targetTraditionId" required>
              <option value="">Select canonical</option>
              {traditionOptions.map((tradition) => (
                <option key={tradition.id} value={tradition.id}>{tradition.label}</option>
              ))}
            </select>
          </label>
          <div className="review-actions">
            <button className="admin-form-button admin-form-button--warning" type="submit">Merge duplicate</button>
          </div>
        </form>
      </section>

      <section className="review-list" aria-label="Tradition records">
        {traditions.map((tradition) => (
          <article className="review-panel" key={tradition.id}>
            <div className="admin-toolbar">
              <div>
                <div className="review-meta">
                  <StatusBadge label={formatStatus(tradition.status)} />
                  <StatusBadge label={`${tradition._count.saints} saints`} />
                  {tradition._count.childTraditions > 0 ? <StatusBadge label={`${tradition._count.childTraditions} child traditions`} /> : null}
                </div>
                <h2>{tradition.name}</h2>
              </div>
              {tradition.status === "published" ? (
                <Link className="button button--secondary" href={`/traditions/${tradition.slug}`}>View public page</Link>
              ) : null}
            </div>

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
                <label htmlFor={`tradition-overview-${tradition.id}`}>Page overview</label>
                <MarkdownEditor
                  defaultValue={tradition.longIntroductionMarkdown ?? ""}
                  maxLength={20000}
                  name="longIntroductionMarkdown"
                  textareaId={`tradition-overview-${tradition.id}`}
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
          </article>
        ))}
      </section>
    </div>
  );
}

const contentStatuses = ["draft", "needs_review", "published", "hidden", "archived"] as const;

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}
