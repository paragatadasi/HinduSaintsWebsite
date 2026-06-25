"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export type SearchableSelectOption = {
  value: string;
  label: string;
  description?: string;
  keywords?: string[];
};

type SearchableSelectProps = {
  defaultValue?: string;
  emptyText?: string;
  label: string;
  name: string;
  options: SearchableSelectOption[];
  placeholder?: string;
  required?: boolean;
};

export function SearchableSelect({
  defaultValue = "",
  emptyText = "No options match this search.",
  label,
  name,
  options,
  placeholder = "Search options",
  required = false
}: SearchableSelectProps) {
  const listboxId = useId();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const defaultOption = options.find((option) => option.value === defaultValue);
  const [query, setQuery] = useState(defaultOption?.label ?? "");
  const [selectedValue, setSelectedValue] = useState(defaultOption?.value ?? "");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const visibleOptions = useMemo(() => filterOptions(options, query), [options, query]);
  const selectedOption = options.find((option) => option.value === selectedValue);
  const activeOption = visibleOptions[activeIndex];

  useEffect(() => {
    searchInputRef.current?.setCustomValidity(required && !selectedValue ? `Select ${label}.` : "");
  }, [label, required, selectedValue]);

  return (
    <div className="combo-search">
      <input name={name} type="hidden" value={selectedValue} />
      <label htmlFor={`${listboxId}-input`}>{label}</label>
      <div className="combo-search__control">
        <input
          aria-activedescendant={isDropdownOpen && activeOption ? `${listboxId}-${activeOption.value}` : undefined}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={isDropdownOpen}
          autoComplete="off"
          id={`${listboxId}-input`}
          placeholder={placeholder}
          ref={searchInputRef}
          required={required}
          role="combobox"
          type="search"
          value={query}
          onBlur={() => {
            window.setTimeout(() => setIsDropdownOpen(false), 100);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelectedValue("");
            setActiveIndex(0);
            setIsDropdownOpen(true);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setIsDropdownOpen(true);
              setActiveIndex((index) => (visibleOptions.length > 0 ? Math.min(index + 1, visibleOptions.length - 1) : 0));
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            }

            if (event.key === "Enter" && isDropdownOpen && activeOption) {
              event.preventDefault();
              selectOption(activeOption);
            }

            if (event.key === "Escape") {
              setIsDropdownOpen(false);
            }
          }}
        />
        <button
          aria-label={isDropdownOpen ? `Hide ${label} options` : `Show ${label} options`}
          className="combo-search__toggle"
          type="button"
          onClick={() => setIsDropdownOpen((open) => !open)}
        >
          <ChevronDown aria-hidden="true" size={18} />
        </button>
      </div>
      {isDropdownOpen ? (
        <div className="combo-search__list" id={listboxId} role="listbox">
          {visibleOptions.length > 0 ? (
            visibleOptions.map((option, index) => (
              <button
                aria-selected={option.value === selectedValue}
                className="combo-search__option"
                data-active={index === activeIndex ? "true" : undefined}
                id={`${listboxId}-${option.value}`}
                key={option.value}
                role="option"
                type="button"
                onClick={() => selectOption(option)}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <span>{option.label}</span>
                {option.description ? <small>{option.description}</small> : null}
              </button>
            ))
          ) : (
            <div className="combo-search__empty">{emptyText}</div>
          )}
        </div>
      ) : null}
      {selectedOption ? <p className="combo-search__selection">Selected: {selectedOption.label}</p> : null}
    </div>
  );

  function selectOption(option: SearchableSelectOption) {
    setQuery(option.label);
    setSelectedValue(option.value);
    setIsDropdownOpen(false);
  }
}

function filterOptions(options: SearchableSelectOption[], query: string) {
  const term = query.trim().toLowerCase();
  if (!term) return options;

  return options.filter((option) => {
    const haystack = [
      option.label,
      option.description,
      ...(option.keywords ?? [])
    ].filter(Boolean).join(" ").toLowerCase();

    return haystack.includes(term);
  });
}
