import Link from "next/link";
import { Search, Sun } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="site-header">
      <nav className="page-shell site-nav">
        <Link href="/" className="site-brand" aria-label="Hindu Saints home">
          <span className="site-brand__mark" aria-hidden="true">
            <Sun size={26} />
          </span>
          <span>Hindu Saints</span>
        </Link>
        <div className="site-links">
          <Link href="/saints">Saints</Link>
          <Link href="/traditions">Traditions</Link>
          <Link href="/places">Places</Link>
          <Link href="/about">About</Link>
          <Link href="https://www.instagram.com/hindu_saints/">Instagram</Link>
          <Link href="/saints" aria-label="Search saints">
            <Search size={20} />
          </Link>
        </div>
      </nav>
    </header>
  );
}
