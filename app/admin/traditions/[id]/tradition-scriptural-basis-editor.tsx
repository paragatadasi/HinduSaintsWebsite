"use client";

import { useState } from "react";
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";

type ScripturalBasisRow = {
  key: string;
  note: string;
  sortOrder: number;
  sourceId: string;
  title: string;
  url: string;
};

type TraditionScripturalBasisEditorProps = {
  action: (formData: FormData) => void | Promise<void>;
  rows: ScripturalBasisRow[];
  sourceOptions: SearchableSelectOption[];
  traditionId: string;
};

export function TraditionScripturalBasisEditor({
  action,
  rows: initialRows,
  sourceOptions,
  traditionId
}: TraditionScripturalBasisEditorProps) {
  const [rows, setRows] = useState(initialRows);

  return (
    <form action={action} className="form-stack">
      <input name="traditionId" type="hidden" value={traditionId} />
      {rows.length > 0 ? (
        <div className="review-list">
          {rows.map((row, index) => (
            <div className="review-row" key={row.key}>
              <label>
                Display title
                <input name="scripturalBasisTitle" defaultValue={row.title} maxLength={300} />
              </label>
              <SearchableSelect
                defaultValue={row.sourceId}
                emptyText="No sources match this search."
                label="Reviewed source"
                name="scripturalBasisSourceId"
                options={[{ value: "", label: "No linked source" }, ...sourceOptions]}
                placeholder="Search sources"
              />
              <label>
                URL override
                <input name="scripturalBasisUrl" type="url" defaultValue={row.url} maxLength={1000} />
              </label>
              <label>
                Note
                <input name="scripturalBasisNote" defaultValue={row.note} maxLength={500} />
              </label>
              <label>
                Sort order
                <input name="scripturalBasisSortOrder" type="number" defaultValue={row.sortOrder ?? index} />
              </label>
              <div className="review-actions">
                <button
                  className="admin-form-button admin-form-button--secondary"
                  type="button"
                  onClick={() => setRows((currentRows) => currentRows.filter((item) => item.key !== row.key))}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No scriptural basis links have been attached.</p>
      )}
      <div className="review-actions">
        <button
          className="admin-form-button admin-form-button--secondary"
          type="button"
          onClick={() => {
            setRows((currentRows) => [
              ...currentRows,
              {
                key: `new-scriptural-basis-${Date.now()}`,
                note: "",
                sortOrder: currentRows.length,
                sourceId: "",
                title: "",
                url: ""
              }
            ]);
          }}
        >
          Add scriptural basis
        </button>
      </div>
      <div className="review-actions">
        <button className="admin-form-button" type="submit">Save scriptural basis</button>
      </div>
    </form>
  );
}
