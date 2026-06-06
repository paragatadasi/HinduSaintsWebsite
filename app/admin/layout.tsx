import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ background: "var(--color-surface-muted)", minHeight: "70vh" }}>
      <div className="page-shell" style={{ display: "grid", gap: "var(--space-6)", gridTemplateColumns: "220px 1fr", padding: "var(--space-8) 0" }}>
        <aside style={{ display: "grid", gap: "var(--space-3)", alignContent: "start" }}>
          <strong>Admin CMS</strong>
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/saints">Saints</Link>
          <Link href="/admin/instagram">Instagram</Link>
          <Link href="/admin/biographies">Biographies</Link>
          <Link href="/admin/sampradayas">Sampradayas</Link>
        </aside>
        <section>{children}</section>
      </div>
    </main>
  );
}
