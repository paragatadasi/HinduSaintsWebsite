import type { Route } from "next";
import Link from "next/link";

type TaxonomyLinkItem = {
  href: string;
  label: string;
};

export function TaxonomyLinkList({
  items,
  label
}: {
  items: TaxonomyLinkItem[];
  label: string;
}) {
  return (
    <span className="taxonomy-link-list" aria-label={label} role="group">
      {items.map((item) => (
        <Link className="taxonomy-link" href={item.href as Route} key={item.href} prefetch={false}>
          {item.label}
        </Link>
      ))}
    </span>
  );
}
