import { NextResponse } from "next/server";
import sharp from "sharp";
import { getStoredMediaFile } from "@/lib/media-storage";

const SOCIAL_IMAGE_WIDTH = 1200;
const SOCIAL_IMAGE_HEIGHT = 630;

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  try {
    const { key } = await params;
    if (key.length < 2 || key.at(-1) !== "preview.jpg") {
      return NextResponse.json({ error: "Social image not found." }, { status: 404 });
    }

    const storageKey = key.slice(0, -1).join("/");
    const source = await getStoredMediaFile(storageKey);
    const metadata = await sharp(source.body).metadata();
    const focalPoint = getFocalPoint(new URL(request.url));
    const crop = metadata.width && metadata.height
      ? getCoverCrop(metadata.width, metadata.height, focalPoint)
      : undefined;
    let transformer = sharp(source.body).rotate();

    if (crop) transformer = transformer.extract(crop);

    const output = await transformer
      .resize(SOCIAL_IMAGE_WIDTH, SOCIAL_IMAGE_HEIGHT, { fit: "fill" })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();

    return new Response(new Uint8Array(output), {
      headers: {
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
        "Content-Length": String(output.byteLength),
        "Content-Type": "image/jpeg",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch {
    return NextResponse.json({ error: "Social image not found." }, { status: 404 });
  }
}

function getFocalPoint(url: URL) {
  return {
    x: getPercentage(url.searchParams.get("x")),
    y: getPercentage(url.searchParams.get("y"))
  };
}

function getPercentage(value: string | null) {
  if (value === null || value.trim() === "") return 50;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : 50;
}

function getCoverCrop(width: number, height: number, focalPoint: { x: number; y: number }) {
  const targetAspectRatio = SOCIAL_IMAGE_WIDTH / SOCIAL_IMAGE_HEIGHT;
  const sourceAspectRatio = width / height;

  if (sourceAspectRatio > targetAspectRatio) {
    const cropWidth = Math.min(width, Math.round(height * targetAspectRatio));
    return {
      left: clampOffset(Math.round((focalPoint.x / 100) * width - cropWidth / 2), width - cropWidth),
      top: 0,
      width: cropWidth,
      height
    };
  }

  const cropHeight = Math.min(height, Math.round(width / targetAspectRatio));
  return {
    left: 0,
    top: clampOffset(Math.round((focalPoint.y / 100) * height - cropHeight / 2), height - cropHeight),
    width,
    height: cropHeight
  };
}

function clampOffset(value: number, maximum: number) {
  return Math.min(maximum, Math.max(0, value));
}
