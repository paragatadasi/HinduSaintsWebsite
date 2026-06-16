export type InstagramFirstPageMetadata = {
  displayName?: string;
  subtitle?: string;
  born?: string;
  samadhi?: string;
  keyPlace?: string;
  keyPlaces?: string[];
  tradition?: string;
  guru?: string;
  gurus?: string[];
};

const FIELD_LABELS = [
  { key: "born", label: "BORN" },
  { key: "samadhi", label: "SAMADHI" },
  { key: "keyPlace", label: "KEY PLACE" },
  { key: "tradition", label: "TRADITION" },
  { key: "guru", label: "GURU" }
] as const;

type MetadataKey = keyof InstagramFirstPageMetadata;
type ParsedFieldKey = typeof FIELD_LABELS[number]["key"];

export function parseInstagramFirstPageMetadata(input: string | undefined | null): InstagramFirstPageMetadata {
  const text = input?.trim();
  if (!text) return {};

  const normalizedLines = text
    .split(/\r?\n/)
    .map((line) => normalizeText(line))
    .filter(Boolean);
  const metadata: InstagramFirstPageMetadata = {};
  const nameLines: string[] = [];

  for (const line of normalizedLines) {
    const matches = getFieldMatches(line);
    if (matches.length === 0) {
      if (line.length > 1) nameLines.push(line);
      continue;
    }

    const leadingText = line.slice(0, matches[0]?.start ?? 0).trim();
    if (leadingText.length > 1) nameLines.push(leadingText);

    for (let index = 0; index < matches.length; index += 1) {
      const match = matches[index];
      const nextMatch = matches[index + 1];
      if (!match) continue;
      const rawValue = line.slice(match.end, nextMatch?.start).trim();
      const value = cleanMetadataValue(rawValue);
      if (value) metadata[match.key] = value;
    }
  }

  if (!metadata.displayName && nameLines[0]) metadata.displayName = nameLines[0];
  if (!metadata.subtitle && nameLines[1]) metadata.subtitle = nameLines.slice(1).join(" ");

  return compactMetadata(metadata);
}

export function compactMetadata(metadata: InstagramFirstPageMetadata): InstagramFirstPageMetadata {
  const compacted = Object.fromEntries(
    Object.entries(metadata)
      .map(([key, value]) => [key, Array.isArray(value) ? compactStringList(value) : normalizeText(value)])
      .filter((entry): entry is [MetadataKey, string | string[]] => Array.isArray(entry[1]) ? entry[1].length > 0 : Boolean(entry[1]))
  ) as InstagramFirstPageMetadata;

  const keyPlaces = compactStringList(compacted.keyPlaces ?? splitKeyPlaces(compacted.keyPlace));
  const gurus = compactStringList(compacted.gurus ?? splitGurus(compacted.guru));

  return {
    ...compacted,
    keyPlaces: keyPlaces.length > 0 ? keyPlaces : undefined,
    gurus: gurus.length > 0 ? gurus : undefined
  };
}

export function splitKeyPlaces(value: string | undefined | null) {
  return splitMetadataList(value, {
    splitCommaBeforeHonorific: false,
    preserveCommaPairs: true
  });
}

export function splitGurus(value: string | undefined | null) {
  return splitMetadataList(value, {
    splitCommaBeforeHonorific: true,
    preserveCommaPairs: false
  });
}

function getFieldMatches(line: string) {
  const matches: Array<{ key: ParsedFieldKey; start: number; end: number }> = [];

  for (const field of FIELD_LABELS) {
    const match = new RegExp(`\\b${field.label.replace(" ", "\\s+")}\\b`, "i").exec(line);
    if (match) matches.push({ key: field.key, start: match.index, end: match.index + match[0].length });
  }

  matches.sort((left, right) => left.start - right.start);

  return matches;
}

function cleanMetadataValue(value: string) {
  return normalizeText(value.replace(/^[:\-–—\s]+/, ""));
}

function normalizeText(value: string | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function splitMetadataList(
  value: string | undefined | null,
  options: { splitCommaBeforeHonorific: boolean; preserveCommaPairs: boolean }
) {
  const normalized = normalizeText(value ?? undefined);
  if (!normalized) return [];

  return compactStringList(
    normalized
      .replace(/\s+(?:and|&)\s+/gi, ";")
      .replace(/\s*[;/|]\s*/g, ";")
      .split(";")
      .flatMap((part) => splitCommaSeparatedPart(part, options))
      .map((part) => normalizeText(part.replace(/^(?:near|in|at|from)\s+/i, "")))
  );
}

function splitCommaSeparatedPart(part: string, options: { splitCommaBeforeHonorific: boolean; preserveCommaPairs: boolean }) {
  const pieces = part.split(/\s*,\s*/).map((piece) => normalizeText(piece)).filter(Boolean);
  if (pieces.length <= 1) return pieces;
  if (options.preserveCommaPairs && pieces.length === 2) return [pieces.join(", ")];
  if (options.splitCommaBeforeHonorific && pieces.slice(1).some(startsWithSaintHonorific)) return pieces;
  return [pieces.join(", ")];
}

function startsWithSaintHonorific(value: string) {
  return /^(?:acharya|baba|bhagat|guru|mahant|maharaj|maharaja|maharishi|maharshi|paramahamsa|paramahansa|sant|shri|sri|srila|swami)\b/i.test(value);
}

function compactStringList(values: Array<string | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = normalizeText(value);
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }

  return result;
}
