import type { PublicSourceSummary } from "@/lib/public-contracts";

type SourceTitleFields = Pick<PublicSourceSummary, "author" | "publisher" | "title" | "url">;

export type ComparableSource = {
  author?: string | null;
  publicationYear?: number | null;
  title: string;
  url?: string | null;
};

export type SourceMatchKind = "exact_url" | "matching_details";

export function getSourceDisplayTitle(source: SourceTitleFields) {
  const title = source.title.trim();
  if (!looksLikeUrl(title)) return title;

  const parsed = parseUrl(source.url ?? title);
  if (!parsed) return source.publisher ?? source.author ?? "External source";

  const siteName = formatSiteName(parsed.hostname);
  const pageName = formatPageName(parsed.pathname);
  return pageName ? `${pageName} — ${siteName}` : siteName;
}

export function createImportedSourceTitle(url: string) {
  return getSourceDisplayTitle({ title: url, url });
}

export function getSourceMatchKind(candidate: ComparableSource, input: ComparableSource): SourceMatchKind | null {
  const candidateUrl = normalizeSourceUrl(candidate.url);
  const inputUrl = normalizeSourceUrl(input.url);
  if (candidateUrl && inputUrl && candidateUrl === inputUrl) return "exact_url";

  const titlesMatch = normalizeSourceText(candidate.title) === normalizeSourceText(input.title);
  if (!titlesMatch) return null;

  const candidateAuthor = normalizeSourceText(candidate.author);
  const inputAuthor = normalizeSourceText(input.author);
  const authorsMatch = !candidateAuthor || !inputAuthor || candidateAuthor === inputAuthor;
  const yearsMatch = candidate.publicationYear == null
    || input.publicationYear == null
    || candidate.publicationYear === input.publicationYear;
  return authorsMatch && yearsMatch ? "matching_details" : null;
}

export function normalizeSourceUrl(value?: string | null) {
  if (!value?.trim()) return null;

  try {
    const url = new URL(value.trim());
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$)/i.test(key)) url.searchParams.delete(key);
    }
    url.searchParams.sort();
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString();
  } catch {
    return null;
  }
}

function normalizeSourceText(value?: string | null) {
  return value?.trim().replace(/\s+/g, " ").toLocaleLowerCase() ?? "";
}

function looksLikeUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function parseUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function formatSiteName(hostname: string) {
  const segments = hostname.replace(/^www\./i, "").split(".");
  const name = segments.length > 1 ? segments.at(-2)! : segments[0];
  return humanize(name);
}

function formatPageName(pathname: string) {
  const segment = pathname.split("/").filter(Boolean).at(-1);
  if (!segment) return "";
  try {
    return humanize(decodeURIComponent(segment));
  } catch {
    return humanize(segment);
  }
}

function humanize(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
