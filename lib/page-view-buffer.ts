import "server-only";

import { recordPageViewBatch } from "@/lib/page-views";

const flushIntervalMs = 10_000;
const flushThreshold = 250;
const maxBufferedViews = 10_000;

type BufferState = {
  counts: Map<string, number>;
  flushPromise?: Promise<void>;
  timer?: ReturnType<typeof setTimeout>;
  total: number;
};

const globalForPageViews = globalThis as unknown as {
  pageViewBuffer?: BufferState;
};

function getBuffer() {
  globalForPageViews.pageViewBuffer ??= {
    counts: new Map(),
    total: 0
  };

  return globalForPageViews.pageViewBuffer;
}

export function queuePageView(path: string) {
  const buffer = getBuffer();
  if (buffer.total >= maxBufferedViews) return false;

  const key = `${getUtcDayKey()}\n${path}`;
  buffer.counts.set(key, (buffer.counts.get(key) ?? 0) + 1);
  buffer.total += 1;

  if (buffer.total >= flushThreshold) {
    void flushPageViews();
  } else if (!buffer.timer) {
    buffer.timer = setTimeout(() => {
      buffer.timer = undefined;
      void flushPageViews();
    }, flushIntervalMs);
    buffer.timer.unref?.();
  }

  return true;
}

export async function flushPageViews() {
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

  buffer.flushPromise = recordPageViewBatch(
    Array.from(pending, ([key, views]) => {
      const separator = key.indexOf("\n");
      return {
        date: new Date(`${key.slice(0, separator)}T00:00:00.000Z`),
        path: key.slice(separator + 1),
        views
      };
    })
  ).catch((error) => {
    console.error("Unable to record buffered anonymous page views.", error);

    for (const [key, views] of pending) {
      buffer.counts.set(key, (buffer.counts.get(key) ?? 0) + views);
      buffer.total += views;
    }
  }).finally(() => {
    buffer.flushPromise = undefined;
    if (buffer.counts.size > 0 && !buffer.timer) {
      buffer.timer = setTimeout(() => {
        buffer.timer = undefined;
        void flushPageViews();
      }, flushIntervalMs);
      buffer.timer.unref?.();
    }
  });

  return buffer.flushPromise;
}

function getUtcDayKey() {
  return new Date().toISOString().slice(0, 10);
}
