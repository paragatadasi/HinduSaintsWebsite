import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeTelemetryPath } from "@/lib/page-view-path";
import { queuePageView } from "@/lib/page-view-buffer";
import { queueTelemetry } from "@/lib/telemetry-buffer";
import { TELEMETRY_EVENT_NAMES } from "@/lib/telemetry-contract";
import { normalizeTelemetryValue } from "@/lib/telemetry-values";

export const runtime = "nodejs";

const MAX_PAYLOAD_BYTES = 8_192;

const payloadSchema = z.object({
  events: z.array(z.object({
    name: z.enum(TELEMETRY_EVENT_NAMES),
    path: z.string().max(500),
    value: z.string().max(255).optional()
  }).strict()).min(1).max(20)
}).strict();

export async function POST(request: Request) {
  const requestSite = request.headers.get("sec-fetch-site");
  if (requestSite && requestSite !== "same-origin" && requestSite !== "none") {
    return NextResponse.json({ error: "Cross-site telemetry is not accepted." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: "Payload is too large." }, { status: 413 });
  }

  const body = await request.text();
  if (body.length > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: "Payload is too large." }, { status: 413 });
  }

  const parsed = payloadSchema.safeParse(parseJson(body));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid telemetry payload." }, { status: 400 });
  }

  let accepted = 0;
  for (const event of parsed.data.events) {
    const path = normalizeTelemetryPath(event.path);
    if (!path) continue;

    if (event.name === "page_view") {
      if (event.value === undefined && queuePageView(path)) accepted += 1;
      continue;
    }

    const dimension = normalizeTelemetryValue(event.name, event.value);
    if (dimension === null) continue;
    if (queueTelemetry(path, event.name, dimension)) accepted += 1;
  }

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
