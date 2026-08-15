"use client";

import { Star, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { TrackedSaveButton } from "@/components/admin/tracked-save-button";
import type { SearchableMultiSelectOption } from "@/components/ui/searchable-multi-select";
import { SearchableRelationshipPicker } from "@/components/ui/searchable-relationship-picker";
import { createAndAttachSaintTradition, updateSaintTraditions } from "../actions";

type SaintTraditionEditorProps = {
  options: SearchableMultiSelectOption[];
  primaryTraditionId?: string;
  saintId: string;
  selectedTraditionIds: string[];
};

export function SaintTraditionEditor({
  options,
  primaryTraditionId,
  saintId,
  selectedTraditionIds
}: SaintTraditionEditorProps) {
  const [selectedValues, setSelectedValues] = useState(selectedTraditionIds);
  const [primaryValue, setPrimaryValue] = useState(primaryTraditionId ?? selectedTraditionIds[0] ?? "");
  const [createName, setCreateName] = useState<string | null>(null);
  const savedSignature = JSON.stringify({
    primaryValue: primaryTraditionId ?? selectedTraditionIds[0] ?? "",
    selectedValues: [...selectedTraditionIds].sort()
  });
  const optionsByValue = useMemo(() => new Map(options.map((option) => [option.value, option])), [options]);
  const selectedOptions = selectedValues
    .map((value) => optionsByValue.get(value))
    .filter((option): option is SearchableMultiSelectOption => Boolean(option));
  const isDirty = primaryValue !== (primaryTraditionId ?? selectedTraditionIds[0] ?? "")
    || !haveSameValues(selectedValues, selectedTraditionIds);

  useEffect(() => {
    setSelectedValues(selectedTraditionIds);
    setPrimaryValue(primaryTraditionId ?? selectedTraditionIds[0] ?? "");
  }, [savedSignature]);

  return (
    <div className="relationship-editor">
      <form action={updateSaintTraditions} className="form-stack">
        <input name="saintId" type="hidden" value={saintId} />
        {selectedValues.map((value) => <input key={value} name="traditionIds" type="hidden" value={value} />)}
        {primaryValue ? <input name="primaryTraditionId" type="hidden" value={primaryValue} /> : null}
        <SearchableRelationshipPicker
          createLabel={(query) => `Create tradition “${query}”`}
          emptyText="No more traditions are available."
          label="Add traditions"
          onCreateRequest={setCreateName}
          onSelectionChange={handleSelectionChange}
          options={options}
          placeholder="Search traditions"
          selectedValues={selectedValues}
        />
        <div className="relationship-editor__selection">
          <div className="relationship-editor__selection-heading">
            <strong>Selected traditions</strong>
            <span>{selectedOptions.length}</span>
          </div>
          {selectedOptions.length > 0 ? (
            <div className="relationship-selection-list">
              {selectedOptions.map((tradition) => {
                const isPrimary = tradition.value === primaryValue;

                return (
                  <div className="relationship-selection-row" data-primary={isPrimary ? "true" : undefined} key={tradition.value}>
                    <div className="relationship-selection-row__identity">
                      <strong>{tradition.label}</strong>
                      {tradition.description ? <small>{tradition.description}</small> : null}
                    </div>
                    <div className="relationship-selection-row__actions">
                      <button
                        aria-label={isPrimary ? `${tradition.label} is the primary tradition` : `Make ${tradition.label} primary`}
                        aria-pressed={isPrimary}
                        className="relationship-selection-row__primary"
                        data-active={isPrimary ? "true" : undefined}
                        type="button"
                        onClick={() => setPrimaryValue(tradition.value)}
                      >
                        <Star aria-hidden="true" fill={isPrimary ? "currentColor" : "none"} size={15} />
                        {isPrimary ? "Primary" : "Make primary"}
                      </button>
                      <button
                        aria-label={`Remove ${tradition.label}`}
                        className="relationship-selection-row__remove"
                        type="button"
                        onClick={() => removeTradition(tradition.value)}
                      >
                        <X aria-hidden="true" size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="empty-note">No traditions selected.</p>
          )}
        </div>
        <div className="review-actions">
          <TrackedSaveButton dirty={isDirty} saveLabel="Save traditions" />
        </div>
      </form>

      {createName ? (
        <form action={createAndAttachSaintTradition} className="relationship-create-panel form-stack" key={createName}>
          <input name="saintId" type="hidden" value={saintId} />
          <div>
            <h3>Create draft tradition</h3>
            <p>Only a name is needed now. Complete its profile later in tradition review.</p>
          </div>
          <label>
            Tradition name
            <input autoFocus defaultValue={createName} name="name" required maxLength={200} />
          </label>
          <div className="review-actions">
            <button className="admin-form-button admin-form-button--secondary" type="button" onClick={() => setCreateName(null)}>
              Cancel
            </button>
            <button className="admin-form-button" type="submit">Create and attach</button>
          </div>
        </form>
      ) : null}
    </div>
  );

  function handleSelectionChange(nextValues: string[]) {
    setSelectedValues(nextValues);
    if (!primaryValue && nextValues[0]) setPrimaryValue(nextValues[0]);
  }

  function removeTradition(value: string) {
    const nextValues = selectedValues.filter((selectedValue) => selectedValue !== value);
    setSelectedValues(nextValues);
    if (primaryValue === value) setPrimaryValue(nextValues[0] ?? "");
  }
}

function haveSameValues(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  const rightValues = new Set(right);
  return left.every((value) => rightValues.has(value));
}
