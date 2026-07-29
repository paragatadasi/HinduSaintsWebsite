import type { PublicImage } from "@/lib/public-contracts";

type ResponsiveVariant = NonNullable<PublicImage["variants"]>[number];

export function getPublicImageVariants(value: unknown): ResponsiveVariant[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const variants = value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const candidate = item as Record<string, unknown>;
    if (
      typeof candidate.url !== "string"
      || typeof candidate.width !== "number"
      || typeof candidate.height !== "number"
    ) {
      return [];
    }

    return [{
      url: candidate.url,
      width: candidate.width,
      height: candidate.height
    }];
  }).sort((left, right) => left.width - right.width);

  return variants.length > 0 ? variants : undefined;
}

export function getResponsiveImageSourceSet(variants: PublicImage["variants"]) {
  return variants?.map((variant) => `${variant.url} ${variant.width}w`).join(", ");
}
