import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

type ButtonProps = {
  href: string;
  children: ReactNode;
  icon?: ReactNode;
  variant?: "primary" | "secondary";
};

export function Button({ href, children, icon, variant = "primary" }: ButtonProps) {
  const className = `button button--${variant}`;

  if (href.startsWith("http")) {
    return (
      <a href={href} className={className}>
        {icon}
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href as Route}
      className={className}
    >
      {icon}
      {children}
    </Link>
  );
}
