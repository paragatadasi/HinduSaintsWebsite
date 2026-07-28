import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { extractInstagramBiographySlidesDraft } from "@/lib/instagram-first-page-extraction";

const requestSchema = z.object({
  saintId: z.string().cuid(),
  instagramItemId: z.string().cuid()
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Your admin session has expired. Sign in again, then retry the import." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => undefined);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Select a valid Instagram post and try again." }, { status: 400 });
  }

  const link = await db.instagramItemSaint.findFirst({
    where: {
      saintId: parsed.data.saintId,
      instagramItemId: parsed.data.instagramItemId,
      matchStatus: { in: ["matched", "published"] }
    },
    include: {
      instagramItem: {
        select: {
          instagramShortcode: true,
          instagramUrl: true,
          thumbnailUrl: true,
          mediaAssets: {
            orderBy: { sortOrder: "asc" },
            select: {
              cachedUrl: true,
              isCover: true,
              sortOrder: true,
              sourceUrl: true,
              storageKey: true
            }
          }
        }
      }
    }
  });

  if (!link) {
    return NextResponse.json(
      { error: "Select a matched Instagram post attached to this saint." },
      { status: 404 }
    );
  }

  const externalRecord = await db.externalRecord.findFirst({
    where: {
      sourceType: "instagram",
      entityType: "InstagramItem",
      entityId: parsed.data.instagramItemId
    },
    orderBy: { lastSeenAt: "desc" },
    select: { rawPayloadJson: true }
  });
  const draft = await extractInstagramBiographySlidesDraft({
    cachedMediaAssets: link.instagramItem.mediaAssets,
    rawPayloadJson: externalRecord?.rawPayloadJson,
    thumbnailUrl: link.instagramItem.thumbnailUrl
  });

  if (!draft.markdown) {
    return NextResponse.json(
      { error: draft.error ?? "No biography text could be extracted from slides after the cover image." },
      { status: 422 }
    );
  }

  return NextResponse.json({
    markdown: [
      `## Imported from Instagram ${link.instagramItem.instagramShortcode ?? "post"}`,
      "",
      draft.markdown,
      "",
      `[Source Instagram post](${link.instagramItem.instagramUrl})`
    ].join("\n"),
    slideCount: draft.slideCount
  });
}
