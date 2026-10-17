import { db } from "@/lib/db";
import { extractInstagramBiographySlidesDraft } from "@/lib/instagram-first-page-extraction";

type ExtractionInput = Parameters<typeof extractInstagramBiographySlidesDraft>[0];

// Keep the source transcription separate from all editable biography revisions.
export async function getSavedInstagramBiographySlides({ instagramItemId, ...input }: ExtractionInput & { instagramItemId: string }): Promise<{ markdown?: string; slideCount: number; error?: string }> {
  const saved = await db.instagramItem.findUniqueOrThrow({
    where: { id: instagramItemId },
    select: { biographySlidesText: true, biographySlidesCount: true }
  });
  if (saved.biographySlidesText) {
    return { markdown: saved.biographySlidesText, slideCount: saved.biographySlidesCount ?? 0 };
  }

  const draft = await extractInstagramBiographySlidesDraft(input);
  if (!draft.markdown) return draft;

  // Concurrent imports must not replace the first saved reference.
  await db.instagramItem.updateMany({
    where: { id: instagramItemId, biographySlidesText: null },
    data: { biographySlidesText: draft.markdown, biographySlidesCount: draft.slideCount }
  });
  const reference = await db.instagramItem.findUniqueOrThrow({
    where: { id: instagramItemId },
    select: { biographySlidesText: true, biographySlidesCount: true }
  });
  return { markdown: reference.biographySlidesText!, slideCount: reference.biographySlidesCount ?? draft.slideCount };
}
