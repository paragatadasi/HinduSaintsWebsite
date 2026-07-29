import "server-only";

import { after } from "next/server";
import { db } from "@/lib/db";
import { normalizePageViewPath } from "@/lib/page-view-path";

export function logPageView(rawPath: string) {
  const path = normalizePageViewPath(rawPath);

  if (!path) return;

  after(async () => {
    const now = new Date();
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    try {
      await db.pageViewDaily.upsert({
        where: {
          path_date: { path, date }
        },
        create: {
          path,
          date,
          views: 1
        },
        update: {
          views: { increment: 1 }
        }
      });
    } catch (error) {
      console.error("Unable to record anonymous page view.", error);
    }
  });
}
