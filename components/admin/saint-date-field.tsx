"use client";

import { useId, useRef, useState } from "react";
import { parseImportedDate } from "@/lib/import-dates";

type SaintDateFieldProps = {
  defaultValue?: string | null;
  label: string;
  name: "birthDateRaw" | "samadhiDateRaw";
};

export function SaintDateField({ defaultValue, label, name }: SaintDateFieldProps) {
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const [value, setValue] = useState(defaultValue ?? "");
  const previousValue = useRef(/^unknown$/i.test(defaultValue?.trim() ?? "") ? "" : defaultValue ?? "");
  const parsed = parseImportedDate(value);
  const isUnknown = parsed.precision === "unknown";
  const hint = getDateHint(parsed);
  const toggleUnknown = () => {
    if (isUnknown) {
      setValue(previousValue.current);
      return;
    }

    previousValue.current = value;
    setValue("Unknown");
  };

  return (
    <div className="form-stack__field saint-date-field">
      <label htmlFor={inputId}>{label}</label>
      <div className="saint-date-field__control">
        <input
          aria-describedby={hint ? hintId : undefined}
          id={inputId}
          maxLength={120}
          name={name}
          onChange={(event) => {
            previousValue.current = event.target.value;
            setValue(event.target.value);
          }}
          placeholder="e.g. 1914 or 1914-1915"
          readOnly={isUnknown}
          value={value}
        />
        <button
          aria-label={isUnknown ? `Clear unknown ${label.toLowerCase()}` : `Mark ${label.toLowerCase()} as unknown`}
          aria-pressed={isUnknown}
          className={`admin-form-button${isUnknown ? "" : " admin-form-button--secondary"}`}
          onClick={toggleUnknown}
          type="button"
        >
          Unknown
        </button>
      </div>
      {hint ? (
        <span className="saint-date-field__hint" id={hintId} aria-live="polite">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

function getDateHint(parsed: ReturnType<typeof parseImportedDate>) {
  if (parsed.precision === "range" && parsed.year != null && parsed.endYear != null) {
    return `Range: ${parsed.year}–${parsed.endYear}`;
  }

  if (parsed.note) return parsed.note;

  return undefined;
}
