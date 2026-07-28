import { toSlug } from "./slugs";

export type AirtableSaintSlugCandidates = {
  baseSlug: string;
  detailedSlug?: string;
};

export function buildAirtableSaintSlugCandidates({
  displayName,
  originalName
}: {
  displayName: string;
  originalName: string;
}): AirtableSaintSlugCandidates {
  const baseSlug = toSlug(displayName) || "saint";
  const detailedSlug = toSlug(originalName);

  return {
    baseSlug,
    ...(detailedSlug && detailedSlug !== baseSlug ? { detailedSlug } : {})
  };
}
