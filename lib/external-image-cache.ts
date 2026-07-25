import { saveImageBuffer } from "@/lib/media-storage";

type CacheExternalImageInput = {
  fileName: string;
  folder: string;
  sourceUrls: Array<string | null | undefined>;
};

export async function cacheExternalImage({ fileName, folder, sourceUrls }: CacheExternalImageInput) {
  const candidates = Array.from(
    new Set(sourceUrls.map((url) => url?.trim()).filter((url): url is string => Boolean(url)))
  );
  let lastError: Error | undefined;

  for (const sourceUrl of candidates) {
    try {
      const response = await fetch(sourceUrl, { cache: "no-store" });
      const contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();

      if (!response.ok || !contentType?.startsWith("image/")) {
        throw new Error(`${response.status} ${response.statusText}`.trim());
      }

      const stored = await saveImageBuffer({
        body: Buffer.from(await response.arrayBuffer()),
        contentType,
        fileName,
        folder
      });

      return { ...stored, fetchedFromUrl: sourceUrl };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown image download error.");
    }
  }

  throw new Error(
    candidates.length === 0
      ? "No external image URL was provided."
      : `External image could not be cached: ${lastError?.message ?? "unknown error"}`
  );
}
