import { NextResponse } from "next/server";
import { getPublishedSaintSlugs } from "@/lib/public-saints";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const saints = await getPublishedSaintSlugs();
  const currentSlug = getReferringSaintSlug(request.headers.get("referer"));
  const candidates = currentSlug && saints.length > 1
    ? saints.filter(({ slug }) => slug !== currentSlug)
    : saints;
  const saint = candidates[Math.floor(Math.random() * candidates.length)];
  const destination = saint ? `/saints/${saint.slug}` : "/saints";
  const response = new NextResponse(null, {
    status: 307,
    headers: { Location: destination }
  });

  response.headers.set("Cache-Control", "no-store");
  return response;
}

function getReferringSaintSlug(referer: string | null) {
  if (!referer) return undefined;

  try {
    const match = new URL(referer).pathname.match(/^\/saints\/([^/]+)\/?$/);
    return match?.[1] ? decodeURIComponent(match[1]) : undefined;
  } catch {
    return undefined;
  }
}
