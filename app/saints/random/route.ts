import { NextResponse } from "next/server";
import { getPublishedSaintSlugs } from "@/lib/public-saints";

export const dynamic = "force-dynamic";

export async function GET() {
  const saints = await getPublishedSaintSlugs();
  const saint = saints[Math.floor(Math.random() * saints.length)];
  const destination = saint ? `/saints/${saint.slug}` : "/saints";
  const response = new NextResponse(null, {
    status: 307,
    headers: { Location: destination }
  });

  response.headers.set("Cache-Control", "no-store");
  return response;
}
