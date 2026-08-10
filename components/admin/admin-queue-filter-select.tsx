"use client";

type QueueFilterOption = {
  label: string;
  value: string;
};

type AdminQueueFilterSelectProps = {
  label: string;
  name: string;
  options: readonly QueueFilterOption[];
  value: string;
};

export function AdminQueueFilterSelect({ label, name, options, value }: AdminQueueFilterSelectProps) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <select
        aria-label={label}
        defaultValue={value}
        name={name}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
