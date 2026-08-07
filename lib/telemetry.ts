import "server-only";

import { db } from "@/lib/db";
import { CLIENT_DIAGNOSTIC_EVENT_NAMES } from "@/lib/telemetry-contract";

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
      where: { event: { in: [...CLIENT_DIAGNOSTIC_EVENT_NAMES] }, date: { lt: errorCutoff } }
    }),
    db.telemetryDaily.deleteMany({
      where: { event: { notIn: [...CLIENT_DIAGNOSTIC_EVENT_NAMES] }, date: { lt: aggregateCutoff } }
    })
  ]);
}
