import type { PublicSourceSummary } from "@/lib/public-contracts";

type SourceTitleFields = Pick<PublicSourceSummary, "author" | "publisher" | "title" | "url">;

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
