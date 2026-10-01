import type { PublicImage } from "@/lib/public-contracts";

export type MuseumSaintProfile = {
  name: string;
  description: string;
  facts: Array<{ label: string; value: string }>;
  images: PublicImage[];
  publicSlug?: string;
  postUrl?: string;
};
