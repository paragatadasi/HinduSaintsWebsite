"use client";

import { useId, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

export type SearchableMultiSelectOption = {
  value: string;
  label: string;
  description?: string;
  keywords?: string[];
};

type SearchableMultiSelectProps = {
  defaultSelectedValues?: string[];
  emptyText?: string;
  label: string;
  name: string;
  onSelectionChange?: (selectedValues: string[]) => void;
  options: SearchableMultiSelectOption[];
  placeholder?: string;
  primaryName?: string;
  renderHiddenInputs?: boolean;
  selectedLabel?: string;
};

export function SearchableMultiSelect({
  defaultSelectedValues = [],
  emptyText = "No options match this search.",
  label,
  name,
  onSelectionChange,
  options,
  placeholder = "Search options",
  primaryName,
  renderHiddenInputs = true,
  selectedLabel = "Selected"
}: SearchableMultiSelectProps) {
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [selectedValues, setSelectedValues] = useState(defaultSelectedValues);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);
  const selectedOptions = selectedValues
    .map((value) => options.find((option) => option.value === value))
    .filter((option): option is SearchableMultiSelectOption => Boolean(option));
  const visibleOptions = useMemo(() => filterOptions(options, query), [options, query]);

  return (
    <div className="combo-search combo-search--multi">
      <label htmlFor={`${listboxId}-input`}>{label}</label>
      {renderHiddenInputs ? (
        <>
          {selectedValues.map((value) => (
            <input key={value} name={name} type="hidden" value={value} />
          ))}
          {primaryName && selectedValues[0] ? <input name={primaryName} type="hidden" value={selectedValues[0]} /> : null}
        </>
      ) : null}
      <div className="combo-search__control">
        <input
          aria-controls={listboxId}
          aria-expanded={isDropdownOpen}
          autoComplete="off"
          id={`${listboxId}-input`}
          placeholder={placeholder}
          role="combobox"
          type="search"
          value={query}
          onBlur={() => {
            window.setTimeout(() => setIsDropdownOpen(false), 100);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          onKeyDown={(event) => {
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
        <div className="combo-search__list combo-search__list--multi" id={listboxId} role="listbox" aria-multiselectable="true">
          {visibleOptions.length > 0 ? (
            visibleOptions.map((option) => {
              const isSelected = selectedSet.has(option.value);

              return (
                <label
                  aria-selected={isSelected}
                  className="combo-search__option combo-search__option--check"
                  key={option.value}
                  role="option"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => toggleOption(option.value)}
                >
                  <input checked={isSelected} readOnly tabIndex={-1} type="checkbox" />
                  <span>
                    <strong>{option.label}</strong>
                    {option.description ? <small>{option.description}</small> : null}
                  </span>
                </label>
              );
            })
          ) : (
            <div className="combo-search__empty">{emptyText}</div>
          )}
        </div>
      ) : null}
      <div className="combo-search__selection" aria-live="polite">
        <strong>{selectedLabel}:</strong>{" "}
        {selectedOptions.length > 0 ? selectedOptions.map((option) => option.label).join(", ") : "None"}
      </div>
    </div>
  );

  function toggleOption(value: string) {
    const nextValues = selectedValues.includes(value)
      ? selectedValues.filter((currentValue) => currentValue !== value)
      : [...selectedValues, value];

    setSelectedValues(nextValues);
    onSelectionChange?.(nextValues);
  }
}

function filterOptions(options: SearchableMultiSelectOption[], query: string) {
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
