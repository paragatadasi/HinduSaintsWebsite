"use client";

import {useLayoutEffect, useRef, type ReactNode} from "react";
import {ChevronDown} from "lucide-react";

export function MuseumNavigationDisclosure({museum, children, scope="sections", title="Browse sections", defaultOpen=false, className="", tone}: {museum: string; children: ReactNode; scope?: string; title?: ReactNode; defaultOpen?: boolean; className?: string; tone?: string}) {
 const details = useRef<HTMLDetailsElement>(null);
 const storageKey = `museum-navigation:${museum}:${scope}`;

 useLayoutEffect(() => {
  try {
   const stored=sessionStorage.getItem(storageKey);
   if (details.current) details.current.open = stored === null ? defaultOpen : stored === "open";
  } catch {
   // Native disclosure still works when browser storage is unavailable.
  }
 }, [storageKey, defaultOpen]);

 return <details ref={details} className={`museum-nav-disclosure ${className}`} data-tone={tone} onToggle={event => {
  try {
   sessionStorage.setItem(storageKey, event.currentTarget.open ? "open" : "closed");
  } catch {
   // Persistence is optional; never block navigation when storage is disabled.
  }
 }}><summary>{title}<ChevronDown aria-hidden="true"/></summary>{children}</details>;
}
