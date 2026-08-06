import "server-only";

import { db } from "@/lib/db";

export type TelemetryIncrement = {
  count: number;
  date: Date;
  dimension: string;
  event: string;
  path: string;
};

export async function recordTelemetryBatch(increments: TelemetryIncrement[]) {
  if (increments.length === 0) return;

  await db.$transaction(
    increments.map((increment) => db.telemetryDaily.upsert({
      where: {
        path_date_event_dimension: {
          path: increment.path,
          date: increment.date,
          event: increment.event,
          dimension: increment.dimension
        }
      },
      create: increment,
      update: {
        count: { increment: increment.count }
      }
    }))
  );
}

export async function pruneTelemetry(referenceDate = new Date()) {
  const errorCutoff = new Date(referenceDate);
  errorCutoff.setUTCDate(errorCutoff.getUTCDate() - 30);
  const aggregateCutoff = new Date(referenceDate);
  aggregateCutoff.setUTCDate(aggregateCutoff.getUTCDate() - 366);

  await db.$transaction([
    db.telemetryDaily.deleteMany({
      where: { event: "client_error", date: { lt: errorCutoff } }
    }),
    db.telemetryDaily.deleteMany({
      where: { event: { not: "client_error" }, date: { lt: aggregateCutoff } }
    })
  ]);
}
