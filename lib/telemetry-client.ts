import {
  isTelemetryEngagementEventName,
  type TelemetryEngagementEventName,
  type TelemetryEvent,
  type TelemetryEventName,
  type TelemetryValueBucket
} from "@/lib/telemetry-contract";

const TELEMETRY_ENDPOINT = "/api/telemetry";
const FLUSH_INTERVAL_MS = 10_000;
const MAX_QUEUED_EVENTS = 20;
const PERFORMANCE_SAMPLE_RATE = 0.1;

let currentPath = "";
let performancePath = "";
let performanceSampled = false;
let pendingNavigationPath = "";
let pendingNavigationStartedAt = 0;
let flushTimer: ReturnType<typeof setTimeout> | undefined;
const queue: TelemetryEvent[] = [];

type WebVitalMetric = {
  name: string;
  value: number;
};

export function setTelemetryPage(path: string) {
  currentPath = path;
  if (!performancePath) {
    performancePath = path;
    performanceSampled = Math.random() < PERFORMANCE_SAMPLE_RATE;
  }
  recordTelemetry("page_view", path);
}

export function recordEngagement(name: TelemetryEngagementEventName) {
  recordTelemetry(name, getCurrentPath());
}

export function recordDeclarativeEngagement(value: string) {
  if (isTelemetryEngagementEventName(value)) {
    recordEngagement(value);
  }
}

export function markNavigationStarted(path: string) {
  pendingNavigationPath = path;
  pendingNavigationStartedAt = performance.now();
  recordTelemetry("navigation_started", path);
}

export function markNavigationCompleted(path: string) {
  if (!pendingNavigationPath) return;
  const duration = performance.now() - pendingNavigationStartedAt;
  recordTelemetry("navigation_duration", path, getBucket(duration, 500, 1_500));
  recordTelemetry("navigation_completed", path);
  pendingNavigationPath = "";
  pendingNavigationStartedAt = 0;
}

export function recordClientError(error: unknown) {
  const errorClass = getErrorClass(error);
  const source = getSameOriginErrorSource(error);
  recordTelemetry("client_error", getCurrentPath(), `${errorClass}|${source}`);
}

export function reportWebVital(metric: WebVitalMetric) {
  if (!performanceSampled) return;

  const eventName = getWebVitalEventName(metric.name);
  if (!eventName) return;

  recordTelemetry(eventName, performancePath || getCurrentPath(), getWebVitalBucket(metric.name, metric.value));
}

export function flushTelemetryForPageExit() {
  if (pendingNavigationPath) {
    recordTelemetry("navigation_abandoned", pendingNavigationPath);
    pendingNavigationPath = "";
    pendingNavigationStartedAt = 0;
  }

  flushTelemetry();
}

function recordTelemetry(name: TelemetryEventName, path: string, value?: string) {
  if (!isClientTrackablePath(path) || queue.length >= MAX_QUEUED_EVENTS) return;

  queue.push({ name, path, ...(value ? { value } : {}) });

  if (queue.length >= MAX_QUEUED_EVENTS) {
    flushTelemetry();
  } else if (!flushTimer) {
    flushTimer = setTimeout(flushTelemetry, FLUSH_INTERVAL_MS);
  }
}

function isClientTrackablePath(path: string) {
  if (!path.startsWith("/")) return false;
  return !["/admin", "/api", "/media", "/museumadmin", "/_next"].some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

function flushTelemetry() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = undefined;
  }

  if (queue.length === 0) return;

  const events = queue.splice(0, MAX_QUEUED_EVENTS);
  const payload = JSON.stringify({ events });

  if (navigator.sendBeacon) {
    const accepted = navigator.sendBeacon(
      TELEMETRY_ENDPOINT,
      new Blob([payload], { type: "application/json" })
    );
    if (accepted) return;
  }

  void fetch(TELEMETRY_ENDPOINT, {
    method: "POST",
    body: payload,
    headers: { "Content-Type": "application/json" },
    keepalive: true
  });
}

function getCurrentPath() {
  return currentPath || window.location.pathname;
}

function getWebVitalEventName(name: string): TelemetryEventName | null {
  if (name === "LCP") return "web_vital_lcp";
  if (name === "INP") return "web_vital_inp";
  if (name === "CLS") return "web_vital_cls";
  if (name === "TTFB") return "web_vital_ttfb";
  return null;
}

function getWebVitalBucket(name: string, value: number): TelemetryValueBucket {
  if (name === "LCP") return getBucket(value, 2_500, 4_000);
  if (name === "INP") return getBucket(value, 200, 500);
  if (name === "CLS") return getBucket(value, 0.1, 0.25);
  return getBucket(value, 800, 1_800);
}

function getBucket(value: number, goodLimit: number, poorLimit: number): TelemetryValueBucket {
  if (value <= goodLimit) return "good";
  if (value <= poorLimit) return "needs_improvement";
  return "poor";
}

function getErrorClass(error: unknown) {
  const name = error instanceof Error ? error.name : "Error";
  return /^[A-Za-z][A-Za-z0-9]{0,63}$/.test(name) ? name : "Error";
}

function getSameOriginErrorSource(error: unknown) {
  if (!(error instanceof Error) || !error.stack) return "unknown";

  const origin = window.location.origin;
  for (const line of error.stack.split("\n").slice(1, 8)) {
    const start = line.indexOf(origin);
    if (start < 0) continue;

    const source = line.slice(start + origin.length).split(/[?#]/, 1)[0];
    const match = source.match(/\/_next\/[A-Za-z0-9_./:-]+/);
    if (match) return match[0].slice(0, 180);
  }

  return "unknown";
}
