"use client";

import {useLayoutEffect, useRef, type ReactNode} from "react";
import {ChevronDown} from "lucide-react";

export function MuseumNavigationDisclosure({museum, children}: {museum: string; children: ReactNode}) {
 const details = useRef<HTMLDetailsElement>(null);
 const storageKey = `museum-navigation:${museum}:sections`;

 useLayoutEffect(() => {
  try {
   if (details.current) details.current.open = sessionStorage.getItem(storageKey) === "open";
  } catch {
   // Native disclosure still works when browser storage is unavailable.
  }
 }, [storageKey]);

 return <details ref={details} className="museum-nav-disclosure" onToggle={event => {
  try {
   sessionStorage.setItem(storageKey, event.currentTarget.open ? "open" : "closed");
  } catch {
   // Persistence is optional; never block navigation when storage is disabled.
  }
 }}><summary>Browse sections<ChevronDown aria-hidden="true"/></summary>{children}</details>;
}
