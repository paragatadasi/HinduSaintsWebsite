import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { getInstagramLinkProps } from "@/lib/external-links";

type ButtonProps = {
  href: string;
  children: ReactNode;
  icon?: ReactNode;
  iconPosition?: "start" | "end";
  variant?: "primary" | "secondary" | "text";
};

export function Button({ href, children, icon, iconPosition = "start", variant = "primary" }: ButtonProps) {
  const className = `button button--${variant}`;
  const content = (
    <>
      {iconPosition === "start" ? icon : null}
      {children}
      {iconPosition === "end" ? icon : null}
    </>
  );

  if (href.startsWith("http")) {
    return (
      <a href={href} className={className} {...getInstagramLinkProps(href)}>
        {content}
      </a>
    );
  }

  return (
    <Link
      href={href as Route}
      className={className}
    >
      {content}
    </Link>
  );
}
