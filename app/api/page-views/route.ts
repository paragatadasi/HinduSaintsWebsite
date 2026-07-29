import { NextResponse } from "next/server";
import { z } from "zod";
import { queuePageView } from "@/lib/page-view-buffer";
import { normalizePageViewPath } from "@/lib/page-view-path";

export const runtime = "nodejs";

const payloadSchema = z.object({
  path: z.string().max(500)
});

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 1_024) {
    return NextResponse.json({ error: "Payload is too large." }, { status: 413 });
  }

  const body = await request.text();
  if (body.length > 1_024) {
    return NextResponse.json({ error: "Payload is too large." }, { status: 413 });
  }

  const parsed = payloadSchema.safeParse(parseJson(body));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid page-view payload." }, { status: 400 });
  }

  const path = normalizePageViewPath(parsed.data.path);
  if (!path) {
    return NextResponse.json({ accepted: false }, {
      status: 202,
      headers: { "Cache-Control": "no-store" }
    });
  }

  const accepted = queuePageView(path);
  return NextResponse.json({ accepted }, {
    status: 202,
    headers: { "Cache-Control": "no-store" }
  });
}

function parseJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}
