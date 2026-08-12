import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRequestVisibilityPolicy } from "@/lib/request-visibility";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const policy = getRequestVisibilityPolicy({
    pathname: request.nextUrl.pathname,
    cookieNames: request.cookies.getAll().map(({ name }) => name)
  });

  if (policy.cacheControl) response.headers.set("Cache-Control", policy.cacheControl);
  if (policy.cdnCacheControl) response.headers.set("CDN-Cache-Control", policy.cdnCacheControl);
  if (policy.surrogateControl) response.headers.set("Surrogate-Control", policy.surrogateControl);
  if (policy.robots) response.headers.set("X-Robots-Tag", policy.robots);

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.png|favicon.ico).*)"]
};
