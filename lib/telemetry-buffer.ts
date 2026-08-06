import "server-only";

import { pruneTelemetry, recordTelemetryBatch } from "@/lib/telemetry";
import type { TelemetryEventName } from "@/lib/telemetry-contract";

const FLUSH_INTERVAL_MS = 10_000;
const FLUSH_THRESHOLD = 250;
const MAX_BUFFERED_EVENTS = 10_000;
const MAX_BUFFERED_KEYS = 2_000;

type BufferState = {
  counts: Map<string, number>;
  flushPromise?: Promise<void>;
  timer?: ReturnType<typeof setTimeout>;
  total: number;
};

const globalForTelemetry = globalThis as unknown as {
  aggregateTelemetryBuffer?: BufferState;
  aggregateTelemetryPrunedOn?: string;
};

function getBuffer() {
  globalForTelemetry.aggregateTelemetryBuffer ??= {
    counts: new Map(),
    total: 0
  };

  return globalForTelemetry.aggregateTelemetryBuffer;
}

export function queueTelemetry(path: string, event: TelemetryEventName, dimension: string) {
  const buffer = getBuffer();
  if (buffer.total >= MAX_BUFFERED_EVENTS) return false;

  const key = `${getUtcDayKey()}\n${event}\n${dimension}\n${path}`;
  if (!buffer.counts.has(key) && buffer.counts.size >= MAX_BUFFERED_KEYS) return false;

  buffer.counts.set(key, (buffer.counts.get(key) ?? 0) + 1);
  buffer.total += 1;

  if (buffer.total >= FLUSH_THRESHOLD) {
    void flushTelemetry();
  } else if (!buffer.timer) {
    buffer.timer = setTimeout(() => {
      buffer.timer = undefined;
      void flushTelemetry();
    }, FLUSH_INTERVAL_MS);
    buffer.timer.unref?.();
  }

  return true;
}

export async function flushTelemetry() {
  const buffer = getBuffer();
  if (buffer.flushPromise) return buffer.flushPromise;
  if (buffer.counts.size === 0) return;

  if (buffer.timer) {
    clearTimeout(buffer.timer);
    buffer.timer = undefined;
  }

  const pending = buffer.counts;
  buffer.counts = new Map();
  buffer.total = 0;

  buffer.flushPromise = (async () => {
    try {
      await recordTelemetryBatch(
        Array.from(pending, ([key, count]) => parseIncrement(key, count))
      );
    } catch (error) {
      console.error("Unable to record buffered aggregate telemetry.", error);

      for (const [key, count] of pending) {
        if (!buffer.counts.has(key) && buffer.counts.size >= MAX_BUFFERED_KEYS) continue;
        const restorableCount = Math.min(count, MAX_BUFFERED_EVENTS - buffer.total);
        if (restorableCount <= 0) break;
        buffer.counts.set(key, (buffer.counts.get(key) ?? 0) + restorableCount);
        buffer.total += restorableCount;
      }
      return;
    }

    const today = getUtcDayKey();
    if (globalForTelemetry.aggregateTelemetryPrunedOn === today) return;
    globalForTelemetry.aggregateTelemetryPrunedOn = today;

    try {
      await pruneTelemetry();
    } catch (error) {
      console.error("Unable to prune expired aggregate telemetry.", error);
      globalForTelemetry.aggregateTelemetryPrunedOn = undefined;
    }
  })().finally(() => {
    buffer.flushPromise = undefined;
    if (buffer.counts.size > 0 && !buffer.timer) {
      buffer.timer = setTimeout(() => {
        buffer.timer = undefined;
        void flushTelemetry();
      }, FLUSH_INTERVAL_MS);
      buffer.timer.unref?.();
    }
  });

  return buffer.flushPromise;
}

function parseIncrement(key: string, count: number) {
  const [date, event, dimension, ...pathParts] = key.split("\n");
  return {
    count,
    date: new Date(`${date}T00:00:00.000Z`),
    dimension,
    event,
    path: pathParts.join("\n")
  };
}

function getUtcDayKey() {
  return new Date().toISOString().slice(0, 10);
}
