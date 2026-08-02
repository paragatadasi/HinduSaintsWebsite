import { Search } from "lucide-react";

type PublicSearchFieldProps = {
  defaultValue?: string;
  id: string;
  label: string;
  placeholder: string;
};

export function PublicSearchField({ defaultValue, id, label, placeholder }: PublicSearchFieldProps) {
  return (
    <div className="hero-search public-search-field">
      <label className="sr-only" htmlFor={id}>{label}</label>
      <input
        defaultValue={defaultValue}
        id={id}
        name="q"
        placeholder={placeholder}
        type="search"
      />
      <button type="submit" aria-label={label}>
        <Search size={22} />
      </button>
    </div>
  );
}
