import "server-only";

import { db } from "@/lib/db";

export type PageViewIncrement = {
  date: Date;
  path: string;
  views: number;
};

export async function recordPageViewBatch(increments: PageViewIncrement[]) {
  if (increments.length === 0) return;

  await db.$transaction(
    increments.map((increment) => db.pageViewDaily.upsert({
      where: {
        path_date: {
          path: increment.path,
          date: increment.date
        }
      },
      create: increment,
      update: {
        views: { increment: increment.views }
      }
    }))
  );
}
