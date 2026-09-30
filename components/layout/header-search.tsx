"use client";

import { Search } from "lucide-react";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";

export function HeaderSearch() {
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  function expandSearch() {
    // Keep focus in the tap event so mobile browsers can open the keyboard.
    flushSync(() => setIsExpanded(true));
    inputRef.current?.focus({ preventScroll: true });
  }

  return (
    <form
      action="/saints"
      className={isExpanded ? "hero-search header-search" : "header-search"}
      data-expanded={isExpanded}
      data-telemetry-submit="header_search_submit"
      role="search"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsExpanded(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setIsExpanded(false);
          buttonRef.current?.focus({ preventScroll: true });
        }
      }}
    >
      <label className="sr-only" htmlFor="header-saint-search">Search saints</label>
      <input
        aria-hidden={!isExpanded}
        id="header-saint-search"
        name="q"
        placeholder="Search saints..."
        ref={inputRef}
        tabIndex={isExpanded ? 0 : -1}
        type="search"
      />
      <button
        aria-expanded={isExpanded}
        aria-label={isExpanded ? "Submit saint search" : "Open saint search"}
        data-telemetry-event={isExpanded ? undefined : "header_search_open"}
        onClick={(event) => {
          if (!isExpanded) {
            event.preventDefault();
            expandSearch();
          }
        }}
        ref={buttonRef}
        type={isExpanded ? "submit" : "button"}
      >
        <Search aria-hidden="true" size={20} />
      </button>
    </form>
  );
}
