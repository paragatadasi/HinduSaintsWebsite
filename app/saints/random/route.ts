import { NextResponse } from "next/server";
import { getPublishedSaintSlugs } from "@/lib/public-saints";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const saints = await getPublishedSaintSlugs();
  const saint = saints[Math.floor(Math.random() * saints.length)];
  const destination = saint ? `/saints/${saint.slug}` : "/saints";
  const response = NextResponse.redirect(new URL(destination, request.url));

  response.headers.set("Cache-Control", "no-store");
  return response;
}
