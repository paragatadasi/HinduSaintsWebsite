import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveUploadedImage, shouldRequireMediaUploadAuth } from "@/lib/media-storage";

const metadataSchema = z.object({
  altText: z.string().trim().max(240).optional(),
  caption: z.string().trim().max(500).optional(),
  credit: z.string().trim().max(160).optional(),
  sourceUrl: z.string().trim().url().max(2048).optional()
});

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
    sourceUrl: getOptionalFormString(formData, "sourceUrl")
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

function getOptionalFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
