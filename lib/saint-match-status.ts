import type { MatchStatus, Prisma } from "@/lib/generated/prisma/client";

export type SaintMatchStatus = "unmatched" | "matched";

export const reviewedInstagramMatchStatuses: readonly MatchStatus[] = ["matched", "published"];

type InstagramMatchReference = {
  matchStatus: MatchStatus;
  instagramItem: { status: MatchStatus };
};

export function getSaintMatchStatus(links: readonly InstagramMatchReference[]): SaintMatchStatus {
  return links.some((link) => (
    reviewedInstagramMatchStatuses.includes(link.matchStatus)
    && reviewedInstagramMatchStatuses.includes(link.instagramItem.status)
  )) ? "matched" : "unmatched";
}

export function reviewedInstagramMatchWhere(): Prisma.InstagramItemSaintWhereInput {
  return {
    matchStatus: { in: [...reviewedInstagramMatchStatuses] },
    instagramItem: { status: { in: [...reviewedInstagramMatchStatuses] } }
  };
}
