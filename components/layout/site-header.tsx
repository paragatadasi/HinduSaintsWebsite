import Link from "next/link";

export function SiteHeader() {
  return (
    <header style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg)" }}>
      <nav className="page-shell" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-4) 0" }}>
        <Link href="/" style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", fontWeight: 700 }}>
          Hindu Saints Archive
        </Link>
        <div style={{ display: "flex", gap: "var(--space-4)", color: "var(--color-muted)" }}>
          <Link href="/saints">Saints</Link>
          <Link href="/sampradayas">Sampradayas</Link>
          <Link href="/admin">Admin</Link>
        </div>
      </nav>
    </header>
  );
}
