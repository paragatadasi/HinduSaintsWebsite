import { Upload } from "lucide-react";

export default function AdminMediaPage() {
  return (
    <div className="site-grid">
      <div>
        <div className="eyebrow">Media library</div>
        <h1>Images</h1>
      </div>
      <form action="/api/admin/media" method="post" encType="multipart/form-data" className="card" style={{ display: "grid", gap: "var(--space-4)", maxWidth: "720px" }}>
        <label style={{ display: "grid", gap: "var(--space-2)" }}>
          <strong>Image</strong>
          <input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required />
        </label>
        <label style={{ display: "grid", gap: "var(--space-2)" }}>
          <strong>Alt text</strong>
          <input name="altText" type="text" maxLength={240} />
        </label>
        <label style={{ display: "grid", gap: "var(--space-2)" }}>
          <strong>Caption</strong>
          <textarea name="caption" maxLength={500} rows={4} />
        </label>
        <label style={{ display: "grid", gap: "var(--space-2)" }}>
          <strong>Credit</strong>
          <input name="credit" type="text" maxLength={160} />
        </label>
        <label style={{ display: "grid", gap: "var(--space-2)" }}>
          <strong>Source URL</strong>
          <input name="sourceUrl" type="url" />
        </label>
        <div>
          <button type="submit" className="button button--primary">
            <Upload size={16} />
            Upload image
          </button>
        </div>
      </form>
    </div>
  );
}
