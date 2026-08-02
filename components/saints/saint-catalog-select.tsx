"use client";

type SaintCatalogSelectProps = {
  allLabel: string;
  label: string;
  name: "location" | "tradition";
  options: string[];
  value: string;
};

export function SaintCatalogSelect({ allLabel, label, name, options, value }: SaintCatalogSelectProps) {
  const visibleOptions = value && !options.includes(value) ? [value, ...options] : options;

  return (
    <label>
      <span>{label}</span>
      <select
        aria-label={label}
        defaultValue={value}
        name={name}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        <option value="">{allLabel}</option>
        {visibleOptions.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
