"use client";

import { useState } from "react";
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";

type LineageRow = {
  key: string;
  parentSaintId: string;
  roleLabel: string;
  saintId: string;
  sortOrder: number;
};

type TraditionLineageEditorProps = {
  action: (formData: FormData) => void | Promise<void>;
  rows: LineageRow[];
  saintOptions: SearchableSelectOption[];
  traditionId: string;
};

export function TraditionLineageEditor({
  action,
  rows: initialRows,
  saintOptions,
  traditionId
}: TraditionLineageEditorProps) {
  const [rows, setRows] = useState(initialRows);

  return (
    <form action={action} className="form-stack">
      <input name="traditionId" type="hidden" value={traditionId} />
      {rows.length > 0 ? (
        <div className="review-list">
          {rows.map((row, index) => (
            <div className="review-row" key={row.key}>
              <SearchableSelect
                defaultValue={row.saintId}
                emptyText="No saints match this search."
                label="Saint"
                name="lineageSaintId"
                options={saintOptions}
                placeholder="Search saints"
              />
              <label>
                Role label
                <input name="lineageRoleLabel" defaultValue={row.roleLabel} maxLength={120} />
              </label>
              <SearchableSelect
                defaultValue={row.parentSaintId}
                emptyText="No saints match this search."
                label="Parent saint"
                name="lineageParentSaintId"
                options={[{ value: "", label: "No parent saint" }, ...saintOptions]}
                placeholder="Search saints"
              />
              <label>
                Sort order
                <input name="lineageSortOrder" type="number" defaultValue={row.sortOrder ?? index} />
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
        <p>No lineage saints are attached.</p>
      )}
      <div className="review-actions">
        <button
          className="admin-form-button admin-form-button--secondary"
          type="button"
          onClick={() => {
            setRows((currentRows) => [
              ...currentRows,
              {
                key: `new-lineage-${Date.now()}`,
                parentSaintId: "",
                roleLabel: "",
                saintId: "",
                sortOrder: currentRows.length
              }
            ]);
          }}
        >
          Add lineage saint
        </button>
      </div>
      <div className="review-actions">
        <button className="admin-form-button" type="submit">Save lineage</button>
      </div>
    </form>
  );
}
