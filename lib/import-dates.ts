export type ImportedDatePrecision = "day" | "month" | "year" | "text" | "empty";

export type ImportedDateParts = {
  raw?: string;
  year?: number;
  month?: number;
  day?: number;
  precision: ImportedDatePrecision;
  note?: string;
};

const MONTHS = new Map([
  ["jan", 1],
  ["january", 1],
  ["feb", 2],
  ["february", 2],
  ["mar", 3],
  ["march", 3],
  ["apr", 4],
  ["april", 4],
  ["may", 5],
  ["jun", 6],
  ["june", 6],
  ["jul", 7],
  ["july", 7],
  ["aug", 8],
  ["august", 8],
  ["sep", 9],
  ["sept", 9],
  ["september", 9],
  ["oct", 10],
  ["october", 10],
  ["nov", 11],
  ["november", 11],
  ["dec", 12],
  ["december", 12]
]);

export function parseImportedDate(value: unknown): ImportedDateParts {
  const raw = String(value ?? "").trim();

  if (!raw) return { precision: "empty" };

  const iso = raw.match(/^(1[0-9]{3}|20[0-9]{2})-(0?[1-9]|1[0-2])-(0?[1-9]|[12][0-9]|3[01])$/);
  if (iso) {
    return {
      raw,
      year: Number(iso[1]),
      month: Number(iso[2]),
      day: Number(iso[3]),
      precision: "day"
    };
  }

  const dotted = raw.match(/^(0?[1-9]|[12][0-9]|3[01])[./](0?[1-9]|1[0-2])[./](1[0-9]{3}|20[0-9]{2})$/);
  if (dotted) {
    return {
      raw,
      year: Number(dotted[3]),
      month: Number(dotted[2]),
      day: Number(dotted[1]),
      precision: "day"
    };
  }

  const monthYear = raw.match(/\b([A-Za-z]+)\s+(1[0-9]{3}|20[0-9]{2})\b/);
  if (monthYear) {
    const month = MONTHS.get(monthYear[1].toLowerCase());
    if (month) {
      return {
        raw,
        year: Number(monthYear[2]),
        month,
        precision: "month"
      };
    }
  }

  const yearOnly = raw.match(/^(1[0-9]{3}|20[0-9]{2})$/);
  if (yearOnly) {
    return {
      raw,
      year: Number(yearOnly[1]),
      precision: "year"
    };
  }

  const embeddedYear = raw.match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
  if (embeddedYear) {
    return {
      raw,
      year: Number(embeddedYear[1]),
      precision: "year",
      note: "Year parsed from free-text date."
    };
  }

  return {
    raw,
    precision: "text",
    note: "No Gregorian date parts parsed from raw value."
  };
}

export function buildEraLabel(birth: ImportedDateParts, samadhi: ImportedDateParts) {
  if (birth.year && samadhi.year) return `${birth.year}-${samadhi.year}`;
  if (birth.year) return `b. ${birth.year}`;
  if (samadhi.year) return `samadhi ${samadhi.year}`;
  return undefined;
}
