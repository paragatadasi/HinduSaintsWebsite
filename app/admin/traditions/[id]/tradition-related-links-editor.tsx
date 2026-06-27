"use client";

import { useState } from "react";
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";

type RelatedTraditionRow = {
  key: string;
  relatedTraditionId: string;
  label: string;
  sortOrder: number;
};

type RelatedPlaceRow = {
  key: string;
  placeId: string;
  label: string;
  sortOrder: number;
};

type TraditionRelatedLinksEditorProps = {
  action: (formData: FormData) => void | Promise<void>;
  placeOptions: SearchableSelectOption[];
  relatedPlaces: RelatedPlaceRow[];
  relatedTraditions: RelatedTraditionRow[];
  traditionId: string;
  traditionOptions: SearchableSelectOption[];
};

export function TraditionRelatedLinksEditor({
  action,
  placeOptions,
  relatedPlaces,
  relatedTraditions,
  traditionId,
  traditionOptions
}: TraditionRelatedLinksEditorProps) {
  const [traditionRows, setTraditionRows] = useState(relatedTraditions);
  const [placeRows, setPlaceRows] = useState(relatedPlaces);

  return (
    <form action={action} className="form-stack">
      <input name="traditionId" type="hidden" value={traditionId} />
      <div className="review-panel__subsection">
        <h3>Manual related traditions</h3>
        <p>Hierarchy links from parent and child traditions appear automatically; add editorial sidebar links here.</p>
        {traditionRows.length > 0 ? (
          <div className="review-list">
            {traditionRows.map((row, index) => (
              <div className="review-row" key={row.key}>
                <SearchableSelect
                  defaultValue={row.relatedTraditionId}
                  emptyText="No traditions match this search."
                  label="Tradition"
                  name="relatedTraditionId"
                  options={traditionOptions}
                  placeholder="Search traditions"
                />
                <label>
                  Label
                  <input name="relatedTraditionLabel" defaultValue={row.label} maxLength={120} />
                </label>
                <label>
                  Sort order
                  <input name="relatedTraditionSortOrder" type="number" defaultValue={row.sortOrder ?? index} />
                </label>
                <div className="review-actions">
                  <button
                    className="admin-form-button admin-form-button--secondary"
                    type="button"
                    onClick={() => setTraditionRows((rows) => rows.filter((item) => item.key !== row.key))}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No manual related traditions have been attached.</p>
        )}
        <div className="review-actions">
          <button
            className="admin-form-button admin-form-button--secondary"
            type="button"
            onClick={() => {
              setTraditionRows((rows) => [
                ...rows,
                {
                  key: `new-related-tradition-${Date.now()}`,
                  label: "",
                  relatedTraditionId: "",
                  sortOrder: rows.length
                }
              ]);
            }}
          >
            Add related tradition
          </button>
        </div>
      </div>

      <div className="review-panel__subsection">
        <h3>Related places</h3>
        {placeRows.length > 0 ? (
          <div className="review-list">
            {placeRows.map((row, index) => (
              <div className="review-row" key={row.key}>
                <SearchableSelect
                  defaultValue={row.placeId}
                  emptyText="No places match this search."
                  label="Place"
                  name="relatedPlaceId"
                  options={placeOptions}
                  placeholder="Search places"
                />
                <label>
                  Label
                  <input name="relatedPlaceLabel" defaultValue={row.label} maxLength={120} />
                </label>
                <label>
                  Sort order
                  <input name="relatedPlaceSortOrder" type="number" defaultValue={row.sortOrder ?? index} />
                </label>
                <div className="review-actions">
                  <button
                    className="admin-form-button admin-form-button--secondary"
                    type="button"
                    onClick={() => setPlaceRows((rows) => rows.filter((item) => item.key !== row.key))}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No related places have been attached.</p>
        )}
        <div className="review-actions">
          <button
            className="admin-form-button admin-form-button--secondary"
            type="button"
            onClick={() => {
              setPlaceRows((rows) => [
                ...rows,
                {
                  key: `new-related-place-${Date.now()}`,
                  label: "",
                  placeId: "",
                  sortOrder: rows.length
                }
              ]);
            }}
          >
            Add related place
          </button>
        </div>
      </div>

      <div className="review-actions">
        <button className="admin-form-button" type="submit">Save related links</button>
      </div>
    </form>
  );
}
