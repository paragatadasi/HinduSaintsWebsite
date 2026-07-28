"use client";

import { useState } from "react";
import {
  SearchableMultiSelect,
  type SearchableMultiSelectOption
} from "@/components/ui/searchable-multi-select";
import { createAndAttachSaintTradition, updateSaintTraditions } from "../actions";

type SaintTraditionEditorProps = {
  options: SearchableMultiSelectOption[];
  saintId: string;
  selectedTraditionIds: string[];
};

export function SaintTraditionEditor({
  options,
  saintId,
  selectedTraditionIds
}: SaintTraditionEditorProps) {
  const [isCreatingTradition, setIsCreatingTradition] = useState(false);

  return (
    <div className="form-stack">
      <form action={updateSaintTraditions} className="form-stack">
        <input name="saintId" type="hidden" value={saintId} />
        <SearchableMultiSelect
          defaultSelectedValues={selectedTraditionIds}
          emptyText="No traditions match this search. Create a new tradition below."
          label="Traditions"
          name="traditionIds"
          options={options}
          placeholder="Search traditions"
          primaryName="primaryTraditionId"
          selectedLabel="Selected traditions"
        />
        <div className="review-actions">
          <button className="admin-form-button" type="submit">Save traditions</button>
        </div>
      </form>

      {isCreatingTradition ? (
        <form action={createAndAttachSaintTradition} className="form-stack">
          <input name="saintId" type="hidden" value={saintId} />
          <div>
            <h3>Create a new tradition</h3>
            <p>Add a missing draft tradition without leaving this saint. Its full profile can be refined in tradition review.</p>
          </div>
          <div className="field-grid">
            <label>
              Tradition name
              <input name="name" required maxLength={200} />
            </label>
            <label>
              Alternate names
              <input name="alternateNames" maxLength={1000} placeholder="Separate names with commas" />
            </label>
          </div>
          <label>
            Short description
            <textarea name="shortDescription" maxLength={500} />
          </label>
          <div className="review-actions">
            <button
              className="admin-form-button admin-form-button--secondary"
              type="button"
              onClick={() => setIsCreatingTradition(false)}
            >
              Cancel
            </button>
            <button className="admin-form-button" type="submit">Create and attach tradition</button>
          </div>
        </form>
      ) : (
        <div className="review-actions">
          <button
            className="admin-form-button admin-form-button--secondary"
            type="button"
            onClick={() => setIsCreatingTradition(true)}
          >
            Create new tradition
          </button>
        </div>
      )}
    </div>
  );
}
