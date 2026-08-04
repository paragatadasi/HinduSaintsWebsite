export type ImportedDatePrecision = "day" | "month" | "year" | "range" | "unknown" | "text" | "empty";

export type ImportedDateParts = {
  raw?: string;
  year?: number;
  endYear?: number;
  month?: number;
  day?: number;
  precision: ImportedDatePrecision;
  note?: string;
};

const MONTHS = new Map([
  ["jan", 1], ["january", 1], ["feb", 2], ["february", 2], ["mar", 3], ["march", 3],
  ["apr", 4], ["april", 4], ["may", 5], ["jun", 6], ["june", 6], ["jul", 7], ["july", 7],
  ["aug", 8], ["august", 8], ["sep", 9], ["sept", 9], ["september", 9], ["oct", 10],
  ["october", 10], ["nov", 11], ["november", 11], ["dec", 12], ["december", 12]
]);

const ERA_PATTERN = "(?:B\\.?\\s*C\\.?(?:\\s*E\\.?)?|A\\.?\\s*D\\.?|C\\.?\\s*E\\.?)";
const RANGE_PATTERN = new RegExp(`^(?:(?:c(?:irca)?|ca)\\.?\\s+)?(\\d{1,4})\\s*(${ERA_PATTERN})?\\s*[-–—]\\s*(\\d{1,4})\\s*(${ERA_PATTERN})?$`, "i");
const YEAR_PATTERN = new RegExp(`^(\\d{1,4})\\s*(${ERA_PATTERN})?$`, "i");
const ISO_PATTERN = new RegExp(`^(\\d{1,4})-(0?[1-9]|1[0-2])-(0?[1-9]|[12][0-9]|3[01])\\s*(${ERA_PATTERN})?$`, "i");
const DOTTED_PATTERN = new RegExp(`^(0?[1-9]|[12][0-9]|3[01])[./](0?[1-9]|1[0-2])[./](\\d{1,4})\\s*(${ERA_PATTERN})?$`, "i");
const DAY_MONTH_YEAR_PATTERN = new RegExp(`^(0?[1-9]|[12][0-9]|3[01])(?:st|nd|rd|th)?\\s+([A-Za-z]+)\\s+(\\d{1,4})\\s*(${ERA_PATTERN})?(?=$|[\\s,;:()])`, "i");
const MONTH_DAY_YEAR_PATTERN = new RegExp(`^([A-Za-z]+)\\s+(0?[1-9]|[12][0-9]|3[01])(?:st|nd|rd|th)?(?:,)?\\s+(\\d{1,4})\\s*(${ERA_PATTERN})?(?=$|[\\s,;:()])`, "i");
const MONTH_YEAR_PATTERN = new RegExp(`^([A-Za-z]+)\\s+(\\d{1,4})\\s*(${ERA_PATTERN})?(?=$|[\\s,;:()])`, "i");
const ERA_QUALIFIED_YEAR_PATTERN = new RegExp(`\\b(\\d{1,4})\\s*(${ERA_PATTERN})\\b`, "i");
const FOUR_DIGIT_YEAR_PATTERN = /\\b(\\d{4})\\b/;

