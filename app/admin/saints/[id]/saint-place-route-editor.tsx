"use client";

import { GripVertical, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { TrackedSaveButton } from "@/components/admin/tracked-save-button";
import type { SearchableMultiSelectOption } from "@/components/ui/searchable-multi-select";
import { SearchableRelationshipPicker } from "@/components/ui/searchable-relationship-picker";
import { createAndAttachSaintPlace, updateSaintPlaces } from "../actions";

type PlaceType = "primary" | "birth" | "samadhi" | "sadhana" | "associated" | "other";

export type SaintPlaceRouteOption = SearchableMultiSelectOption & {
  placeType: PlaceType;
  routeLabel?: string | null;
  routeOrder?: number | null;
};

type SaintPlaceRouteEditorProps = {
  options: SaintPlaceRouteOption[];
  placeTypes: readonly PlaceType[];
  saintId: string;
  selectedPlaceIds: string[];
};

export function SaintPlaceRouteEditor({ options, placeTypes, saintId, selectedPlaceIds }: SaintPlaceRouteEditorProps) {
  const [selectedValues, setSelectedValues] = useState(selectedPlaceIds);
  const [draggedValue, setDraggedValue] = useState<string | null>(null);
  const [createName, setCreateName] = useState<string | null>(null);
  const [settingsByValue, setSettingsByValue] = useState(() => getPlaceSettings(options));
  const savedSignature = getSavedSignature(options, selectedPlaceIds);
  const optionsByValue = useMemo(() => new Map(options.map((option) => [option.value, option])), [options]);
  const selectedOptions = selectedValues
    .map((value) => optionsByValue.get(value))
    .filter((option): option is SaintPlaceRouteOption => Boolean(option));
  const isDirty = getCurrentSignature(selectedValues, settingsByValue) !== savedSignature;

  useEffect(() => {
    setSelectedValues(selectedPlaceIds);
    setSettingsByValue(getPlaceSettings(options));
  }, [savedSignature]);

  return (
    <div className="relationship-editor">
      <form action={updateSaintPlaces} className="form-stack">
        <input name="saintId" type="hidden" value={saintId} />
        <SearchableRelationshipPicker
          createLabel={(query) => `Create place “${query}”`}
          emptyText="No more places are available."
          label="Add places"
          onCreateRequest={setCreateName}
          onSelectionChange={handleSelectionChange}
          options={options}
          placeholder="Search places"
          selectedValues={selectedValues}
        />
        <div className="relationship-editor__selection">
          <div className="relationship-editor__selection-heading">
            <strong>Selected places and route</strong>
            <span>{selectedOptions.length}</span>
          </div>
          <div className="route-editor">
            {selectedOptions.length > 0 ? (
              selectedOptions.map((place, index) => (
                <div
                  className="route-editor__row"
                  draggable
                  key={place.value}
                  onDragEnd={() => setDraggedValue(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDragStart={() => setDraggedValue(place.value)}
                  onDrop={() => moveDraggedPlace(place.value)}
                >
                  <input name="placeIds" type="hidden" value={place.value} />
                  <input name={`routeOrder:${place.value}`} type="hidden" value={index} />
                  <span className="route-editor__handle" aria-hidden="true">
                    <GripVertical size={18} />
                  </span>
                  <div className="route-editor__place">
                    <strong>{place.label}</strong>
                    {place.description ? <small>{place.description}</small> : null}
                  </div>
                  <button
                    aria-label={`Remove ${place.label}`}
                    className="relationship-selection-row__remove route-editor__remove"
                    type="button"
                    onClick={() => removePlace(place.value)}
                  >
                    <X aria-hidden="true" size={16} />
                  </button>
                  <label>
                    Type
                    <select
                      name={`placeType:${place.value}`}
                      value={settingsByValue[place.value]?.placeType ?? place.placeType}
                      onChange={(event) => updatePlaceSettings(place.value, { placeType: event.target.value as PlaceType })}
                    >
                      {placeTypes.map((placeType) => (
                        <option key={placeType} value={placeType}>{formatStatus(placeType)}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Route label
                    <input
                      name={`routeLabel:${place.value}`}
                      value={settingsByValue[place.value]?.routeLabel ?? ""}
                      onChange={(event) => updatePlaceSettings(place.value, { routeLabel: event.target.value })}
                    />
                  </label>
                </div>
              ))
            ) : (
              <p className="empty-note">No places selected.</p>
            )}
          </div>
        </div>
        <div className="review-actions">
          <TrackedSaveButton dirty={isDirty} saveLabel="Save places and route" />
        </div>
      </form>

      {createName ? (
        <form action={createAndAttachSaintPlace} className="relationship-create-panel form-stack" key={createName}>
          <input name="saintId" type="hidden" value={saintId} />
          <input name="placeType" type="hidden" value="associated" />
          <div>
            <h3>Create place</h3>
            <p>It will be attached as associated. Set its route role and label in the row after creation.</p>
          </div>
          <div className="field-grid">
            <label>
              Place name
              <input autoFocus defaultValue={createName} name="name" required maxLength={200} />
            </label>
            <label>
              Place unit
              <select name="placeScope" defaultValue="locality">
                <option value="locality">Locality</option>
                <option value="state">State</option>
                <option value="country">Country</option>
              </select>
            </label>
          </div>
          <div className="review-actions">
            <button className="admin-form-button admin-form-button--secondary" type="button" onClick={() => setCreateName(null)}>
              Cancel
            </button>
            <button className="admin-form-button" type="submit">Create and add</button>
          </div>
        </form>
      ) : null}
    </div>
  );

  function handleSelectionChange(nextValues: string[]) {
    setSelectedValues((currentValues) => [
      ...currentValues.filter((value) => nextValues.includes(value)),
      ...nextValues.filter((value) => !currentValues.includes(value))
    ]);
  }

  function removePlace(value: string) {
    setSelectedValues((currentValues) => currentValues.filter((currentValue) => currentValue !== value));
  }

  function moveDraggedPlace(targetValue: string) {
    if (!draggedValue || draggedValue === targetValue) return;

    setSelectedValues((currentValues) => {
      const draggedIndex = currentValues.indexOf(draggedValue);
      const targetIndex = currentValues.indexOf(targetValue);
      if (draggedIndex < 0 || targetIndex < 0) return currentValues;

      const nextValues = [...currentValues];
      const [movedValue] = nextValues.splice(draggedIndex, 1);
      nextValues.splice(targetIndex, 0, movedValue);
      return nextValues;
    });
  }

  function updatePlaceSettings(value: string, updates: Partial<PlaceSettings>) {
    setSettingsByValue((current) => ({
      ...current,
      [value]: {
        placeType: current[value]?.placeType ?? "associated",
        routeLabel: current[value]?.routeLabel ?? "",
        ...updates
      }
    }));
  }
}

type PlaceSettings = {
  placeType: PlaceType;
  routeLabel: string;
};

function getPlaceSettings(options: SaintPlaceRouteOption[]) {
  return Object.fromEntries(options.map((option) => [option.value, {
    placeType: option.placeType,
    routeLabel: option.routeLabel ?? ""
  }])) as Record<string, PlaceSettings>;
}

function getSavedSignature(options: SaintPlaceRouteOption[], selectedValues: string[]) {
  const settings = getPlaceSettings(options);
  return getCurrentSignature(selectedValues, settings);
}

function getCurrentSignature(selectedValues: string[], settings: Record<string, PlaceSettings>) {
  return JSON.stringify(selectedValues.map((value) => ({
    placeType: settings[value]?.placeType ?? "associated",
    routeLabel: settings[value]?.routeLabel ?? "",
    value
  })));
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}
