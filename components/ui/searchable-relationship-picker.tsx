"use client";

import { ChevronDown, Plus } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { SearchableMultiSelectOption } from "@/components/ui/searchable-multi-select";

type SearchableRelationshipPickerProps = {
  createLabel?: (query: string) => string;
  emptyText?: string;
  label: string;
  onCreateRequest?: (query: string) => void;
  onSelectionChange: (selectedValues: string[]) => void;
  options: SearchableMultiSelectOption[];
  placeholder?: string;
  selectedValues: string[];
};

export function SearchableRelationshipPicker({
  createLabel = (query) => `Create “${query}”`,
  emptyText = "No options match this search.",
  label,
  onCreateRequest,
  onSelectionChange,
  options,
  placeholder = "Search options",
  selectedValues
}: SearchableRelationshipPickerProps) {
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);
  const visibleOptions = useMemo(
    () => filterOptions(options, query).filter((option) => !selectedSet.has(option.value)),
    [options, query, selectedSet]
  );
  const trimmedQuery = query.trim();
  const hasExactMatch = options.some((option) => normalize(option.label) === normalize(trimmedQuery));
  const canCreate = Boolean(onCreateRequest && trimmedQuery.length >= 2 && !hasExactMatch);
  const resultCount = visibleOptions.length + (canCreate ? 1 : 0);
  const activeOption = activeIndex < visibleOptions.length ? visibleOptions[activeIndex] : undefined;
  const isCreateActive = canCreate && activeIndex === visibleOptions.length;

  useEffect(() => {
    setActiveIndex((index) => Math.min(index, Math.max(resultCount - 1, 0)));
  }, [resultCount]);

  return (
    <div className="combo-search combo-search--relationship">
      <label htmlFor={`${listboxId}-input`}>{label}</label>
      <div className="combo-search__control">
        <input
          aria-activedescendant={
            isDropdownOpen
              ? activeOption
                ? `${listboxId}-${activeOption.value}`
                : isCreateActive
                  ? `${listboxId}-create`
                  : undefined
              : undefined
          }
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={isDropdownOpen}
          autoComplete="off"
          id={`${listboxId}-input`}
          placeholder={placeholder}
          ref={inputRef}
          role="combobox"
          type="search"
          value={query}
          onBlur={() => {
            window.setTimeout(() => setIsDropdownOpen(false), 100);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setIsDropdownOpen(true);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setIsDropdownOpen(true);
              setActiveIndex((index) => resultCount > 0 ? Math.min(index + 1, resultCount - 1) : 0);
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            }

            if (event.key === "Enter" && isDropdownOpen) {
              event.preventDefault();

              if (activeOption) {
                addOption(activeOption.value);
              } else if (isCreateActive) {
                requestCreation();
              }
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
          {visibleOptions.map((option, index) => (
            <button
              aria-selected="false"
              className="combo-search__option combo-search__option--add"
              data-active={index === activeIndex ? "true" : undefined}
              id={`${listboxId}-${option.value}`}
              key={option.value}
              role="option"
              type="button"
              onClick={() => addOption(option.value)}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <Plus aria-hidden="true" className="combo-search__option-icon" size={16} />
              <span>
                <strong>{option.label}</strong>
                {option.description ? <small>{option.description}</small> : null}
              </span>
            </button>
          ))}
          {canCreate ? (
            <button
              aria-selected="false"
              className="combo-search__option combo-search__option--create"
              data-active={isCreateActive ? "true" : undefined}
              id={`${listboxId}-create`}
              role="option"
              type="button"
              onClick={requestCreation}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(visibleOptions.length)}
            >
              <Plus aria-hidden="true" className="combo-search__option-icon" size={16} />
              <span>{createLabel(trimmedQuery)}</span>
            </button>
          ) : null}
          {visibleOptions.length === 0 && !canCreate ? (
            <div className="combo-search__empty">{emptyText}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  function addOption(value: string) {
    if (selectedSet.has(value)) return;
    onSelectionChange([...selectedValues, value]);
    setQuery("");
    setActiveIndex(0);
    setIsDropdownOpen(true);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function requestCreation() {
    if (!onCreateRequest || !trimmedQuery) return;
    onCreateRequest(trimmedQuery);
    setIsDropdownOpen(false);
  }
}

function filterOptions(options: SearchableMultiSelectOption[], query: string) {
  const term = normalize(query);
  if (!term) return options;

  return options.filter((option) => normalize([
    option.label,
    option.description,
    ...(option.keywords ?? [])
  ].filter(Boolean).join(" ")).includes(term));
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase();
}
