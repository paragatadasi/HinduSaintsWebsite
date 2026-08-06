"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { EditorialDraftForm } from "@/components/admin/editorial-draft-form";
import { SearchableMultiSelect, type SearchableMultiSelectOption } from "@/components/ui/searchable-multi-select";
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";
import type { EditorialDraftSnapshot } from "@/lib/editorial-drafts";

type PlaceOverviewEditorProps = {
  action: (formData: FormData) => void | Promise<void>;
  alternateNames: string;
  country: string;
  countryOptions: string[];
  effectivePlaceScope: "locality" | "state" | "country";
  initialDraft?: EditorialDraftSnapshot;
  localityOptions: SearchableMultiSelectOption[];
  name: string;
  parentStateId: string;
  placeId: string;
  selectedLocalityIds: string[];
  stateOptions: SearchableSelectOption[];
  version: number;
};

export function PlaceOverviewEditor({
  action,
  alternateNames,
  country,
  countryOptions,
  effectivePlaceScope,
  initialDraft,
  localityOptions,
  name,
  parentStateId,
  placeId,
  selectedLocalityIds,
  stateOptions,
  version
}: PlaceOverviewEditorProps) {
  const [placeScope, setPlaceScope] = useState(effectivePlaceScope);

  return (
    <EditorialDraftForm action={action} baseVersion={version} className="form-stack" entityId={placeId} entityType="place" initialDraft={initialDraft} section="overview">
      <input name="placeId" type="hidden" value={placeId} />
      <input name="version" type="hidden" value={version} />
      <div className="field-grid field-grid--identity-line">
        <label>
          Name
          <input name="name" defaultValue={name} required maxLength={200} />
        </label>
        <label>
          Alternate names
          <input name="alternateNames" defaultValue={alternateNames} maxLength={2000} />
        </label>
      </div>
      <div className="field-grid field-grid--place-overview-hierarchy">
        <label>
          Place unit
          <select name="placeScope" value={placeScope} onChange={(event) => setPlaceScope(event.target.value as "locality" | "state" | "country")}>
            <option value="locality">Locality</option>
            <option value="state">State</option>
            <option value="country">Country</option>
          </select>
        </label>
        {placeScope === "locality" ? (
          <SearchableSelect
            defaultValue={parentStateId}
            emptyText="No states match this search."
            label="Parent state"
            name="parentStateId"
            options={stateOptions}
            placeholder="Search states or leave blank"
          />
        ) : placeScope === "state" ? (
          <>
            <input name="parentStateId" type="hidden" value="" />
            <SearchableMultiSelect
              defaultSelectedValues={selectedLocalityIds}
              emptyText="No localities match this search."
              label="Localities"
              name="localityIds"
              options={localityOptions}
              placeholder="Search localities"
              selectedLabel="Selected localities"
            />
          </>
        ) : (
          <>
            <input name="parentStateId" type="hidden" value="" />
            <input name="country" type="hidden" value={name} />
          </>
        )}
        {placeScope !== "country" ? <CountryCombobox defaultValue={country} options={countryOptions} /> : null}
      </div>
      <div className="review-actions">
        <button className="admin-form-button" type="submit">Save overview</button>
      </div>
    </EditorialDraftForm>
  );
}

function CountryCombobox({ defaultValue, options }: { defaultValue: string; options: string[] }) {
  const [query, setQuery] = useState(defaultValue);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const visibleOptions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => option.toLowerCase().includes(term));
  }, [options, query]);

  return (
    <div className="combo-search">
      <label htmlFor="place-country">Country</label>
      <div className="combo-search__control">
        <input
          autoComplete="off"
          id="place-country"
          maxLength={120}
          name="country"
          placeholder="Search or add country"
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
        />
        <button
          aria-label={isDropdownOpen ? "Hide country options" : "Show country options"}
          className="combo-search__toggle"
          type="button"
          onClick={() => setIsDropdownOpen((open) => !open)}
        >
          <ChevronDown aria-hidden="true" size={18} />
        </button>
      </div>
      {isDropdownOpen ? (
        <div className="combo-search__list" role="listbox">
          {visibleOptions.length > 0 ? (
            visibleOptions.map((option) => (
              <button
                className="combo-search__option"
                key={option}
                role="option"
                type="button"
                onClick={() => {
                  setQuery(option);
                  setIsDropdownOpen(false);
                }}
                onMouseDown={(event) => event.preventDefault()}
              >
                <span>{option}</span>
              </button>
            ))
          ) : (
            <div className="combo-search__empty">No saved countries match. This new country will be saved.</div>
          )}
        </div>
      ) : null}
      <p className="combo-search__selection">Selected: {query.trim() || "No country"}</p>
    </div>
  );
}
