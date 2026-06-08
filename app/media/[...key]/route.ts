import { NextResponse } from "next/server";
import { getStoredMediaFile } from "@/lib/media-storage";

export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  try {
    const { key } = await params;
    const media = await getStoredMediaFile(key.join("/"));

    return new Response(new Uint8Array(media.body), {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": media.contentType,
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch {
    return NextResponse.json({ error: "Media not found." }, { status: 404 });
  }
}
