"use client";

import { useId, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, GripVertical, X } from "lucide-react";

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
  maxSelected?: number;
  name: string;
  onSelectionChange?: (selectedValues: string[]) => void;
  options: SearchableMultiSelectOption[];
  placeholder?: string;
  primaryName?: string;
  renderHiddenInputs?: boolean;
  reorderable?: boolean;
  selectedLabel?: string;
};

export function SearchableMultiSelect({
  defaultSelectedValues = [],
  emptyText = "No options match this search.",
  label,
  maxSelected,
  name,
  onSelectionChange,
  options,
  placeholder = "Search options",
  primaryName,
  renderHiddenInputs = true,
  reorderable = false,
  selectedLabel = "Selected"
}: SearchableMultiSelectProps) {
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [selectedValues, setSelectedValues] = useState(() => {
    const optionValues = new Set(options.map((option) => option.value));
    return Array.from(new Set(defaultSelectedValues.filter((value) => optionValues.has(value))));
  });
  const [draggedValue, setDraggedValue] = useState<string | null>(null);
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
      <div className="combo-search__menu">
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
                const isDisabled = !isSelected && maxSelected != null && selectedValues.length >= maxSelected;

                return (
                  <label
                    aria-selected={isSelected}
                    className="combo-search__option combo-search__option--check"
                    key={option.value}
                    role="option"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      if (!isDisabled) toggleOption(option.value);
                    }}
                  >
                    <input checked={isSelected} disabled={isDisabled} readOnly tabIndex={-1} type="checkbox" />
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
      </div>
      {reorderable ? (
        <div className="combo-search__selection combo-search__selection--ordered" aria-live="polite">
          <div className="combo-search__selection-heading">
            <strong>{selectedLabel}</strong>
            <span>{selectedOptions.length}</span>
          </div>
          <p>Arrange the list in the order it should appear. The first item appears first.</p>
          {selectedOptions.length > 0 ? (
            <ol className="combo-search__ordered-list">
              {selectedOptions.map((option, index) => (
                <li
                  className="combo-search__ordered-row"
                  draggable
                  key={option.value}
                  onDragEnd={() => setDraggedValue(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDragStart={() => setDraggedValue(option.value)}
                  onDrop={() => moveDraggedOption(option.value)}
                >
                  <span className="combo-search__ordered-handle" aria-hidden="true">
                    <GripVertical size={18} />
                  </span>
                  <span className="combo-search__ordered-identity">
                    <strong>{index + 1}. {option.label}</strong>
                    {option.description ? <small>{option.description}</small> : null}
                  </span>
                  <span className="combo-search__ordered-actions">
                    <button
                      aria-label={`Move ${option.label} up`}
                      disabled={index === 0}
                      type="button"
                      onClick={() => moveOption(option.value, -1)}
                    >
                      <ArrowUp aria-hidden="true" size={16} />
                    </button>
                    <button
                      aria-label={`Move ${option.label} down`}
                      disabled={index === selectedOptions.length - 1}
                      type="button"
                      onClick={() => moveOption(option.value, 1)}
                    >
                      <ArrowDown aria-hidden="true" size={16} />
                    </button>
                    <button
                      aria-label={`Remove ${option.label}`}
                      type="button"
                      onClick={() => updateSelectedValues(selectedValues.filter((value) => value !== option.value))}
                    >
                      <X aria-hidden="true" size={16} />
                    </button>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <span>None</span>
          )}
        </div>
      ) : (
        <div className="combo-search__selection" aria-live="polite">
          <strong>{selectedLabel}:</strong>{" "}
          {selectedOptions.length > 0 ? selectedOptions.map((option) => option.label).join(", ") : "None"}
        </div>
      )}
    </div>
  );

  function toggleOption(value: string) {
    if (!selectedValues.includes(value) && maxSelected != null && selectedValues.length >= maxSelected) return;
    const nextValues = selectedValues.includes(value)
      ? selectedValues.filter((currentValue) => currentValue !== value)
      : [...selectedValues, value];

    updateSelectedValues(nextValues);
  }

  function moveOption(value: string, offset: -1 | 1) {
    const currentIndex = selectedValues.indexOf(value);
    const targetIndex = currentIndex + offset;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= selectedValues.length) return;

    const nextValues = [...selectedValues];
    const [movedValue] = nextValues.splice(currentIndex, 1);
    nextValues.splice(targetIndex, 0, movedValue);
    updateSelectedValues(nextValues);
  }

  function moveDraggedOption(targetValue: string) {
    if (!draggedValue || draggedValue === targetValue) return;

    const draggedIndex = selectedValues.indexOf(draggedValue);
    const targetIndex = selectedValues.indexOf(targetValue);
    if (draggedIndex < 0 || targetIndex < 0) return;

    const nextValues = [...selectedValues];
    const [movedValue] = nextValues.splice(draggedIndex, 1);
    nextValues.splice(targetIndex, 0, movedValue);
    updateSelectedValues(nextValues);
    setDraggedValue(null);
  }

  function updateSelectedValues(nextValues: string[]) {
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
