const EXCLUDED_PATH_PREFIXES = ["/admin", "/api", "/media", "/museumadmin", "/_next"];
const MAX_PAGE_PATH_LENGTH = 500;
const PUBLIC_STATIC_PATHS = new Set([
  "/",
  "/about",
  "/contact",
  "/map",
  "/places",
  "/saints",
  "/sampradayas",
  "/traditions"
]);
const PUBLIC_DETAIL_PATH_PATTERN = /^\/(?:saints|traditions|places|sampradayas)\/[^/]+$/;

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

export function normalizeTelemetryPath(rawPath: string) {
  const normalizedPath = normalizePageViewPath(rawPath);
  if (!normalizedPath) return null;

  return PUBLIC_STATIC_PATHS.has(normalizedPath) || PUBLIC_DETAIL_PATH_PATTERN.test(normalizedPath)
    ? normalizedPath
    : null;
}
