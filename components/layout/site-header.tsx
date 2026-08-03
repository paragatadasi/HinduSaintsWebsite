import Image from "next/image";
import Link from "next/link";
import { getInstagramLinkProps } from "@/lib/external-links";
import { HeaderSearch } from "@/components/layout/header-search";

export function SiteHeader() {
  return (
    <header className="site-header">
      <nav className="page-shell site-nav">
        <Link href="/" className="site-brand" aria-label="Hindu Saints home">
          <span className="site-brand__mark" aria-hidden="true">
            <Image
              src="/images/hindu-saints-logo.png"
              alt=""
              width={794}
              height={752}
              priority
              sizes="52px"
            />
          </span>
          <span>Hindu Saints</span>
        </Link>
        <div className="site-links">
          <Link href="/saints">Saints</Link>
          <Link href="/traditions">Traditions</Link>
          <Link href="/map">Map</Link>
          <Link href="/about">About</Link>
          <Link href="https://www.instagram.com/hindu_saints/" {...getInstagramLinkProps("https://www.instagram.com/hindu_saints/")}>Instagram</Link>
          <HeaderSearch />
        </div>
      </nav>
    </header>
  );
}
