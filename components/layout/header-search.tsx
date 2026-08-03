"use client";

import { Search } from "lucide-react";
import { useRef, useState } from "react";

export function HeaderSearch() {
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  function expandSearch() {
    setIsExpanded(true);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <form
      action="/saints"
      className={isExpanded ? "hero-search header-search" : "header-search"}
      data-expanded={isExpanded}
      role="search"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setIsExpanded(false);
          buttonRef.current?.focus();
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
