type SaintDateValue = {
  raw?: string | null;
  year?: number | null;
  month?: number | null;
  day?: number | null;
  precision?: string | null;
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
] as const;

const MONTH_NUMBERS = new Map(
  MONTH_NAMES.flatMap((name, index) => [
    [name.toLowerCase(), index + 1] as const,
    [name.slice(0, 3).toLowerCase(), index + 1] as const
  ])
);

const PUBLIC_CALENDAR_DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC"
});

export function formatSaintDate(value: SaintDateValue) {
  const raw = value.raw?.trim();
  const parsedRange = raw ? parseDisplayYearRange(raw) : undefined;
  const parsedRaw = raw ? parseDisplayDate(raw) : undefined;

  if (parsedRange) {
    const prefix = parsedRange.approximate ? "c. " : "";
    return `${prefix}${parsedRange.year}–${parsedRange.endYear}`;
  }

  if (parsedRaw) {
    return formatDateParts(parsedRaw.year, parsedRaw.month, parsedRaw.day, parsedRaw.approximate);
  }

  const canUseStoredParts = !raw || value.precision === "day" || value.precision === "month";
  if (canUseStoredParts && isValidDateParts(value.year, value.month, value.day)) {
    return formatDateParts(value.year!, value.month ?? undefined, value.day ?? undefined);
  }

  return raw;
}

export function formatSaintEraLabel(value: string) {
  return value.replace(/(\b\d{1,4})\s*[-–—]\s*(\d{1,4}\b)/g, "$1–$2");
}

export function formatPublicCalendarDate(value?: string | Date) {
  if (!value) return undefined;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return PUBLIC_CALENDAR_DATE_FORMATTER.format(date);
}

type ParsedDisplayDate = {
  year: number;
  month?: number;
  day?: number;
  approximate?: boolean;
};

function parseDisplayYearRange(value: string) {
  const match = value.match(/^(?:(c(?:irca)?|ca)\.?\s+)?(\d{1,4})\s*[-–—]\s*(\d{1,4})$/i);
  if (!match) return undefined;

  const year = Number(match[2]);
  const endYear = Number(match[3]);
  if (year < 1 || endYear < year) return undefined;

  return {
    year,
    endYear,
    approximate: Boolean(match[1])
  };
}

function parseDisplayDate(value: string): ParsedDisplayDate | undefined {
  const approximateMatch = value.match(/^(?:(?:c(?:irca)?|ca)\.?\s+)(.+)$/i);
  const approximate = Boolean(approximateMatch);
  const dateText = approximateMatch?.[1] ?? value;

  const iso = dateText.match(/^(\d{1,4})-(0?[1-9]|1[0-2])-(0?[1-9]|[12]\d|3[01])$/);
  if (iso) {
    return validParsedDate(Number(iso[1]), Number(iso[2]), Number(iso[3]), approximate);
  }

  const dayFirstNumeric = dateText.match(/^(0?[1-9]|[12]\d|3[01])[./](0?[1-9]|1[0-2])[./](\d{1,4})$/);
  if (dayFirstNumeric) {
    return validParsedDate(
      Number(dayFirstNumeric[3]),
      Number(dayFirstNumeric[2]),
      Number(dayFirstNumeric[1]),
      approximate
    );
  }

  const dayFirstText = dateText.match(/^(0?[1-9]|[12]\d|3[01])\s+([A-Za-z]+),?\s+(\d{1,4})$/);
  if (dayFirstText) {
    const month = MONTH_NUMBERS.get(dayFirstText[2].toLowerCase());
    if (month) {
      return validParsedDate(Number(dayFirstText[3]), month, Number(dayFirstText[1]), approximate);
    }
  }

  const monthFirstText = dateText.match(/^([A-Za-z]+)\s+(0?[1-9]|[12]\d|3[01]),?\s+(\d{1,4})$/);
  if (monthFirstText) {
    const month = MONTH_NUMBERS.get(monthFirstText[1].toLowerCase());
    if (month) {
      return validParsedDate(Number(monthFirstText[3]), month, Number(monthFirstText[2]), approximate);
    }
  }

  const monthYear = dateText.match(/^([A-Za-z]+)\s+(\d{1,4})$/);
  if (monthYear) {
    const month = MONTH_NUMBERS.get(monthYear[1].toLowerCase());
    if (month) {
      return { year: Number(monthYear[2]), month, approximate };
    }
  }

  const yearOnly = dateText.match(/^(\d{1,4})$/);
  if (yearOnly) {
    return { year: Number(yearOnly[1]), approximate };
  }

  return undefined;
}

function validParsedDate(year: number, month: number, day: number, approximate: boolean) {
  if (!isValidDateParts(year, month, day)) return undefined;
  return { year, month, day, approximate };
}

function isValidDateParts(
  year?: number | null,
  month?: number | null,
  day?: number | null
): year is number {
  if (!Number.isInteger(year) || year! < 1) return false;
  if (month == null) return day == null;
  if (!Number.isInteger(month) || month < 1 || month > 12) return false;
  if (day == null) return true;
  if (!Number.isInteger(day) || day < 1) return false;

  return day <= new Date(Date.UTC(year!, month, 0)).getUTCDate();
}

function formatDateParts(year: number, month?: number, day?: number, approximate = false) {
  const prefix = approximate ? "c. " : "";
  if (!month) return `${prefix}${year}`;

  const monthName = MONTH_NAMES[month - 1];
  if (!day) return `${prefix}${monthName} ${year}`;

  return `${prefix}${day} ${monthName} ${year}`;
}
