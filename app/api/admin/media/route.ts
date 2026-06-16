import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveUploadedImage, shouldRequireMediaUploadAuth } from "@/lib/media-storage";

const metadataSchema = z.object({
  altText: z.string().trim().max(240).optional(),
  caption: z.string().trim().max(500).optional(),
  credit: z.string().trim().max(160).optional(),
  sourceUrl: z.string().trim().url().max(2048).optional(),
  width: z.coerce.number().int().positive().max(12000).optional(),
  height: z.coerce.number().int().positive().max(12000).optional()
});

export async function GET(request: Request) {
  if (shouldRequireMediaUploadAuth()) {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
  }

  const sourceUrl = new URL(request.url).searchParams.get("sourceUrl");
  const parsedUrl = parseRemoteImageUrl(sourceUrl);

  if (!parsedUrl) {
    return NextResponse.json({ error: "A valid HTTPS sourceUrl is required." }, { status: 400 });
  }

  try {
    const response = await fetch(parsedUrl, { cache: "no-store" });
    const contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();

    if (!response.ok || !contentType?.startsWith("image/")) {
      return NextResponse.json({ error: "Remote image could not be loaded." }, { status: 400 });
    }

    const body = await response.arrayBuffer();

    return new NextResponse(body, {
      headers: {
        "Cache-Control": "private, max-age=300",
        "Content-Type": contentType
      }
    });
  } catch {
    return NextResponse.json({ error: "Remote image could not be loaded." }, { status: 400 });
  }
}

export async function POST(request: Request) {
  if (shouldRequireMediaUploadAuth()) {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload a file using the `file` field." }, { status: 400 });
  }

  const parsedMetadata = metadataSchema.safeParse({
    altText: getOptionalFormString(formData, "altText"),
    caption: getOptionalFormString(formData, "caption"),
    credit: getOptionalFormString(formData, "credit"),
    sourceUrl: getOptionalFormString(formData, "sourceUrl"),
    width: getOptionalFormString(formData, "width"),
    height: getOptionalFormString(formData, "height")
  });

  if (!parsedMetadata.success) {
    return NextResponse.json({ error: "Media metadata is invalid." }, { status: 400 });
  }

  try {
    const stored = await saveUploadedImage(file);
    const mediaAsset = await db.mediaAsset.create({
      data: {
        ...stored,
        ...parsedMetadata.data
      }
    });

    return NextResponse.json({ mediaAsset }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Media upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function parseRemoteImageUrl(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || isPrivateHostname(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

function isPrivateHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  if (normalized === "localhost" || normalized === "::1") return true;
  if (/^127\./.test(normalized) || /^10\./.test(normalized) || /^192\.168\./.test(normalized)) return true;

  const match = normalized.match(/^172\.(\d{1,2})\./);
  return Boolean(match && Number(match[1]) >= 16 && Number(match[1]) <= 31);
}

function getOptionalFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
