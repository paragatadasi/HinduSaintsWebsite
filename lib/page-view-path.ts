const EXCLUDED_PATH_PREFIXES = ["/admin", "/api", "/media", "/museumadmin", "/_next"];
const MAX_PAGE_PATH_LENGTH = 500;

export function normalizePageViewPath(rawPath: string) {
  const pathWithoutQuery = rawPath.trim().split(/[?#]/, 1)[0];

  if (!pathWithoutQuery?.startsWith("/")) return null;

  const normalizedPath = pathWithoutQuery
    .replace(/\/{2,}/g, "/")
    .replace(/\/+$/, "") || "/";

  if (normalizedPath.length > MAX_PAGE_PATH_LENGTH) return null;

  const isExcluded = EXCLUDED_PATH_PREFIXES.some(
    (prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
  );

  return isExcluded ? null : normalizedPath;
}