export function parseImportedDate(value: unknown): ImportedDateParts {
  const raw = String(value ?? "").trim();
  if (!raw) return { precision: "empty" };
  if (/^unknown$/i.test(raw)) return { raw: "Unknown", precision: "unknown" };

  const range = raw.match(RANGE_PATTERN);
  if (range) {
    const firstEra = normalizeEra(range[2]);
    const secondEra = normalizeEra(range[4]);
    const year = historicalYear(Number(range[1]), firstEra ?? secondEra);
    const endYear = historicalYear(Number(range[3]), secondEra ?? firstEra);
    if (year != null && endYear != null && year <= endYear) {
      return { raw, year, endYear, precision: "range" };
    }
    return { raw, precision: "text", note: "Year range must run from the earlier year to the later year." };
  }

  const iso = raw.match(ISO_PATTERN);
  if (iso) return parsedDay(raw, Number(iso[1]), Number(iso[2]), Number(iso[3]), iso[4]);

  const dotted = raw.match(DOTTED_PATTERN);
  if (dotted) return parsedDay(raw, Number(dotted[3]), Number(dotted[2]), Number(dotted[1]), dotted[4]);

  const dayMonthYear = raw.match(DAY_MONTH_YEAR_PATTERN);
  if (dayMonthYear) {
    const month = MONTHS.get(dayMonthYear[2].toLowerCase());
    if (month) return parsedDay(raw, Number(dayMonthYear[3]), month, Number(dayMonthYear[1]), dayMonthYear[4]);
  }

  const monthDayYear = raw.match(MONTH_DAY_YEAR_PATTERN);
  if (monthDayYear) {
    const month = MONTHS.get(monthDayYear[1].toLowerCase());
    if (month) return parsedDay(raw, Number(monthDayYear[3]), month, Number(monthDayYear[2]), monthDayYear[4]);
  }

  const monthYear = raw.match(MONTH_YEAR_PATTERN);
  if (monthYear) {
    const month = MONTHS.get(monthYear[1].toLowerCase());
    const year = historicalYear(Number(monthYear[2]), normalizeEra(monthYear[3]));
    if (month && year != null) return { raw, year, month, precision: "month" };
  }

  const yearOnly = raw.match(YEAR_PATTERN);
  if (yearOnly) {
    const year = historicalYear(Number(yearOnly[1]), normalizeEra(yearOnly[2]));
    if (year != null) return { raw, year, precision: "year" };
  }

  const embeddedYear = raw.match(ERA_QUALIFIED_YEAR_PATTERN) ?? raw.match(FOUR_DIGIT_YEAR_PATTERN);
  if (embeddedYear) {
    const year = historicalYear(Number(embeddedYear[1]), normalizeEra(embeddedYear[2]));
    if (year != null) return { raw, year, precision: "year", note: "Year parsed from free-text date." };
  }

  return unparsedDate(raw);
}

export function buildEraLabel(birth: ImportedDateParts, samadhi: ImportedDateParts) {
  const birthRange = formatYearRange(birth);
  const samadhiRange = formatYearRange(samadhi);
  if (birthRange || samadhiRange) {
    return [
      birthRange ? `b. ${birthRange}` : birth.year ? `b. ${formatHistoricalYear(birth.year)}` : undefined,
      samadhiRange ? `samadhi ${samadhiRange}` : samadhi.year ? `samadhi ${formatHistoricalYear(samadhi.year)}` : undefined
    ].filter(Boolean).join("; ") || undefined;
  }
  if (birth.year && samadhi.year) return `${formatHistoricalYear(birth.year)}–${formatHistoricalYear(samadhi.year)}`;
  if (birth.year) return `b. ${formatHistoricalYear(birth.year)}`;
  if (samadhi.year) return `samadhi ${formatHistoricalYear(samadhi.year)}`;
  return undefined;
}

export function formatHistoricalYear(year: number, showCommonEra = false) {
  return year < 0 ? `${Math.abs(year)} BCE` : `${year}${showCommonEra ? " CE" : ""}`;
}

function formatYearRange(value: ImportedDateParts) {
  if (value.precision !== "range" || value.year == null || value.endYear == null) return undefined;
  const crossesEra = value.year < 0 && value.endYear > 0;
  return `${formatHistoricalYear(value.year)}–${formatHistoricalYear(value.endYear, crossesEra)}`;
}

function parsedDay(raw: string, rawYear: number, month: number, day: number, eraText?: string): ImportedDateParts {
  const year = historicalYear(rawYear, normalizeEra(eraText));
  if (year == null || !isValidDate(year, month, day)) return unparsedDate(raw);
  return { raw, year, month, day, precision: "day" };
}

function normalizeEra(value?: string) {
  const normalized = value?.replace(/[.\s]/g, "").toUpperCase();
  if (normalized === "BC" || normalized === "BCE") return "BCE" as const;
  if (normalized === "AD" || normalized === "CE") return "CE" as const;
  return undefined;
}

function historicalYear(year: number, era?: "BCE" | "CE") {
  if (!Number.isInteger(year) || year < 1) return undefined;
  return era === "BCE" ? -year : year;
}

function isValidDate(year: number, month: number, day: number) {
  const astronomicalYear = year < 0 ? year + 1 : year;
  const leap = astronomicalYear % 4 === 0 && (astronomicalYear % 100 !== 0 || astronomicalYear % 400 === 0);
  return day <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

function unparsedDate(raw: string): ImportedDateParts {
  return { raw, precision: "text", note: "No historical date parts parsed from raw value." };
}
