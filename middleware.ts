import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { shouldBlockSearchIndexing } from "@/lib/deployment-environment";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (shouldBlockSearchIndexing(request.nextUrl.hostname)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
