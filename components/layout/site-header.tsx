import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <nav className="page-shell site-nav">
        <Link href="/" className="site-brand">Hindu Saints Archive</Link>
        <div className="site-links">
          <Link href="/saints">Saints</Link>
          <Link href="/sampradayas">Sampradayas</Link>
          <Link href="/admin">Admin</Link>
        </div>
      </nav>
    </header>
  );
}
