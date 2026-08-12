const sessionCookiePrefixes = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token"
] as const;

const privatePathPrefixes = ["/admin", "/museumadmin", "/preview", "/api/admin"] as const;
const publicCacheExactPaths = new Set(["/", "/about", "/contact", "/map", "/saints", "/traditions"]);
const publicCachePathPrefixes = ["/saints/", "/traditions/", "/places/"] as const;

export const PRIVATE_ROBOTS_HEADER = "noindex, nofollow, noarchive, nosnippet, noimageindex";

export type RequestVisibilityPolicy = {
  cacheControl?: string;
  cdnCacheControl?: string;
  robots?: string;
  surrogateControl?: string;
};

export function hasAdminSessionCookie(cookieNames: readonly string[]) {
  return cookieNames.some((name) => sessionCookiePrefixes.some((prefix) => (
    name === prefix || name.startsWith(`${prefix}.`)
  )));
}

export function isPrivateSurfacePath(pathname: string) {
  return privatePathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isPublicCachePath(pathname: string) {
  if (pathname === "/saints/random") return false;
  return publicCacheExactPaths.has(pathname)
    || publicCachePathPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export function getRequestVisibilityPolicy({
  pathname,
  cookieNames
}: {
  pathname: string;
  cookieNames: readonly string[];
}): RequestVisibilityPolicy {
  const authenticated = hasAdminSessionCookie(cookieNames);
  if (authenticated || isPrivateSurfacePath(pathname)) {
    return {
      cacheControl: "private, no-store, max-age=0",
      cdnCacheControl: "private, no-store",
      robots: PRIVATE_ROBOTS_HEADER,
      surrogateControl: "no-store"
    };
  }

  if (isPublicCachePath(pathname)) {
    return {
      cacheControl: "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
      cdnCacheControl: "public, s-maxage=300, stale-while-revalidate=86400",
      surrogateControl: "max-age=300, stale-while-revalidate=86400"
    };
  }

  return {};
}
