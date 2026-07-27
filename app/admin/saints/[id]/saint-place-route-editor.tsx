"use client";

import { useMemo, useState } from "react";
import { GripVertical } from "lucide-react";
import { SearchableMultiSelect, type SearchableMultiSelectOption } from "@/components/ui/searchable-multi-select";
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
  const [isCreatingPlace, setIsCreatingPlace] = useState(false);
  const optionsByValue = useMemo(() => new Map(options.map((option) => [option.value, option])), [options]);
  const selectedOptions = selectedValues
    .map((value) => optionsByValue.get(value))
    .filter((option): option is SaintPlaceRouteOption => Boolean(option));

  return (
    <div className="form-stack">
      <form action={updateSaintPlaces} className="form-stack">
        <input name="saintId" type="hidden" value={saintId} />
        <SearchableMultiSelect
          defaultSelectedValues={selectedPlaceIds}
          emptyText="No places match this search. Create a new place below."
          label="Places"
          name="placeIds"
          options={options}
          placeholder="Search places"
          renderHiddenInputs={false}
          selectedLabel="Selected places"
          onSelectionChange={handleSelectionChange}
        />
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
                <label>
                  Type
                  <select name={`placeType:${place.value}`} defaultValue={place.placeType}>
                    {placeTypes.map((placeType) => (
                      <option key={placeType} value={placeType}>{formatStatus(placeType)}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Route label
                  <input name={`routeLabel:${place.value}`} defaultValue={place.routeLabel ?? ""} />
                </label>
              </div>
            ))
          ) : (
            <p className="empty-note">Select places to configure their public route order.</p>
          )}
        </div>
        <div className="review-actions">
          <button className="admin-form-button" type="submit">Save places and route order</button>
        </div>
      </form>

      {isCreatingPlace ? (
        <form action={createAndAttachSaintPlace} className="form-stack">
          <input name="saintId" type="hidden" value={saintId} />
          <div>
            <h3>Create a new place</h3>
            <p>Add a missing place without leaving this saint. It will be attached and appended to the route.</p>
          </div>
          <div className="field-grid">
            <label>
              Place name
              <input name="name" required maxLength={200} />
            </label>
            <label>
              Place unit
              <select name="placeScope" defaultValue="locality">
                <option value="locality">Locality</option>
                <option value="state">State</option>
              </select>
            </label>
            <label>
              Saint-place type
              <select name="placeType" defaultValue="associated">
                {placeTypes.map((placeType) => (
                  <option key={placeType} value={placeType}>{formatStatus(placeType)}</option>
                ))}
              </select>
            </label>
            <label>
              Region
              <input name="region" maxLength={120} />
            </label>
            <label>
              Country
              <input name="country" maxLength={120} />
            </label>
            <label>
              Route label
              <input name="routeLabel" maxLength={120} />
            </label>
          </div>
          <div className="review-actions">
            <button className="admin-form-button admin-form-button--secondary" type="button" onClick={() => setIsCreatingPlace(false)}>Cancel</button>
            <button className="admin-form-button" type="submit">Create and add to route</button>
          </div>
        </form>
      ) : (
        <div className="review-actions">
          <button className="admin-form-button admin-form-button--secondary" type="button" onClick={() => setIsCreatingPlace(true)}>Create new place</button>
        </div>
      )}
    </div>
  );

  function handleSelectionChange(nextValues: string[]) {
    setSelectedValues((currentValues) => [
      ...currentValues.filter((value) => nextValues.includes(value)),
      ...nextValues.filter((value) => !currentValues.includes(value))
    ]);
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
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}
